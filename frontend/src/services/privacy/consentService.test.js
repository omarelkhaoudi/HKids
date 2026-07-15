import { describe, it, expect, beforeEach, vi } from 'vitest';

const store = {};
const localStorageMock = {
  getItem: vi.fn((key) => store[key] ?? null),
  setItem: vi.fn((key, value) => { store[key] = value; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const dispatchMock = vi.fn();
Object.defineProperty(window, 'dispatchEvent', { value: dispatchMock });

let consent;

describe('consentService', () => {
  beforeEach(async () => {
    Object.keys(store).forEach((k) => delete store[k]);
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    dispatchMock.mockClear();
    vi.resetModules();
    consent = await import('./consentService');
  });

  it('hasDecided returns false initially', () => {
    expect(consent.hasDecided()).toBe(false);
  });

  it('getConsent returns null when no consent stored', () => {
    expect(consent.getConsent()).toBeNull();
  });

  it('acceptAll sets all categories to true', () => {
    const result = consent.acceptAll();
    expect(result.analytics).toBe(true);
    expect(result.ai).toBe(true);
    expect(result.local_storage).toBe(true);
    expect(result.version).toBe(2);
    expect(result.decided_at).toBeTruthy();
    expect(consent.hasDecided()).toBe(true);
  });

  it('acceptEssentialOnly sets all categories to false', () => {
    const result = consent.acceptEssentialOnly();
    expect(result.analytics).toBe(false);
    expect(result.ai).toBe(false);
    expect(result.local_storage).toBe(false);
    expect(consent.hasDecided()).toBe(true);
  });

  it('isConsentGiven checks individual categories', () => {
    consent.acceptAll();
    expect(consent.isConsentGiven('analytics')).toBe(true);
    expect(consent.isConsentGiven('ai')).toBe(true);
    expect(consent.isConsentGiven('local_storage')).toBe(true);
  });

  it('isConsentGiven returns false without consent', () => {
    expect(consent.isConsentGiven('analytics')).toBe(false);
  });

  it('updateConsent updates individual categories', () => {
    consent.acceptAll();
    const result = consent.updateConsent({ analytics: false });
    expect(result.analytics).toBe(false);
    expect(result.ai).toBe(true);
    expect(result.local_storage).toBe(true);
  });

  it('revokeAllConsent sets all to false with revoked_at', () => {
    consent.acceptAll();
    const result = consent.revokeAllConsent();
    expect(result.analytics).toBe(false);
    expect(result.ai).toBe(false);
    expect(result.local_storage).toBe(false);
    expect(result.revoked_at).toBeTruthy();
  });

  it('deleteConsentData removes all consent keys', () => {
    consent.acceptAll();
    consent.deleteConsentData();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('hkids_consent_v2');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('hkids_cookie_consent_v1');
  });

  it('exportConsentData returns structured data', () => {
    consent.acceptAll();
    const exported = consent.exportConsentData();
    expect(exported.consent.analytics).toBe(true);
    expect(exported.exported_at).toBeTruthy();
    expect(exported.categories).toEqual(['analytics', 'ai', 'local_storage']);
  });

  it('dispatches consent-changed event on accept', () => {
    consent.acceptAll();
    expect(dispatchMock).toHaveBeenCalled();
    const event = dispatchMock.mock.calls[0][0];
    expect(event.type).toBe('hkids:consent-changed');
    expect(event.detail.analytics).toBe(true);
  });

  it('migrates legacy v1 consent to v2', () => {
    store['hkids_cookie_consent_v1'] = 'accepted';
    const result = consent.getConsent();
    expect(result.analytics).toBe(true);
    expect(result.ai).toBe(true);
    expect(result.local_storage).toBe(true);
    expect(result.version).toBe(2);
  });

  it('CATEGORIES exports the list', () => {
    expect(consent.CATEGORIES).toEqual(['analytics', 'ai', 'local_storage']);
  });
});
