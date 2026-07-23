/**
 * Soft UI sounds for Kids Mode — Web Audio only, no assets, no autoplay.
 * Respects mute preference and reduced-motion (still allows short taps unless muted).
 */

const STORAGE_KEY = 'hkids_kids_ui_sounds';

let audioCtx = null;

export function isKidsUiSoundEnabled() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw !== '0' && raw !== 'false';
  } catch {
    return true;
  }
}

export function setKidsUiSoundEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // ignore quota / private mode
  }
}

function getCtx() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new Ctx();
  }
  return audioCtx;
}

const PRESETS = {
  tap: { freq: 520, dur: 0.06, type: 'sine', gain: 0.045 },
  success: { freq: 660, dur: 0.12, type: 'triangle', gain: 0.05 },
  complete: { freq: 740, dur: 0.18, type: 'sine', gain: 0.055 },
  unlock: { freq: 880, dur: 0.14, type: 'triangle', gain: 0.05 },
  favorite: { freq: 620, dur: 0.1, type: 'sine', gain: 0.05 },
  play: { freq: 480, dur: 0.08, type: 'sine', gain: 0.04 },
  pause: { freq: 360, dur: 0.07, type: 'sine', gain: 0.035 },
  mute: { freq: 280, dur: 0.05, type: 'sine', gain: 0.03 },
};

/**
 * @param {'tap'|'success'|'complete'|'unlock'|'favorite'|'play'|'pause'|'mute'} kind
 */
export function playKidsUiSound(kind = 'tap') {
  if (!isKidsUiSoundEnabled()) return;
  const preset = PRESETS[kind] || PRESETS.tap;
  const ctx = getCtx();
  if (!ctx) return;

  const run = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = preset.type;
      osc.frequency.value = preset.freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(preset.gain, ctx.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + preset.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + preset.dur + 0.02);
    } catch {
      // ignore autoplay / audio failures
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(run).catch(() => {});
    return;
  }
  run();
}
