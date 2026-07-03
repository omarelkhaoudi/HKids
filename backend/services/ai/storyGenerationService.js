import { MockStoryGenerationProvider } from './providers/mockStoryGenerationProvider.js';

const allowedDurations = [2, 5, 8, 12, 15];
const allowedLanguages = ['fr', 'en', 'ar'];
const allowedValues = ['friendship', 'courage', 'respect', 'curiosity'];

function createProvider() {
  const provider = process.env.AI_STORY_PROVIDER || 'mock';

  if (provider !== 'mock') {
    console.warn(`[ai] Unknown story provider "${provider}", falling back to mock provider.`);
  }

  return new MockStoryGenerationProvider();
}

const provider = createProvider();

function normalizeText(value, fallback = '') {
  return String(value || fallback).trim().slice(0, 120);
}

function normalizeCharacters(value) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];

  return items
    .map((item) => normalizeText(item))
    .filter((item, index, self) => item && self.indexOf(item) === index)
    .slice(0, 4);
}

function normalizeDuration(value) {
  const parsed = Number.parseInt(value, 10);
  if (allowedDurations.includes(parsed)) return parsed;
  return 5;
}

function normalizeLanguage(value, fallback) {
  if (allowedLanguages.includes(value)) return value;
  if (allowedLanguages.includes(fallback)) return fallback;
  return 'fr';
}

function normalizeEducationalValue(value) {
  return allowedValues.includes(value) ? value : 'curiosity';
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('story_generation_timeout')), timeoutMs);
    })
  ]);
}

export function normalizeStoryRequest(body = {}, kid = {}) {
  return {
    theme: normalizeText(body.theme, 'aventure du soir'),
    characters: normalizeCharacters(body.characters),
    estimated_duration_minutes: normalizeDuration(body.estimated_duration_minutes),
    educational_value: normalizeEducationalValue(body.educational_value),
    language: normalizeLanguage(body.language, kid.preferred_language)
  };
}

export async function generatePersonalizedStory({ kid, preferences }) {
  const timeoutMs = Math.max(3000, Number.parseInt(process.env.AI_STORY_TIMEOUT_MS || '15000', 10));
  const normalizedPreferences = normalizeStoryRequest(preferences, kid);
  const safeKid = {
    id: kid.id,
    name: normalizeText(kid.name, 'petit lecteur'),
    age: kid.age === null || kid.age === undefined ? null : Number(kid.age),
    preferred_language: normalizeLanguage(kid.preferred_language, normalizedPreferences.language),
    interests: Array.isArray(kid.interests) ? kid.interests.slice(0, 12) : []
  };

  const response = await withTimeout(
    provider.generate({
      kid: safeKid,
      preferences: normalizedPreferences
    }),
    timeoutMs
  );

  return {
    title: normalizeText(response.title, 'Histoire personnalisee'),
    story_text: String(response.story_text || '').trim(),
    preferences: normalizedPreferences,
    provider: process.env.AI_STORY_PROVIDER || 'mock',
    provider_metadata: response.provider_metadata || {}
  };
}
