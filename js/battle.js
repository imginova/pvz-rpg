/* =====================================================================
   battle.js: the RULES of a fight.

   How a battle works:
     - Your team (up to 5 plants) fights waves of enemies.
     - Each ROUND, every unit gets one turn, fastest first (speed stat).
     - On a plant's turn YOU pick a move and a target. Moves cost sun
       from the shared sun counter, which fills up every round.
     - Enemies choose their own moves (the "AI", short for artificial
       intelligence: a few simple rules that pick a move and a target).
     - Beat every wave to win. If every plant wilts, you lose.

   Everything about the current fight is in one object, B. This file
   changes B; render.js draws it; screens.js shows the results.

   Words used here:
     unit   one plant or zombie in the fight
     side   'ally' (your team) or 'foe' (the enemies)
     hook   a function in a plant's passive that runs at a set moment
   ===================================================================== */

let B = null;          // the current battle (null when not fighting)
let uidCounter = 0;    // gives every unit its own id number

// later(fn, ms) runs fn after a pause, unless the battle has ended or
// been left in the meantime. B.speed > 1 makes everything quicker.
function later(fn, ms) {
  const battle = B;
  setTimeout(() => { if (B === battle && !B.over) fn(); }, ms / (B?.speed || 1));
}

// ---- Making units ------------------------------------------------------------------
function makeUnit(kind, id, side, lvl, opts = {}) {
  const data = kind === 'plant' ? PLANTS[id] : ZOMBIES[id];
  const [hp, atk, dfn, spd] = data.stats;
  const s = statScale(side);
  const u = {
    uid: ++uidCounter, kind, id, data, side, lvl, name: data.name,
    maxHp: Math.round(hp * s), atk: atk * s, dfn, spd,
    armor: 0, armorMax: 0, armorKind: null,
    st: {}, cd: {}, moves: [], flags: {}, boss: !!opts.boss, rogue: !!opts.rogue,
  };
  if (data.armor) {
    u.armor = u.armorMax = Math.round(data.armor[0] * s);
    u.armorKind = data.armor[1];
  }
  if (opts.boss) u.maxHp = Math.round(u.maxHp * (opts.rogue ? ROGUE_HP : BOSS_HP));
  if (opts.rogue) { u.atk *= ROGUE_ATK; u.name = 'Rogue ' + u.name; }
  u.hp = u.maxHp;
  if (kind === 'zombie') u.moves = data.moves.slice();
  else u.moves = side === 'ally' ? equipped(id) : learnedAt(id, lvl);
  return u;
}

// A wave entry is 'cone' (a zombie), 'football!' (a boss zombie) or
// 'R:chomper' (a rogue plant boss).
function unitFromSpec(spec, lvl) {
  if (spec.startsWith('R:')) return makeUnit('plant', spec.slice(2), 'foe', lvl, { boss: true, rogue: true });
  const boss = spec.endsWith('!');
  return makeUnit('zombie', spec.replace('!', ''), 'foe', lvl, { boss });
}

// ---- Looking at the field -----------------------------------------------------------
const sideList = side => (side === 'ally' ? B.plants : B.foes);
const allUnits = () => [...B.plants, ...B.foes];
const unitById = uid => allUnits().find(u => u.uid === uid);

function alliesOf(u) { return sideList(u.side).filter(x => x.hp > 0); }

// A hypnotized unit fights its own side.
function foesOf(u) {
  if (u.st.hypno) return sideList(u.side).filter(x => x.hp > 0 && x !== u);
  return sideList(u.side === 'ally' ? 'foe' : 'ally').filter(x => x.hp > 0);
}

const isLob = (u, mv) => !!(mv.lob || u.data.passive?.lobAll);

// Diving Snorkel Zombies can only be reached by lobs (or hit-everyone moves).
function canTarget(u, t, mv) {
  return !(t.flags.under && !isLob(u, mv));
}

// Who a move could be aimed at, or null if it needs no choosing.
// Is a Ladder Zombie on this unit's side still carrying its ladder?
const ladderUp = u => sideList(u.side).some(z => z.hp > 0 && z.data.passive?.ladder && z.armor > 0);

function validTargets(u, mv) {
  if (mv.target === 'foe' || mv.target === 'foe2') {
    let list = foesOf(u).filter(t => canTarget(u, t, mv));
    const taunters = list.filter(t => t.st.taunt);
    // Vaulting attacks ignore Taunt, and so does everyone while a Ladder Zombie still has its ladder.
    if (taunters.length && !mv.vault && !ladderUp(u)) list = taunters;
    return list;
  }
  if (mv.target === 'ally') return alliesOf(u);
  if (mv.target === 'fallen') return sideList(u.side).filter(x => x.hp <= 0);
  return null;
}

// ---- Messages and pop-up numbers ------------------------------------------------------
function log(text, cls = '') {
  if (!B) return;
  B.lines.push({ text, cls });
  if (B.lines.length > 80) B.lines.shift();
}

// A little number that pops up over a card for a moment ("-12", "+20").
function pop(u, text, cls) {
  B.fx.push({ uid: u.uid, text, cls, at: performance.now() });
}

// ---- Sun -------------------------------------------------------------------------------
function gainSun(n, src) {
  if (src && src.side !== 'ally') return;   // rogue plants don't make you sun
  B.sun = Math.min(SUN_MAX, B.sun + Math.round(n));
  if (B.sun >= 500) award('sunhoard');
}

// ---- Damage ------------------------------------------------------------------------------
const ARMOR_NAMES = { cone: 'cone', bucket: 'bucket', paper: 'newspaper', helmet: 'helmet', door: 'screen door', mech: 'robot armor', crown: 'knight armor', robo: 'future armor', ladder: 'ladder', pogo: 'pogo stick', ice: 'ice block', boombox: 'boombox', barrel: 'barrel', sarcophagus: 'sarcophagus' };

/* hit(src, t, power, mv): src attacks t. Returns the damage done.
   mv is the move (or a small object like { aoe: true }) and says what
   kind of attack it is: straight, lob, pierce, fire...
   The order of steps: dodge -> damage formula -> bonuses -> critical
   hit -> shield -> armor -> HP -> bounce-back damage -> hooks.        */
function hit(src, t, power, mv = {}) {
  if (!t || t.hp <= 0) return 0;
  const P = src.data.passive || {};
  const lob = isLob(src, mv);
  const straight = !!mv.straight && !lob;
  const pierce = mv.pierce || P.pierceAll;
  let fire = !!mv.fire || !!src.st.fiery;
  const aimed = !mv.aoe && !mv.counter;   // aimed at this one unit
  let mult = 1;

  // Protectors step in front of attacks aimed at one ally ("Block for You").
  if (aimed && t.st.cover) {
    const guard = unitById(t.coverBy);
    if (guard && guard.hp > 0 && guard !== src && guard !== t) { log(`${guard.name} takes the hit for ${t.name}!`, 'good'); t = guard; }
  }
  // Umbrella Leaf catches lobbed enemy attacks meant for its team, at half damage.
  if (lob && t.side === 'ally' && src.side === 'foe' && !mv.counter) {
    const brolly = B.plants.find(p => p.hp > 0 && p.data.passive?.umbrella);
    if (brolly) { if (brolly !== t) log(`${brolly.name} catches it!`, 'good'); t = brolly; mult *= 0.5; }
  }
  const TP = t.data.passive || {};

  // A blinded attacker's next aimed attack misses.
  if (aimed && src.st.blind) { delete src.st.blind; log(`${src.name} can't see and misses!`, 'good'); pop(t, 'MISS', 'miss'); return 0; }

  // Dodges and fog misses only happen to attacks aimed at one unit.
  const single = aimed && !mv.sure;
  if (single && t.st.invuln) { log(`The rainbow protects ${t.name}!`); pop(t, 'BLOCKED', 'miss'); return 0; }
  if (single && TP.dodge && chance(TP.dodge)) { log(`${t.name} dodged!`); pop(t, 'DODGE', 'miss'); return 0; }
  if (single && t.st.evade && chance(EVADE_CHANCE)) { log(`${t.name} evades!`); pop(t, 'DODGE', 'miss'); return 0; }
  if (single && straight && TP.dodgeStraight && chance(TP.dodgeStraight)) { log(`${t.name} flies out of the way!`); pop(t, 'DODGE', 'miss'); return 0; }
  if (single && B.g.has('fog') && src.side === 'ally' && chance(0.15)) { log(`${src.name} missed in the fog.`); pop(t, 'MISS', 'miss'); return 0; }

  // The damage formula (see config.js). Wall-nut's Roll uses defense instead of attack.
  const atk = mv.useDef ? (src.dfn + 4) * statScale(src.side) : src.atk;
  let dmg = power * (atk / 10) * (DEF_K / (DEF_K + t.dfn));

  // Torchwood sets your straight shots on fire.
  let torchBurn = false;
  if (straight && src.side === 'ally' && src.kind === 'plant' && !src.st.hypno && B.plants.some(p => p.hp > 0 && p.data.passive?.torch)) {
    dmg *= FIRE_BONUS; fire = true; torchBurn = chance(0.3);
  }

  // Status effects.
  if (src.st.power) dmg *= POWER_MULT;
  if (src.st.weak) dmg *= WEAK_MULT;
  if (t.st.guard) dmg *= GUARD_MULT;
  if (t.st.sheep) dmg *= 1.3;
  if (t.st.marked) dmg *= MARK_MULT;
  // Finishing moves (Squash's "Hmm...") hit much harder on badly hurt enemies.
  if (mv.execute && t.hp < t.maxHp * 0.4) dmg *= mv.execute;
  // Combo moves (Frostbite) hit much harder on enemies that are already chilled or frozen.
  if (mv.vsChilled && (t.st.chill || t.st.freeze)) dmg *= mv.vsChilled;
  dmg *= mult;

  // Battle gimmicks.
  if (src.data.shroom) dmg *= B.g.has('night') ? 1.3 : B.g.has('day') ? 0.85 : 1;
  if (B.g.has('roof')) { if (straight) dmg *= 0.75; if (lob) dmg *= 1.25; }
  if (fire && B.g.has('pool')) dmg *= 0.75;
  if (fire && B.g.has('heatwave')) dmg *= 1.5;

  // Passive abilities of the attacker and the target.
  if (P.dealMult) dmg *= P.dealMult(src, t, mv);
  if (TP.takeMult) dmg *= TP.takeMult(t, src, { ...mv, straight, lob, fire, pierce });

  let crit = false;
  if (!mv.counter && !mv.noCrit && chance(CRIT_CHANCE)) { crit = true; dmg *= CRIT_MULT; }
  dmg = Math.max(1, Math.round(dmg * rand(0.9, 1.1)));

  // A shield soaks up damage first, then armor, then HP.
  let left = dmg;
  if (t.st.shield) {
    const soak = Math.min(t.st.shield, left);
    t.st.shield -= soak; left -= soak;
    if (t.st.shield <= 0) delete t.st.shield;
  }
  if (left > 0 && t.armor > 0 && !pierce && !(lob && t.armorKind === 'door')) {
    const soak = Math.min(t.armor, left);
    t.armor -= soak; left -= soak;
    if (t.armor <= 0) {
      log(`${t.name}'s ${ARMOR_NAMES[t.armorKind]} broke!`, 'good');
      if (src.side === 'ally') progress.stats.armorBroken++;
      TP.armorBreak?.(t);
    }
  }
  t.hp = Math.max(0, t.hp - left);
  pop(t, (crit ? 'CRIT ' : '') + '-' + dmg, crit ? 'crit' : 'dmg');
  log(`${src.name} hits ${t.name} for ${dmg}${crit ? ' (critical!)' : ''}.`, src.side === 'ally' && !src.st.hypno ? '' : 'foe');
  sfx.hit(crit);

  if (fire) { delete t.st.chill; delete t.st.freeze; }   // fire melts ice
  if (torchBurn || (src.st.fiery && chance(0.3))) addStatus(t, 'burn', 2, { src });
  if (src.side === 'ally' && dmg >= 150) award('overkill');
  if (t.st.sleep && t.hp > 0) { delete t.st.sleep; log(`${t.name} wakes up!`); }
  // Life-stealing moves (Chomper's Lunge) heal the attacker.
  if (mv.lifesteal) healUnit(src, dmg * mv.lifesteal);
  P.onHit?.(src, t, dmg, mv);

  // Counter stance: the next attack aimed at it gets hit straight back.
  if (aimed && t.st.counter && src !== t && src.hp > 0 && t.hp > 0) {
    delete t.st.counter;
    log(`${t.name} counters!`, 'good');
    hit(t, src, COUNTER_POWER, { counter: true });
  }

  // Spiky plants and Thorns bounce some damage back (never bounces twice).
  const bounce = (t.st.thorns ? THORNS_PART : 0) + (TP.reflect || 0);
  if (bounce > 0 && !mv.counter && src !== t && src.hp > 0) {
    const back = Math.max(1, Math.round(dmg * bounce));
    src.hp = Math.max(0, src.hp - back);
    pop(src, '-' + back, 'dmg');
    log(`${t.name}'s spikes hurt ${src.name} for ${back}.`);
    if (src.hp <= 0) fallUnit(src, t);
  }

  if (t.hp > 0 && TP.onHurt) TP.onHurt(t, mv.counter ? null : src, dmg, { ...mv, straight, lob, fire, pierce });
  if (t.hp <= 0) fallUnit(t, src);
  return dmg;
}

// Fixed damage that ignores everything (burning, lightning).
function zap(u, amount, why) {
  if (u.hp <= 0) return;
  const d = Math.max(1, Math.round(amount));
  u.hp = Math.max(0, u.hp - d);
  pop(u, '-' + d, 'dmg');
  log(`${u.name} ${why} (${d}).`, u.side === 'ally' ? 'bad' : '');
  if (u.hp <= 0) fallUnit(u, null);
}

// A unit runs out of HP.
function fallUnit(u, killer) {
  if (u.fallen) return;
  u.fallen = true;
  u.hp = 0;
  // Citron's Bounty pays out when a marked enemy goes down.
  if (u.st.bounty) { log(`Bounty collected! +${BOUNTY_SUN} sun.`, 'good'); gainSun(BOUNTY_SUN); }
  u.st = {};
  u.flags.under = false;
  if (u.side === 'ally') {
    log(`${u.name} wilted!`, 'bad');
    B.stats.wilted++;
    for (const a of alliesOf(u)) a.data.passive?.onAllyFall?.(a, u);
  } else {
    log(`${u.name} is defeated!`, 'good');
    B.defeated.push(u);
    B.moveKills++;
    if (u.kind === 'zombie') progress.seen[u.id] = true;
    if (u.id === 'catapult') progress.stats.catapults++;
    if (killer && killer.st.hypno && killer.side === 'foe') award('turncoat');
  }
  sfx.fall(u.side === 'ally');
  u.data.passive?.onFall?.(u, killer);
}

// ---- Healing, shields, statuses ------------------------------------------------------------
function healUnit(u, amount, src) {
  if (!u || u.hp <= 0) return 0;
  // Burning units can't be healed (this is the counter to Scientist Zombies).
  if (u.st.burn) { pop(u, 'NO HEAL', 'miss'); return 0; }
  const boost = src?.data.passive?.healBoost || 1;
  const gain = Math.min(u.maxHp - u.hp, Math.round(amount * boost));
  if (gain > 0) { u.hp += gain; pop(u, '+' + gain, 'heal'); }
  return gain;
}

function addShield(u, amount) {
  if (!u || u.hp <= 0) return;
  u.st.shield = Math.min(u.maxHp, (u.st.shield || 0) + Math.round(amount));
  pop(u, 'SHIELD', 'buff');
}

function cleanse(u) {
  for (const k in u.st) if (STATUS[k]?.bad) delete u.st[k];
}

function revive(u, part) {
  if (!u || u.hp > 0) return;
  u.fallen = false;
  u.hp = Math.round(u.maxHp * Math.min(1, part));
  u.cd = {};
  log(`${u.name} blooms again!`, 'good');
  pop(u, 'REVIVED', 'heal');
}

/* addStatus(t, 'chill', 2, { src, label }): put a status on a unit.
   Turns count the unit's OWN turns, and go down at the end of each of
   its turns. A unit buffing itself gets one extra, because the turn it
   is using right now ends straight away.                              */
function addStatus(t, name, turns, o = {}) {
  if (!t || t.hp <= 0) return false;
  const TP = t.data.passive || {};
  const icy = name === 'chill' || name === 'freeze';
  if (TP.immune?.includes(name)) { log(`${t.name} can't be ${STATUS[name].tag.toLowerCase()}!`); return false; }
  if (icy && B.g.has('heatwave')) return false;
  const stopsTurn = name === 'stun' || name === 'freeze' || name === 'sleep';
  // A Ward (Garlic) keeps new bad statuses off.
  if (STATUS[name].bad && t.st.ward) { log(`${t.name}'s ward blocks it!`, t.side === 'ally' ? 'good' : ''); return false; }
  if (stopsTurn && TP.noStun) { log(`${t.name} is too tall to stun!`); return false; }
  if (name === 'hypno' && t.boss) { log(`${t.name} resists the hypnosis!`); return false; }
  // E.M.Peach's stuns always work on machines, even boss machines.
  const emp = o.src?.data.passive?.emp && t.data.vehicle;
  if (t.boss && !emp && stopsTurn && chance(BOSS_RESIST)) { log(`${t.name} shrugs it off!`); return false; }
  if (icy && o.src) turns += o.src.data.passive?.icyBonus || 0;
  if (name === 'burn' && o.src?.data.passive?.scorch) turns += 1;
  if (name === 'chill' && B.g.has('pool')) turns += 1;
  if (icy && o.src?.side === 'ally' && t.side === 'foe') progress.stats.chilled++;
  if (t === B.actor) turns += 1;
  t.st[name] = Math.max(t.st[name] || 0, turns);
  if (name === 'stun') t.stunLabel = o.label || 'Stunned';
  pop(t, STATUS[name].tag, STATUS[name].bad ? 'debuff' : 'buff');
  if (name === 'hypno') log(`${t.name} is hypnotized!`, 'good');
  TP.onStatus?.(t, name);
  return true;
}

// Zombies calling in friends (up to 5 on their side).
function summon(u, ids) {
  for (const id of ids) {
    const list = sideList(u.side);
    if (list.filter(x => x.hp > 0).length >= 5) break;
    const z = makeUnit('zombie', id, u.side, B.lvl);
    if (B.g.has('sandstorm')) z.dfn += 3;
    list.push(z);
    log(`${z.name} joins the fight!`, 'foe');
    progress.seen[id] = true;
  }
}

/* ---- Starting a battle ----------------------------------------------------------------------
   startBattle({ enc, chapter, key }) where enc is a battle from world.js.
   Practice battles pass key = null so they don't count as story wins.  */
function startBattle(enc, chapterIdx, key) {
  const ch = CHAPTERS[chapterIdx];
  B = {
    enc, chapterIdx, key, lvl: enc.lvl,
    g: new Set([ch.gimmick, ...(enc.gimmicks || [])]),
    wave: 0, round: 0, sun: 0, queue: [], actor: null,
    plants: [], foes: [], defeated: [],
    lines: [], fx: [], phase: 'wait', choice: null, allowed: null,
    stats: { wilted: 0, waits: 0 }, moveKills: 0, over: false, speed: B?.speed || 1,
  };
  // Starting sun: a gimmick can change it.
  B.sun = SUN_START;
  for (const g of B.g) if (GIMMICKS[g].startSun != null) B.sun = GIMMICKS[g].startSun;

  const team = progress.team.filter(owns).slice(0, MAX_TEAM);
  B.plants = team.map(id => makeUnit('plant', id, 'ally', progress.owned[id].lvl));
  progress.stats.battles++;
  if (B.plants.length >= 5) award('fullteam');

  log(`${enc.name}! ` + [...B.g].map(g => GIMMICKS[g].name).join(' + '), 'title');
  spawnWave();
  show('battle');
  later(startRound, 600);
}

function spawnWave() {
  B.foes = B.enc.waves[B.wave].map(spec => unitFromSpec(spec, B.lvl));
  for (const f of B.foes) {
    if (f.kind === 'zombie') progress.seen[f.id] = true;
    if (B.g.has('sandstorm')) f.dfn += 3;
  }
  if (B.enc.waves.length > 1) log(`Wave ${B.wave + 1} of ${B.enc.waves.length}!`, 'title');
  for (const u of allUnits()) if (u.hp > 0) u.data.passive?.waveStart?.(u);
}

// ---- Rounds and turns -----------------------------------------------------------------------
function effSpeed(u) {
  let s = u.spd;
  if (u.st.chill) s *= CHILL_SPEED;
  if (u.kind === 'zombie' && B.g.has('rush')) s *= 1.5;
  return s;
}

function startRound() {
  B.round++;
  log(`- Round ${B.round} -`, 'round');

  // Sun income (some gimmicks lower it).
  let income = SUN_INCOME;
  for (const g of B.g) if (GIMMICKS[g].income != null) income = Math.min(income, GIMMICKS[g].income);
  gainSun(income);

  // Gravestones: a zombie climbs out every 3 rounds.
  if (B.g.has('graves') && B.round % 3 === 0) {
    const pool = CHAPTERS[B.chapterIdx].pool.filter(id => !['gargantuar', 'zomboni'].includes(id));
    log('A zombie climbs out of a grave!', 'foe');
    summon({ side: 'foe' }, [pick(pool)]);
  }
  // Storm: lightning hits anyone every 3 rounds.
  if (B.g.has('storm') && B.round % 3 === 0) {
    const t = pick(allUnits().filter(u => u.hp > 0));
    if (t) zap(t, t.maxHp * 0.12, 'is struck by lightning');
  }

  // Freezing Wind: a random plant gets chilled.
  if (B.g.has('frostwind')) {
    const t = pick(B.plants.filter(p => p.hp > 0));
    if (t && addStatus(t, 'chill', 1)) log(`A freezing wind chills ${t.name}.`, 'bad');
  }
  // Neon Jams: the music switches every 2 rounds.
  if (B.g.has('neon') && B.round % 2 === 1) {
    const punk = (B.round % 4) === 1;
    log(punk ? 'PUNK JAM! The zombies get Power!' : 'POP JAM! The zombies get Weak!', 'title');
    for (const z of B.foes) if (z.hp > 0) addStatus(z, punk ? 'power' : 'weak', 2);
  }

  // Infi-nut rebuilding itself.
  for (const u of B.plants) {
    if (u.hp <= 0 && u.flags.rebuildAt && B.round >= u.flags.rebuildAt) { u.flags.rebuildAt = null; revive(u, 0.5); }
  }

  for (const u of allUnits()) if (u.hp > 0) u.data.passive?.roundStart?.(u);

  // Fastest first. The small random part breaks ties. Time Warp ignores speed.
  const warp = B.g.has('timewarp');
  B.queue = allUnits().filter(u => u.hp > 0)
    .map(u => ({ uid: u.uid, s: warp ? Math.random() : effSpeed(u) + Math.random() }))
    .sort((a, b) => b.s - a.s).map(x => x.uid);
  render();
  later(nextTurn, DELAY_NEXT);
}

function nextTurn() {
  if (checkEnd()) return;
  while (B.queue.length) {
    const u = unitById(B.queue.shift());
    if (u && u.hp > 0) return beginTurn(u);
  }
  startRound();
}

function beginTurn(u) {
  B.actor = u;
  B.choice = null;
  const P = u.data.passive || {};
  if (P.turnStart && P.turnStart(u) === 'skip') return finishTurn(u);
  if (u.st.burn) {
    zap(u, Math.max(2, u.maxHp * BURN_PART), 'burns');
    if (u.hp <= 0) return finishTurn(u);
  }
  // Regenerating units heal a little at the start of each of their turns.
  if (u.st.regen) healUnit(u, u.maxHp * REGEN_PART);
  if (u.st.freeze || u.st.stun || u.st.sheep || u.st.sleep) {
    if (u.st.sheep) log(`${u.name} is a sheep. Baa.`);
    else if (u.st.sleep) log(`${u.name} is fast asleep. Zzz.`);
    else log(`${u.name} is ${u.st.freeze ? 'frozen' : (u.stunLabel || 'stunned').toLowerCase()} and can't move.`);
    if (u.flags.charging) { u.flags.charging = false; log(`${u.name}'s charge is cancelled!`, 'good'); }
    return finishTurn(u);
  }
  // Super Brainz fires the beam he charged last turn.
  if (u.flags.charging) {
    B.phase = 'enemy';
    render();
    return later(() => { u.flags.charging = false; useMove(u, 'z_beam', null); finishTurn(u); }, DELAY_FOE);
  }
  if (u.side === 'ally' && !u.st.hypno) {
    // Your turn! Conveyor Belt only lets 2 random moves through.
    B.allowed = B.g.has('conveyor') ? shuffle(u.moves).slice(0, 2) : null;
    B.phase = 'player';
    sfx.blip();
    render();
    return;
  }
  B.phase = 'enemy';
  render();
  later(() => { aiAct(u); finishTurn(u); }, DELAY_FOE);
}

function finishTurn(u) {
  for (const k in u.st) {
    if (k === 'shield' || k === 'fed') continue;   // these last until used up
    if (--u.st[k] <= 0) delete u.st[k];
  }
  for (const k in u.cd) if (--u.cd[k] <= 0) delete u.cd[k];
  B.actor = null;
  B.choice = null;
  B.phase = 'wait';
  render();
  later(nextTurn, DELAY_NEXT);
}

// ---- Using a move ------------------------------------------------------------------------------
// Can the plant whose turn it is use this move right now? Returns null if
// yes, or the reason why not.
function whyNot(u, id) {
  const mv = MOVES[id];
  if (B.allowed && !B.allowed.includes(id)) return 'Not on the belt';
  if (u.cd[id]) return mv.cd >= ONCE_PER_BATTLE ? 'Used this battle' : `Ready in ${u.cd[id]}`;
  if (u.st.silence && !mv.power) return 'Silenced';
  if (!u.st.fed && B.sun < mv.cost) return 'Not enough sun';
  const t = validTargets(u, mv);
  if (t && !t.length) return mv.target === 'fallen' ? 'Nobody wilted' : 'No target';
  return null;
}

function useMove(u, id, chosen) {
  const mv = MOVES[id];
  const P = u.data.passive || {};
  const fed = u.side === 'ally' && !!u.st.fed;
  const boost = fed ? 2 : 1;
  if (u.side === 'ally' && !u.st.hypno) B.sun -= fed ? 0 : mv.cost;
  if (fed) { delete u.st.fed; log('Plant Food! Double power!', 'good'); }
  // Enemies don't pay sun, so their sun moves get a cooldown of at least 2 instead.
  const cd = Math.max(mv.cd || 0, u.side === 'foe' && mv.cost ? 2 : 0);
  if (cd) u.cd[id] = cd + 1;

  log(`${u.name} used ${mv.name}!`, u.side === 'ally' ? 'move' : 'foe');
  B.moveKills = 0;
  // Some moves set something up before they hit (Coconut Cannon loads itself).
  mv.pre?.(u);

  // Who gets hit.
  let targets = [];
  if (mv.target === 'foe' || mv.target === 'ally' || mv.target === 'fallen') targets = chosen ? [chosen] : [];
  else if (mv.target === 'foe2') {
    const other = shuffle(foesOf(u).filter(t => t !== chosen && canTarget(u, t, mv)))[0];
    targets = [chosen, other].filter(Boolean);
  } else if (mv.target === 'foes') targets = foesOf(u);
  else if (mv.target === 'allies') targets = alliesOf(u);
  else if (mv.target === 'self') targets = [u];

  // Laser Bean's Beam: an attack on one enemy hits every enemy at half power.
  let mult = boost;
  // Its Charge Up move makes the next beam full power.
  const beam = !!(P.beam && mv.power && mv.target === 'foe');
  if (beam) {
    targets = foesOf(u);
    if (u.flags.fullBeam) { u.flags.fullBeam = false; log('Full power beam!', 'good'); } else mult *= P.beam;
  }

  const aoe = beam || mv.target === 'foes' || mv.target === 'foe2';
  const single = mv.target === 'foe' && !beam;
  const splash = mv.splash || P.splashAll || 0;

  // One hit, plus its extras (status, butter, splash).
  const strike = (t, power) => {
    const dealt = hit(u, t, power, { ...mv, aoe, noCrit: beam });
    if (dealt > 0) {
      if (mv.status && STATUS[mv.status[0]].bad && chance(mv.status[2])) addStatus(t, mv.status[0], mv.status[1], { src: u, label: mv.label });
      if (P.butter && chance(P.butter)) addStatus(t, 'stun', 1, { src: u, label: 'Buttered' });
      if (splash) for (const o of foesOf(u)) if (o !== t) hit(u, o, power * splash, { aoe: true, pierce: mv.pierce });
    }
    return dealt;
  };

  if (mv.power && mv.target === 'randfoe') {
    for (let h = 0; h < (mv.hits || 1); h++) {
      const t = pick(foesOf(u).filter(x => canTarget(u, x, mv)));
      if (t) strike(t, mv.power * boost);
    }
  }
  for (const t of targets) {
    if (mv.power) {
      for (let h = 0; h < (mv.hits || 1) && t.hp > 0; h++) {
        strike(t, mv.power * mult);
        // Bloomerang's Comeback: each throw bounces on to 2 other enemies
        // (or to every other enemy after Wind Up).
        if (P.ricochet && single) {
          const bounces = u.flags.windup ? 99 : 2;
          for (const o of shuffle(foesOf(u).filter(x => x !== t)).slice(0, bounces)) hit(u, o, mv.power * mult * P.ricochet, { ...mv, aoe: true });
        }
      }
      // Repeater's Double Tap: a second, weaker pea.
      if (P.echo && single && !(mv.hits > 1) && t.hp > 0) strike(t, mv.power * mult * P.echo);
      // Snapdragon's Firebreather: fire scorches one more enemy.
      if (P.scorch && single && mv.fire) {
        const o = pick(foesOf(u).filter(x => x !== t));
        if (o) hit(u, o, mv.power * mult * P.scorch, { ...mv, aoe: true });
      }
    } else if (mv.status && t.hp > 0 && chance(mv.status[2])) {
      addStatus(t, mv.status[0], mv.status[1], { src: u, label: mv.label });
    }
    if (mv.power && mv.status && !STATUS[mv.status[0]].bad) addStatus(t, mv.status[0], mv.status[1]);
    if (mv.cleanse) cleanse(t);
    // Rogue plants have ROGUE_HP times the health, so their heals and
    // shields are worked out from their normal health instead (otherwise
    // a rogue Spikeweed shielding itself could drag a fight on forever).
    if (mv.heal) healUnit(t, t.maxHp / (t.rogue ? ROGUE_HP : 1) * mv.heal * boost, u);
    if (mv.shield) addShield(t, u.maxHp / (u.rogue ? ROGUE_HP : 1) * mv.shield * boost);
    if (mv.revive) revive(t, mv.revive * boost);
  }
  if (mv.power && P.afterAttack) P.afterAttack(u, targets[0] || u, mv);
  if (mv.power && single) u.flags.windup = false;   // Wind Up is used up
  if (mv.self) addStatus(u, mv.self[0], mv.self[1] * boost);
  if (mv.sun) gainSun(mv.sun * boost, u);
  if (mv.special) mv.special(u, targets, boost);
  if (mv.recoil && u.hp > 0) zap(u, u.maxHp * mv.recoil, 'takes recoil');
  if (u.side === 'ally' && B.moveKills >= 3) award('triple');
}

// ---- What you can do on your turn (called from input.js) -----------------------------------------
function playerPickMove(id) {
  if (B?.phase !== 'player') return;
  const u = B.actor;
  if (whyNot(u, id)) return;
  const mv = MOVES[id];
  const t = validTargets(u, mv);
  // No choice needed (or only one choice): use it straight away.
  if (!t || (t.length === 1 && mv.target !== 'ally')) return playerUse(id, t ? t[0] : null);
  B.choice = id;
  render();
}

function playerUse(id, target) {
  const u = B.actor;
  B.phase = 'acting';
  useMove(u, id, target);
  finishTurn(u);
}

function playerTarget(uid) {
  if (B?.phase !== 'player' || !B.choice) return;
  const t = unitById(uid);
  const list = validTargets(B.actor, MOVES[B.choice]);
  if (t && list.includes(t)) playerUse(B.choice, t);
}

function playerWait() {
  if (B?.phase !== 'player') return;
  B.stats.waits++;
  gainSun(WAIT_SUN);
  log(`${B.actor.name} soaks up the sun (+${WAIT_SUN}).`);
  B.phase = 'acting';
  finishTurn(B.actor);
}

// Plant Food doesn't use up the turn: it powers up the plant's next move.
function playerFeed() {
  if (B?.phase !== 'player' || progress.plantFood <= 0 || B.actor.st.fed) return;
  progress.plantFood--;
  saveProgress();
  B.actor.st.fed = 1;
  log(`${B.actor.name} ate Plant Food! Its next move is free and twice as strong.`, 'good');
  sfx.sun();
  render();
}

// ---- Enemy AI --------------------------------------------------------------------------------------
function aiAct(u) {
  if (u.hp <= 0) return;
  const hurt = alliesOf(u).some(a => a.hp < a.maxHp * 0.7);
  const usable = u.moves.filter(id => {
    const mv = MOVES[id];
    if (!mv || u.cd[id]) return false;
    if (mv.heal && mv.target !== 'self' && !hurt) return false;
    if (mv.can && !mv.can(u)) return false;
    if (mv.w === 0) return false;
    if (u.st.silence && !mv.power) return false;   // silenced: plain attacks only
    if (mv.target === 'fallen' && !sideList(u.side).some(x => x.hp <= 0)) return false;
    const t = validTargets(u, mv);
    return !t || t.length > 0;
  });
  if (!usable.length) { log(`${u.name} waits.`); return; }

  // Pick a move: each has a weight (w); bigger weight = picked more often.
  const weights = usable.map(id => MOVES[id].w || (MOVES[id].power ? 1 : 0.6));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  let id = usable[0];
  for (let i = 0; i < usable.length; i++) { r -= weights[i]; if (r <= 0) { id = usable[i]; break; } }
  const mv = MOVES[id];

  // Pick a target.
  let target = null;
  let list = validTargets(u, mv);
  if (list) {
    if (mv.vault) {
      const tall = foesOf(u).find(t => t.data.passive?.blocksVault);
      list = tall ? [tall] : foesOf(u).filter(t => canTarget(u, t, mv));
      if (tall) log(`${tall.name} is too tall to jump over!`, 'good');
    }
    if (mv.target === 'ally') target = list.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    else if (mv.ai === 'weak') target = list.sort((a, b) => a.hp - b.hp)[0];
    else if (mv.ai === 'back') target = list[list.length - 1];
    else target = pick(list);
  }
  useMove(u, id, target);
}

// ---- Winning and losing --------------------------------------------------------------------------
function checkEnd() {
  if (B.over) return true;
  if (B.plants.every(p => p.hp <= 0)) { loseBattle(); return true; }
  if (B.foes.every(f => f.hp <= 0)) {
    if (B.wave < B.enc.waves.length - 1) {
      B.wave++;
      B.queue = [];
      for (const p of B.plants) healUnit(p, p.maxHp * WAVE_HEAL);
      log('The wave is beaten! Your plants catch their breath.', 'good');
      spawnWave();
      render();
      later(startRound, 900);
      return true;
    }
    winBattle();
    return true;
  }
  return false;
}

// Coins and XP for the enemies beaten.
function battleLoot(part) {
  let coins = 0, xp = 0;
  for (const z of B.defeated) {
    const base = z.kind === 'zombie' ? z.data.coins : 25;
    coins += base * (1 + 0.05 * (z.lvl - 1)) * (z.boss ? 2 : 1);
    xp += (6 + 2 * z.lvl) * (z.boss ? 3 : 1);
  }
  const gold = B.plants.reduce((m, p) => m + (p.data.passive?.coinBonus || 0), 0);
  return { coins: Math.round(coins * (1 + gold) * part), xp: Math.round(xp * part) };
}

function shareXp(xp) {
  const ups = [];
  for (const id of ownedIds()) {
    const inTeam = B.plants.some(p => p.id === id);
    const n = giveXp(id, (inTeam ? xp : xp * BENCH_XP) * xpFactor(progress.owned[id].lvl, B.lvl));
    if (n) ups.push(`${PLANTS[id].name} grew to level ${progress.owned[id].lvl}!`);
  }
  return ups;
}

function winBattle() {
  B.over = true;
  B.phase = 'done';
  sfx.win();
  const enc = B.enc;
  const first = B.key && !progress.cleared[B.key];
  const loot = battleLoot(1);
  if (first && enc.reward?.coins) loot.coins += enc.reward.coins;
  progress.coins += loot.coins;
  progress.stats.wins++;
  const notes = shareXp(loot.xp);
  if (B.key) progress.cleared[B.key] = true;
  saveProgress();

  // Achievements.
  award('firstwin');
  const team = B.plants;
  const standing = team.filter(p => p.hp > 0).length;
  if (team.length > 1 && standing === 1) award('laststand');
  if (team.every(p => p.data.cls === 'hearty')) award('nuts');
  if (team.every(p => p.data.cls === 'sunny')) award('sunnyside');
  if (B.key && team.length === 5 && team.every(p => p.data.cls === team[0].data.cls)) award('purebreed');
  if (B.stats.waits >= 5) award('lazy');
  if (progress.stats.chilled >= 25) award('chillout');
  if (progress.stats.devoured >= 10) award('bottomless');
  if (enc.kind === 'secret') award('yeti');
  if (B.g.has('storm') && B.stats.wilted === 0) award('stormchaser');
  if (progress.stats.armorBroken >= 30) award('scrapper');
  if (progress.stats.catapults >= 10) award('dunk');
  if (B.key && enc.kind === 'boss') {
    award(CHAPTERS[B.chapterIdx].bossAch);
    if (B.stats.wilted === 0) award('untouchable');
    progress.reached = Math.min(CHAPTERS.length, Math.max(progress.reached, B.chapterIdx + 2));
  }
  if (first && enc.reward?.plant) unlockPlant(enc.reward.plant);
  saveProgress();
  showResult(true, loot, notes, first ? enc.outro : null);
}

function loseBattle() {
  B.over = true;
  B.phase = 'done';
  sfx.lose();
  // You still learn something from losing: half XP for what you beat.
  const loot = battleLoot(0.5);
  loot.coins = 0;
  const notes = shareXp(loot.xp);
  saveProgress();
  showResult(false, loot, notes, null);
}
