import { AIProviderFactory } from './AIProviderFactory.js';
import { aiConfig } from './aiConfig.js';
import { normalizeAIError, withAITimeout } from './errors.js';

const allowedDurations = [2, 5, 8, 12, 15];
const allowedLanguages = ['fr', 'en', 'ar'];
const allowedValues = ['friendship', 'courage', 'respect', 'curiosity'];

const provider = AIProviderFactory.getProvider();

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

export function normalizeStoryRequest(body = {}, kid = {}) {
  return {
    theme: normalizeText(body.theme, 'aventure du soir'),
    characters: normalizeCharacters(body.characters),
    estimated_duration_minutes: normalizeDuration(body.estimated_duration_minutes),
    educational_value: normalizeEducationalValue(body.educational_value),
    language: normalizeLanguage(body.language, kid.preferred_language)
  };
}

export class StoryGenerationService {
  constructor({ aiProvider = provider, timeoutMs = aiConfig.timeoutMs } = {}) {
    this.aiProvider = aiProvider;
    this.timeoutMs = timeoutMs;
  }

  async generatePersonalizedStory({ kid, preferences }) {
    const normalizedPreferences = normalizeStoryRequest(preferences, kid);
    const safeKid = {
      id: kid.id,
      name: normalizeText(kid.name, 'petit lecteur'),
      age: kid.age === null || kid.age === undefined ? null : Number(kid.age),
      preferred_language: normalizeLanguage(kid.preferred_language, normalizedPreferences.language),
      interests: Array.isArray(kid.interests) ? kid.interests.slice(0, 12) : []
    };

    try {
      const response = await withAITimeout(
        this.aiProvider.generateStory({
          kid: safeKid,
          preferences: normalizedPreferences
        }),
        this.timeoutMs,
        {
          provider: this.aiProvider.name,
          message: 'Story generation timed out. Please try again.'
        }
      );

      return {
        title: normalizeText(response.title, 'Histoire personnalisee'),
        story_text: String(response.story_text || '').trim(),
        preferences: normalizedPreferences,
        provider: this.aiProvider.name,
        provider_metadata: response.provider_metadata || {}
      };
    } catch (error) {
      throw normalizeAIError(error, {
        provider: this.aiProvider.name,
        fallbackMessage: 'Story generation failed'
      });
    }
  }
}

const storyGenerationService = new StoryGenerationService();

export async function generatePersonalizedStory(input) {
  return storyGenerationService.generatePersonalizedStory(input);
}
