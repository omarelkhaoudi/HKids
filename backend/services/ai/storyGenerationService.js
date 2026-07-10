import { AIProviderFactory } from './AIProviderFactory.js';
import { normalizeAIError } from './errors.js';

const allowedDurations = [2, 5, 8, 12, 15];
const allowedLanguages = ['fr', 'en', 'ar'];
const allowedValues = ['friendship', 'courage', 'respect', 'curiosity'];
const maxThemeLength = 80;
const maxCharacterLength = 60;

function normalizeText(value, fallback = '') {
  return String(value || fallback).trim().slice(0, 120);
}

function normalizeLongText(value, fallback = '', maxLength = 2000) {
  return String(value || fallback).trim().slice(0, maxLength);
}

function normalizeCharacters(value) {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];

  return items
    .map((item) => normalizeText(item).slice(0, maxCharacterLength))
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

function normalizeInterests(interests) {
  if (!Array.isArray(interests)) return [];
  return interests
    .map((interest) => normalizeText(interest))
    .filter((interest, index, self) => interest && self.indexOf(interest) === index)
    .slice(0, 12);
}

function normalizeAge(value) {
  if (value === null || value === undefined || value === '') return null;
  const age = Number.parseInt(value, 10);
  if (Number.isNaN(age)) return null;
  return Math.max(0, Math.min(18, age));
}

export function getAgeLevel(age) {
  const normalizedAge = normalizeAge(age);
  if (normalizedAge === null) return 'age_unknown';
  if (normalizedAge <= 5) return 'early_childhood';
  if (normalizedAge <= 8) return 'first_reader';
  if (normalizedAge <= 12) return 'middle_grade';
  return 'young_teen';
}

function getAgeGuidance(ageLevel) {
  const guidance = {
    early_childhood: 'phrases tres courtes, vocabulaire simple, repetition douce, intrigue rassurante',
    first_reader: 'phrases courtes, vocabulaire accessible, aventure claire, emotion positive',
    middle_grade: 'chapitres courts implicites, vocabulaire plus riche, dilemme simple, progression nette',
    young_teen: 'style plus nuance, enjeux adaptes, dialogue naturel, conclusion reflechie',
    age_unknown: 'style enfantin general, ton rassurant, complexite moderee'
  };

  return guidance[ageLevel] || guidance.age_unknown;
}

function buildSummary({ title, storyText, theme }) {
  const firstSentence = String(storyText || '')
    .replace(/\s+/g, ' ')
    .split(/[.!?]/)
    .map((item) => item.trim())
    .find(Boolean);

  return normalizeLongText(firstSentence || `${title} est une histoire autour de ${theme}.`, '', 280);
}

function buildOutputSchema() {
  return {
    title: 'string',
    story_text: 'string',
    summary: 'string',
    estimated_duration_minutes: 'number',
    theme: 'string',
    age_level: 'early_childhood | first_reader | middle_grade | young_teen | age_unknown',
    chapters: 'array reserved for future multi-chapter stories',
    interactive_choices: 'array reserved for future interactive choices',
    illustration_plan: 'object reserved for future AI illustrations',
    narration_metadata: 'object reserved for future cloned narration'
  };
}

export function buildStoryPrompt({ kid, preferences, ageLevel }) {
  const interests = kid.interests.length > 0 ? kid.interests.join(', ') : 'lecture, imagination';
  const characters = preferences.characters.length > 0 ? preferences.characters.join(', ') : 'un compagnon bienveillant';
  const languageLabel = preferences.language === 'en' ? 'English' : preferences.language === 'ar' ? 'Arabic' : 'French';

  return [
    'You are the story engine for Le Lit Qui Lit, a safe educational reading platform for children.',
    'Generate one original, age-appropriate, warm and non-frightening story.',
    'Never include unsafe, violent, discriminatory, sexual, political, or advertising content.',
    '',
    `Child profile: first_name="${kid.name}", age="${kid.age ?? 'unknown'}", language="${languageLabel}", interests="${interests}".`,
    `Story request: theme="${preferences.theme}", characters="${characters}", target_duration_minutes="${preferences.estimated_duration_minutes}", educational_value="${preferences.educational_value}".`,
    `Age level: ${ageLevel}. Style guidance: ${getAgeGuidance(ageLevel)}.`,
    '',
    'Return a structured object matching this schema:',
    JSON.stringify(buildOutputSchema()),
    '',
    'The story_text must be ready to display and read aloud. The summary must be one short sentence.'
  ].join('\n');
}

export function normalizeStoryRequest(body = {}, kid = {}) {
  return {
    theme: normalizeText(body.theme, 'aventure du soir').slice(0, maxThemeLength),
    characters: normalizeCharacters(body.characters),
    estimated_duration_minutes: normalizeDuration(body.estimated_duration_minutes),
    educational_value: normalizeEducationalValue(body.educational_value),
    language: normalizeLanguage(body.language, kid.preferred_language)
  };
}

export function validateStoryRequest(body = {}) {
  const errors = [];
  const normalized = normalizeStoryRequest(body);

  if (body.theme !== undefined && !String(body.theme).trim()) {
    errors.push({ field: 'theme', message: 'Theme cannot be empty' });
  }

  if (body.estimated_duration_minutes !== undefined && !allowedDurations.includes(Number.parseInt(body.estimated_duration_minutes, 10))) {
    errors.push({ field: 'estimated_duration_minutes', message: `Duration must be one of: ${allowedDurations.join(', ')}` });
  }

  if (body.language !== undefined && !allowedLanguages.includes(body.language)) {
    errors.push({ field: 'language', message: `Language must be one of: ${allowedLanguages.join(', ')}` });
  }

  if (body.educational_value !== undefined && !allowedValues.includes(body.educational_value)) {
    errors.push({ field: 'educational_value', message: `Educational value must be one of: ${allowedValues.join(', ')}` });
  }

  if (normalizeCharacters(body.characters).length === 0 && body.characters !== undefined && String(body.characters).trim()) {
    errors.push({ field: 'characters', message: 'Characters could not be parsed' });
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized
  };
}

export class StoryGenerationService {
  constructor({ aiProvider = null } = {}) {
    this.aiProvider = aiProvider;
  }

  async generatePersonalizedStory({ kid, preferences }) {
    const aiProvider = this.aiProvider || AIProviderFactory.getProvider();
    const normalizedPreferences = normalizeStoryRequest(preferences, kid);
    const age = normalizeAge(kid.age);
    const ageLevel = getAgeLevel(age);
    const safeKid = {
      id: kid.id,
      name: normalizeText(kid.name, 'petit lecteur'),
      age,
      preferred_language: normalizeLanguage(kid.preferred_language, normalizedPreferences.language),
      interests: normalizeInterests(kid.interests)
    };
    const prompt = buildStoryPrompt({
      kid: safeKid,
      preferences: normalizedPreferences,
      ageLevel
    });

    try {
      const response = await aiProvider.generateStory({
        kid: safeKid,
        preferences: normalizedPreferences,
        prompt,
        outputSchema: buildOutputSchema()
      });
      const storyText = normalizeLongText(response.story_text, '', 12000);
      const title = normalizeText(response.title, 'Histoire personnalisee');
      const summary = normalizeLongText(
        response.summary,
        buildSummary({ title, storyText, theme: normalizedPreferences.theme }),
        500
      );

      return {
        title,
        story_text: storyText,
        story: storyText,
        summary,
        estimated_duration_minutes: normalizeDuration(response.estimated_duration_minutes || normalizedPreferences.estimated_duration_minutes),
        theme: normalizeText(response.theme, normalizedPreferences.theme),
        age_level: response.age_level || ageLevel,
        chapters: Array.isArray(response.chapters) ? response.chapters.slice(0, 10) : [],
        interactive_choices: Array.isArray(response.interactive_choices) ? response.interactive_choices.slice(0, 8) : [],
        illustration_plan: response.illustration_plan && typeof response.illustration_plan === 'object' ? response.illustration_plan : {},
        narration_metadata: response.narration_metadata && typeof response.narration_metadata === 'object' ? response.narration_metadata : {},
        preferences: normalizedPreferences,
        prompt_metadata: {
          prompt,
          output_schema: buildOutputSchema(),
          kid_profile: {
            id: safeKid.id,
            name: safeKid.name,
            age: safeKid.age,
            age_level: ageLevel,
            interests: safeKid.interests,
            language: safeKid.preferred_language
          }
        },
        provider: aiProvider.name,
        provider_metadata: response.provider_metadata || {},
        generation_metadata: {
          service: 'StoryGenerationService',
          version: 'v1',
          future_capabilities: {
            illustrations: 'illustration_plan',
            multi_chapter: 'chapters',
            interactive_choices: 'interactive_choices',
            cloned_narration: 'narration_metadata'
          }
        }
      };
    } catch (error) {
      throw normalizeAIError(error, {
        provider: aiProvider.name,
        fallbackMessage: 'Story generation failed'
      });
    }
  }
}

const storyGenerationService = new StoryGenerationService();

export async function generatePersonalizedStory(input) {
  return storyGenerationService.generatePersonalizedStory(input);
}
