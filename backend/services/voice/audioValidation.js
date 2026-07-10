import path from 'path';

const AUDIO_TYPES = {
  webm: { mimeType: 'audio/webm', extensions: ['.webm'] },
  wav: { mimeType: 'audio/wav', extensions: ['.wav'] },
  mp3: { mimeType: 'audio/mpeg', extensions: ['.mp3', '.mpeg'] },
  ogg: { mimeType: 'audio/ogg', extensions: ['.ogg', '.oga', '.opus'] },
  m4a: { mimeType: 'audio/mp4', extensions: ['.m4a', '.mp4'] }
};

function detectAudioType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') return 'wav';
  if (buffer.subarray(0, 4).toString('ascii') === 'OggS') return 'ogg';
  if (buffer.subarray(0, 3).toString('ascii') === 'ID3') return 'mp3';
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) return 'mp3';
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'webm';
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') return 'm4a';
  return null;
}

export function validateAudioUpload(file, {
  required = true,
  minBytes = 1024,
  maxBytes = 12 * 1024 * 1024
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

  const detectedType = detectAudioType(file.buffer);
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

  return {
    type: detectedType,
    extension: config.extensions[0],
    mimeType: config.mimeType,
    size: file.buffer.length
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
