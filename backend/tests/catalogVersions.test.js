import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  createCatalogVersion,
  publishCatalogVersion,
  rollbackCatalogVersion,
  archiveCatalogVersion,
  scheduleCatalogVersion,
  getCurrentCatalogVersion,
  listCatalogVersions,
  getCatalogManifestExtras,
} from '../services/content/catalogVersionService.js';

async function withTempCatalog(run) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hkids-catalog-'));
  const dataPath = path.join(tmpDir, 'catalog-versions.json');
  const previous = process.env.CATALOG_VERSIONS_PATH;
  process.env.CATALOG_VERSIONS_PATH = dataPath;
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env.CATALOG_VERSIONS_PATH;
    else process.env.CATALOG_VERSIONS_PATH = previous;
    await fs.remove(tmpDir);
  }
}

test('catalog versioning supports create, publish, rollback and archive', async () => {
  await withTempCatalog(async () => {
    const current = await getCurrentCatalogVersion();
    assert.ok(current.current?.version);
    assert.equal(current.current.version, '1.0.0');

    const draft = await createCatalogVersion({
      bump: 'patch',
      changelog: [{ type: 'added', category: 'stories', summary: 'Test story' }],
    });
    assert.equal(draft.version, '1.0.1');
    assert.equal(draft.status, 'draft');

    const published = await publishCatalogVersion(draft.id);
    assert.equal(published.current.version, '1.0.1');
    assert.equal(published.previousVersionId, 'v1.0.0');

    const rolled = await rollbackCatalogVersion();
    assert.equal(rolled.current.version, '1.0.0');

    await publishCatalogVersion('v1.0.1');
    const archived = await archiveCatalogVersion('v1.0.0');
    assert.equal(archived.status, 'archived');

    await assert.rejects(() => archiveCatalogVersion('v1.0.1'), /currently published/);

    const list = await listCatalogVersions({ includeArchived: true });
    assert.ok(list.versions.length >= 2);

    const extras = await getCatalogManifestExtras();
    assert.equal(extras.catalog.version, '1.0.1');
    assert.ok(Array.isArray(extras.catalog.packs));
    assert.ok(extras.catalog.package_bytes > 0);
  });
});

test('catalog schedule marks version scheduled', async () => {
  await withTempCatalog(async () => {
    const draft = await createCatalogVersion({ bump: 'minor' });
    const scheduled = await scheduleCatalogVersion(
      draft.id,
      new Date(Date.now() + 86_400_000).toISOString(),
    );
    assert.equal(scheduled.status, 'scheduled');
    assert.ok(scheduled.scheduledAt);
  });
});

test('offline manifest route module exports a router', async () => {
  const module = await import('../routes/offline.js');
  assert.equal(typeof module.default, 'function');
});
