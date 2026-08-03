import { VoiceProviderFactory } from './VoiceProviderFactory.js';
import { deleteStoredVoiceFiles } from './voiceStorage.js';
import { logAIEvent } from '../ai/aiLogger.js';

function safeDeletionReason(error) {
  return String(error?.code || error?.status || 'VOICE_PROVIDER_DELETION_FAILED').slice(0, 80);
}

async function enqueueProviderDeletion(client, { userId, providerVoiceId, error }) {
  await client.query(
    `INSERT INTO voice_provider_deletion_queue (
       user_id, provider, provider_voice_id, retry_count, last_error
     )
     VALUES ($1, 'elevenlabs', $2, 1, $3)
     ON CONFLICT (provider_voice_id)
     DO UPDATE SET retry_count = voice_provider_deletion_queue.retry_count + 1,
                   last_error = EXCLUDED.last_error,
                   updated_at = NOW()`,
    [userId, providerVoiceId, safeDeletionReason(error)]
  );
}

export async function purgeUserVoiceData({ client, userId }) {
  const profiles = await client.query(
    `SELECT id, provider_voice_id, sample_audio_path, preview_audio_path
     FROM voice_profiles
     WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  const messages = await client.query(
    `SELECT audio_path FROM voice_messages WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  const narrations = await client.query(
    `SELECT audio_path FROM voice_narrations WHERE user_id = $1`,
    [userId]
  );

  const providerProfiles = profiles.rows.filter((profile) => profile.provider_voice_id);
  if (providerProfiles.length > 0) {
    const provider = VoiceProviderFactory.getProvider();
    for (const profile of providerProfiles) {
      try {
        await provider.deleteVoiceProfile({ providerVoiceId: profile.provider_voice_id });
      } catch (error) {
        await enqueueProviderDeletion(client, {
          userId,
          providerVoiceId: profile.provider_voice_id,
          error
        });
        logAIEvent('warn', 'voice_provider_deletion_queued', {
          provider: 'elevenlabs',
          operation: 'voice_delete',
          code: safeDeletionReason(error)
        });
      }
    }
  }

  await deleteStoredVoiceFiles([
    ...profiles.rows.flatMap((row) => [row.sample_audio_path, row.preview_audio_path]),
    ...messages.rows.map((row) => row.audio_path),
    ...narrations.rows.map((row) => row.audio_path)
  ]);

  await client.query(
    `UPDATE voice_profiles
     SET deleted_at = NOW(), status = 'deleted', consent_given = FALSE,
         sample_audio_path = NULL, sample_audio_hash = NULL,
         preview_audio_path = NULL, preview_audio_hash = NULL, provider_voice_id = NULL,
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );
  await client.query(
    `UPDATE voice_messages SET deleted_at = NOW(), audio_path = NULL WHERE user_id = $1`,
    [userId]
  );
  await client.query('DELETE FROM voice_narrations WHERE user_id = $1', [userId]);
}
