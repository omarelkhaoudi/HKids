import fs from 'fs-extra';
import path from 'node:path';
import supabase from '../../config/supabase.js';

const useSupabaseStorage = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabaseBucket = process.env.SUPABASE_BUCKET || 'hkids-books';

function contentTypeForFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

export function isRemoteAssetUrl(filePath) {
  return typeof filePath === 'string' && (filePath.startsWith('http://') || filePath.startsWith('https://'));
}

export async function persistBookAsset({
  buffer,
  filename,
  localDir,
  folder = 'catalog',
}) {
  if (!buffer?.length) {
    throw new Error('persistBookAsset requires a non-empty buffer');
  }

  if (useSupabaseStorage && supabase) {
    const objectPath = `${folder}/${filename}`;
    try {
      const { error } = await supabase.storage
        .from(supabaseBucket)
        .upload(objectPath, buffer, {
          contentType: contentTypeForFilename(filename),
          upsert: true,
        });

      if (error) {
        throw new Error(error.message || 'unknown Supabase storage error');
      }

      const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(objectPath);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch (error) {
      // Network / DNS / auth blips should not abort catalog seeding.
      console.warn(
        `[bookAssetStorage] Supabase upload failed for ${objectPath} (${error.message}). Falling back to local uploads.`
      );
    }
  }

  await fs.ensureDir(localDir);
  const fullPath = path.join(localDir, filename);
  await fs.writeFile(fullPath, buffer);
  return `/uploads/books/${filename}`;
}

export async function readBookAssetBuffer({ filename, localDir, folder = 'catalog' }) {
  const localPath = path.join(localDir, filename);
  if (await fs.pathExists(localPath)) {
    return fs.readFile(localPath);
  }

  if (!useSupabaseStorage || !supabase) {
    return null;
  }

  const objectPath = `${folder}/${filename}`;
  const { data, error } = await supabase.storage.from(supabaseBucket).download(objectPath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export function getSupabaseStorageConfig() {
  return {
    enabled: useSupabaseStorage,
    bucket: supabaseBucket,
  };
}
