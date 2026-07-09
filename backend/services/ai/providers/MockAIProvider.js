import { AIProvider } from '../AIProvider.js';
import { AIProviderMethodNotImplementedError } from '../errors.js';
import { MockStoryGenerationProvider } from './mockStoryGenerationProvider.js';
import { MockVoiceAssistantProvider } from './mockVoiceAssistantProvider.js';

export class MockAIProvider extends AIProvider {
  constructor() {
    super({ name: 'mock' });
    this.storyProvider = new MockStoryGenerationProvider();
    this.voiceProvider = new MockVoiceAssistantProvider();
  }

  async generateStory({ kid, preferences }) {
    return this.storyProvider.generate({ kid, preferences });
  }

  async chat({ transcript, user, context, conversation, language, messages }) {
    return this.voiceProvider.respond({
      transcript,
      user,
      context,
      conversation: conversation || messages || [],
      language
    });
  }

  async transcribeAudio({ audioBuffer, mimeType, language }) {
    return {
      transcript: 'Je veux une histoire courte',
      language: language || 'fr-FR',
      provider_metadata: {
        provider: this.name,
        model: 'mock-stt-v1',
        mime_type: mimeType,
        audio_bytes: audioBuffer?.length || 0
      }
    };
  }

  async recommendContent({ contents = [] }) {
    return {
      recommendations: contents.slice(0, 6),
      provider_metadata: {
        provider: this.name,
        model: 'mock-recommendation-v1'
      }
    };
  }

  async cloneVoice() {
    throw new AIProviderMethodNotImplementedError('cloneVoice', { provider: this.name });
  }

  async translate({ text, targetLanguage }) {
    return {
      translated_text: String(text || ''),
      target_language: targetLanguage,
      provider_metadata: {
        provider: this.name,
        model: 'mock-translation-v1'
      }
    };
  }
}
