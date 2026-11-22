/* =====================================================================
   versus.js: VERSUS MODE. Two teams of plants fight each other.

   Three ways to play (owner's request, 2026-11-22):
     You vs AI   you play Player 1, the computer plays Player 2
     2 players   two people share one screen and take turns
     AI vs AI    sit back and watch the computer fight itself

   Everything is unlocked here: every plant, at level 10, with all 7 of
   its moves to choose from (pick 4, just like the Team screen). Versus
   never touches your story save: its teams and settings are saved on
   their own under "lawnlegends:versus", it earns no XP, coins or
   achievements, and its Plant Food is free.

   This file has:
     - the saved versus settings (vs) and team helpers
     - the setup screen (renderVersus)
     - starting and ending a versus battle (startVersus, endVersus)
     - the versus AI (versusAct), which plays plants on either side

   The battle rules themselves are the normal ones in battle.js; it
   checks B.versus where versus works differently (each side has its
   own sun and Plant Food, and both sides can be people or AI).
   Side 'ally' is Player 1 (the left column), side 'foe' is Player 2.
   ===================================================================== */

// The three ways to play: who controls each side.
const VS_MODES = {
  ai:    { name: 'You vs AI', ctrl: { ally: 'human', foe: 'ai' } },
  pvp:   { name: '2 players', ctrl: { ally: 'human', foe: 'human' } },
  aivai: { name: 'AI vs AI',  ctrl: { ally: 'ai', foe: 'ai' } },
};

const VS_DIFFS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

// Gimmicks that make sense when plants fight plants. The left-out ones
// (Gravestones, Rush, Sandstorm, Neon Jams) only do things to zombies.
const VS_GIMMICKS = ['day', 'night', 'pool', 'roof', 'fog', 'drought', 'laststand', 'conveyor', 'storm', 'heatwave', 'frostwind', 'timewarp'];

const VS_FOOD_MAX = 3;   // the Plant Food picker goes Off, 1, 2, 3

// ---- The saved versus settings ---------------------------------------------------------
// vs.teams.ally is Player 1's team (a list of plant ids), vs.moves.ally
// holds each of Player 1's plants' chosen moves: { peashooter: [...] }.
// The same plant can have different moves on the two teams.
function randomTeam() {
  return shuffle(PLANT_ORDER).slice(0, MAX_TEAM);
}

function loadVersus() {
  const v = {
    mode: 'ai', gimmick: 'none', food: 1,
    diff: { ally: 'normal', foe: 'normal' },
    teams: { ally: randomTeam(), foe: randomTeam() },
    moves: { ally: {}, foe: {} },
    edit: 'ally',            // which team the setup screen is editing
  };
  const saved = store.get('versus', null);
  // Same safety rule as the story save: keep every saved key.
  if (saved && typeof saved === 'object') {
    for (const key in saved) {
      if (v[key] && typeof v[key] === 'object' && saved[key] && typeof saved[key] === 'object') Object.assign(v[key], saved[key]);
      else v[key] = saved[key];
    }
  }
  return v;
}

let vs = loadVersus();
let vsSel = null;            // the plant shown in the detail panel
let vsFilter = 'all';

const saveVersus = () => store.set('versus', vs);
const otherSide = side => (side === 'ally' ? 'foe' : 'ally');

// A team's plants, skipping any that don't exist anymore.
const vsTeam = side => (vs.teams[side] || []).filter(id => PLANTS[id]).slice(0, MAX_TEAM);

// Every move a plant has at level 10 (all 7 of them).
const allMovesOf = id => learnedAt(id, MAX_LEVEL);

// A plant's chosen moves on one team. If nothing was chosen yet (or the
// saved moves no longer exist), it starts with the first 4 it learns.
function vsMoves(side, id) {
  const known = allMovesOf(id);
  const list = (vs.moves[side][id] || []).filter(m => known.includes(m)).slice(0, MAX_MOVES);
  return list.length ? list : known.slice(0, MAX_MOVES);
}

function toggleVsMove(side, id, mv) {
  const list = vsMoves(side, id);
  if (list.includes(mv)) {
    if (list.length === 1) return 'A plant needs at least one move.';
    vs.moves[side][id] = list.filter(m => m !== mv);
  } else {
    if (list.length >= MAX_MOVES) return `Only ${MAX_MOVES} moves at a time. Unequip one first.`;
    vs.moves[side][id] = [...list, mv];
  }
  saveVersus();
  return null;
}

function toggleVsTeam(side, id) {
  const team = vsTeam(side);
  if (team.includes(id)) vs.teams[side] = team.filter(t => t !== id);
  else if (team.length >= MAX_TEAM) return toast('That team is full (5 plants). Remove one first.');
  else vs.teams[side] = [...team, id];
  saveVersus();
  renderVersus();
}

// A random team: 5 random plants, each with its free basic attack (its
// first move) plus 3 random others, so no plant ends up unable to attack.
function randomizeTeam(side) {
  vs.teams[side] = randomTeam();
  for (const id of vs.teams[side]) {
    const [first, ...rest] = allMovesOf(id);
    vs.moves[side][id] = [first, ...shuffle(rest).slice(0, MAX_MOVES - 1)];
  }
  saveVersus();
  renderVersus();
}

// What a side is called with the current settings: "You", "AI (Hard)",
// "Player 2", "AI 1 (Easy)"...
function vsLabel(side) {
  const ai = `(${VS_DIFFS[vs.diff[side]]})`;
  if (vs.mode === 'ai') return side === 'ally' ? 'You' : `AI ${ai}`;
  if (vs.mode === 'aivai') return `AI ${side === 'ally' ? 1 : 2} ${ai}`;
  return `Player ${side === 'ally' ? 1 : 2}`;
}

// The name to show: during a versus battle the names are fixed when it
// starts (B.versus.names), so changing settings later can't rename them.
const vsName = side => (B?.versus ? B.versus.names[side] : vsLabel(side));

// ---- The setup screen ------------------------------------------------------------------------
function renderVersus() {
  const ctrl = VS_MODES[vs.mode].ctrl;
  if (!PLANTS[vsSel]) vsSel = vsTeam(vs.edit)[0] || PLANT_ORDER[0];

  // Options: how to play, gimmick, Plant Food, AI difficulty.
  const modeBtns = Object.entries(VS_MODES).map(([k, m]) =>
    `<button type="button" class="small ${vs.mode === k ? 'on' : ''}" data-vsmode="${k}">${esc(m.name)}</button>`).join('');
  const gimOpts = [['none', 'None'], ['random', 'Random'], ...VS_GIMMICKS.map(g => [g, GIMMICKS[g].name])]
    .map(([k, n]) => `<option value="${k}" ${vs.gimmick === k ? 'selected' : ''}>${esc(n)}</option>`).join('');
  const gimDesc = GIMMICKS[vs.gimmick] ? GIMMICKS[vs.gimmick].desc : vs.gimmick === 'random' ? 'A random gimmick every battle.' : 'A plain battle.';
  const foodBtns = Array.from({ length: VS_FOOD_MAX + 1 }, (_, n) =>
    `<button type="button" class="small ${vs.food === n ? 'on' : ''}" data-vsfood="${n}">${n ? n : 'Off'}</button>`).join('');
  const diffRows = ['ally', 'foe'].filter(s => ctrl[s] === 'ai').map(s =>
    `<div class="vs-opt"><span class="dim">${esc(vs.mode === 'aivai' ? `AI ${s === 'ally' ? 1 : 2}` : 'AI')}</span> ${Object.entries(VS_DIFFS).map(([k, n]) =>
      `<button type="button" class="small ${vs.diff[s] === k ? 'on' : ''}" data-vsdiff="${s}:${k}">${n}</button>`).join('')}</div>`).join('');
  $('vsOpts').innerHTML = `
    <div class="vs-opt"><span class="dim">Play</span> ${modeBtns}</div>
    <div class="vs-opt"><span class="dim">Gimmick</span> <select id="vsGimmick">${gimOpts}</select> <span class="dim small-print">${esc(gimDesc)}</span></div>
    <div class="vs-opt"><span class="dim">Plant Food per side</span> ${foodBtns}</div>
    ${diffRows}`;

  // The two teams. Click a team to edit it.
  const teamBox = side => {
    const team = vsTeam(side);
    const slots = Array.from({ length: MAX_TEAM }, (_, i) => {
      const id = team[i];
      return id
        ? `<button type="button" class="slot ${CLASSES[PLANTS[id].cls].color} ${vs.edit === side && vsSel === id ? 'on' : ''}" data-vsslot="${side}:${id}">${i + 1}. ${esc(PLANTS[id].name)}</button>`
        : `<span class="slot empty">${i + 1}. empty</span>`;
    }).join('');
    return `<div class="vs-team ${side === 'ally' ? 'team1' : 'team2'} ${vs.edit === side ? 'editing' : ''}" data-vsedit="${side}">
      <div class="vs-team-head"><b>${esc(vsLabel(side))}</b>
        <span class="dim">${vs.edit === side ? '(editing)' : '(click to edit)'}</span>
        <span class="vs-team-btns">
          <button type="button" class="small" data-vsrandom="${side}">Random team</button>
          <button type="button" class="small" data-vsclear="${side}">Clear</button>
        </span></div>
      <div class="vs-slots">${slots}</div>
    </div>`;
  };
  const ready = vsTeam('ally').length && vsTeam('foe').length;
  $('vsTeams').innerHTML = teamBox('ally') + teamBox('foe')
    + `<div class="vs-go"><button type="button" class="big" id="btnVsFight" ${ready ? '' : 'disabled'}>Fight!</button>
       ${ready ? '' : '<span class="dim">Each team needs at least one plant.</span>'}</div>`;

  // Every plant, for adding to the team being edited.
  $('vsFilters').innerHTML = ['all', ...CLASS_ORDER].map(c =>
    `<button type="button" class="small ${vsFilter === c ? 'on' : ''} ${c === 'all' ? '' : CLASSES[c].color}" data-vsfilter="${c}">${c === 'all' ? 'All' : CLASSES[c].name}</button>`).join('');
  const team = vsTeam(vs.edit);
  $('vsGrid').innerHTML = PLANT_ORDER.filter(id => vsFilter === 'all' || PLANTS[id].cls === vsFilter).map(id => {
    const p = PLANTS[id];
    const inTeam = team.includes(id);
    return `<button type="button" class="ptile ${CLASSES[p.cls].color} ${inTeam ? 'inteam' : ''}" data-vsplant="${id}">
      <pre class="spr">${spriteHtml(id, SPRITES[id])}</pre>
      <span class="cname">${esc(p.name)}</span>
      <span class="dim">${esc(CLASSES[p.cls].name)}${inTeam ? ' · TEAM' : ''}</span>
    </button>`;
  }).join('');
  $('vsDetail').innerHTML = vsDetail(vsSel);
}

// The info panel for a plant on the team being edited.
function vsDetail(id) {
  const p = PLANTS[id];
  const cls = CLASSES[p.cls];
  const side = vs.edit;
  const [hp, atk, dfn, spd] = p.stats;
  const s = PLANT_STAT_SCALE;
  const inTeam = vsTeam(side).includes(id);
  const eq = vsMoves(side, id);
  const moves = allMovesOf(id).map(mv => {
    const m = MOVES[mv];
    const on = eq.includes(mv);
    const info = `${m.cost ? '&#9728;' + m.cost : 'free'}${m.cd ? (m.cd >= ONCE_PER_BATTLE ? ' · once per battle' : ' · cooldown ' + m.cd) : ''}${m.power ? ' · power ' + m.power + (m.hits > 1 ? ' x' + m.hits : '') : ''}`;
    return `<button type="button" class="mrow ${on ? 'on' : ''}" data-vsequip="${mv}">
      <span class="mcheck">${on ? '[x]' : '[ ]'}</span>
      <span><b>${esc(m.name)}</b> <span class="dim">${info}</span><br>${esc(m.desc)}</span>
    </button>`;
  }).join('');
  return `
    <div class="dhead">
      <pre class="spr big">${spriteHtml(id, SPRITES[id])}</pre>
      <div>
        <h2 class="${cls.color}">${esc(p.name)}</h2>
        <p><span class="${cls.color}">${esc(cls.name)}</span>${p.shroom ? ' · Mushroom' : ''} · Lv${MAX_LEVEL}</p>
        <p class="stats">HP ${Math.round(hp * s)} · ATK ${Math.round(atk * s)} · DEF ${dfn} · SPD ${spd}</p>
        <p class="dim">${esc(p.flavor)}</p>
      </div>
    </div>
    <p class="passive"><b>${esc(p.passive.name)}:</b> ${esc(p.passive.desc)}</p>
    <div class="row"><button type="button" id="btnVsToggle">${inTeam ? `Remove from ${esc(vsLabel(side))}` : `Add to ${esc(vsLabel(side))}`}</button></div>
    <h3>Moves for ${esc(vsLabel(side))} <span class="dim">(${eq.length}/${MAX_MOVES} equipped, click to change)</span></h3>
    <div class="mlist">${moves}</div>`;
}

// ---- Starting and ending a versus battle ----------------------------------------------------
function startVersus() {
  const mode = VS_MODES[vs.mode];
  const g = vs.gimmick === 'random' ? pick(VS_GIMMICKS) : vs.gimmick;
  const gimmicks = new Set(GIMMICKS[g] ? [g] : []);
  const names = { ally: vsLabel('ally'), foe: vsLabel('foe') };
  const sun = startSun(gimmicks);
  B = {
    versus: { ctrl: { ...mode.ctrl }, diff: { ...vs.diff }, food: { ally: vs.food, foe: vs.food }, foodMax: vs.food, names },
    enc: { name: 'Versus', waves: [[]] }, chapterIdx: 0, key: null, lvl: MAX_LEVEL,
    g: gimmicks,
    wave: 0, round: 0, suns: { ally: sun, foe: sun }, queue: [], actor: null,
    plants: [], foes: [], defeated: [],
    lines: [], fx: [], phase: 'wait', choice: null, allowed: null,
    stats: { wilted: 0, waits: 0 }, moveKills: 0, over: false, speed: B?.speed || 1,
  };
  const units = side => vsTeam(side).map(id => makeUnit('plant', id, side, MAX_LEVEL, { versus: true, moves: vsMoves(side, id) }));
  B.plants = units('ally');
  B.foes = units('foe');
  log(`Versus! ${names.ally} vs ${names.foe}` + (gimmicks.size ? ' · ' + [...gimmicks].map(k => GIMMICKS[k].name).join(' + ') : ''), 'title');
  for (const u of allUnits()) u.data.passive?.waveStart?.(u);
  $('result').hidden = true;
  show('battle');
  later(startRound, 600);
}

// winner is 'ally', 'foe', or null for a draw (both teams wilted at once).
function endVersus(winner) {
  B.over = true;
  B.phase = 'done';
  B.actor = null;
  const { names } = B.versus;
  // Against the AI, it's your win or loss; otherwise someone always wins.
  const youLost = vs.mode === 'ai' && winner !== 'ally';
  if (youLost) sfx.lose(); else sfx.win();
  const title = !winner ? 'A draw!' : names[winner] === 'You' ? 'You win!' : `${names[winner]} wins!`;
  const standing = winner ? sideList(winner).filter(p => p.hp > 0).map(p => p.name) : [];
  $('resultBox').innerHTML = `
    <h2 class="${youLost ? 'lose' : 'win'}">${esc(title)}</h2>
    <p>${B.round} rounds.${standing.length ? ` Still standing: ${esc(standing.join(', '))}.` : ''}</p>
    <p class="dim">Versus battles don't change your story save.</p>
    <div class="row">
      <button type="button" class="big" id="btnRematch">Rematch (Enter)</button>
      <button type="button" id="btnVsSetup">Change teams</button>
    </div>`;
  $('result').hidden = false;
  render();
}

// Overtime (see VS_OVERTIME_ROUND in config.js): called at the start of
// every round after it, so even two teams that heal forever finish.
function versusOvertime() {
  const n = B.round - VS_OVERTIME_ROUND;
  if (n === 1) log('OVERTIME! Every plant now wilts a little more each round.', 'title');
  for (const u of allUnits()) if (u.hp > 0) zap(u, u.maxHp * VS_OVERTIME_PART * n, 'wilts in overtime');
}

// Back to the versus setup screen (from the result box or the Quit button).
function leaveVersus() {
  if (B) B.over = true;
  B = null;
  $('result').hidden = true;
  show('versus');
}

/* ---- The versus AI ------------------------------------------------------------------------------
   The story zombies pick moves almost at random (aiAct in battle.js).
   Plants fighting plants need more thought, and they have to pay sun,
   so the versus AI works out roughly how much every move would help on
   every target it could hit, and picks the best:

     value = damage it would do (more if it knocks a plant out)
           + the worth of any status, heal, shield or revive
           - the sun it costs

   Everything is measured in "HP": a heal of 30 HP is worth about as
   much as 30 damage. The numbers are rough guesses, not exact.

   Difficulty:
     Easy    picks a random move it can afford, at a random target.
     Normal  picks a good move, but makes mistakes (some randomness,
             and now and then a random move).
     Hard    always picks the best move it can find, and saves its
             Plant Food for the biggest moment.                      */

// How much 1 sun is worth, in HP. Soaking up sun trades a turn (about
// one basic attack, ~12 HP) for 15 sun, so sun is worth well under 1.
const AI_SUN_VALUE = 0.4;
// With this much sun saved up, sun is worth much less (spend it!).
const AI_SUN_PLENTY = 200;
const aiSunValue = side => (B.suns[side] >= AI_SUN_PLENTY ? AI_SUN_VALUE / 4 : AI_SUN_VALUE);
// How much a Plant Food is worth: it's only used when doubling a move
// is worth more than this.
const AI_FOOD_VALUE = { normal: 30, hard: 45 };

// How much a status is worth on a target, per turn it lasts.
const AI_STATUS = {
  stun: t => t.atk * 0.8, freeze: t => t.atk * 0.8, sleep: t => t.atk * 0.6, sheep: t => t.atk * 0.8,
  hypno: t => t.atk * 1.2, weak: t => t.atk * 0.25, blind: t => t.atk * 0.5, burn: t => Math.max(2, t.maxHp * BURN_PART),
  chill: () => 3, marked: () => 5, silence: () => 5, bounty: () => 6,
  power: t => t.atk * 0.35, guard: () => 6, regen: t => t.maxHp * REGEN_PART * (t.hp < t.maxHp ? 1 : 0.3),
  ward: () => 3, evade: () => 7, counter: () => 6, taunt: () => 5, fiery: () => 5, thorns: () => 5,
  invuln: () => 12, cover: () => 6,
};

function aiStatusValue(t, name, turns, odds = 1) {
  if (!t || t.hp <= 0 || !STATUS[name]) return 0;
  const TP = t.data.passive || {};
  const stops = name === 'stun' || name === 'freeze' || name === 'sleep';
  if (TP.immune?.includes(name)) return 0;
  if (STATUS[name].bad && t.st.ward) return 0;
  if (stops && TP.noStun) return 0;
  if ((name === 'chill' || name === 'freeze') && B.g.has('heatwave')) return 0;
  let v = (AI_STATUS[name] ? AI_STATUS[name](t) : 5) * Math.min(turns, stops ? 2 : 3) * odds;
  if ((t.st[name] || 0) >= turns) v *= 0.2;   // it already has it
  return v;
}

// Roughly how much damage u would do to t with a move of this power
// (the same formula as hit() in battle.js, without the random parts).
function aiDamage(u, t, mv, power) {
  if (!t || t.hp <= 0) return 0;
  const TP = t.data.passive || {};
  const atk = mv.useDef ? (u.dfn + 4) * u.scale : u.atk;
  let d = power * (atk / 10) * (DEF_K / (DEF_K + t.dfn)) * (mv.hits || 1);
  if (u.st.power) d *= POWER_MULT;
  if (u.st.weak) d *= WEAK_MULT;
  if (t.st.guard) d *= GUARD_MULT;
  if (t.st.marked) d *= MARK_MULT;
  if (t.st.sheep) d *= 1.3;
  if (mv.execute && t.hp < t.maxHp * 0.4) d *= mv.execute;
  if (mv.vsChilled && (t.st.chill || t.st.freeze)) d *= mv.vsChilled;
  if (B.g.has('roof')) { if (mv.straight && !isLob(u, mv)) d *= 0.75; if (isLob(u, mv)) d *= 1.25; }
  if (u.data.shroom) d *= B.g.has('night') ? 1.3 : B.g.has('day') ? 0.85 : 1;
  // Attacks aimed at one plant can be dodged.
  if (!mv.sure && mv.target !== 'foes') {
    if (t.st.invuln) return 0;
    if (TP.dodge) d *= 1 - TP.dodge;
    if (t.st.evade) d *= 1 - EVADE_CHANCE;
  }
  return d;
}

// What damage to t is worth: capped at what it can take, plus a bonus
// for knocking it out (it won't get any more turns), plus a bit more
// for hitting plants that are already hurt (finish what you started).
function aiHitValue(u, t, mv, power) {
  const d = aiDamage(u, t, mv, power);
  if (d <= 0) return 0;
  const left = t.hp + (t.st.shield || 0) + (mv.pierce ? 0 : t.armor);
  let v = Math.min(d, left) * (1 + 0.5 * (1 - t.hp / t.maxHp));
  if (d >= left) v += 20 + t.atk * 1.5;
  // Spikes and counters hurt the attacker back.
  const back = (t.st.thorns ? THORNS_PART : 0) + (t.data.passive?.reflect || 0);
  v -= Math.min(d, left) * back * 0.8;
  if (t.st.counter) v -= 8;
  return v;
}

// How much using move `id` on target t would help (before its sun cost).
// boost is 2 when the move would be powered by Plant Food.
function aiValue(u, id, t, boost) {
  const mv = MOVES[id];
  const P = u.data.passive || {};
  const foes = foesOf(u).filter(x => canTarget(u, x, mv));
  const sum = (list, f) => list.reduce((a, x) => a + f(x), 0);
  const pw = (mv.power || 0) * boost;
  let v = 0;

  // Damage.
  if (mv.power) {
    const hitV = (x, power) => aiHitValue(u, x, mv, power);
    if (P.beam && mv.target === 'foe') v += sum(foes, x => hitV(x, pw * (u.flags.fullBeam ? 1 : P.beam)));
    else if (mv.target === 'foe') {
      v += hitV(t, pw);
      const others = foes.filter(x => x !== t);
      if (P.echo && !(mv.hits > 1)) v += hitV(t, pw * P.echo) * 0.7;
      if (P.ricochet && others.length) v += sum(others, x => hitV(x, pw * P.ricochet)) * Math.min(1, 2 / others.length);
      const splash = mv.splash || P.splashAll || 0;
      if (splash) v += sum(others, x => hitV(x, pw * splash));
    } else if (mv.target === 'foe2') v += hitV(t, pw) + Math.max(0, ...foes.filter(x => x !== t).map(x => hitV(x, pw)));
    else if (mv.target === 'foes') v += sum(foes, x => hitV(x, pw));
    else if (mv.target === 'randfoe' && foes.length) v += sum(foes, x => hitV(x, pw)) / foes.length;
  }

  // Who the rest of the move (statuses, heals...) lands on.
  const targets = mv.target === 'foes' ? foes : mv.target === 'allies' ? alliesOf(u) : mv.target === 'self' ? [u] : t ? [t] : [];
  for (const x of targets) {
    if (mv.status) {
      const [name, turns, odds] = mv.status;
      v += aiStatusValue(x, name, turns, odds);
    }
    if (mv.heal) v += x.st.burn ? 0 : Math.min(x.maxHp - x.hp, x.maxHp * mv.heal * boost * (P.healBoost || 1));
    if (mv.shield) v += Math.min(u.maxHp * mv.shield * boost, x.maxHp * 0.5) * (1.3 - x.hp / x.maxHp) * 0.6;
    if (mv.revive) v += x.maxHp * mv.revive * boost * 0.8 + 20;
    if (mv.cleanse) for (const k in x.st) if (STATUS[k]?.bad) v += AI_STATUS[k] ? AI_STATUS[k](x) : 5;
  }
  if (mv.self) v += aiStatusValue(u, mv.self[0], mv.self[1] * boost);
  if (mv.sun) v += mv.sun * boost * AI_SUN_VALUE;
  if (mv.recoil) v -= u.maxHp * mv.recoil * (u.hp < u.maxHp * 0.3 ? 3 : 0.7);

  // Special moves do all sorts of things. A few are worked out exactly;
  // for the rest, guess that a move is worth a bit more than its cost
  // (stronger specials cost more sun).
  if (id === 'chomp_devour') v = t && t.hp <= t.maxHp * 0.4 ? t.hp + 20 + t.atk * 1.5 - u.atk : 5;
  else if (id === 'sun_flare') {
    const spent = B.suns[u.side];
    v = spent < 10 ? 0 : sum(foes, x => aiHitValue(u, x, { aoe: true }, spent / 10)) - spent * AI_SUN_VALUE;
  } else if (mv.special) v += 6 + mv.cost * 0.35 * boost;
  return v;
}

// Could u use this move if sun didn't matter (that is, with Plant Food)?
function aiReadyWithFood(u, id) {
  if (u.st.fed) return !whyNot(u, id);
  u.st.fed = 1;
  const ok = !whyNot(u, id);
  delete u.st.fed;
  return ok;
}

// The versus AI takes a plant's turn.
function versusAct(u) {
  if (u.hp <= 0) return;
  const side = u.side;
  const diff = B.versus.diff[side];
  const canUse = id => MOVES[id] && (!MOVES[id].can || MOVES[id].can(u));
  const usable = u.moves.filter(id => canUse(id) && !whyNot(u, id));
  const targetsFor = id => validTargets(u, MOVES[id]) || [null];

  // Easy (and Normal now and then): a random move at a random target.
  if (diff === 'easy' || (diff === 'normal' && chance(0.15))) {
    if (!usable.length) return aiSoak(u);
    if (diff === 'easy' && foodLeft(side) > 0 && !u.st.fed && chance(0.15)) aiFeed(u);
    const id = pick(usable);
    return useMove(u, id, pick(targetsFor(id)));
  }

  // Normal and Hard: score every move on every target.
  const food = foodLeft(side) > 0 && !u.st.fed;
  const noise = () => (diff === 'hard' ? rand(0.95, 1.05) : rand(0.7, 1.3));
  // Soaking up sun is the fallback (worthless once the side has plenty of sun).
  const sunV = aiSunValue(side);
  let best = { score: B.suns[side] < AI_SUN_PLENTY ? WAIT_SUN * sunV : 0, id: null };
  for (const id of u.moves.filter(canUse)) {
    const mv = MOVES[id];
    const affordable = usable.includes(id);
    const withFood = food && aiReadyWithFood(u, id);
    if (!affordable && !withFood) continue;
    for (const t of targetsFor(id)) {
      if (affordable) {
        const s = (aiValue(u, id, t, u.st.fed ? 2 : 1) - (u.st.fed ? 0 : mv.cost * sunV)) * noise();
        if (s > best.score) best = { score: s, id, t, feed: false };
      }
      // With Plant Food the move is free and twice as strong.
      if (withFood) {
        const s = (aiValue(u, id, t, 2) - AI_FOOD_VALUE[diff]) * noise();
        if (s > best.score) best = { score: s, id, t, feed: true };
      }
    }
  }
  if (!best.id) return aiSoak(u);
  if (best.feed) aiFeed(u);
  useMove(u, best.id, best.t);
}

function aiSoak(u) {
  gainSun(WAIT_SUN, u);
  log(`${u.name} soaks up the sun (+${WAIT_SUN}).`);
}

function aiFeed(u) {
  B.versus.food[u.side]--;
  u.st.fed = 1;
  log(`${u.name} ate Plant Food!`, 'good');
  sfx.sun();
}
