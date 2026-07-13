import test from 'node:test';
import assert from 'node:assert/strict';

process.env.OPENAI_API_KEY = '';
process.env.GEMINI_API_KEY = '';
process.env.ANTHROPIC_API_KEY = '';
process.env.CLAUDE_API_KEY = '';

const { VoiceAssistantService } = await import('../services/ai/voiceAssistantService.js');

test('voice assistant returns demo mode when no AI provider key is configured', async () => {
  const service = new VoiceAssistantService();
  const reply = await service.getReply({
    transcript: 'Raconte-moi une histoire',
    user: { id: 1, role: 'kid' },
    requestedLanguage: 'fr',
  });

  assert.equal(reply.demo_mode, true);
  assert.equal(reply.provider, 'demo');
  assert.match(reply.reply_text, /demonstration|demo/i);
});

test('voice assistant stream path returns demo mode without API key', async () => {
  const service = new VoiceAssistantService();
  const chunks = [];
  const reply = await service.getReplyStream({
    transcript: 'Bonjour',
    user: { id: 1, role: 'kid' },
    requestedLanguage: 'fr',
  }, {
    onChunk: async (chunk) => { chunks.push(chunk); },
  });

  assert.equal(reply.demo_mode, true);
  assert.equal(reply.provider, 'demo');
  assert.ok(chunks.length > 0);
});
