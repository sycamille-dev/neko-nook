let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let muted = false;
let musicOn = false;
let schedulerTimer = null;
let nextNoteTime = 0;
let barIndex = 0;
let noiseBuffer = null;

const BPM = 72;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;

const CHORDS = [
  [261.63, 329.63, 392.0, 493.88],
  [220.0, 261.63, 329.63, 392.0],
  [174.61, 220.0, 261.63, 329.63],
  [196.0, 246.94, 293.66, 392.0]
];

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return;
  }
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0.12;
  musicGain.connect(master);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.32;
  sfxGain.connect(master);

  noiseBuffer = createNoiseBuffer();
}

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function setMuted(m) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.05);
}

export function isMuted() {
  return muted;
}

function createNoiseBuffer() {
  const len = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function noiseSource() {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  return src;
}

function tone({ type = 'sine', freq, endFreq, dur, gain, attack = 0.02, release = 0.15, detune = 0, dest = sfxGain, filterType = null, filterFreq = null, filterQ = 1 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), ctx.currentTime + dur);
  osc.detune.value = detune;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

  let node = osc;
  if (filterType) {
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = filterFreq;
    f.Q.value = filterQ;
    node.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(dest);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.05);
}

export function playMeow(intensity = 0.5) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const base = 380 + intensity * 220;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.linearRampToValueAtTime(base * 1.5, t + 0.12);
  osc.frequency.linearRampToValueAtTime(base * 0.75, t + 0.42);
  osc.frequency.linearRampToValueAtTime(base * 0.55, t + 0.55);

  const vib = ctx.createOscillator();
  vib.frequency.value = 7;
  const vibGain = ctx.createGain();
  vibGain.gain.value = 18;
  vib.connect(vibGain);
  vibGain.connect(osc.frequency);

  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1300;
  f.Q.value = 1.8;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.06);
  g.gain.setValueAtTime(0.3, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

  osc.connect(f);
  f.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.65);
  vib.start(t);
  vib.stop(t + 0.65);
}

export function playPurr(duration = 1.8) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = noiseSource();
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 260;
  f.Q.value = 2;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.12);

  const lfo = ctx.createOscillator();
  lfo.type = 'triangle';
  lfo.frequency.value = 27;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.09;
  lfo.connect(lfoGain);
  lfoGain.connect(g.gain);

  const hum = ctx.createOscillator();
  hum.type = 'sine';
  hum.frequency.value = 95;
  const humGain = ctx.createGain();
  humGain.gain.setValueAtTime(0.0001, t);
  humGain.gain.exponentialRampToValueAtTime(0.07, t + 0.12);

  g.gain.setTargetAtTime(0.0001, t + duration - 0.25, 0.1);

  src.connect(f);
  f.connect(g);
  g.connect(sfxGain);
  hum.connect(humGain);
  humGain.connect(sfxGain);
  src.start(t);
  src.stop(t + duration + 0.3);
  lfo.start(t);
  lfo.stop(t + duration + 0.3);
  hum.start(t);
  hum.stop(t + duration + 0.3);
}

export function playHappy() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [660, 880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const start = t + i * 0.09;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

export function playEat() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const src = noiseSource();
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 700;
  f.Q.value = 3;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(f);
  f.connect(g);
  g.connect(sfxGain);
  src.start(t);
  src.stop(t + 0.12);
  tone({ type: 'sine', freq: 210, endFreq: 120, dur: 0.08, gain: 0.08 });
}

export function playChime() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [1046.5, 1318.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.14, t + i * 0.06 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.5);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(t + i * 0.06);
    osc.stop(t + i * 0.06 + 0.55);
  });
}

export function playPop() {
  if (!ctx) return;
  tone({ type: 'sine', freq: 620, endFreq: 300, dur: 0.08, gain: 0.12 });
}

export function playBird() {
  if (!ctx) return;
  const t = ctx.currentTime;
  const chirps = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < chirps; i++) {
    const start = t + i * 0.14;
    const base = 1900 + Math.random() * 900;
    tone({ type: 'sine', freq: base, endFreq: base * 1.35, dur: 0.09, gain: 0.03, attack: 0.01, release: 0.06 });
  }
}

export function startMusic() {
  if (!ctx || musicOn) return;
  musicOn = true;
  nextNoteTime = ctx.currentTime + 0.1;
  barIndex = 0;
  schedulerTimer = setInterval(scheduleAhead, 90);
  scheduleAhead();
}

export function stopMusic() {
  musicOn = false;
  clearInterval(schedulerTimer);
  schedulerTimer = null;
}

function scheduleAhead() {
  if (!ctx) return;
  while (nextNoteTime < ctx.currentTime + 0.3) {
    scheduleBar(barIndex % CHORDS.length, nextNoteTime);
    barIndex += 1;
    nextNoteTime += BAR;
  }
}

function scheduleBar(bar, t) {
  const chord = CHORDS[bar];
  const low = chord[0] / 2;

  pad(low, t, BAR);
  chord.forEach((freq) => pad(freq, t, BAR));

  const beatCount = 4;
  for (let b = 0; b < beatCount; b++) {
    const bt = t + b * BEAT;
    if (b % 2 === 0) kick(bt);
    if (b === 1 || b === 3) snare(bt);
    for (let s = 0; s < 2; s++) {
      hat(bt + s * (BEAT / 2));
    }
  }

  const notes = [...chord, chord[1] * 2];
  for (let s = 0; s < 8; s++) {
    const freq = notes[s % notes.length];
    pluck(freq * 2, t + s * (BEAT / 2));
  }
}

function pad(freq, t, dur) {
  [0, 5].forEach((det) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = det;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.9);
    g.gain.setValueAtTime(0.035, t + dur - 1.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    osc.connect(f);
    f.connect(g);
    g.connect(musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.3);
  });
}

function pluck(freq, t) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.045, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t);
  osc.stop(t + 0.35);
}

function kick(t) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t);
  osc.stop(t + 0.2);
}

function snare(t) {
  const src = noiseSource();
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1800;
  f.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  src.connect(f);
  f.connect(g);
  g.connect(musicGain);
  src.start(t);
  src.stop(t + 0.16);
}

function hat(t) {
  const src = noiseSource();
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 6500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.035, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(f);
  f.connect(g);
  g.connect(musicGain);
  src.start(t);
  src.stop(t + 0.06);
}
