import { VoiceProviderFactory } from './VoiceProviderFactory.js';
import { deleteStoredVoiceFiles } from './voiceStorage.js';

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

  const provider = VoiceProviderFactory.getProvider();
  for (const profile of profiles.rows) {
    if (profile.provider_voice_id) {
      await provider.deleteVoiceProfile({ providerVoiceId: profile.provider_voice_id });
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
         sample_audio_path = NULL, preview_audio_path = NULL, provider_voice_id = NULL,
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
