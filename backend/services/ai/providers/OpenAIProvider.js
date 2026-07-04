import { AIProvider } from '../AIProvider.js';
import {
  AINetworkError,
  AIProviderMethodNotImplementedError,
  AIProviderUnavailableError,
  AIQuotaExceededError,
  AITimeoutError,
  AIError
} from '../errors.js';

const SAFE_CHILD_SYSTEM_PROMPT = [
  'You are Le Lit Qui Lit, a warm educational AI for children.',
  'Always use age-appropriate, gentle, reassuring language.',
  'Never produce violent, sexual, discriminatory, political, manipulative, or advertising content.',
  'Avoid frightening details and unsafe instructions.',
  'Prefer curiosity, kindness, respect, courage, friendship, and emotional safety.',
  'If a child asks for something unsafe, redirect softly to a safe educational answer.'
].join('\n');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function extractJson(content) {
  const text = String(content || '').trim();
  if (!text) throw new AIError('OpenAI returned an empty response', { provider: 'openai' });

  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced.trim());

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }

    throw new AIError('OpenAI response was not valid JSON', { provider: 'openai' });
  }
}

function languageName(language) {
  if (language === 'en') return 'English';
  if (language === 'ar') return 'Arabic';
  return 'French';
}

function normalizeLanguageCode(language = '') {
  const normalized = String(language || '').toLowerCase();
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('ar')) return 'ar';
  return 'fr';
}

export class OpenAIProvider extends AIProvider {
  constructor({
    apiKey,
    model,
    transcriptionModel,
    baseUrl,
    maxRetries = 2,
    cacheTtlMs = 300000,
    maxCacheEntries = 200
  } = {}) {
    super({ name: 'openai' });
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
    this.transcriptionModel = transcriptionModel || 'whisper-1';
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
    this.maxRetries = maxRetries;
    this.cacheTtlMs = cacheTtlMs;
    this.maxCacheEntries = maxCacheEntries;
    this.cache = new Map();
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('OpenAI provider is not configured', { provider: this.name });
    }
  }

  getCached(cacheKey) {
    if (!cacheKey || this.cacheTtlMs <= 0) return null;
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    if (Date.now() - cached.createdAt > this.cacheTtlMs) {
      this.cache.delete(cacheKey);
      return null;
    }
    return cloneJson(cached.value);
  }

  setCached(cacheKey, value) {
    if (!cacheKey || this.cacheTtlMs <= 0) return;
    this.cache.set(cacheKey, {
      createdAt: Date.now(),
      value: cloneJson(value)
    });

    if (this.cache.size > this.maxCacheEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  async requestJson(path, body, { cacheKey = null } = {}) {
    this.assertConfigured();

    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          this.setCached(cacheKey, data);
          return data;
        }

        const message = data?.error?.message || `OpenAI request failed with status ${response.status}`;

        if (response.status === 401 || response.status === 403) {
          throw new AIProviderUnavailableError(message, { provider: this.name });
        }

        if (response.status === 408) {
          throw new AITimeoutError(message, { provider: this.name });
        }

        if (response.status === 429) {
          throw new AIQuotaExceededError(message, { provider: this.name });
        }

        if (response.status >= 500 && attempt < this.maxRetries) {
          lastError = new AINetworkError(message, { provider: this.name });
          await sleep(250 * 2 ** attempt);
          continue;
        }

        throw new AIProviderUnavailableError(message, { provider: this.name });
      } catch (error) {
        if (error?.isAIError && !(error instanceof AINetworkError)) throw error;

        lastError = error?.isAIError
          ? error
          : new AINetworkError(error?.message || 'OpenAI network error', { provider: this.name, cause: error });

        if (attempt < this.maxRetries) {
          await sleep(250 * 2 ** attempt);
          continue;
        }
      }
    }

    throw lastError || new AINetworkError('OpenAI request failed', { provider: this.name });
  }

  async chatCompletion({ messages, temperature = 0.4, maxTokens = 1200, json = false, cacheKey = null }) {
    const body = {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    if (json) {
      body.response_format = { type: 'json_object' };
    }

    const data = await this.requestJson('/chat/completions', body, { cacheKey });
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIProviderUnavailableError('OpenAI returned an empty completion', { provider: this.name });
    }

    return {
      content,
      usage: data.usage || null,
      response_id: data.id || null,
      model: data.model || this.model
    };
  }

  async generateStory({ kid, preferences, prompt, outputSchema }) {
    const cacheKey = `story:${this.model}:${stableStringify({ kid, preferences, prompt })}`;
    const duration = Math.max(2, Math.min(15, Number(preferences?.estimated_duration_minutes || 5)));
    const language = languageName(preferences?.language || kid?.preferred_language || 'fr');

    const { content, usage, response_id, model } = await this.chatCompletion({
      json: true,
      temperature: 0.65,
      maxTokens: Math.min(5000, Math.max(1300, duration * 420)),
      cacheKey,
      messages: [
        {
          role: 'system',
          content: [
            SAFE_CHILD_SYSTEM_PROMPT,
            'Return only valid JSON. Do not wrap it in markdown.',
            'The JSON must match the requested story schema and be safe to read aloud to a child.'
          ].join('\n')
        },
        {
          role: 'user',
          content: [
            prompt,
            '',
            `Required output language: ${language}.`,
            `Output schema: ${JSON.stringify(outputSchema || {})}`,
            'Required keys: title, story_text, summary, estimated_duration_minutes, theme, age_level, chapters, interactive_choices, illustration_plan, narration_metadata.'
          ].join('\n')
        }
      ]
    });

    const story = extractJson(content);

    return {
      title: story.title,
      story_text: story.story_text || story.story,
      summary: story.summary,
      estimated_duration_minutes: story.estimated_duration_minutes || duration,
      theme: story.theme || preferences?.theme,
      age_level: story.age_level,
      chapters: Array.isArray(story.chapters) ? story.chapters : [],
      interactive_choices: Array.isArray(story.interactive_choices) ? story.interactive_choices : [],
      illustration_plan: story.illustration_plan && typeof story.illustration_plan === 'object' ? story.illustration_plan : {},
      narration_metadata: story.narration_metadata && typeof story.narration_metadata === 'object' ? story.narration_metadata : {},
      provider_metadata: {
        provider: this.name,
        model,
        response_id,
        usage
      }
    };
  }

  async chat({ transcript, user }) {
    const cleanTranscript = String(transcript || '').trim().slice(0, 1000);
    const cacheKey = `chat:${this.model}:${stableStringify({ transcript: cleanTranscript, role: user?.role })}`;

    const { content, usage, response_id, model } = await this.chatCompletion({
      json: true,
      temperature: 0.35,
      maxTokens: 450,
      cacheKey,
      messages: [
        {
          role: 'system',
          content: [
            SAFE_CHILD_SYSTEM_PROMPT,
            'You are answering inside a bedtime reading assistant.',
            'Return only JSON with keys: text and intent.',
            'Keep text short, kind, educational, and easy to read aloud.'
          ].join('\n')
        },
        {
          role: 'user',
          content: `Child/user request: ${cleanTranscript}`
        }
      ]
    });

    const parsed = extractJson(content);

    return {
      text: String(parsed.text || '').trim() || "Je suis la pour t'aider avec une histoire douce.",
      intent: String(parsed.intent || 'conversation').trim(),
      provider_metadata: {
        provider: this.name,
        model,
        response_id,
        usage
      }
    };
  }

  async recommendContent({ kid, contents = [], context = {} }) {
    const compactContents = contents.slice(0, 40).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category_name,
      theme: item.theme,
      language: item.language,
      age_min: item.age_group_min,
      age_max: item.age_group_max,
      has_audio: Boolean(item.audio_url)
    }));
    const cacheKey = `recommend:${this.model}:${stableStringify({ kid, compactContents, context })}`;

    const { content, usage, response_id, model } = await this.chatCompletion({
      json: true,
      temperature: 0.25,
      maxTokens: 900,
      cacheKey,
      messages: [
        {
          role: 'system',
          content: [
            SAFE_CHILD_SYSTEM_PROMPT,
            'Rank educational reading contents for a child.',
            'Return only JSON with keys: ids and reasons. ids must contain existing content ids only.'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            child: kid,
            context,
            contents: compactContents
          })
        }
      ]
    });

    const parsed = extractJson(content);
    const rankedIds = Array.isArray(parsed.ids) ? parsed.ids.map((id) => Number(id)).filter(Number.isFinite) : [];
    const byId = new Map(contents.map((item) => [Number(item.id), item]));
    const recommendations = rankedIds.map((id) => byId.get(id)).filter(Boolean);

    return {
      recommendations,
      provider_metadata: {
        provider: this.name,
        model,
        response_id,
        usage,
        reasons: parsed.reasons || {}
      }
    };
  }

  async transcribeAudio({ audioBuffer, mimeType, language = 'fr-FR' }) {
    this.assertConfigured();

    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const formData = new FormData();
        formData.append('model', this.transcriptionModel);
        formData.append('language', normalizeLanguageCode(language));
        formData.append('file', new Blob([audioBuffer], { type: mimeType || 'audio/webm' }), 'voice-assistant.webm');

        const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          },
          body: formData
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          return {
            transcript: data.text || '',
            language,
            provider_metadata: {
              provider: this.name,
              model: this.transcriptionModel
            }
          };
        }

        const message = data?.error?.message || `OpenAI transcription failed with status ${response.status}`;
        if (response.status === 429) throw new AIQuotaExceededError(message, { provider: this.name });
        if (response.status >= 500 && attempt < this.maxRetries) {
          lastError = new AINetworkError(message, { provider: this.name });
          await sleep(250 * 2 ** attempt);
          continue;
        }
        throw new AIProviderUnavailableError(message, { provider: this.name });
      } catch (error) {
        if (error?.isAIError && !(error instanceof AINetworkError)) throw error;
        lastError = error?.isAIError ? error : new AINetworkError(error?.message || 'OpenAI transcription network error', { provider: this.name, cause: error });
        if (attempt < this.maxRetries) {
          await sleep(250 * 2 ** attempt);
          continue;
        }
      }
    }

    throw lastError || new AINetworkError('OpenAI transcription failed', { provider: this.name });
  }

  async translate({ text, sourceLanguage = null, targetLanguage, context = {} }) {
    const cacheKey = `translate:${this.model}:${stableStringify({ text, sourceLanguage, targetLanguage, context })}`;
    const target = languageName(targetLanguage);

    const { content, usage, response_id, model } = await this.chatCompletion({
      json: true,
      temperature: 0.2,
      maxTokens: 1200,
      cacheKey,
      messages: [
        {
          role: 'system',
          content: [
            SAFE_CHILD_SYSTEM_PROMPT,
            'Translate educational child-safe content faithfully. Return only JSON with key translated_text.'
          ].join('\n')
        },
        {
          role: 'user',
          content: JSON.stringify({
            text: String(text || '').slice(0, 5000),
            source_language: sourceLanguage,
            target_language: target,
            context
          })
        }
      ]
    });

    const parsed = extractJson(content);

    return {
      translated_text: parsed.translated_text || '',
      target_language: targetLanguage,
      provider_metadata: {
        provider: this.name,
        model,
        response_id,
        usage
      }
    };
  }

  async cloneVoice() {
    throw new AIProviderMethodNotImplementedError('cloneVoice', { provider: this.name });
  }
}
