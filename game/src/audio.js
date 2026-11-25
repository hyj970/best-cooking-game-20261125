// Sizzle Line — sound effects, synthesized with WebAudio. One job: tiny
// bleeps and sizzles, no audio files, silent when the browser says no.

let ctx = null;
let sizzleNodes = null;

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, vol, when) {
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + (when || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol || 0.12, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (e) { /* sound is decoration; never break the game */ }
}

function noiseBurst(dur, vol) {
  const c = ac();
  if (!c) return;
  try {
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = vol || 0.1;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1200;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  } catch (e) { /* ignore */ }
}

export const sfx = {
  start() { tone(523, 0.12, 'triangle', 0.14); tone(784, 0.18, 'triangle', 0.14, 0.1); },
  pickup() { tone(660, 0.07, 'triangle', 0.1); },
  place() { tone(392, 0.08, 'triangle', 0.1); },
  chop() { noiseBurst(0.09, 0.16); tone(180, 0.08, 'square', 0.08); },
  ding() { tone(1046, 0.22, 'sine', 0.12); tone(1318, 0.3, 'sine', 0.08, 0.05); },
  serve() { tone(784, 0.1, 'triangle', 0.14); tone(988, 0.1, 'triangle', 0.14, 0.08); tone(1175, 0.22, 'triangle', 0.14, 0.16); },
  lose() { tone(311, 0.25, 'sawtooth', 0.07); tone(233, 0.35, 'sawtooth', 0.07, 0.12); },
  burn() { noiseBurst(0.25, 0.12); },
  trash() { noiseBurst(0.12, 0.1); tone(220, 0.1, 'square', 0.06); },
  gameover() { tone(523, 0.15, 'triangle', 0.12); tone(392, 0.15, 'triangle', 0.12, 0.14); tone(330, 0.3, 'triangle', 0.12, 0.28); },
  sizzleStart() {
    const c = ac();
    if (!c || sizzleNodes) return;
    try {
      const len = c.sampleRate * 1;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 4500;
      f.Q.value = 0.6;
      const g = c.createGain();
      g.gain.value = 0.035;
      src.connect(f).connect(g).connect(c.destination);
      src.start();
      sizzleNodes = { src, g };
      setTimeout(() => {
        try { g.gain.linearRampToValueAtTime(0, c.currentTime + 0.4); src.stop(c.currentTime + 0.5); } catch (e) {}
        sizzleNodes = null;
      }, 4000);
    } catch (e) { /* ignore */ }
  },
};
