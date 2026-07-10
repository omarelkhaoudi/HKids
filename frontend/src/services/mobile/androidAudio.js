let unlocked = false;

function createSilentAudio() {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.muted = true;
  audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  return audio;
}

export async function unlockAndroidAudio() {
  if (unlocked) return true;

  try {
    const audio = createSilentAudio();
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    unlocked = true;
    return true;
  } catch {
    return false;
  }
}

export function isAndroidAudioUnlocked() {
  return unlocked;
}

export function primeAudioElement(audio) {
  if (!audio) return audio;
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';
  audio.setAttribute('playsinline', 'true');
  return audio;
}
