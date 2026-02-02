const audioCtx = typeof AudioContext !== 'undefined'
  ? new AudioContext()
  : typeof webkitAudioContext !== 'undefined'
    ? new webkitAudioContext()
    : null;

function play(frequencies, durations, type = 'sine', gain = 0.15) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const now = audioCtx.currentTime;
  let t = now;

  for (let i = 0; i < frequencies.length; i++) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = frequencies[i];
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + durations[i]);
    t += durations[i] * 0.8;
  }
}

export function playCorrect() {
  play([523, 659, 784], [0.1, 0.1, 0.2], 'sine', 0.12);
}

export function playWrong() {
  play([300, 250], [0.15, 0.25], 'triangle', 0.1);
}

export function playCelebration() {
  play([523, 659, 784, 1047], [0.12, 0.12, 0.12, 0.35], 'sine', 0.12);
}
