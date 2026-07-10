import { AIProvider } from '../AIProvider.js';
import {
  AINetworkError,
  AIProviderUnavailableError,
  AIQuotaExceededError
} from '../errors.js';
import {
  SAFE_CHILD_SYSTEM_PROMPT,
  buildVoiceAssistantSystemPrompt,
  extractJson,
  inferAssistantIntent,
  languageName,
  normalizeLanguageCode,
  normalizeProviderConversation,
  parseSSEJson,
  readSSE
} from '../providerUtils.js';

export class GeminiProvider extends AIProvider {
  constructor({
    apiKey,
    model,
    baseUrl,
    timeoutMs = 20000,
    maxRetries = 2
  } = {}) {
    super({ name: 'gemini', timeoutMs, maxRetries });
    this.apiKey = apiKey;
    this.model = model || 'gemini-2.0-flash';
    this.baseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('Gemini provider is not configured', {
        provider: this.name,
        retryable: false
      });
    }
  }

  async request(method, body, { stream = false, signal = null } = {}) {
    this.assertConfigured();
    const suffix = stream ? 'streamGenerateContent' : 'generateContent';
    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:${suffix}?key=${encodeURIComponent(this.apiKey)}${stream ? '&alt=sse' : ''}`;

    return this.execute(stream ? 'stream_content' : 'generate_content', async ({ signal }) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal
      });

      if (response.ok) return stream ? response : response.json();

      const data = await response.json().catch(() => ({}));
      const message = data?.error?.message || `Gemini request failed with status ${response.status}`;
      if (response.status === 429) throw new AIQuotaExceededError(message, { provider: this.name });
      if (response.status >= 500) throw new AINetworkError(message, { provider: this.name });
      throw new AIProviderUnavailableError(message, { provider: this.name, retryable: false });
    }, stream ? { maxRetries: 0, signal } : { signal });
  }

  async generateContent({ system, contents, temperature = 0.4, maxTokens = 1200, json = false }) {
    const data = await this.request('generateContent', {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        ...(json ? { responseMimeType: 'application/json' } : {})
      }
    });
    const content = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
    if (!content) throw new AIProviderUnavailableError('Gemini returned an empty response', { provider: this.name });
    return {
      content,
      usage: data.usageMetadata || null,
      response_id: data.responseId || null,
      model: data.modelVersion || this.model
    };
  }

  async generateStory({ kid, preferences, prompt, outputSchema }) {
    const duration = Math.max(2, Math.min(15, Number(preferences?.estimated_duration_minutes || 5)));
    const response = await this.generateContent({
      system: `${SAFE_CHILD_SYSTEM_PROMPT}\nReturn only valid JSON matching the requested schema.`,
      contents: [{
        role: 'user',
        parts: [{
          text: `${prompt}\nRequired output language: ${languageName(preferences?.language || kid?.preferred_language)}.\nOutput schema: ${JSON.stringify(outputSchema || {})}`
        }]
      }],
      temperature: 0.65,
      maxTokens: Math.min(5000, Math.max(1300, duration * 420)),
      json: true
    });
    const story = extractJson(response.content, this.name);
    return {
      ...story,
      story_text: story.story_text || story.story,
      estimated_duration_minutes: story.estimated_duration_minutes || duration,
      provider_metadata: {
        provider: this.name,
        model: response.model,
        response_id: response.response_id,
        usage: response.usage
      }
    };
  }

  async chat({ transcript, context = {}, conversation = [], language = 'fr' }) {
    const history = normalizeProviderConversation(conversation).map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
    const response = await this.generateContent({
      system: buildVoiceAssistantSystemPrompt({ context, language }),
      contents: [
        ...history,
        { role: 'user', parts: [{ text: `Child/user request: ${String(transcript || '').trim().slice(0, 1000)}` }] }
      ],
      temperature: 0.35,
      maxTokens: 450,
      json: true
    });
    const parsed = extractJson(response.content, this.name);
    return {
      text: String(parsed.text || '').trim(),
      intent: String(parsed.intent || 'conversation'),
      provider_metadata: {
        provider: this.name,
        model: response.model,
        response_id: response.response_id,
        usage: response.usage
      }
    };
  }

  async chatStream({ transcript, context = {}, conversation = [], language = 'fr' }, { onChunk, signal } = {}) {
    const history = normalizeProviderConversation(conversation).map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));
    const response = await this.request('streamGenerateContent', {
      systemInstruction: {
        parts: [{ text: buildVoiceAssistantSystemPrompt({ context, language, json: false }) }]
      },
      contents: [
        ...history,
        { role: 'user', parts: [{ text: `Child/user request: ${String(transcript || '').trim().slice(0, 1000)}` }] }
      ],
      generationConfig: { temperature: 0.35, maxOutputTokens: 450 }
    }, { stream: true, signal });
    let text = '';
    let usage = null;

    await readSSE(response, async ({ data }) => {
      const event = parseSSEJson(data, this.name);
      usage = event.usageMetadata || usage;
      const chunk = event?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
      if (!chunk) return;
      text += chunk;
      if (onChunk) await onChunk(chunk);
    });

    return {
      text: text.trim(),
      intent: inferAssistantIntent(transcript),
      provider_metadata: { provider: this.name, model: this.model, usage, stream: true }
    };
  }

  async transcribeAudio({ audioBuffer, mimeType, language = 'fr-FR' }) {
    const response = await this.generateContent({
      system: 'Transcribe the supplied child-safe audio accurately. Return only the spoken words.',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: mimeType || 'audio/webm', data: audioBuffer.toString('base64') } },
          { text: `Transcription language hint: ${normalizeLanguageCode(language)}.` }
        ]
      }],
      temperature: 0,
      maxTokens: 1000
    });
    return {
      transcript: response.content.trim(),
      language,
      provider_metadata: { provider: this.name, model: response.model, usage: response.usage }
    };
  }

  async recommendContent({ kid, contents = [], context = {} }) {
    const compactContents = contents.slice(0, 40).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category_name,
      theme: item.theme,
      language: item.language
    }));
    const response = await this.generateContent({
      system: `${SAFE_CHILD_SYSTEM_PROMPT}\nRank educational contents. Return JSON with keys ids and reasons.`,
      contents: [{ role: 'user', parts: [{ text: JSON.stringify({ child: kid, context, contents: compactContents }) }] }],
      temperature: 0.25,
      maxTokens: 900,
      json: true
    });
    const parsed = extractJson(response.content, this.name);
    const byId = new Map(contents.map((item) => [Number(item.id), item]));
    const recommendations = (Array.isArray(parsed.ids) ? parsed.ids : [])
      .map((id) => byId.get(Number(id)))
      .filter(Boolean);
    return {
      recommendations,
      provider_metadata: {
        provider: this.name,
        model: response.model,
        usage: response.usage,
        reasons: parsed.reasons || {}
      }
    };
  }

  async translate({ text, sourceLanguage = null, targetLanguage, context = {} }) {
    const response = await this.generateContent({
      system: `${SAFE_CHILD_SYSTEM_PROMPT}\nTranslate faithfully. Return JSON with key translated_text.`,
      contents: [{
        role: 'user',
        parts: [{
          text: JSON.stringify({
            text: String(text || '').slice(0, 5000),
            source_language: sourceLanguage,
            target_language: languageName(targetLanguage),
            context
          })
        }]
      }],
      temperature: 0.2,
      maxTokens: 1200,
      json: true
    });
    const parsed = extractJson(response.content, this.name);
    return {
      translated_text: parsed.translated_text || '',
      target_language: targetLanguage,
      provider_metadata: { provider: this.name, model: response.model, usage: response.usage }
    };
  }
}
