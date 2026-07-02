export function isTextToSpeechSupported() {
  return Boolean(window.speechSynthesis && window.SpeechSynthesisUtterance);
}

export function speakText(text, { language = 'fr-FR' } = {}) {
  if (!isTextToSpeechSupported()) {
    throw new Error("La lecture vocale n est pas disponible dans ce navigateur.");
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = 0.92;
  utterance.pitch = 1.05;

  return new Promise((resolve, reject) => {
    utterance.onend = resolve;
    utterance.onerror = () => reject(new Error("La lecture audio a echoue."));
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
