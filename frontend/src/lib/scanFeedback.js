let audioContext = null;

const TONES = {
  success: [
    [880, 0.09],
    [1320, 0.12],
  ],
  warning: [
    [620, 0.14],
    [620, 0.14],
  ],
  error: [[220, 0.32]],
};

/** Short audio + haptic cue so door staff get feedback without looking at the screen. */
export function playScanFeedback(kind, withSound) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(
      kind === "success" ? 60 : kind === "warning" ? [80, 60, 80] : [200],
    );
  }
  if (!withSound || typeof window === "undefined") return;
  try {
    audioContext = audioContext ?? new AudioContext();
    let start = audioContext.currentTime;
    TONES[kind].forEach(([freq, duration]) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + duration);
      start += duration + 0.04;
    });
  } catch {
    // Audio unavailable — haptics/visuals still apply.
  }
}
