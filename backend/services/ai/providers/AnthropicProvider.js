import { AIProvider } from '../AIProvider.js';
import {
  AINetworkError,
  AIProviderMethodNotImplementedError,
  AIProviderUnavailableError,
  AIQuotaExceededError
} from '../errors.js';
import {
  SAFE_CHILD_SYSTEM_PROMPT,
  buildVoiceAssistantSystemPrompt,
  extractJson,
  inferAssistantIntent,
  languageName,
  normalizeProviderConversation,
  parseSSEJson,
  readSSE
} from '../providerUtils.js';

export class AnthropicProvider extends AIProvider {
  constructor({
    apiKey,
    model,
    baseUrl,
    apiVersion,
    timeoutMs = 20000,
    maxRetries = 2
  } = {}) {
    super({ name: 'anthropic', timeoutMs, maxRetries });
    this.apiKey = apiKey;
    this.model = model || 'claude-3-5-haiku-latest';
    this.baseUrl = baseUrl || 'https://api.anthropic.com/v1';
    this.apiVersion = apiVersion || '2023-06-01';
  }

  assertConfigured() {
    if (!this.apiKey) {
      throw new AIProviderUnavailableError('Anthropic provider is not configured', {
        provider: this.name,
        retryable: false
      });
    }
  }

  async request(body, { stream = false, signal = null } = {}) {
    this.assertConfigured();
    return this.execute(stream ? 'messages_stream' : 'messages', async ({ signal }) => {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...body, stream }),
        signal
      });

      if (response.ok) return stream ? response : response.json();

      const data = await response.json().catch(() => ({}));
      const message = data?.error?.message || `Anthropic request failed with status ${response.status}`;
      if (response.status === 429) throw new AIQuotaExceededError(message, { provider: this.name });
      if (response.status >= 500) throw new AINetworkError(message, { provider: this.name });
      throw new AIProviderUnavailableError(message, { provider: this.name, retryable: false });
    }, stream ? { maxRetries: 0, signal } : { signal });
  }

  async createMessage({
    system,
    messages,
    temperature = 0.4,
    maxTokens = 1200,
    jsonSchema = null
  }) {
    const data = await this.request({
      model: this.model,
      system,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(jsonSchema ? {
        tools: [{
          name: 'return_json',
          description: 'Return the requested structured result.',
          input_schema: jsonSchema
        }],
        tool_choice: { type: 'tool', name: 'return_json' }
      } : {})
    });
    const toolResult = Array.isArray(data.content)
      ? data.content.find((block) => block.type === 'tool_use' && block.name === 'return_json')?.input
      : null;
    const content = Array.isArray(data.content)
      ? data.content.filter((block) => block.type === 'text').map((block) => block.text || '').join('')
      : '';
    if (!content && !toolResult) {
      throw new AIProviderUnavailableError('Anthropic returned an empty response', {
        provider: this.name
      });
    }
    return {
      content,
      structured: toolResult,
      usage: data.usage || null,
      response_id: data.id || null,
      model: data.model || this.model
    };
  }

  async generateStory({ kid, preferences, prompt, outputSchema }) {
    const duration = Math.max(2, Math.min(15, Number(preferences?.estimated_duration_minutes || 5)));
    const response = await this.createMessage({
      system: `${SAFE_CHILD_SYSTEM_PROMPT}\nReturn only valid JSON matching the requested schema. Do not use markdown fences.`,
      messages: [{
        role: 'user',
        content: `${prompt}\nRequired output language: ${languageName(preferences?.language || kid?.preferred_language)}.\nOutput schema: ${JSON.stringify(outputSchema || {})}`
      }],
      temperature: 0.65,
      maxTokens: Math.min(5000, Math.max(1300, duration * 420)),
      jsonSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          story_text: { type: 'string' },
          summary: { type: 'string' },
          estimated_duration_minutes: { type: 'number' },
          theme: { type: 'string' },
          age_level: { type: 'string' },
          chapters: { type: 'array', items: {} },
          interactive_choices: { type: 'array', items: {} },
          illustration_plan: { type: 'object' },
          narration_metadata: { type: 'object' }
        },
        required: ['title', 'story_text', 'summary']
      }
    });
    const story = response.structured || extractJson(response.content, this.name);
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
    const messages = [
      ...normalizeProviderConversation(conversation),
      { role: 'user', content: `Child/user request: ${String(transcript || '').trim().slice(0, 1000)}` }
    ];
    const response = await this.createMessage({
      system: buildVoiceAssistantSystemPrompt({ context, language }),
      messages,
      temperature: 0.35,
      maxTokens: 450,
      jsonSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          intent: { type: 'string' }
        },
        required: ['text', 'intent']
      }
    });
    const parsed = response.structured || extractJson(response.content, this.name);
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
    const response = await this.request({
      model: this.model,
      system: buildVoiceAssistantSystemPrompt({ context, language, json: false }),
      messages: [
        ...normalizeProviderConversation(conversation),
        { role: 'user', content: `Child/user request: ${String(transcript || '').trim().slice(0, 1000)}` }
      ],
      temperature: 0.35,
      max_tokens: 450
    }, { stream: true, signal });
    let text = '';
    let responseId = null;
    let responseModel = this.model;
    let usage = null;

    await readSSE(response, async ({ data }) => {
      const event = parseSSEJson(data, this.name);
      if (event.type === 'message_start') {
        responseId = event.message?.id || responseId;
        responseModel = event.message?.model || responseModel;
        usage = event.message?.usage || usage;
      }
      if (event.type === 'message_delta') usage = { ...(usage || {}), ...(event.usage || {}) };
      const chunk = event.type === 'content_block_delta' ? event.delta?.text || '' : '';
      if (!chunk) return;
      text += chunk;
      if (onChunk) await onChunk(chunk);
    });

    return {
      text: text.trim(),
      intent: inferAssistantIntent(transcript),
      provider_metadata: {
        provider: this.name,
        model: responseModel,
        response_id: responseId,
        usage,
        stream: true
      }
    };
  }

  async transcribeAudio() {
    throw new AIProviderMethodNotImplementedError('transcribeAudio', {
      provider: this.name
    });
  }

  async recommendContent({ kid, contents = [], context = {} }) {
    const compactContents = contents.slice(0, 40).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category_name,
      theme: item.theme,
      language: item.language
    }));
    const response = await this.createMessage({
      system: `${SAFE_CHILD_SYSTEM_PROMPT}\nRank educational contents. Return only JSON with keys ids and reasons.`,
      messages: [{ role: 'user', content: JSON.stringify({ child: kid, context, contents: compactContents }) }],
      temperature: 0.25,
      maxTokens: 900,
      jsonSchema: {
        type: 'object',
        properties: {
          ids: { type: 'array', items: { type: 'number' } },
          reasons: { type: 'object' }
        },
        required: ['ids', 'reasons']
      }
    });
    const parsed = response.structured || extractJson(response.content, this.name);
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
    const response = await this.createMessage({
      system: `${SAFE_CHILD_SYSTEM_PROMPT}\nTranslate faithfully. Return only JSON with key translated_text.`,
      messages: [{
        role: 'user',
        content: JSON.stringify({
          text: String(text || '').slice(0, 5000),
          source_language: sourceLanguage,
          target_language: languageName(targetLanguage),
          context
        })
      }],
      temperature: 0.2,
      maxTokens: 1200,
      jsonSchema: {
        type: 'object',
        properties: { translated_text: { type: 'string' } },
        required: ['translated_text']
      }
    });
    const parsed = response.structured || extractJson(response.content, this.name);
    return {
      translated_text: parsed.translated_text || '',
      target_language: targetLanguage,
      provider_metadata: { provider: this.name, model: response.model, usage: response.usage }
    };
  }
}
