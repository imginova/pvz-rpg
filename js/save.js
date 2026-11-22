/* =====================================================================
   save.js: your PROGRESS. Which plants you own and their levels, XP
   and moves, your team, coins, Plant Food, which battles you've beaten,
   chests you've opened, achievements, and a few counters.

   It all lives in one object, `progress`, saved in the browser under
   the key "lawnlegends:save".

   SAVE SAFETY (please keep this): loading never throws anything away.
   If a save has a key this version doesn't know about, it is kept as it
   is and written back. If a saved move or plant no longer exists, it is
   just skipped when the game USES it (see equipped()), but it stays in
   the save. That way an older or newer version can't erase progress.
   ===================================================================== */

const STARTERS = PLANT_ORDER.filter(id => PLANTS[id].unlock.how === 'start');

function defaultProgress() {
  return {
    owned: {},           // { plantId: { lvl, xp, moves: [move ids] } }
    team: STARTERS.slice(),
    coins: 0,
    plantFood: 1,
    cleared: {},         // { 'lawn:1': true } battles beaten (chapter id : map character)
    chests: {},          // { 'lawn:1,6': true } chests opened
    chapter: 0,          // the chapter you're standing in
    reached: 1,          // how many chapters are open
    pos: {},             // { lawn: [x, y] } where you stood in each chapter
    ach: {},             // { achievementId: date earned }
    seen: {},            // { zombieId: true } zombies met (for the Almanac)
    introSeen: {},       // { lawn: true } chapter intros already shown
    stats: { chilled: 0, devoured: 0, spent: 0, wins: 0, battles: 0 },
  };
}

// Load the save and fill in anything missing with the defaults.
function loadProgress() {
  const p = defaultProgress();
  const saved = store.get('save', null);
  if (saved && typeof saved === 'object') {
    for (const key in saved) {
      // Objects are merged key by key (so new counters get a default),
      // everything else is taken as saved. Unknown keys are kept too.
      if (p[key] && typeof p[key] === 'object' && !Array.isArray(p[key]) && saved[key] && typeof saved[key] === 'object') {
        p[key] = Object.assign(p[key], saved[key]);
      } else {
        p[key] = saved[key];
      }
    }
  }
  for (const id of STARTERS) if (!p.owned[id]) p.owned[id] = newPlantEntry(id, 1);
  return p;
}

let progress = loadProgress();

function saveProgress() { store.set('save', progress); }

// ---- Plants you own -------------------------------------------------------------
function newPlantEntry(id, lvl) {
  return { lvl, xp: 0, moves: learnedAt(id, lvl).slice(0, MAX_MOVES) };
}

const owns = id => !!progress.owned[id] && !!PLANTS[id];
const ownedIds = () => PLANT_ORDER.filter(owns);

// The moves a plant knows at a level (in the order it learns them).
function learnedAt(id, lvl) {
  return PLANTS[id].learn.filter(([, at]) => at <= lvl).map(([mv]) => mv);
}

// The moves a plant has equipped, skipping any that don't exist anymore.
// If a saved move was taken out of the game (moves were re-themed on
// 2026-11-21), its slot is filled with the next move the plant knows, so
// the plant keeps the same number of moves. The save itself isn't changed
// until the player edits that plant's moves.
function equipped(id) {
  const entry = progress.owned[id];
  const known = learnedAt(id, entry.lvl);
  const saved = entry.moves || [];
  const list = saved.filter(m => known.includes(m));
  const want = Math.min(MAX_MOVES, Math.max(1, saved.length));
  for (const m of known) {
    if (list.length >= want) break;
    if (!list.includes(m)) list.push(m);
  }
  return list;
}

// Equip or unequip a move. Returns a message if it can't be done.
function toggleMove(id, mv) {
  const entry = progress.owned[id];
  const list = equipped(id);
  if (list.includes(mv)) {
    if (list.length === 1) return 'A plant needs at least one move.';
    entry.moves = list.filter(m => m !== mv);
  } else {
    if (list.length >= MAX_MOVES) return `Only ${MAX_MOVES} moves at a time. Unequip one first.`;
    entry.moves = [...list, mv];
  }
  saveProgress();
  return null;
}

// Add a plant to your collection. New plants join at one level below
// your best plant, so they're useful right away. Returns true if new.
function unlockPlant(id) {
  if (owns(id) || !PLANTS[id]) return false;
  const best = Math.max(1, ...ownedIds().map(o => progress.owned[o].lvl));
  progress.owned[id] = newPlantEntry(id, Math.max(1, best - 1));
  if (progress.team.length < MAX_TEAM) progress.team.push(id);
  saveProgress();
  toast(`New plant: ${PLANTS[id].name}!`, 'plant');
  sfx.unlock();
  checkCollection();
  return true;
}

// Give XP to a plant. Returns how many levels it gained.
function giveXp(id, amount) {
  const entry = progress.owned[id];
  if (!entry) return 0;
  let gained = 0;
  entry.xp += Math.round(amount);
  while (entry.lvl < MAX_LEVEL && entry.xp >= xpToNext(entry.lvl)) {
    entry.xp -= xpToNext(entry.lvl);
    entry.lvl++;
    gained++;
    // A newly learned move goes straight into a free slot.
    for (const [mv, at] of PLANTS[id].learn) {
      if (at === entry.lvl && equipped(id).length < MAX_MOVES) entry.moves = [...equipped(id), mv];
    }
  }
  if (entry.lvl >= MAX_LEVEL) entry.xp = 0;
  if (entry.lvl >= 10) award('grown');
  return gained;
}

// ---- Achievements -------------------------------------------------------------------
// award('firstwin') marks an achievement as earned (once) and hands out
// its reward.
function award(id) {
  const a = ACHIEVEMENTS[id];
  if (!a || progress.ach[id]) return;
  progress.ach[id] = new Date().toISOString().slice(0, 10);
  toast(`Achievement: ${a.name}!`, 'ach');
  if (a.reward.coins) progress.coins += a.reward.coins;
  saveProgress();
  if (a.reward.plant) unlockPlant(a.reward.plant);
}

function checkCollection() {
  const n = ownedIds().length;
  if (n >= 20) award('seedvault');
  if (n >= PLANT_ORDER.length) award('almanac');
}

// How you unlock a plant, in words (for the Almanac and the shop).
function unlockText(id) {
  const u = PLANTS[id].unlock;
  if (u.how === 'start') return 'You start with it.';
  if (u.how === 'shop') return `Buy it from Crazy Dave for ${u.price} coins.`;
  if (u.how === 'achievement') return `Earn the achievement "${ACHIEVEMENTS[u.id].name}".`;
  for (const ch of CHAPTERS) {
    for (const key in ch.enc) {
      if (ch.enc[key].reward?.plant === id) {
        return u.how === 'rogue' ? `Beat it as a rogue plant in ${ch.name}.` : `Win "${ch.enc[key].name}" in ${ch.name}.`;
      }
    }
  }
  return 'Keep exploring.';
}
