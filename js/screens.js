/* =====================================================================
   screens.js: every screen OUTSIDE the battle itself.

   The title, the overworld map (walking, chests, signs, Crazy Dave),
   the dialog box, the "ready to fight?" box, the win/lose box, the
   Team, Shop, Almanac and Achievements screens, and the little pop-up
   messages ("toasts") for unlocks and achievements.
   ===================================================================== */

let currentScreen = 'title';   // not "screen": that name belongs to the browser
let backTo = 'title';          // where the Back buttons go
let pendingFight = null;       // a fight waiting while you edit your team

function show(name) {
  for (const s of ['title', 'world', 'team', 'shop', 'almanac', 'ach', 'versus', 'battle']) $('scr-' + s).hidden = s !== name;
  currentScreen = name;
  renderWallet();
  if (name === 'world') renderWorld();
  if (name === 'team') renderTeam();
  if (name === 'shop') renderShop();
  if (name === 'almanac') renderAlmanac();
  if (name === 'ach') renderAch();
  if (name === 'versus') renderVersus();   // in versus.js
  if (name === 'battle') render();
}

// Open one of the side screens and remember where to go back to.
function openSide(name) {
  if (currentScreen !== 'team' && currentScreen !== 'shop' && currentScreen !== 'almanac' && currentScreen !== 'ach') backTo = currentScreen;
  show(name);
}

function goBack() {
  show(backTo);
  if (backTo === 'world' && pendingFight) {
    const f = pendingFight;
    pendingFight = null;
    openPrebattle(f.enc, f.chapterIdx, f.key);
  }
}

function renderWallet() {
  $('wallet').innerHTML = `<span class="coins">$${progress.coins}</span> <span class="food">Plant Food ${progress.plantFood}</span>`;
}

// ---- Toasts (small pop-up messages) ----------------------------------------------------------
function toast(text, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = text;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ---- Dialog box ----------------------------------------------------------------------------------
// dialog([[speaker, text], ...], done) shows the lines one at a time, then
// calls done(). The last line can offer buttons: choices = [[label, fn]].
let dlg = null;

function dialog(lines, done, choices) {
  dlg = { lines, i: 0, done, choices };
  $('dialog').hidden = false;
  showDialogLine();
}

function showDialogLine() {
  const [who, text] = dlg.lines[dlg.i];
  $('dlgSpeaker').textContent = who;
  $('dlgSpeaker').className = 'speaker sp-' + who.toLowerCase().replace(/[^a-z]/g, '');
  $('dlgText').textContent = text;
  const last = dlg.i === dlg.lines.length - 1;
  const choices = last && dlg.choices ? dlg.choices : null;
  $('dlgChoices').innerHTML = choices
    ? choices.map(([label], i) => `<button type="button" data-choice="${i}"><kbd>${i + 1}</kbd> ${esc(label)}</button>`).join('') : '';
  $('dlgHint').hidden = !!choices;
  sfx.talk();
}

function advanceDialog() {
  if (!dlg) return;
  if (dlg.i === dlg.lines.length - 1 && dlg.choices) return;   // waiting for a button
  dlg.i++;
  if (dlg.i < dlg.lines.length) return showDialogLine();
  closeDialog(dlg.done);
}

function chooseDialog(i) {
  const c = dlg?.choices?.[i];
  if (c && dlg.i === dlg.lines.length - 1) closeDialog(c[1]);
}

function closeDialog(then) {
  dlg = null;
  $('dialog').hidden = true;
  if (then) then();
}

const overlayOpen = () => !$('dialog').hidden || !$('prebattle').hidden || !$('result').hidden || !$('howto').hidden;

/* ---- The overworld ---------------------------------------------------------------------------
   MAPS[i] is chapter i's map turned into a grid: grid[y][x] is a character.
   Short rows are padded with hedge, and the start '@' becomes grass.   */
const MAPS = CHAPTERS.map(ch => {
  const w = Math.max(...ch.map.map(r => r.length));
  let start = [1, 1];
  const grid = ch.map.map((row, y) => [...row.padEnd(w, '#')].map((c, x) => {
    if (c === '@') { start = [x, y]; return '.'; }
    return c;
  }));
  return { grid, start, w, h: grid.length };
});

const chapterNow = () => CHAPTERS[progress.chapter];
const encKey = (chIdx, c) => `${CHAPTERS[chIdx].id}:${c}`;

function playerPos() {
  const ch = chapterNow();
  return progress.pos[ch.id] || MAPS[progress.chapter].start.slice();
}

// Has the boss of a chapter been beaten?
const bossBeaten = chIdx => !!progress.cleared[encKey(chIdx, 'B')];

// The battles that must be won before the boss will fight.
function bossReady(chIdx) {
  const ch = CHAPTERS[chIdx];
  return Object.keys(ch.enc).every(c => ['boss', 'rogue', 'secret'].includes(ch.enc[c].kind) || progress.cleared[encKey(chIdx, c)]);
}

// What character and color to draw for map tile (x, y).
function tileLook(x, y) {
  const i = progress.chapter;
  const ch = CHAPTERS[i];
  const c = MAPS[i].grid[y][x];
  const enc = ch.enc[c];
  const floor = ch.gimmick === 'roof' ? (ch.id === 'lair' ? '_' : '^') : '.';
  if (enc) {
    // A beaten battle is just floor, until the chapter's boss is beaten:
    // then it comes back, drawn dim, and you can refight it (see moveWorld).
    const done = progress.cleared[encKey(i, c)];
    if (done && !bossBeaten(i)) return [floor, TILE_STYLE[floor]];
    const dim = done ? ' k-done' : '';
    if (enc.kind === 'secret') return done ? ['Y', 'k-boss' + dim] : ['T', 't-tree'];   // shh, it looks like a tree
    if (enc.kind === 'boss') return ['B', 'k-boss' + (bossReady(i) && !done ? ' ready' : '') + dim];
    if (enc.kind === 'rogue') return ['R', 'k-rogue' + dim];
    if (enc.kind === 'hero') return ['S', 'k-boss' + dim];
    if (enc.kind === 'key') return ['Z', 'k-key' + dim];
    return ['z', 'k-zom' + dim];
  }
  if (c === 'D') return ['D', 'k-dave'];
  if (c === 'C') return progress.chests[`${ch.id}:${x},${y}`] ? [floor, TILE_STYLE[floor]] : ['C', 'k-chest'];
  if (c === 'G') return ['G', bossBeaten(i) ? 'k-gate open' : 'k-gate'];
  if (ch.signs?.[c]) return [c, 'k-sign'];
  return [c, TILE_STYLE[c] || ''];
}

function renderWorld() {
  const i = progress.chapter;
  const ch = CHAPTERS[i];
  const [px, py] = playerPos();
  const { w, h } = MAPS[i];
  let html = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [c, cls] = x === px && y === py ? ['@', 'k-you'] : tileLook(x, y);
      html += `<span class="${cls}">${esc(c)}</span>`;
    }
    html += '\n';
  }
  $('map').innerHTML = html;
  $('map').className = 'map map-' + ch.id;

  $('chapterTabs').innerHTML = CHAPTERS.slice(0, Math.min(progress.reached, CHAPTERS.length))
    .map((c, j) => `<button type="button" class="small ${j === i ? 'on' : ''}" data-chapter="${j}">${j + 1}. ${esc(c.name)}${bossBeaten(j) ? ' &#10003;' : ''}</button>`).join('');

  const left = Object.keys(ch.enc).filter(c => !['boss', 'secret'].includes(ch.enc[c].kind) && !progress.cleared[encKey(i, c)]).length;
  $('worldHint').textContent = bossBeaten(i)
    ? (i === CHAPTERS.length - 1 ? 'You beat Tomorrow-tron! Keep battling to level up and collect every plant.' : 'Boss beaten! Walk to the gate (G) to go on.')
      + ' Dim letters are battles you can fight again: step on one.'
    : left ? `${left} battle${left > 1 ? 's' : ''} left before the boss. Battle: ${GIMMICKS[ch.gimmick].name} (${GIMMICKS[ch.gimmick].desc})`
      : 'The boss (B) is ready for you.';

  if (!progress.introSeen[ch.id]) {
    progress.introSeen[ch.id] = true;
    saveProgress();
    setTimeout(() => dialog(ch.intro), 250);
  }
}

// Try to step one tile. Bumping into something does its thing instead.
function moveWorld(dx, dy) {
  if (currentScreen !== 'world' || overlayOpen()) return;
  const i = progress.chapter;
  const ch = chapterNow();
  const [px, py] = playerPos();
  const x = px + dx, y = py + dy;
  const grid = MAPS[i].grid;
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;
  const c = grid[y][x];
  const enc = ch.enc[c];

  if (enc && !progress.cleared[encKey(i, c)]) return meetBattle(i, c);
  if (c === 'D') return daveMenu();
  if (ch.signs?.[c]) return dialog([['Sign', ch.signs[c]]]);
  if (c === 'C' && !progress.chests[`${ch.id}:${x},${y}`]) return openChest(x, y);
  if (c === 'G') return useGate();
  if (WALLS.has(c)) { sfx.bump(); return; }

  progress.pos[ch.id] = [x, y];
  saveProgress();
  sfx.step();
  renderWorld();
  // Stepping onto a beaten battle in a beaten chapter offers a rematch
  // (owner, 2026-11-22: "once you beat a world you can infinitely refight
  // the zombies there"). "Not yet" just leaves you standing there.
  if (enc && bossBeaten(i)) openPrebattle(enc, i, encKey(i, c));
}

function openChest(x, y) {
  const i = progress.chapter;
  const ch = chapterNow();
  progress.chests[`${ch.id}:${x},${y}`] = true;
  const coins = 40 + 30 * i;
  progress.coins += coins;
  const food = progress.plantFood < PLANT_FOOD_MAX;
  if (food) progress.plantFood++;
  saveProgress();
  sfx.sun();
  renderWorld();
  renderWallet();
  dialog([['Chest', `You found ${coins} coins${food ? ' and a Plant Food' : ''}!`]]);
}

function useGate() {
  const i = progress.chapter;
  if (!bossBeaten(i)) return dialog([['Gate', 'The gate is locked. Beat this chapter\'s boss to open it.']]);
  if (i + 1 >= CHAPTERS.length) return;
  progress.chapter = i + 1;
  progress.reached = Math.max(progress.reached, i + 2);
  saveProgress();
  renderWorld();
}

function goChapter(j) {
  if (j >= progress.reached || j === progress.chapter) return;
  progress.chapter = j;
  saveProgress();
  renderWorld();
}

function meetBattle(i, c) {
  const enc = CHAPTERS[i].enc[c];
  if (enc.kind === 'boss' && !bossReady(i)) {
    return dialog([['Dave', 'That one\'s the boss! Beat the other zombies around here first.']]);
  }
  dialog(enc.intro || [['Dave', 'Zombies!']], () => openPrebattle(enc, i, encKey(i, c)));
}

// ---- Crazy Dave ----------------------------------------------------------------------------------
const DAVE_TIPS = [
  'Armor soaks up damage before the zombie does. Pierce it, or lob over doors!',
  'Your Sunny plants make sun every round. More sun, more big moves!',
  'Hearty plants can Taunt. Then zombies HAVE to hit them. Except vaulters. Vaulters are rude.',
  'Fire melts chill and freeze. Don\'t burn the zombie your Snow Pea just froze!',
  'Plants on the bench still get some XP. Try new plants without falling behind!',
  'Click a zombie in battle to read what it does.',
  'Plant Food makes the next move free AND twice as strong. Save it for the big ones!',
  'I once saw something furry hiding behind a tree in my backyard. At night. Probably nothing.',
  'Some achievements want weird teams. All nuts? All sunshine? Check the list!',
];

function daveMenu() {
  dialog([['Dave', 'Hey neighbor! Need something? I\'ve got stuff. And things. Mostly stuff.']], null, [
    ['Shop', () => openSide('shop')],
    ['Practice battle', practiceBattle],
    ['Any tips?', () => dialog([['Dave', pick(DAVE_TIPS)]])],
    ['Bye', null],
  ]);
}

// A practice fight against random zombies from this chapter. It gives
// XP and coins but doesn't count as a story battle.
function practiceBattle() {
  const i = progress.chapter;
  const ch = CHAPTERS[i];
  const n = 2 + Math.floor(Math.random() * 2);
  const enc = { name: 'Practice with Dave', kind: 'zombie', lvl: ch.lvl, waves: [shuffle(ch.pool).slice(0, n)] };
  openPrebattle(enc, i, null);
}

// ---- Ready to fight? -------------------------------------------------------------------------------
function enemyName(spec) {
  if (spec.startsWith('R:')) return 'Rogue ' + PLANTS[spec.slice(2)].name;
  const z = ZOMBIES[spec.replace('!', '')];
  return z.name + (spec.endsWith('!') ? ' (BOSS)' : '');
}

function openPrebattle(enc, chapterIdx, key) {
  pendingFight = { enc, chapterIdx, key };
  const g = [CHAPTERS[chapterIdx].gimmick, ...(enc.gimmicks || [])];
  // A rematch: a story battle you've already won (it gives XP and coins
  // again, but not the first-win prize).
  const rematch = key && progress.cleared[key];
  const team = progress.team.filter(owns);
  const reward = enc.reward && key && !progress.cleared[key]
    ? `<p>First win: ${enc.reward.plant ? `<b class="${CLASSES[PLANTS[enc.reward.plant].cls].color}">${esc(PLANTS[enc.reward.plant].name)}</b>` : ''}${enc.reward.coins ? ` <span class="coins">$${enc.reward.coins}</span>` : ''}</p>` : '';
  $('preBox').innerHTML = `
    <h2>${rematch ? 'Rematch: ' : ''}${esc(enc.name)}</h2>
    <p class="dim">Enemy level ${enc.lvl}${rematch ? ' · XP and coins as usual, no first-win prize' : ''}</p>
    <div class="gimmick-list">${g.map(id => `<div><span class="chip">${esc(GIMMICKS[id].name)}</span> ${esc(GIMMICKS[id].desc)}</div>`).join('')}</div>
    <h3>Enemies</h3>
    ${enc.waves.map((w, n) => `<p>Wave ${n + 1}: ${w.map(s => esc(enemyName(s))).join(', ')}</p>`).join('')}
    ${reward}
    <h3>Your team</h3>
    <p>${team.length ? team.map(id => `<span class="${CLASSES[PLANTS[id].cls].color}">${esc(PLANTS[id].name)}</span> <span class="dim">Lv${progress.owned[id].lvl}</span>`).join(', ') : '<b>Your team is empty!</b>'}</p>
    <div class="row">
      <button type="button" class="big" id="btnFight" ${team.length ? '' : 'disabled'}>Fight! (Enter)</button>
      <button type="button" id="btnEditTeam">Edit team</button>
      <button type="button" id="btnNotYet">Not yet</button>
    </div>`;
  $('prebattle').hidden = false;
}

function fight() {
  const f = pendingFight;
  if (!f || !progress.team.some(owns)) return;
  pendingFight = null;
  $('prebattle').hidden = true;
  startBattle(f.enc, f.chapterIdx, f.key);
}

function closePrebattle() {
  pendingFight = null;
  $('prebattle').hidden = true;
}

// ---- After a battle -----------------------------------------------------------------------------------
let lastFight = null;

function showResult(won, loot, notes, outro) {
  lastFight = { enc: B.enc, chapterIdx: B.chapterIdx, key: B.key, outro };
  $('resultBox').innerHTML = `
    <h2 class="${won ? 'win' : 'lose'}">${won ? 'Victory!' : 'Your plants wilted...'}</h2>
    <p>${won ? `<span class="coins">+$${loot.coins}</span> · ` : ''}+${loot.xp} XP for the team</p>
    ${notes.map(n => `<p class="good">${esc(n)}</p>`).join('')}
    ${won ? '' : '<p class="dim">Try different plants or moves, level up with a practice battle from Crazy Dave, or bring Plant Food.</p>'}
    <div class="row">
      ${won ? '' : '<button type="button" class="big" id="btnRetry">Retry</button>'}
      <button type="button" class="${won ? 'big' : ''}" id="btnContinue">${won ? 'Continue (Enter)' : 'Back to map'}</button>
    </div>`;
  $('result').hidden = false;
}

function leaveBattle() {
  $('result').hidden = true;
  const outro = lastFight?.outro;
  B = null;
  show('world');
  if (outro) dialog(outro);
}

function retryBattle() {
  $('result').hidden = true;
  const f = lastFight;
  openPrebattle(f.enc, f.chapterIdx, f.key);
}

// ---- Team screen -------------------------------------------------------------------------------------
let teamSel = 'peashooter';
let teamFilter = 'all';

const levelText = id => {
  const e = progress.owned[id];
  return e.lvl >= MAX_LEVEL ? `Lv${e.lvl} (max)` : `Lv${e.lvl} · ${e.xp}/${xpToNext(e.lvl)} XP`;
};

function plantTile(id, locked) {
  const p = PLANTS[id];
  const inTeam = progress.team.includes(id);
  return `<button type="button" class="ptile ${CLASSES[p.cls].color} ${locked ? 'locked' : ''} ${inTeam ? 'inteam' : ''}" data-plant="${id}">
    <pre class="spr">${locked ? esc(SPRITES[id].map(l => l.replace(/\S/g, '?')).join('\n')) : spriteHtml(id, SPRITES[id])}</pre>
    <span class="cname">${locked ? '???' : esc(p.name)}</span>
    <span class="dim">${locked ? esc(CLASSES[p.cls].name) : progress.owned[id] ? 'Lv' + progress.owned[id].lvl : ''}${inTeam ? ' · TEAM' : ''}</span>
  </button>`;
}

function renderTeam() {
  if (!owns(teamSel)) teamSel = ownedIds()[0];
  const team = progress.team.filter(owns);
  $('teamSlots').innerHTML = Array.from({ length: MAX_TEAM }, (_, i) => {
    const id = team[i];
    return id
      ? `<button type="button" class="slot ${CLASSES[PLANTS[id].cls].color}" data-plant="${id}">${i + 1}. ${esc(PLANTS[id].name)} <span class="dim">Lv${progress.owned[id].lvl}</span></button>`
      : `<span class="slot empty">${i + 1}. empty</span>`;
  }).join('');

  $('teamFilters').innerHTML = ['all', ...CLASS_ORDER].map(c =>
    `<button type="button" class="small ${teamFilter === c ? 'on' : ''} ${c === 'all' ? '' : CLASSES[c].color}" data-filter="${c}">${c === 'all' ? 'All' : CLASSES[c].name}</button>`).join('');

  const list = ownedIds().filter(id => teamFilter === 'all' || PLANTS[id].cls === teamFilter);
  $('plantGrid').innerHTML = list.map(id => plantTile(id, false)).join('')
    + `<p class="dim grid-note">${ownedIds().length}/${PLANT_ORDER.length} plants collected</p>`;
  $('plantDetail').innerHTML = plantDetail(teamSel, true);
}

// The big info panel for a plant. `editable` adds the team and move buttons.
function plantDetail(id, editable) {
  const p = PLANTS[id];
  const entry = progress.owned[id];
  const cls = CLASSES[p.cls];
  const lvl = entry ? entry.lvl : 1;
  const s = statScale('ally');
  const [hp, atk, dfn, spd] = p.stats;
  const eq = entry ? equipped(id) : [];
  const inTeam = progress.team.includes(id);
  const moves = p.learn.map(([mv, at]) => {
    const m = MOVES[mv];
    const known = entry && at <= lvl;
    const on = eq.includes(mv);
    const info = `${m.cost ? '&#9728;' + m.cost : 'free'}${m.cd ? (m.cd >= ONCE_PER_BATTLE ? ' · once per battle' : ' · cooldown ' + m.cd) : ''}${m.power ? ' · power ' + m.power + (m.hits > 1 ? ' x' + m.hits : '') : ''}`;
    return `<button type="button" class="mrow ${on ? 'on' : ''}" ${editable && known ? `data-equip="${mv}"` : 'disabled'}>
      <span class="mcheck">${on ? '[x]' : known ? '[ ]' : '   '}</span>
      <span><b>${esc(m.name)}</b> <span class="dim">${info}</span><br>${esc(m.desc)}${known ? '' : ` <i>(learned at Lv${at})</i>`}</span>
    </button>`;
  }).join('');
  return `
    <div class="dhead">
      <pre class="spr big">${spriteHtml(id, SPRITES[id])}</pre>
      <div>
        <h2 class="${cls.color}">${esc(p.name)}</h2>
        <p><span class="${cls.color}">${esc(cls.name)}</span>${p.shroom ? ' · Mushroom' : ''}${entry ? ' · ' + levelText(id) : ''}</p>
        <p class="stats">HP ${Math.round(hp * s)} · ATK ${Math.round(atk * s)} · DEF ${dfn} · SPD ${spd}</p>
        <p class="dim">${esc(p.flavor)}</p>
      </div>
    </div>
    <p class="passive"><b>${esc(p.passive.name)}:</b> ${esc(p.passive.desc)}</p>
    ${editable ? `<div class="row"><button type="button" id="btnTeamToggle">${inTeam ? 'Remove from team' : 'Add to team'}</button>
      ${inTeam ? '<button type="button" id="btnTeamUp">Move up</button>' : ''}</div>` : `<p class="dim">${esc(unlockText(id))}</p>`}
    <h3>Moves <span class="dim">(${eq.length}/${MAX_MOVES} equipped${editable ? ', click to change' : ''})</span></h3>
    <div class="mlist">${moves}</div>`;
}

function toggleTeam(id) {
  const team = progress.team.filter(owns);
  if (team.includes(id)) progress.team = team.filter(t => t !== id);
  else if (team.length >= MAX_TEAM) return toast('Your team is full (5 plants). Remove one first.');
  else progress.team = [...team, id];
  saveProgress();
  renderTeam();
}

function teamUp(id) {
  const team = progress.team.filter(owns);
  const i = team.indexOf(id);
  if (i > 0) { [team[i - 1], team[i]] = [team[i], team[i - 1]]; progress.team = team; saveProgress(); renderTeam(); }
}

// ---- Shop ------------------------------------------------------------------------------------------------
const DAVE_SHOP_LINES = [
  'Welcome to my shop! Everything is half off! Off of what? Don\'t ask.',
  'Buy something! I need money for tacos.',
  'These are the finest plants this side of my car\'s trunk.',
];

function renderShop() {
  $('shopTalk').textContent = 'Crazy Dave: "' + pick(DAVE_SHOP_LINES) + '"';
  const plants = SHOP_PLANTS.map(id => {
    const p = PLANTS[id];
    const have = owns(id);
    const price = p.unlock.price;
    return `<div class="shop-item ${CLASSES[p.cls].color}">
      <pre class="spr">${spriteHtml(id, SPRITES[id])}</pre>
      <div><b>${esc(p.name)}</b> <span class="dim">${esc(CLASSES[p.cls].name)}</span><br>
      <span class="small-print"><b>${esc(p.passive.name)}:</b> ${esc(p.passive.desc)}</span></div>
      <button type="button" data-buy="${id}" ${have || progress.coins < price ? 'disabled' : ''}>${have ? 'Owned' : '$' + price}</button>
    </div>`;
  }).join('');
  const food = `<div class="shop-item">
      <pre class="spr c-grower">  .-.
 (+ +)
  )=(
 (___)</pre>
      <div><b>Plant Food</b> <span class="dim">You have ${progress.plantFood}/${PLANT_FOOD_MAX}</span><br>
      <span class="small-print">Use it in battle: a plant's next move is free and twice as strong.</span></div>
      <button type="button" data-buy="food" ${progress.coins < PLANT_FOOD_PRICE || progress.plantFood >= PLANT_FOOD_MAX ? 'disabled' : ''}>$${PLANT_FOOD_PRICE}</button>
    </div>`;
  $('shopList').innerHTML = plants + food;
}

function buy(id) {
  const price = id === 'food' ? PLANT_FOOD_PRICE : PLANTS[id].unlock.price;
  if (progress.coins < price) return;
  if (id === 'food') {
    if (progress.plantFood >= PLANT_FOOD_MAX) return;
    progress.plantFood++;
    toast('Bought a Plant Food!');
  } else {
    if (owns(id)) return;
    unlockPlant(id);
  }
  progress.coins -= price;
  progress.stats.spent += price;
  if (progress.stats.spent >= 1000) award('customer');
  saveProgress();
  sfx.sun();
  renderShop();
  renderWallet();
}

// ---- Almanac -------------------------------------------------------------------------------------------
let almTab = 'plants';
let almSel = 'peashooter';

function renderAlmanac() {
  for (const b of $('almTabs').children) b.classList.toggle('on', b.dataset.tab === almTab);
  if (almTab === 'plants') {
    if (!PLANTS[almSel]) almSel = 'peashooter';
    $('almList').innerHTML = CLASS_ORDER.map(c => `<h3 class="${CLASSES[c].color} grid-note">${esc(CLASSES[c].name)} <span class="dim">${esc(CLASSES[c].desc)}</span></h3>`
      + PLANT_ORDER.filter(id => PLANTS[id].cls === c).map(id => plantTile(id, !owns(id))).join('')).join('');
    $('almDetail').innerHTML = owns(almSel) ? plantDetail(almSel, false)
      : `<h2>???</h2><p class="${CLASSES[PLANTS[almSel].cls].color}">${esc(CLASSES[PLANTS[almSel].cls].name)}</p><p>${esc(unlockText(almSel))}</p>`;
  } else if (almTab === 'zombies') {
    const ids = Object.keys(ZOMBIES);
    if (!ZOMBIES[almSel]) almSel = 'zombie';
    $('almList').innerHTML = ids.map(id => {
      const seen = progress.seen[id];
      return `<button type="button" class="ptile c-zombie ${seen ? '' : 'locked'}" data-zombie="${id}">
        <pre class="spr">${seen ? spriteHtml(id) : esc(SPRITES[id].map(l => l.replace(/\S/g, '?')).join('\n'))}</pre>
        <span class="cname">${seen ? esc(ZOMBIES[id].name) : '???'}</span></button>`;
    }).join('') + `<p class="dim grid-note">${ids.filter(id => progress.seen[id]).length}/${ids.length} zombies seen</p>`;
    const z = ZOMBIES[almSel];
    $('almDetail').innerHTML = progress.seen[almSel]
      ? `<div class="dhead"><pre class="spr big">${spriteHtml(almSel)}</pre><div><h2>${esc(z.name)}</h2>
         <p class="stats">HP ${z.stats[0]} · ATK ${z.stats[1]} · DEF ${z.stats[2]} · SPD ${z.stats[3]}${z.armor ? ` · Armor ${z.armor[0]} (${esc(ARMOR_NAMES[z.armor[1]])})` : ''}</p></div></div>
         <p>${esc(z.desc)}</p><p class="counter"><b>Counter:</b> ${esc(z.counter || '')}</p><p class="dim">Moves: ${z.moves.map(m => esc(MOVES[m].name)).join(', ')}</p>`
      : '<h2>???</h2><p>You haven\'t met this zombie yet.</p>';
  } else {
    $('almList').innerHTML = Object.keys(GIMMICKS).map(id => `<div class="gimmick-row"><span class="chip">${esc(GIMMICKS[id].name)}</span> ${esc(GIMMICKS[id].desc)}</div>`).join('');
    $('almDetail').innerHTML = '<h2>Battle gimmicks</h2><p>Each chapter has its own gimmick (Day, Night, Pool, Roof), and some battles add another one on top. They\'re listed before every fight and at the top of the battle screen.</p>';
  }
}

// ---- Achievements -----------------------------------------------------------------------------------------
function renderAch() {
  const ids = Object.keys(ACHIEVEMENTS);
  $('achCount').textContent = `${ids.filter(id => progress.ach[id]).length}/${ids.length}`;
  $('achList').innerHTML = ids.map(id => {
    const a = ACHIEVEMENTS[id];
    const got = progress.ach[id];
    const reward = a.reward.plant ? `Unlocks ${PLANTS[a.reward.plant].name}` : `$${a.reward.coins}`;
    return `<div class="ach ${got ? 'got' : ''}">
      <span class="mark">${got ? '[&#10003;]' : '[ ]'}</span>
      <div><b>${esc(a.name)}</b>${got ? ` <span class="dim">${esc(got)}</span>` : ''}<br>
      <span class="dim">${esc(a.desc)}</span></div>
      <span class="reward">${esc(reward)}</span>
    </div>`;
  }).join('');
}
