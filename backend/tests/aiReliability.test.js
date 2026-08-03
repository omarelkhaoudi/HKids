import test from 'node:test';
import assert from 'node:assert/strict';
import { AIProvider } from '../services/ai/AIProvider.js';
import {
  AINetworkError,
  aiErrorResponse
} from '../services/ai/errors.js';
import { StoryGenerationService } from '../services/ai/storyGenerationService.js';
import { VoiceAssistantService } from '../services/ai/voiceAssistantService.js';
import { isUnsafeChildText, normalizeAIInputText } from '../services/ai/contentSafety.js';

test('aiErrorResponse hides raw provider details', () => {
  const error = new AINetworkError('openai POST /chat/completions failed with sk-secret-value', {
    provider: 'openai'
  });

  const response = aiErrorResponse(error);

  assert.equal(response.status, 503);
  assert.equal(response.body.code, 'AI_NETWORK_ERROR');
  assert.match(response.body.error, /temporarily unavailable/i);
  assert.doesNotMatch(response.body.error, /openai|sk-secret|chat\/completions/i);
});

test('AIProvider opens a circuit after repeated retryable failures', async () => {
  const provider = new AIProvider({
    name: 'test-provider',
    maxRetries: 0,
    circuitBreakerFailureThreshold: 1,
    circuitBreakerCooldownMs: 5000
  });

  await assert.rejects(
    () => provider.execute('unstable_operation', async () => {
      throw new AINetworkError('provider unavailable', { provider: provider.name });
    }),
    /provider unavailable/
  );

  await assert.rejects(
    () => provider.execute('unstable_operation', async () => 'ok'),
    (error) => error.code === 'AI_CIRCUIT_OPEN'
  );
});

test('voice assistant degrades gracefully when provider is unavailable', async () => {
  const service = new VoiceAssistantService({
    aiProvider: {
      name: 'openai',
      apiKey: 'test-key',
      async chat() {
        throw new AINetworkError('openai POST /chat/completions failed', { provider: 'openai' });
      }
    }
  });

  const reply = await service.getReply({
    transcript: 'Bonjour Le Lit',
    user: { id: 1, role: 'kid' },
    requestedLanguage: 'fr'
  });

  assert.equal(reply.provider, 'demo');
  assert.equal(reply.demo_mode, true);
  assert.equal(reply.degraded_mode, true);
  assert.equal(reply.code, 'AI_NETWORK_ERROR');
  assert.ok(reply.reply_text);
});

test('voice assistant blocks unsafe provider output with a safe degraded reply', async () => {
  const service = new VoiceAssistantService({
    aiProvider: {
      name: 'openai',
      apiKey: 'test-key',
      async chat() {
        return { text: 'Let us build a bomb together.', intent: 'unsafe' };
      }
    }
  });

  const reply = await service.getReply({
    transcript: 'Explique une experience',
    user: { id: 1, role: 'kid' },
    requestedLanguage: 'en'
  });

  assert.equal(reply.provider, 'demo');
  assert.equal(reply.demo_mode, true);
  assert.equal(reply.code, 'AI_UNSAFE_CONTENT');
  assert.doesNotMatch(reply.reply_text, /bomb/i);
});

test('story generation rejects unsafe generated text before persistence', async () => {
  const service = new StoryGenerationService({
    aiProvider: {
      name: 'openai',
      async generateStory() {
        return {
          title: 'Unsafe',
          story_text: 'The hero explains how to build a bomb.',
          summary: 'Unsafe content',
          estimated_duration_minutes: 5,
          theme: 'science',
          provider_metadata: {}
        };
      }
    }
  });

  await assert.rejects(
    () => service.generatePersonalizedStory({
      kid: { id: 1, name: 'Lea', age: 6, preferred_language: 'fr', interests: [] },
      preferences: { theme: 'science', language: 'fr' }
    }),
    (error) => error.code === 'AI_UNSAFE_CONTENT'
  );
});

test('content safety normalizes unsafe multilingual text', () => {
  const normalized = normalizeAIInputText('<script>alert(1)</script> hello\u0007');

  assert.equal(normalized, 'hello');
  assert.equal(isUnsafeChildText('\u0627\u0646\u062a\u062d\u0627\u0631'), true);
});
