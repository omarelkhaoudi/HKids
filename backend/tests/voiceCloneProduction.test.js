import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVoicePreviewText, VoiceCloneService } from '../services/ai/VoiceCloneService.js';

function createSilentWavBuffer() {
  const sampleRate = 16000;
  const dataSize = sampleRate * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

test('buildVoicePreviewText returns localized preview text without mojibake', () => {
  assert.equal(
    buildVoicePreviewText({ name: 'Mama', language: 'fr' }),
    'Bonjour, je suis Mama. Je suis pret a te raconter une merveilleuse histoire.'
  );
  assert.match(buildVoicePreviewText({ name: 'Mom', language: 'en' }), /wonderful story/);
  assert.match(buildVoicePreviewText({ name: 'Mama', language: 'ar' }), /\u0645\u0631\u062d\u0628\u0627/);
});

test('evaluateAudioQuality flags silent samples as low quality', () => {
  const service = new VoiceCloneService({ voiceProvider: { name: 'test' } });
  const quality = service.evaluateAudioQuality({
    audioBuffer: createSilentWavBuffer(),
    mimeType: 'audio/wav'
  });

  assert.equal(quality.quality_status, 'low');
  assert.match(quality.quality_notes, /silencieux|corrompu/);
});

test('evaluateAudioQuality treats missing audio as low quality', () => {
  const service = new VoiceCloneService({ voiceProvider: { name: 'test' } });
  const quality = service.evaluateAudioQuality({
    audioBuffer: null,
    mimeType: 'audio/wav'
  });

  assert.equal(quality.quality_score, 0);
  assert.equal(quality.quality_status, 'low');
});
