import crypto from 'crypto';
import path from 'path';

const AUDIO_TYPES = {
  webm: { mimeType: 'audio/webm', extensions: ['.webm'] },
  wav: { mimeType: 'audio/wav', extensions: ['.wav'] },
  mp3: { mimeType: 'audio/mpeg', extensions: ['.mp3', '.mpeg'] },
  ogg: { mimeType: 'audio/ogg', extensions: ['.ogg', '.oga', '.opus'] },
  m4a: { mimeType: 'audio/mp4', extensions: ['.m4a', '.mp4'] }
};

export function detectAudioType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') return 'wav';
  if (buffer.subarray(0, 4).toString('ascii') === 'OggS') return 'ogg';
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3') return 'mp3';
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return 'mp3';
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'webm';
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') return 'm4a';
  return null;
}

export function hashAudioBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer || Buffer.alloc(0)).digest('hex');
}

function parseWavInfo(buffer) {
  if (detectAudioType(buffer) !== 'wav') return null;

  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataOffset = 0;
  let dataSize = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunkId === 'fmt ' && chunkStart + 16 <= buffer.length) {
      channels = buffer.readUInt16LE(chunkStart + 2);
      sampleRate = buffer.readUInt32LE(chunkStart + 4);
      bitsPerSample = buffer.readUInt16LE(chunkStart + 14);
    } else if (chunkId === 'data') {
      dataOffset = chunkStart;
      dataSize = Math.min(chunkSize, buffer.length - chunkStart);
      break;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  const bytesPerSample = Math.max(1, bitsPerSample / 8);
  const durationSeconds = sampleRate > 0 && channels > 0 && dataSize > 0
    ? dataSize / (sampleRate * channels * bytesPerSample)
    : 0;

  let peakAmplitude = 0;
  let averageAmplitude = 0;
  let clippingRatio = 0;

  if (bitsPerSample === 16 && dataOffset > 0 && dataSize >= 2) {
    const sampleCount = Math.floor(dataSize / 2);
    const stride = Math.max(1, Math.floor(sampleCount / 4096));
    let measured = 0;
    let sum = 0;
    let clipped = 0;

    for (let i = 0; i < sampleCount; i += stride) {
      const position = dataOffset + i * 2;
      if (position + 2 > buffer.length) break;
      const amplitude = Math.abs(buffer.readInt16LE(position));
      peakAmplitude = Math.max(peakAmplitude, amplitude);
      sum += amplitude;
      if (amplitude >= 32700) clipped += 1;
      measured += 1;
    }

    averageAmplitude = measured > 0 ? sum / measured : 0;
    clippingRatio = measured > 0 ? clipped / measured : 0;
  }

  return {
    sampleRate,
    channels,
    bitsPerSample,
    dataOffset,
    dataSize,
    durationSeconds,
    peakAmplitude,
    averageAmplitude,
    clippingRatio
  };
}

export function inspectAudioBuffer(buffer) {
  const detectedType = detectAudioType(buffer);
  const wav = parseWavInfo(buffer);
  const audioBytes = wav?.dataSize > 0
    ? buffer.subarray(wav.dataOffset, wav.dataOffset + wav.dataSize)
    : Buffer.isBuffer(buffer) ? buffer : Buffer.alloc(0);
  const stride = Math.max(1, Math.floor(audioBytes.length / 4096));
  const unique = new Set();
  let sampled = 0;
  let zeroCount = 0;

  for (let i = 0; i < audioBytes.length; i += stride) {
    const byte = audioBytes[i];
    unique.add(byte);
    if (byte === 0) zeroCount += 1;
    sampled += 1;
  }

  const zeroRatio = sampled > 0 ? zeroCount / sampled : 1;
  const lowEntropy = sampled > 128 && unique.size <= 2;
  const likelySilent = Boolean(
    lowEntropy
    || zeroRatio > 0.98
    || (wav && wav.peakAmplitude > 0 && wav.peakAmplitude < 120)
    || (wav && wav.averageAmplitude > 0 && wav.averageAmplitude < 30)
  );

  return {
    detectedType,
    sha256: hashAudioBuffer(buffer),
    byteLength: Buffer.isBuffer(buffer) ? buffer.length : 0,
    uniqueByteCount: unique.size,
    zeroRatio,
    lowEntropy,
    likelySilent,
    wav
  };
}

export function isLikelyAudioPayload(buffer, contentType = '') {
  const normalizedType = String(contentType || '').toLowerCase().split(';')[0];
  if (!Buffer.isBuffer(buffer) || buffer.length < 256) return false;
  if (normalizedType && !normalizedType.startsWith('audio/')) return false;

  const inspection = inspectAudioBuffer(buffer);
  if (inspection.detectedType) return !inspection.lowEntropy;

  return normalizedType.startsWith('audio/') && !inspection.lowEntropy && inspection.zeroRatio <= 0.98;
}

export function validateAudioUpload(file, {
  required = true,
  minBytes = 1024,
  maxBytes = 12 * 1024 * 1024,
  minDurationSeconds = 0,
  rejectSilent = true
} = {}) {
  if (!file) {
    if (!required) return null;
    const error = new Error('Audio file is required');
    error.status = 400;
    throw error;
  }
  if (!Buffer.isBuffer(file.buffer) || file.buffer.length < minBytes) {
    const error = new Error('Audio file is empty or too short');
    error.status = 422;
    throw error;
  }
  if (file.buffer.length > maxBytes) {
    const error = new Error('Audio file is too large');
    error.status = 413;
    throw error;
  }

  const inspection = inspectAudioBuffer(file.buffer);
  const detectedType = inspection.detectedType;
  const extension = path.extname(file.originalname || '').toLowerCase();
  const declaredMime = String(file.mimetype || '').toLowerCase().split(';')[0];
  const config = detectedType ? AUDIO_TYPES[detectedType] : null;
  const extensionAllowed = config?.extensions.includes(extension);
  const mimeAllowed = declaredMime === config?.mimeType
    || (detectedType === 'mp3' && declaredMime === 'audio/mp3')
    || (detectedType === 'm4a' && declaredMime === 'audio/x-m4a');

  if (!config || !extensionAllowed || !mimeAllowed) {
    const error = new Error('Unsupported or invalid audio file');
    error.status = 415;
    throw error;
  }

  if (rejectSilent && inspection.likelySilent) {
    const error = new Error('Audio file appears silent or corrupted');
    error.status = 422;
    throw error;
  }

  if (minDurationSeconds > 0 && inspection.wav?.durationSeconds && inspection.wav.durationSeconds < minDurationSeconds) {
    const error = new Error('Audio recording is too short');
    error.status = 422;
    throw error;
  }

  return {
    type: detectedType,
    extension: config.extensions[0],
    mimeType: config.mimeType,
    size: file.buffer.length,
    fingerprint: inspection.sha256,
    durationSeconds: inspection.wav?.durationSeconds || null,
    sampleRateHz: inspection.wav?.sampleRate || null,
    quality: {
      likely_silent: inspection.likelySilent,
      clipping_ratio: inspection.wav?.clippingRatio || 0,
      zero_ratio: inspection.zeroRatio
    }
  };
}

export function isAllowedAudioMetadata(file) {
  const extension = path.extname(file?.originalname || '').toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase().split(';')[0];
  return Object.values(AUDIO_TYPES).some(({ mimeType: allowedMime, extensions }) => (
    extensions.includes(extension)
    && (mimeType === allowedMime || mimeType === 'audio/mp3' || mimeType === 'audio/x-m4a')
  ));
}
