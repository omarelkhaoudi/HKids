import { isNativeAndroid } from './capacitorRuntime';

export async function ensureMicrophonePermission() {
  if (!isNativeAndroid() || !navigator.permissions?.query) {
    return true;
  }

  try {
    const status = await navigator.permissions.query({ name: 'microphone' });
    if (status.state === 'denied') return false;
    return true;
  } catch {
    return true;
  }
}
