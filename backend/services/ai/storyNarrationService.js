/**
 * Generates multi-language narrations for AI-generated stories using ElevenLabs.
 * Supports FR, EN, AR with automatic voice selection, caching via narration_metadata,
 * and Supabase/local storage for audio files.
 */

import { VoiceProviderFactory } from '../voice/VoiceProviderFactory.js';
import { voiceConfig } from '../voice/voiceConfig.js';
import { persistBookAsset } from '../storage/bookAssetStorage.js';
import { getDatabase } from '../../database/init.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../../uploads/books');

const SUPPORTED_LOCALES = ['fr', 'en', 'ar'];
const MAX_CHUNK_LENGTH = 4800;

const DEFAULT_VOICES = {
  fr: process.env.ELEVENLABS_DEFAULT_VOICE_FR || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '',
  en: process.env.ELEVENLABS_DEFAULT_VOICE_EN || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '',
  ar: process.env.ELEVENLABS_DEFAULT_VOICE_AR || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '',
};

export function isNarrationConfigured() {
  return Boolean(
    voiceConfig.providers?.elevenlabs?.apiKey
    && (DEFAULT_VOICES.fr || DEFAULT_VOICES.en || DEFAULT_VOICES.ar)
  );
}

export function normalizeLocale(locale) {
  const l = String(locale || 'fr').toLowerCase().slice(0, 2);
  return SUPPORTED_LOCALES.includes(l) ? l : 'fr';
}

function selectVoice(locale) {
  const voiceId = DEFAULT_VOICES[normalizeLocale(locale)];
  if (!voiceId) return null;
  return voiceId;
}

function textHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

function splitIntoChunks(text, maxLength = MAX_CHUNK_LENGTH) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return [clean];

  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 > maxLength && current) {
      chunks.push(current.trim());
      current = '';
    }
    current += (current ? ' ' : '') + sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function synthesizeChunk(provider, voiceId, text) {
  const result = await provider.synthesizeSpeech({
    providerVoiceId: voiceId,
    text,
  });
  return result.audioBuffer;
}

async function synthesizeFullText(provider, voiceId, text) {
  const chunks = splitIntoChunks(text);
  if (chunks.length === 1) {
    return synthesizeChunk(provider, voiceId, chunks[0]);
  }

  const buffers = [];
  for (const chunk of chunks) {
    const buffer = await synthesizeChunk(provider, voiceId, chunk);
    buffers.push(buffer);
  }
  return Buffer.concat(buffers);
}

function narrationFilename(storyId, locale) {
  return `story-${storyId}-narration-${locale}.mp3`;
}

export async function generateStoryNarration(storyId, locale, { force = false } = {}) {
  const pool = getDatabase();
  const loc = normalizeLocale(locale);

  const storyResult = await pool.query(
    'SELECT id, title, story_text, language, narration_metadata FROM generated_stories WHERE id = $1',
    [storyId]
  );
  const story = storyResult.rows[0];
  if (!story) throw new Error(`Story ${storyId} not found`);

  const metadata = story.narration_metadata || {};
  const tracks = metadata.tracks || {};

  if (!force && tracks[loc]?.url) {
    return { cached: true, locale: loc, url: tracks[loc].url };
  }

  const voiceId = selectVoice(loc);
  if (!voiceId) {
    throw new Error(`No ElevenLabs voice configured for locale "${loc}"`);
  }

  const text = story.story_text || '';
  if (!text.trim()) {
    throw new Error('Story has no text to narrate');
  }

  const provider = VoiceProviderFactory.getProvider();
  const audioBuffer = await synthesizeFullText(provider, voiceId, text);

  const filename = narrationFilename(storyId, loc);
  const url = await persistBookAsset({
    buffer: audioBuffer,
    filename,
    localDir: uploadsDir,
    folder: 'narrations',
  });

  const hash = textHash(text);
  const trackEntry = {
    url,
    voice_id: voiceId,
    text_hash: hash,
    text_length: text.length,
    generated_at: new Date().toISOString(),
  };

  tracks[loc] = trackEntry;
  const updatedMetadata = {
    ...metadata,
    tracks,
    last_generated: loc,
    last_generated_at: new Date().toISOString(),
  };

  await pool.query(
    'UPDATE generated_stories SET narration_metadata = $2::jsonb, updated_at = NOW() WHERE id = $1',
    [storyId, JSON.stringify(updatedMetadata)]
  );

  return { cached: false, locale: loc, url, text_length: text.length };
}

export async function generateAllNarrations(storyId, { force = false, locales = SUPPORTED_LOCALES } = {}) {
  const results = {};
  for (const locale of locales) {
    const voiceId = selectVoice(locale);
    if (!voiceId) {
      results[locale] = { skipped: true, reason: 'no_voice_configured' };
      continue;
    }
    try {
      results[locale] = await generateStoryNarration(storyId, locale, { force });
    } catch (err) {
      results[locale] = { error: err.message };
    }
  }
  return results;
}

export function getNarrationTracks(narrationMetadata) {
  const metadata = narrationMetadata || {};
  const tracks = metadata.tracks || {};
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
    available: Boolean(tracks[locale]?.url),
    url: tracks[locale]?.url || null,
    generated_at: tracks[locale]?.generated_at || null,
  }));
}
