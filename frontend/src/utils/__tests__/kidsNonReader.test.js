import { describe, expect, it, beforeEach } from 'vitest';
import {
  getCategoryVoicePhrase,
  getGuideVoicePhrase,
  speechLocale,
  KIDS_PICTOGRAMS,
} from '../kidsGuidePhrases';
import {
  isKidsUiSoundEnabled,
  setKidsUiSoundEnabled,
} from '../kidsUiSound';

describe('kidsGuidePhrases', () => {
  it('returns localized category phrases', () => {
    expect(getCategoryVoicePhrase('dinosaurs', 'fr')).toMatch(/dinosaures/i);
    expect(getCategoryVoicePhrase('space', 'en')).toMatch(/space/i);
    expect(getCategoryVoicePhrase('animals', 'ar')).toBeTruthy();
  });

  it('returns action phrases and speech locales', () => {
    expect(getGuideVoicePhrase('library', 'en')).toMatch(/story/i);
    expect(speechLocale('fr')).toBe('fr-FR');
    expect(speechLocale('en')).toBe('en-US');
    expect(speechLocale('ar')).toBe('ar-SA');
  });

  it('exposes core pictograms for non-reader nav', () => {
    expect(KIDS_PICTOGRAMS.home).toBe('🏠');
    expect(KIDS_PICTOGRAMS.library).toBe('📚');
    expect(KIDS_PICTOGRAMS.favorites).toBe('❤️');
  });
});

describe('kidsUiSound mute preference', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to enabled and can mute', () => {
    expect(isKidsUiSoundEnabled()).toBe(true);
    setKidsUiSoundEnabled(false);
    expect(isKidsUiSoundEnabled()).toBe(false);
    setKidsUiSoundEnabled(true);
    expect(isKidsUiSoundEnabled()).toBe(true);
  });
});
