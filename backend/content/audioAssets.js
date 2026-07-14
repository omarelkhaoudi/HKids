import fs from 'fs-extra';
import path from 'node:path';
import { UniversalEdgeTTS } from 'edge-tts-universal';

const VOICES = {
  fr: 'fr-FR-DeniseNeural',
  en: 'en-US-AnaNeural',
  ar: 'ar-SA-ZariyahNeural',
};

/** Minimal valid MP3 frame (silence) as fallback when TTS is unavailable. */
const FALLBACK_MP3 = Buffer.from(
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAYAAAAAAAAAhIX/4wA=',
  'base64'
);

async function synthesizeToFile({ text, voice, outputPath }) {
  const tts = new UniversalEdgeTTS(text, voice);
  const result = await tts.synthesize();
  const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
  await fs.writeFile(outputPath, audioBuffer);
}

export async function ensureSpeechMp3({ text, locale = 'fr', outputPath, force = false }) {
  await fs.ensureDir(path.dirname(outputPath));
  if (!force && await fs.pathExists(outputPath) && (await fs.stat(outputPath)).size > 2000) {
    return outputPath;
  }

  const cleanText = String(text || '').trim().slice(0, 500);
  if (!cleanText) {
    await fs.writeFile(outputPath, FALLBACK_MP3);
    return outputPath;
  }

  const voice = VOICES[locale] || VOICES.fr;
  try {
    await synthesizeToFile({ text: cleanText, voice, outputPath });
    if ((await fs.stat(outputPath)).size > 2000) return outputPath;
  } catch (error) {
    console.warn(`[catalog] TTS failed for ${path.basename(outputPath)} (${locale}):`, error.message);
  }

  await fs.writeFile(outputPath, FALLBACK_MP3);
  return outputPath;
}

export async function estimateDurationSeconds(filePath, fallback = 10) {
  try {
    const stat = await fs.stat(filePath);
    if (stat.size < 2000) return fallback;
    return Math.max(6, Math.min(120, Math.round(stat.size / 4000)));
  } catch {
    return fallback;
  }
}
