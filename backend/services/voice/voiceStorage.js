import crypto from 'crypto';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const voiceStorageDir = path.join(__dirname, '..', '..', 'uploads', 'voices');

export async function saveVoiceAudioFile(file, userId, kind, validatedAudio = null) {
  await fs.ensureDir(voiceStorageDir);
  const extension = validatedAudio?.extension || path.extname(file.originalname || '').toLowerCase() || '.audio';
  const safeKind = String(kind || 'audio').replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'audio';
  const filename = `${safeKind}-${userId}-${Date.now()}-${crypto.randomBytes(12).toString('hex')}${extension}`;
  const absolutePath = path.join(voiceStorageDir, filename);
  await fs.writeFile(absolutePath, file.buffer, { flag: 'wx', mode: 0o600 });
  return `/uploads/voices/${filename}`;
}

export async function deleteStoredVoiceFile(audioPath) {
  if (!audioPath || !audioPath.startsWith('/uploads/voices/')) return;
  const absolutePath = path.join(voiceStorageDir, path.basename(audioPath));
  try {
    await fs.remove(absolutePath);
  } catch (error) {
    console.warn('Stored voice file could not be removed:', error.message);
  }
}

export async function deleteStoredVoiceFiles(paths = []) {
  await Promise.all([...new Set(paths.filter(Boolean))].map(deleteStoredVoiceFile));
}

export function voiceFileUrl(audioPath) {
  if (!audioPath) return null;
  return `/api/voices/files/${encodeURIComponent(path.basename(audioPath))}`;
}
