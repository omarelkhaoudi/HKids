import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAudioUpload, isAllowedAudioMetadata } from '../services/voice/audioValidation.js';

function createWavBuffer(size = 2048) {
  const buffer = Buffer.alloc(size);
  buffer.write('RIFF', 0, 'ascii');
  buffer.write('WAVE', 8, 'ascii');
  return buffer;
}

test('validateAudioUpload accepts a valid wav upload', () => {
  const result = validateAudioUpload({
    originalname: 'voice.wav',
    mimetype: 'audio/wav',
    buffer: createWavBuffer()
  });

  assert.equal(result.type, 'wav');
  assert.equal(result.mimeType, 'audio/wav');
});

test('validateAudioUpload rejects unsupported audio', () => {
  assert.throws(
    () => validateAudioUpload({
      originalname: 'voice.txt',
      mimetype: 'text/plain',
      buffer: Buffer.alloc(2048, 1)
    }),
    /Unsupported or invalid audio file/
  );
});

test('isAllowedAudioMetadata validates declared metadata', () => {
  assert.equal(isAllowedAudioMetadata({
    originalname: 'clip.mp3',
    mimetype: 'audio/mpeg'
  }), true);
  assert.equal(isAllowedAudioMetadata({
    originalname: 'clip.txt',
    mimetype: 'text/plain'
  }), false);
});
