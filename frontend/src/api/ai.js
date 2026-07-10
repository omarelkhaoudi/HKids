import axios from 'axios';
import { buildApiUrl } from '../config/api.js';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function streamVoiceAssistantRequest(
  transcript,
  conversation = [],
  language = null,
  { onDelta, signal } = {}
) {
  const response = await fetch(buildApiUrl('/ai/voice-assistant/stream'), {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
      Accept: 'text/event-stream'
    },
    body: JSON.stringify({ transcript, conversation, language }),
    signal
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || `AI stream failed with status ${response.status}`);
    error.response = { status: response.status, data };
    throw error;
  }
  if (!response.body) throw new Error('Streaming is unavailable in this browser');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalReply = null;

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() || '';

    for (const frame of frames) {
      const event = frame.split(/\r?\n/).find((line) => line.startsWith('event:'))?.slice(6).trim();
      const dataText = frame.split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (!dataText) continue;
      const data = JSON.parse(dataText);
      if (event === 'delta') onDelta?.(data.chunk || '');
      if (event === 'done') finalReply = data;
      if (event === 'error') {
        const error = new Error(data.error || 'AI stream failed');
        error.response = { status: data.status || 500, data };
        throw error;
      }
    }

    if (done) break;
  }

  if (!finalReply) throw new Error('AI stream ended before the final response');
  return finalReply;
}

export const aiAPI = {
  transcribeVoice: ({ audioBlob, language = 'fr-FR' }) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${Date.now()}.webm`);
    formData.append('language', language);

    return axios.post(
      buildApiUrl('/ai/transcribe'),
      formData,
      {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 25000
      }
    );
  },

  sendVoiceAssistantRequest: (transcript, conversation = [], language = null) => axios.post(
    buildApiUrl('/ai/voice-assistant'),
    { transcript, conversation, language },
    { headers: authHeaders() }
  ),

  streamVoiceAssistantRequest,
};
