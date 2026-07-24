/**
 * Premium pack store — merges defaults with admin overrides (local, offline-friendly).
 * Future packs: add to DEFAULT_PREMIUM_PACKS or create via admin UI (no code deploy).
 */

import {
  DEFAULT_PREMIUM_PACKS,
  PREMIUM_FEATURE_FLAGS,
  getActiveSeasonIds,
} from '../constants/premiumPacks';

const PACKS_KEY = 'hkids_premium_packs_overrides_v1';
const FLAGS_KEY = 'hkids_premium_feature_flags_v1';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getFeatureFlags() {
  return { ...PREMIUM_FEATURE_FLAGS, ...readJson(FLAGS_KEY, {}) };
}

export function setFeatureFlag(flagId, enabled) {
  const flags = getFeatureFlags();
  flags[flagId] = Boolean(enabled);
  writeJson(FLAGS_KEY, flags);
  return flags;
}

export function setAllFeatureFlags(nextFlags = {}) {
  writeJson(FLAGS_KEY, { ...PREMIUM_FEATURE_FLAGS, ...nextFlags });
  return getFeatureFlags();
}

export function getPackOverrides() {
  return readJson(PACKS_KEY, {});
}

export function savePackOverride(packId, patch) {
  const overrides = getPackOverrides();
  overrides[packId] = { ...(overrides[packId] || {}), ...patch, id: packId, updatedAt: new Date().toISOString() };
  writeJson(PACKS_KEY, overrides);
  return overrides[packId];
}

export function createCustomPack(pack) {
  const id = pack.id || `custom_${Date.now()}`;
  const payload = {
    emoji: '⭐',
    gradient: 'from-primary-400 to-primary-600',
    labelKey: pack.labelKey || pack.title || id,
    descKey: pack.descKey || '',
    themes: pack.themes || [],
    features: pack.features || ['premium_books'],
    featured: false,
    isNew: true,
    published: false,
    archived: false,
    includes: pack.includes || ['story'],
    custom: true,
    title: pack.title || id,
    description: pack.description || '',
    ...pack,
    id,
  };
  savePackOverride(id, payload);
  return payload;
}

export function archivePack(packId) {
  return savePackOverride(packId, { archived: true, published: false });
}

export function publishPack(packId) {
  return savePackOverride(packId, { archived: false, published: true });
}

export function featurePack(packId, featured = true) {
  return savePackOverride(packId, { featured: Boolean(featured) });
}

/**
 * Resolved pack list for consumers (discovery, admin, gating).
 */
export function listPremiumPacks({ includeArchived = false, onlyPublished = true } = {}) {
  const overrides = getPackOverrides();
  const byId = new Map();

  DEFAULT_PREMIUM_PACKS.forEach((pack) => {
    byId.set(pack.id, { ...pack });
  });

  Object.values(overrides).forEach((override) => {
    if (!override?.id) return;
    const base = byId.get(override.id) || { id: override.id, custom: true };
    byId.set(override.id, { ...base, ...override });
  });

  let packs = [...byId.values()];
  if (!includeArchived) packs = packs.filter((p) => !p.archived);
  if (onlyPublished) packs = packs.filter((p) => p.published !== false);
  return packs;
}

export function getPremiumPack(packId) {
  return listPremiumPacks({ includeArchived: true, onlyPublished: false })
    .find((pack) => pack.id === packId) || null;
}

export function listSeasonalPacks(date = new Date()) {
  const activeSeasons = new Set(getActiveSeasonIds(date));
  return listPremiumPacks().filter((pack) => pack.seasonal && activeSeasons.has(pack.seasonId));
}

export function listFeaturedPacks() {
  return listPremiumPacks().filter((pack) => pack.featured);
}

export function listNewPacks() {
  return listPremiumPacks().filter((pack) => pack.isNew);
}

export function listAiPacks() {
  return listPremiumPacks().filter((pack) => pack.ai);
}
