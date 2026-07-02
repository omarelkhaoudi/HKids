export function isSpeechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isMicrophoneSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export async function recordAndTranscribe({ language = 'fr-FR', onTranscript, onRecordingStart } = {}) {
  if (!isMicrophoneSupported()) {
    throw new Error("Le micro n est pas disponible sur cet appareil.");
  }

  if (!isSpeechRecognitionSupported()) {
    throw new Error("La reconnaissance vocale n est pas disponible dans ce navigateur.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  let recorder = null;

  if (window.MediaRecorder) {
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunks.push(event.data);
    };
    recorder.start();
  }

  onRecordingStart?.();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  return new Promise((resolve, reject) => {
    let finalTranscript = '';
    let settled = false;

    const stopStream = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const part = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalTranscript += part;
        } else {
          interimTranscript += part;
        }
      }
      onTranscript?.((finalTranscript || interimTranscript).trim());
    };

    recognition.onerror = (event) => {
      if (settled) return;
      settled = true;
      stopStream();
      reject(new Error(event.error === 'not-allowed'
        ? 'Autorisation du micro refusee.'
        : 'Je n ai pas pu comprendre la voix.'));
    };

    recognition.onend = () => {
      if (settled) return;
      settled = true;
      stopStream();
      const audioBlob = chunks.length > 0 ? new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }) : null;
      resolve({
        transcript: finalTranscript.trim(),
        audioBlob,
      });
    };

    recognition.start();
  });
}
