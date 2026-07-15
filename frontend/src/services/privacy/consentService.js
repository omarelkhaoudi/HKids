/**
 * Granular RGPD consent management.
 * Stores per-category consent in localStorage as structured JSON.
 * Categories: analytics, ai, local_storage.
 * Essential cookies (auth, preferences) are always allowed.
 */

const CONSENT_KEY = 'hkids_consent_v2';
const LEGACY_KEY = 'hkids_cookie_consent_v1';

const CATEGORIES = ['analytics', 'ai', 'local_storage'];

const DEFAULT_CONSENT = Object.freeze({
  analytics: false,
  ai: false,
  local_storage: false,
});

function read() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.decided_at) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(consent) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    localStorage.setItem(LEGACY_KEY, 'accepted');
  } catch {
    // storage unavailable
  }
}

export function getConsent() {
  const stored = read();
  if (stored) return stored;

  if (localStorage.getItem(LEGACY_KEY) === 'accepted') {
    const migrated = {
      ...DEFAULT_CONSENT,
      analytics: true,
      ai: true,
      local_storage: true,
      decided_at: new Date().toISOString(),
      version: 2,
    };
    write(migrated);
    return migrated;
  }

  return null;
}

export function hasDecided() {
  return getConsent() !== null;
}

export function isConsentGiven(category) {
  const consent = getConsent();
  if (!consent) return false;
  return Boolean(consent[category]);
}

export function acceptAll() {
  const consent = {
    analytics: true,
    ai: true,
    local_storage: true,
    decided_at: new Date().toISOString(),
    version: 2,
  };
  write(consent);
  window.dispatchEvent(new CustomEvent('hkids:consent-changed', { detail: consent }));
  return consent;
}

export function acceptEssentialOnly() {
  const consent = {
    ...DEFAULT_CONSENT,
    decided_at: new Date().toISOString(),
    version: 2,
  };
  write(consent);
  window.dispatchEvent(new CustomEvent('hkids:consent-changed', { detail: consent }));
  return consent;
}

export function updateConsent(categories) {
  const current = getConsent() || { ...DEFAULT_CONSENT };
  const updated = {
    analytics: Boolean(categories.analytics ?? current.analytics),
    ai: Boolean(categories.ai ?? current.ai),
    local_storage: Boolean(categories.local_storage ?? current.local_storage),
    decided_at: new Date().toISOString(),
    version: 2,
  };
  write(updated);
  window.dispatchEvent(new CustomEvent('hkids:consent-changed', { detail: updated }));
  return updated;
}

export function revokeAllConsent() {
  const consent = {
    ...DEFAULT_CONSENT,
    decided_at: new Date().toISOString(),
    revoked_at: new Date().toISOString(),
    version: 2,
  };
  write(consent);
  window.dispatchEvent(new CustomEvent('hkids:consent-changed', { detail: consent }));
  return consent;
}

export function deleteConsentData() {
  try {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('hkids:consent-changed', { detail: null }));
}

export function exportConsentData() {
  const consent = getConsent();
  return {
    consent,
    exported_at: new Date().toISOString(),
    categories: CATEGORIES,
  };
}

export { CATEGORIES, DEFAULT_CONSENT };
