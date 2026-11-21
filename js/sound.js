/* =====================================================================
   sound.js: every sound effect, made on the fly with the Web Audio API
   (the browser's built-in synthesizer). There are no sound files.

   tone() plays one note: a frequency in hertz (how high), a length in
   seconds, a "wave" shape ('square' sounds like an old game console,
   'sine' is soft) and a volume. Browsers only allow sound after you
   click or press a key, so the audio engine starts on the first one.
   ===================================================================== */

let audio = null;                      // the Web Audio engine, made on first use
let muted = store.get('muted', false);

function tone(freq, length, wave = 'square', volume = 0.08, delay = 0, slideTo = null) {
  if (muted) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
    // Fade out so the note doesn't end with a click.
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + length + 0.02);
  } catch {}
}

const sfx = {
  blip()   { tone(660, 0.06, 'square', 0.04); },
  step()   { tone(180, 0.04, 'triangle', 0.05); },
  bump()   { tone(110, 0.08, 'square', 0.05); },
  hit(crit) { tone(crit ? 320 : 220, 0.09, 'square', 0.06, 0, 90); },
  fall(ally) { tone(ally ? 300 : 400, 0.35, 'triangle', 0.07, 0, ally ? 80 : 120); },
  sun()    { tone(880, 0.08, 'sine', 0.06); tone(1320, 0.1, 'sine', 0.05, 0.07); },
  unlock() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'square', 0.05, i * 0.09)); },
  win()    { [392, 523, 659, 784, 659, 784].forEach((f, i) => tone(f, 0.16, 'square', 0.05, i * 0.11)); },
  lose()   { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.07, i * 0.2)); },
  talk()   { tone(rand(300, 420), 0.03, 'square', 0.025); },
};

function setMuted(on) {
  muted = on;
  store.set('muted', on);
}
