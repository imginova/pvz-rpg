/* =====================================================================
   render.js: DRAWS the battle screen from B (see battle.js).

   render() rebuilds the battle's HTML: the top bar, every unit's card,
   the move panel and the message log. It only reads B; it never
   changes the rules. battle.js calls it whenever something happens.
   ===================================================================== */

// An ASCII health bar: bar(30, 60) is "[#####-----]".
function bar(cur, max, width = 10) {
  const n = max > 0 ? Math.round((cur / max) * width) : 0;
  return '[' + '#'.repeat(n) + '-'.repeat(width - n) + ']';
}

// The CSS class that colors a unit.
function unitColor(u) {
  if (u.kind === 'plant') return CLASSES[u.data.cls].color;
  return u.boss ? 'c-boss' : 'c-zombie';
}

// The little labels under a unit: its statuses and special states.
function unitTags(u) {
  const tags = [];
  for (const k in u.st) {
    const n = u.st[k];
    if (k === 'stun') tags.push(`<span class="tag bad">${esc((u.stunLabel || 'Stun').toUpperCase())} ${n}</span>`);
    else if (k === 'shield') tags.push(`<span class="tag good">SHIELD ${n}</span>`);
    else tags.push(`<span class="tag ${STATUS[k].bad ? 'bad' : 'good'}">${STATUS[k].tag}${n < 50 && k !== 'fed' ? ' ' + n : ''}</span>`);
  }
  if (u.flags.under) tags.push('<span class="tag">DIVING</span>');
  if (u.flags.armed) tags.push('<span class="tag good">ARMED</span>');
  if (u.flags.grudge) tags.push('<span class="tag good">GRUDGE</span>');
  if (u.flags.ticks) tags.push(`<span class="tag bad">POP IN ${3 - u.flags.ticks}</span>`);
  if (u.flags.charging) tags.push('<span class="tag bad">CHARGING!</span>');
  if (u.flags.charge) tags.push(`<span class="tag good">CHARGE ${u.flags.charge}/3</span>`);
  if (u.flags.windup) tags.push('<span class="tag good">WOUND UP</span>');
  if (u.flags.fullBeam) tags.push('<span class="tag good">FULL BEAM</span>');
  if (u.flags.metal) tags.push(`<span class="tag good">METAL ${u.flags.metal}</span>`);
  if (u.flags.loaded) tags.push('<span class="tag good">LOADED</span>');
  if (u.flags.icy) tags.push('<span class="tag good">COLD FEET</span>');
  if (u.flags.torchOut) tags.push('<span class="tag">TORCH OUT</span>');
  if (u.flags.stolen) tags.push(`<span class="tag bad">HAS ${u.flags.stolen} SUN</span>`);
  return tags.join('');
}

// Does Fog hide this unit's health? In story mode it hides the zombies'.
// In versus it hides the AI's team when one person plays against it.
function fogHides(u) {
  if (!B.g.has('fog')) return false;
  if (!B.versus) return u.side === 'foe';
  const c = B.versus.ctrl;
  return c[u.side] === 'ai' && c[u.side === 'ally' ? 'foe' : 'ally'] === 'human';
}

function cardHtml(u) {
  const fog = fogHides(u);
  const targets = B.choice ? validTargets(B.actor, MOVES[B.choice]) : null;
  const isTarget = targets && targets.includes(u);
  const cls = ['card', unitColor(u)];
  if (u.hp <= 0) cls.push('down');
  if (B.actor === u) cls.push('active');
  if (isTarget) cls.push('target');
  if (u.rogue) cls.push('rogue');
  if (B.versus) cls.push(u.side === 'ally' ? 'team1' : 'team2');
  if (u.flags.under) cls.push('under');
  if (B.inspect === u.uid) cls.push('inspected');

  const hp = fog ? '[??????????] ???' : `${bar(u.hp, u.maxHp)} ${u.hp}/${u.maxHp}`;
  const armor = u.armorMax > 0 && u.armor > 0
    ? `<span class="armor">${fog ? '[??????] ???' : bar(u.armor, u.armorMax, 6) + ' ' + u.armor} ${esc(ARMOR_NAMES[u.armorKind])}</span>` : '';

  // Pop-up numbers from the last second.
  const now = performance.now();
  const pops = B.fx.filter(f => f.uid === u.uid && now - f.at < 1100).slice(-2)
    .map(f => `<span class="pop ${f.cls}">${esc(f.text)}</span>`).join('');

  return `<button type="button" class="${cls.join(' ')}" data-uid="${u.uid}">
    <pre class="spr">${spriteHtml(spriteKey(u))}</pre>
    <span class="cname">${esc(u.name)} <span class="lv">Lv${u.lvl}</span></span>
    <span class="hp">${hp}</span>${armor}
    <span class="tags">${u.hp > 0 ? unitTags(u) : '<span class="tag bad">WILTED</span>' + (u.flags.rebuildAt ? '<span class="tag good">REBUILDING</span>' : '')}</span>
    <span class="pops">${pops}</span>
  </button>`;
}

function moveButton(u, id, n) {
  const mv = MOVES[id];
  const why = whyNot(u, id);
  const cost = mv.cost ? `&#9728;${mv.cost}` : 'free';
  const bits = [];
  if (mv.power) bits.push(`power ${mv.power}${mv.hits > 1 ? ' x' + mv.hits : ''}`);
  if (mv.cd) bits.push(mv.cd >= ONCE_PER_BATTLE ? 'once per battle' : `cooldown ${mv.cd}`);
  if (mv.pierce) bits.push('pierces');
  if (mv.lob || u.data.passive?.lobAll) bits.push('lobbed');
  return `<button type="button" class="move ${B.choice === id ? 'picked' : ''}" data-move="${id}" ${why ? 'disabled' : ''}>
    <span class="mhead"><kbd>${n}</kbd> ${esc(mv.name)} <span class="cost">${cost}</span></span>
    <span class="mdesc">${esc(mv.desc)}</span>
    <span class="mbits">${why ? `<b>${esc(why)}</b>` : esc(bits.join(' · '))}</span>
  </button>`;
}

// The info box shown when you click a unit outside of choosing a target.
function inspectHtml() {
  const u = B.inspect && unitById(B.inspect);
  if (!u) return '';
  const fog = fogHides(u);
  const p = u.data.passive;
  const about = u.kind === 'plant'
    ? `${CLASSES[u.data.cls].name}. <b>${esc(p.name)}:</b> ${esc(p.desc)}`
    : esc(u.data.desc) + ` <span class="counter"><b>Counter:</b> ${esc(u.data.counter || '')}</span>`
      + (u.boss ? ' <b>Boss:</b> can\'t be devoured or hypnotized, and shrugs off half of all stuns.' : '');
  return `<div class="inspect"><b>${esc(u.name)}</b> Lv${u.lvl} · ATK ${Math.round(u.atk)} · DEF ${u.dfn} · SPD ${Math.round(effSpeed(u))}${fog ? '' : ` · HP ${u.hp}/${u.maxHp}`}<br>${about}</div>`;
}

// In versus, "Player 1 · " in that team's color before a name.
const sideTag = side => B.versus ? `<b class="${side === 'ally' ? 'team1' : 'team2'}">${esc(vsName(side))}</b> · ` : '';

function render() {
  if (!B || currentScreen !== 'battle') return;

  // ---- Top bar ----
  const chips = [...B.g].map(g => `<span class="chip" title="${esc(GIMMICKS[g].desc)}">${esc(GIMMICKS[g].name)}</span>`).join('');
  if (B.versus) setHtml($('bTop'), `
    <span class="bname">Versus <span class="dim">· ${esc(vsName('ally'))} vs ${esc(vsName('foe'))}</span></span>
    <span>Round ${B.round}</span>
    <span class="sun team1">${esc(vsName('ally'))} &#9728; ${B.suns.ally}</span>
    <span class="sun team2">${esc(vsName('foe'))} &#9728; ${B.suns.foe}</span>
    <span class="chips">${chips}</span>
    <button type="button" class="small" id="btnSpeed">${B.speed > 1 ? 'Fast' : 'Normal'} speed</button>
    <button type="button" class="small" id="btnFlee">Quit</button>`);
  else setHtml($('bTop'), `
    <span class="bname">${esc(B.enc.name)} <span class="dim">· ${esc(CHAPTERS[B.chapterIdx].name)}</span></span>
    <span>Wave ${B.wave + 1}/${B.enc.waves.length} · Round ${B.round}</span>
    <span class="sun">&#9728; ${B.suns.ally}</span>
    <span class="chips">${chips}</span>
    <button type="button" class="small" id="btnSpeed">${B.speed > 1 ? 'Fast' : 'Normal'} speed</button>
    <button type="button" class="small" id="btnFlee">Run away</button>`);

  // ---- The field ----
  // In versus each column gets a heading saying whose team it is.
  const head = side => B.versus ? `<div class="vs-head ${side === 'ally' ? 'team1' : 'team2'}">${esc(vsName(side))}</div>` : '';
  setHtml($('bAllies'), head('ally') + B.plants.map(cardHtml).join(''));
  setHtml($('bFoes'), head('foe') + B.foes.map(cardHtml).join(''));

  // ---- The move panel ----
  let panel = '';
  const u = B.actor;
  if (B.phase === 'player' && u) {
    const p = u.data.passive;
    const head = B.choice
      ? `<div class="phead">Choose a target for <b>${esc(MOVES[B.choice].name)}</b> <button type="button" class="small" id="btnCancel">Cancel (Esc)</button></div>`
      : `<div class="phead">${sideTag(u.side)}<b class="${CLASSES[u.data.cls].color}">${esc(u.name)}</b>'s turn <span class="dim">· ${esc(p.name)}: ${esc(p.desc)}</span></div>`;
    const fed = u.st.fed ? '<span class="tag good">FED: next move free, x2</span>' : '';
    const food = foodLeft(u.side);
    // Versus with Plant Food switched off has no Plant Food button at all.
    const feedBtn = B.versus && !B.versus.foodMax ? ''
      : `<button type="button" id="btnFeed" ${food > 0 && !u.st.fed ? '' : 'disabled'}><kbd>F</kbd> Plant Food (${food})</button>`;
    panel = `${head}
      <div class="moves">${u.moves.map((id, i) => moveButton(u, id, i + 1)).join('')}</div>
      <div class="extras">
        <button type="button" id="btnWait"><kbd>5</kbd> Soak up sun (+${WAIT_SUN})</button>
        ${feedBtn}
        ${fed}
        ${B.allowed ? '<span class="tag">CONVEYOR: 2 moves this turn</span>' : ''}
      </div>`;
  } else if (B.phase === 'enemy' && u) {
    panel = `<div class="phead">${sideTag(u.side)}<b class="${unitColor(u)}">${esc(u.name)}</b> is up...</div>`;
  } else {
    panel = '<div class="phead dim">...</div>';
  }
  setHtml($('bPanel'), panel + inspectHtml());

  // ---- The log (newest at the bottom) ----
  setHtml($('bLog'), B.lines.slice(-7).map(l => `<div class="${l.cls}">${esc(l.text)}</div>`).join(''));
}

// Only replace an element's HTML when it actually changed. Rebuilding
// identical HTML would restart animations and lose keyboard focus.
function setHtml(el, html) {
  if (el._html !== html) { el.innerHTML = html; el._html = html; }
}
