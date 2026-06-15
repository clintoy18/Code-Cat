const getAudioContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  const globalWindow = window as typeof window & { __codecatAudioContext?: AudioContext };

  if (!globalWindow.__codecatAudioContext) {
    globalWindow.__codecatAudioContext = new AudioContextCtor();
  }

  return globalWindow.__codecatAudioContext;
};

const normalizedVolume = (volumePercent: number) => Math.max(0.02, Math.min(volumePercent / 100, 1)) * 0.08;

const playTone = (
  frequency: number,
  durationMs: number,
  volume: number,
  type: OscillatorType,
  delayMs = 0,
) => {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const startAt = context.currentTime + delayMs / 1000;
  const durationSeconds = durationMs / 1000;
  const gainNode = context.createGain();
  const oscillator = context.createOscillator();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + durationSeconds + 0.02);
};

export const gameAudio = {
  prime() {
    const context = getAudioContext();

    if (context?.state === 'suspended') {
      void context.resume();
    }
  },

  playStep(volumePercent: number) {
    playTone(420, 90, normalizedVolume(volumePercent), 'triangle');
  },

  playSuccess(volumePercent: number) {
    const volume = normalizedVolume(volumePercent);
    playTone(523.25, 120, volume, 'triangle');
    playTone(659.25, 150, volume * 0.95, 'triangle', 110);
    playTone(783.99, 180, volume * 0.9, 'sine', 220);
  },

  playError(volumePercent: number) {
    const volume = normalizedVolume(volumePercent);
    playTone(210, 160, volume, 'sawtooth');
    playTone(170, 220, volume * 0.8, 'square', 120);
  },
};
