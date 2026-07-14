import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { persistBookAsset, isRemoteAssetUrl } from '../services/storage/bookAssetStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '../uploads/books');

test('persistBookAsset stores svg locally when Supabase is disabled', async () => {
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_KEY;

  try {
    const filename = `test-cover-${Date.now()}.svg`;
    const storedPath = await persistBookAsset({
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8'),
      filename,
      localDir: tempDir,
    });

    assert.equal(storedPath, `/uploads/books/${filename}`);
    assert.equal(await fs.pathExists(path.join(tempDir, filename)), true);
    await fs.remove(path.join(tempDir, filename));
  } finally {
    process.env.SUPABASE_URL = originalUrl;
    process.env.SUPABASE_SERVICE_KEY = originalKey;
  }
});

test('isRemoteAssetUrl detects public URLs', () => {
  assert.equal(isRemoteAssetUrl('https://example.com/catalog/foo.svg'), true);
  assert.equal(isRemoteAssetUrl('/uploads/books/foo.svg'), false);
});
