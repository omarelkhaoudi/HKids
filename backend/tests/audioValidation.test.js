import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashAudioBuffer,
  isAllowedAudioMetadata,
  isLikelyAudioPayload,
  validateAudioUpload
} from '../services/voice/audioValidation.js';

function createWavBuffer({ seconds = 1, silent = false } = {}) {
  const sampleRate = 16000;
  const channels = 1;
  const bitsPerSample = 16;
  const sampleCount = sampleRate * seconds;
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  if (!silent) {
    for (let i = 0; i < sampleCount; i += 1) {
      const amplitude = Math.round(Math.sin(i / 8) * 6000);
      buffer.writeInt16LE(amplitude, 44 + i * 2);
    }
  }

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
  assert.equal(result.fingerprint, hashAudioBuffer(createWavBuffer()));
  assert.equal(result.sampleRateHz, 16000);
});

test('validateAudioUpload rejects silent or corrupted recordings', () => {
  assert.throws(
    () => validateAudioUpload({
      originalname: 'silent.wav',
      mimetype: 'audio/wav',
      buffer: createWavBuffer({ silent: true })
    }),
    /silent or corrupted/
  );
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

test('isLikelyAudioPayload rejects non-audio provider payloads', () => {
  assert.equal(isLikelyAudioPayload(Buffer.from('{"error":"not audio"}'), 'application/json'), false);
  const mp3 = Buffer.alloc(2048, 1);
  mp3[0] = 0xff;
  mp3[1] = 0xfb;
  assert.equal(isLikelyAudioPayload(mp3, 'audio/mpeg'), true);
});
