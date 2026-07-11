import { describe, it, expect } from 'vitest';
import { resolveVoiceNavigation } from '../VoiceAssistant';

describe('resolveVoiceNavigation', () => {
  it('routes library intents', () => {
    expect(resolveVoiceNavigation('ouvre la bibliotheque')).toBe('/kids/library');
    expect(resolveVoiceNavigation('open library')).toBe('/kids/library');
  });

  it('routes themed library intents', () => {
    expect(resolveVoiceNavigation('histoire dinosaure')).toBe('/kids/library?theme=dinosaurs');
    expect(resolveVoiceNavigation('story in space')).toBe('/kids/library?theme=space');
  });

  it('routes learning and studio intents', () => {
    expect(resolveVoiceNavigation('je veux jouer')).toBe('/kids/learning');
    expect(resolveVoiceNavigation('open story studio')).toBe('/kids/story-studio');
  });

  it('returns null for unrelated prompts', () => {
    expect(resolveVoiceNavigation('bonjour comment vas tu')).toBeNull();
  });
});
