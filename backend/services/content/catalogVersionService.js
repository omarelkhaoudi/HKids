/**
 * Catalog versioning — publishable content snapshots for live updates.
 * Persists to backend/data/catalog-versions.json (no DB migration required).
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getDataPath() {
  return process.env.CATALOG_VERSIONS_PATH
    || path.join(__dirname, '../../data/catalog-versions.json');
}

/** Downloadable content packs referenced by catalog versions. */
export const DEFAULT_CONTENT_PACKS = [
  { id: 'dinosaurs', emoji: '🦖', themes: ['dinosaurs', 'dino'], includes: ['story', 'quiz', 'game'], estimatedBytes: 12_000_000 },
  { id: 'space', emoji: '🚀', themes: ['space', 'planet', 'rocket'], includes: ['story', 'quiz'], estimatedBytes: 10_000_000 },
  { id: 'princesses', emoji: '👸', themes: ['princess', 'fairy', 'magic'], includes: ['story'], estimatedBytes: 8_000_000 },
  { id: 'animals', emoji: '🦊', themes: ['animals', 'animal', 'forest'], includes: ['story', 'game'], estimatedBytes: 9_000_000 },
  { id: 'ramadan', emoji: '🌙', themes: ['ramadan', 'values'], includes: ['story', 'quiz', 'game'], seasonal: true, estimatedBytes: 7_000_000 },
  { id: 'summer', emoji: '☀️', themes: ['summer', 'beach', 'ocean'], includes: ['story', 'game'], seasonal: true, estimatedBytes: 8_500_000 },
  { id: 'science', emoji: '🔬', themes: ['science', 'logic', 'math'], includes: ['quiz', 'game'], estimatedBytes: 6_000_000 },
  { id: 'music', emoji: '🎵', themes: ['music', 'rhyme', 'song'], includes: ['story', 'game'], estimatedBytes: 11_000_000 },
];

function buildDefaultState() {
  const now = new Date().toISOString();
  const v100 = {
    id: 'v1.0.0',
    version: '1.0.0',
    status: 'published',
    featured: true,
    publishedAt: now,
    createdAt: now,
    scheduledAt: null,
    archivedAt: null,
    changelog: [
      { type: 'added', category: 'stories', summary: 'Initial story library' },
      { type: 'added', category: 'quizzes', summary: 'Educational quizzes' },
      { type: 'added', category: 'games', summary: 'Learning games' },
      { type: 'added', category: 'worlds', summary: 'Educational worlds' },
    ],
    packs: DEFAULT_CONTENT_PACKS.map((p) => p.id),
    packageBytes: DEFAULT_CONTENT_PACKS.reduce((sum, p) => sum + p.estimatedBytes, 0),
    contentFingerprint: 'seed-1.0.0',
  };

  return {
    currentVersionId: v100.id,
    previousVersionId: null,
    packs: DEFAULT_CONTENT_PACKS,
    versions: [v100],
  };
}

async function ensureStore() {
  const dataPath = getDataPath();
  await fs.ensureDir(path.dirname(dataPath));
  if (!(await fs.pathExists(dataPath))) {
    const initial = buildDefaultState();
    await fs.writeJson(dataPath, initial, { spaces: 2 });
    return initial;
  }
  return fs.readJson(dataPath);
}

async function saveStore(state) {
  const dataPath = getDataPath();
  await fs.ensureDir(path.dirname(dataPath));
  await fs.writeJson(dataPath, state, { spaces: 2 });
  return state;
}

function sortVersions(versions = []) {
  return [...versions].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function findVersion(state, versionId) {
  return state.versions.find((v) => v.id === versionId || v.version === versionId) || null;
}

function isScheduledDue(version, now = new Date()) {
  if (!version?.scheduledAt || version.status !== 'scheduled') return false;
  return new Date(version.scheduledAt).getTime() <= now.getTime();
}

async function applyDueSchedules(state) {
  let changed = false;
  const now = new Date();
  for (const version of state.versions) {
    if (isScheduledDue(version, now)) {
      if (state.currentVersionId && state.currentVersionId !== version.id) {
        state.previousVersionId = state.currentVersionId;
      }
      version.status = 'published';
      version.publishedAt = now.toISOString();
      version.scheduledAt = null;
      state.currentVersionId = version.id;
      changed = true;
    }
  }
  if (changed) await saveStore(state);
  return state;
}

export async function getCatalogState() {
  let state = await ensureStore();
  state = await applyDueSchedules(state);
  return state;
}

export async function listCatalogVersions({ includeArchived = true } = {}) {
  const state = await getCatalogState();
  let versions = sortVersions(state.versions);
  if (!includeArchived) versions = versions.filter((v) => v.status !== 'archived');
  return {
    currentVersionId: state.currentVersionId,
    previousVersionId: state.previousVersionId,
    packs: state.packs,
    versions,
  };
}

export async function getCurrentCatalogVersion() {
  const state = await getCatalogState();
  const current = findVersion(state, state.currentVersionId) || state.versions[0] || null;
  return {
    current,
    previousVersionId: state.previousVersionId,
    packs: state.packs.filter((p) => (current?.packs || []).includes(p.id)),
  };
}

export async function getCatalogManifestExtras() {
  const { current, previousVersionId, packs } = await getCurrentCatalogVersion();
  if (!current) {
    return {
      catalog: { version: '0.0.0', published_at: null, package_bytes: 0, changelog: [], packs: [] },
    };
  }
  return {
    catalog: {
      version: current.version,
      version_id: current.id,
      published_at: current.publishedAt,
      package_bytes: current.packageBytes || 0,
      content_fingerprint: current.contentFingerprint || current.version,
      previous_version_id: previousVersionId,
      featured: Boolean(current.featured),
      changelog: current.changelog || [],
      packs: packs.map((p) => ({
        id: p.id,
        emoji: p.emoji,
        themes: p.themes,
        includes: p.includes,
        seasonal: Boolean(p.seasonal),
        estimated_bytes: p.estimatedBytes || 0,
      })),
    },
  };
}

function nextSemver(fromVersion = '1.0.0', bump = 'patch') {
  const parts = String(fromVersion).split('.').map((n) => Number(n) || 0);
  while (parts.length < 3) parts.push(0);
  if (bump === 'major') {
    parts[0] += 1;
    parts[1] = 0;
    parts[2] = 0;
  } else if (bump === 'minor') {
    parts[1] += 1;
    parts[2] = 0;
  } else {
    parts[2] += 1;
  }
  return parts.join('.');
}

export async function createCatalogVersion({
  bump = 'patch',
  changelog = [],
  packs = null,
  packageBytes = null,
  contentFingerprint = null,
  scheduleAt = null,
  featured = false,
} = {}) {
  const state = await getCatalogState();
  const current = findVersion(state, state.currentVersionId);
  const version = nextSemver(current?.version || '1.0.0', bump);
  const id = `v${version}`;
  if (findVersion(state, id)) {
    const err = new Error(`Catalog version ${version} already exists`);
    err.status = 409;
    throw err;
  }

  const packIds = Array.isArray(packs) && packs.length
    ? packs
    : (current?.packs || DEFAULT_CONTENT_PACKS.map((p) => p.id));
  const bytes = packageBytes
    ?? state.packs
      .filter((p) => packIds.includes(p.id))
      .reduce((sum, p) => sum + (p.estimatedBytes || 0), 0);

  const now = new Date().toISOString();
  const entry = {
    id,
    version,
    status: scheduleAt ? 'scheduled' : 'draft',
    featured: Boolean(featured),
    publishedAt: null,
    createdAt: now,
    scheduledAt: scheduleAt || null,
    archivedAt: null,
    changelog: Array.isArray(changelog) ? changelog : [],
    packs: packIds,
    packageBytes: bytes,
    contentFingerprint: contentFingerprint || `fp-${version}-${Date.now()}`,
  };

  state.versions.push(entry);
  await saveStore(state);
  return entry;
}

export async function publishCatalogVersion(versionId) {
  const state = await getCatalogState();
  const version = findVersion(state, versionId);
  if (!version) {
    const err = new Error('Catalog version not found');
    err.status = 404;
    throw err;
  }
  if (version.status === 'archived') {
    const err = new Error('Cannot publish an archived version');
    err.status = 400;
    throw err;
  }

  if (state.currentVersionId && state.currentVersionId !== version.id) {
    state.previousVersionId = state.currentVersionId;
  }
  version.status = 'published';
  version.publishedAt = new Date().toISOString();
  version.scheduledAt = null;
  state.currentVersionId = version.id;
  await saveStore(state);
  return { current: version, previousVersionId: state.previousVersionId };
}

export async function rollbackCatalogVersion(targetVersionId = null) {
  const state = await getCatalogState();
  const targetId = targetVersionId || state.previousVersionId;
  if (!targetId) {
    const err = new Error('No previous catalog version to rollback to');
    err.status = 400;
    throw err;
  }
  const target = findVersion(state, targetId);
  if (!target || target.status === 'archived') {
    const err = new Error('Rollback target not found or archived');
    err.status = 404;
    throw err;
  }

  state.previousVersionId = state.currentVersionId;
  target.status = 'published';
  target.publishedAt = new Date().toISOString();
  state.currentVersionId = target.id;
  await saveStore(state);
  return { current: target, previousVersionId: state.previousVersionId };
}

export async function archiveCatalogVersion(versionId) {
  const state = await getCatalogState();
  const version = findVersion(state, versionId);
  if (!version) {
    const err = new Error('Catalog version not found');
    err.status = 404;
    throw err;
  }
  if (state.currentVersionId === version.id) {
    const err = new Error('Cannot archive the currently published version');
    err.status = 400;
    throw err;
  }
  version.status = 'archived';
  version.archivedAt = new Date().toISOString();
  version.featured = false;
  await saveStore(state);
  return version;
}

export async function featureCatalogVersion(versionId, featured = true) {
  const state = await getCatalogState();
  const version = findVersion(state, versionId);
  if (!version) {
    const err = new Error('Catalog version not found');
    err.status = 404;
    throw err;
  }
  for (const entry of state.versions) {
    entry.featured = featured && entry.id === version.id;
  }
  await saveStore(state);
  return version;
}

export async function scheduleCatalogVersion(versionId, scheduledAt) {
  const state = await getCatalogState();
  const version = findVersion(state, versionId);
  if (!version) {
    const err = new Error('Catalog version not found');
    err.status = 404;
    throw err;
  }
  if (!scheduledAt) {
    const err = new Error('scheduledAt is required');
    err.status = 400;
    throw err;
  }
  version.status = 'scheduled';
  version.scheduledAt = new Date(scheduledAt).toISOString();
  await saveStore(state);
  return version;
}

export async function getCatalogChangelog(sinceVersion = null) {
  const state = await getCatalogState();
  const versions = sortVersions(state.versions).filter((v) => v.status === 'published' || v.id === state.currentVersionId);
  if (!sinceVersion) {
    const current = findVersion(state, state.currentVersionId);
    return current?.changelog || [];
  }

  const changes = [];
  for (const version of versions) {
    if (version.version === sinceVersion || version.id === sinceVersion) break;
    for (const entry of version.changelog || []) {
      changes.push({ ...entry, version: version.version, publishedAt: version.publishedAt });
    }
  }
  return changes;
}
