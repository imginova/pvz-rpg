/* =====================================================================
   helpers.js: tiny tools that every other file uses.

   Loaded FIRST (see the list at the bottom of index.html), so every
   file after this one can use $, store, pick, rand, clamp and esc.

   About how the files share things: these are plain <script> files,
   not "modules". Anything declared at the top level of one file (a
   const, let or function) can be used by the files loaded after it.
   That also means two files must never use the same top-level name.
   ===================================================================== */

// $('sun') is short for document.getElementById('sun'):
// "find the element on the page whose id is sun".
const $ = id => document.getElementById(id);

// store saves small values in the browser (localStorage), so your
// progress is still there after a reload. Everything is wrapped in
// try/catch because some browsers block storage (for example private
// windows). Then we just use the fallback value instead of crashing.
// Every key starts with "lawnlegends:" so it never mixes with other games.
const store = {
  get(key, fallback) {
    try {
      const saved = localStorage.getItem('lawnlegends:' + key);
      return saved == null ? fallback : JSON.parse(saved);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem('lawnlegends:' + key, JSON.stringify(value)); } catch {}
  },
};

// pick(['a', 'b', 'c']) returns one item at random.
// Math.random() gives a number from 0 up to (not including) 1.
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// A random number between lo and hi, for example rand(3, 6) could be 4.27.
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// chance(0.3) is true 30% of the time.
const chance = p => Math.random() < p;

// clamp(x, lo, hi) keeps x between lo and hi.
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// esc() makes text safe to put inside HTML. Without it, a name with a
// "<" in it would be read as the start of an HTML tag.
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// shuffle() returns a copy of a list in a random order
// (the "Fisher-Yates" shuffle: swap each item with a random earlier one).
function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
