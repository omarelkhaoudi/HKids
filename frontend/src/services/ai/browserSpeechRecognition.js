export function isSpeechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isMicrophoneSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export function isAudioRecordingSupported() {
  return isMicrophoneSupported() && Boolean(window.MediaRecorder);
}

function getSupportedMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];

  return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
}

export async function recordAudioClip({ durationMs = 4200, onRecordingStart } = {}) {
  if (!isAudioRecordingSupported()) {
    throw new Error("L enregistrement audio n est pas disponible sur ce navigateur.");
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      throw new Error('Autorisation du micro refusee. Autorise le micro puis reessaie.');
    }
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      throw new Error("Aucun micro n a ete trouve sur cet appareil.");
    }
    throw new Error("Impossible d acceder au micro pour le moment.");
  }

  const chunks = [];
  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  return new Promise((resolve, reject) => {
    let settled = false;
    let stopTimer = null;

    const cleanup = () => {
      if (stopTimer) clearTimeout(stopTimer);
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.ondataavailable = (event) => {
      if (event.data?.size > 0) chunks.push(event.data);
    };

    recorder.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("L enregistrement audio a echoue. Tu peux ecrire ta demande."));
    };

    recorder.onstop = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const audioBlob = chunks.length > 0 ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null;
      if (!audioBlob || audioBlob.size === 0) {
        reject(new Error("Je n ai pas capte d audio. Reessaie ou ecris ta demande."));
        return;
      }
      resolve({ audioBlob });
    };

    onRecordingStart?.();
    recorder.start();
    stopTimer = setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, durationMs);
  });
}

export async function recordAndTranscribe({ language = 'fr-FR', onTranscript, onRecordingStart } = {}) {
  if (!isMicrophoneSupported()) {
    throw new Error("Le micro n est pas disponible sur cet appareil.");
  }

  if (!isSpeechRecognitionSupported()) {
    throw new Error("La reconnaissance vocale n est pas disponible dans ce navigateur.");
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      throw new Error('Autorisation du micro refusee. Autorise le micro puis reessaie.');
    }
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      throw new Error("Aucun micro n a ete trouve sur cet appareil.");
    }
    throw new Error("Impossible d acceder au micro pour le moment.");
  }
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
      const messages = {
        'not-allowed': 'Autorisation du micro refusee. Autorise le micro puis reessaie.',
        'service-not-allowed': "La reconnaissance vocale est bloquee par le navigateur.",
        'audio-capture': "Je ne detecte pas de micro utilisable.",
        'no-speech': "Je n ai rien entendu. Rapproche-toi du micro ou ecris ta demande.",
        network: "La reconnaissance vocale du navigateur n est pas disponible. Tu peux ecrire ta demande.",
        aborted: "L ecoute a ete arretee. Tu peux reessayer."
      };
      reject(new Error(messages[event.error] || 'Je n ai pas pu comprendre la voix. Tu peux reessayer ou ecrire ta demande.'));
    };

    recognition.onnomatch = () => {
      if (settled) return;
      settled = true;
      stopStream();
      reject(new Error("Je n ai pas reconnu les mots. Tu peux reessayer ou ecrire ta demande."));
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

    try {
      recognition.start();
    } catch (error) {
      if (settled) return;
      settled = true;
      stopStream();
      reject(new Error("L assistant vocal n a pas pu demarrer. Tu peux ecrire ta demande."));
    }
  });
}
