import { describe, expect, it } from 'vitest';
import { buildApiUrl } from '../../config/api.js';
import {
  buildKidPayload,
  formatKidBirthDate,
  getKidInitial,
  kidToForm
} from '../kidProfiles.js';
import { formatContentDuration, contentMatchesCategory } from '../contentLibrary.js';
import { translate } from '../translations.js';

describe('buildApiUrl', () => {
  it('prefixes API paths with /api', () => {
    expect(buildApiUrl('/auth/login')).toContain('/api/auth/login');
    expect(buildApiUrl('/api/books')).toContain('/api/books');
  });
});

describe('kidProfiles utils', () => {
  it('maps kid profile to form state', () => {
    const form = kidToForm({
      name: 'Lina',
      age: 6,
      interests: ['space', 'animals']
    });

    expect(form.name).toBe('Lina');
    expect(form.age).toBe(6);
    expect(form.interests).toBe('space, animals');
  });

  it('builds API payload from form values', () => {
    const payload = buildKidPayload({
      name: '  Lina  ',
      age: '6',
      date_of_birth: '2019-05-01',
      avatar: '',
      photo_url: '',
      preferred_language: 'fr',
      interests: 'space'
    });

    expect(payload).toEqual({
      name: 'Lina',
      age: 6,
      date_of_birth: '2019-05-01',
      avatar: null,
      photo_url: null,
      preferred_language: 'fr',
      interests: 'space'
    });
  });

  it('formats birth dates and initials', () => {
    expect(formatKidBirthDate('2019-05-01')).toMatch(/2019/);
    expect(getKidInitial({ name: 'lina' })).toBe('L');
  });
});

describe('contentLibrary utils', () => {
  it('formats duration labels', () => {
    expect(formatContentDuration(0)).toBe('0 min');
    expect(formatContentDuration(120)).toBe('2 min');
  });

  it('matches content categories by type', () => {
    expect(contentMatchesCategory({ content_type: 'story' }, { contentTypes: ['story'] })).toBe(true);
    expect(contentMatchesCategory({ content_type: 'audio' }, { contentTypes: ['story'] })).toBe(false);
  });
});

describe('parent space translations', () => {
  it('exposes analytics keys in FR, EN and AR', () => {
    expect(translate('fr', 'parentAnalyticsBookProgress')).toBe('Progression des livres');
    expect(translate('en', 'parentAnalyticsBookProgress')).toBe('Book progress');
    expect(translate('ar', 'parentAnalyticsBookProgress')).toBe('تقدم الكتب');
    expect(translate('en', 'skipToContent')).toBe('Skip to main content');
    expect(translate('fr', 'subscriptionsPaymentSuccess')).toBe('Paiement réussi !');
  });

  it('interpolates parent profile delete confirmation', () => {
    expect(translate('en', 'parentProfilesDeleteConfirm', { name: 'Lina' }))
      .toContain('Lina');
  });
});
