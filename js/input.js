/* =====================================================================
   input.js: every way the player TALKS to the game. Mouse clicks,
   taps and keys, all in one place.

   Most clicks use "event delegation": instead of putting a listener on
   each of the 30 plant buttons, we put one on their container and look
   at what was clicked (e.target.closest('[data-plant]') finds the
   nearest element with a data-plant attribute).
   ===================================================================== */

// ---- Title screen ----
$('btnPlay').onclick = () => show('world');
$('btnVersusT').onclick = () => show('versus');
$('btnTeamT').onclick = () => openSide('team');
$('btnShopT').onclick = () => openSide('shop');
$('btnAlmanacT').onclick = () => openSide('almanac');
$('btnAchT').onclick = () => openSide('ach');
$('btnHowT').onclick = () => { $('howto').hidden = false; };
$('btnHowClose').onclick = () => { $('howto').hidden = true; };

// ---- Overworld ----
$('btnTeamW').onclick = () => openSide('team');
$('btnAlmanacW').onclick = () => openSide('almanac');
$('btnAchW').onclick = () => openSide('ach');
$('btnHowW').onclick = () => { $('howto').hidden = false; };
$('btnTitleW').onclick = () => show('title');
$('chapterTabs').onclick = e => {
  const b = e.target.closest('[data-chapter]');
  if (b) goChapter(+b.dataset.chapter);
};

// The on-screen arrows. Holding one keeps walking (one step, then a
// step every 140 ms) until you let go.
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let walkTimer = null;
function stopWalk() { clearInterval(walkTimer); clearTimeout(walkTimer); walkTimer = null; }
$('dpad').addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-dir]');
  if (!b) return;
  e.preventDefault();
  const [dx, dy] = DIRS[b.dataset.dir];
  moveWorld(dx, dy);
  stopWalk();
  walkTimer = setTimeout(() => { walkTimer = setInterval(() => moveWorld(dx, dy), 140); }, 300);
});
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('dpad').addEventListener(ev, stopWalk);

// ---- Back buttons on the side screens ----
for (const b of document.querySelectorAll('[data-back]')) b.onclick = goBack;

// ---- Dialog, prebattle and result boxes ----
$('dialog').onclick = e => {
  const c = e.target.closest('[data-choice]');
  if (c) chooseDialog(+c.dataset.choice);
  else advanceDialog();
};
$('prebattle').onclick = e => {
  if (e.target.id === 'btnFight') fight();
  if (e.target.id === 'btnNotYet') closePrebattle();
  if (e.target.id === 'btnEditTeam') { $('prebattle').hidden = true; openSide('team'); }
};
$('result').onclick = e => {
  if (e.target.id === 'btnContinue') leaveBattle();
  if (e.target.id === 'btnRetry') retryBattle();
  if (e.target.id === 'btnRematch') startVersus();
  if (e.target.id === 'btnVsSetup') leaveVersus();
};

// ---- Team screen ----
$('teamSlots').onclick = e => {
  const b = e.target.closest('[data-plant]');
  if (b) { teamSel = b.dataset.plant; renderTeam(); }
};
$('teamFilters').onclick = e => {
  const b = e.target.closest('[data-filter]');
  if (b) { teamFilter = b.dataset.filter; renderTeam(); }
};
$('plantGrid').onclick = e => {
  const b = e.target.closest('[data-plant]');
  if (b) { teamSel = b.dataset.plant; renderTeam(); }
};
$('plantDetail').onclick = e => {
  const eq = e.target.closest('[data-equip]');
  if (eq) {
    const problem = toggleMove(teamSel, eq.dataset.equip);
    if (problem) toast(problem);
    renderTeam();
  }
  if (e.target.id === 'btnTeamToggle') toggleTeam(teamSel);
  if (e.target.id === 'btnTeamUp') teamUp(teamSel);
};

// ---- Shop ----
$('shopList').onclick = e => {
  const b = e.target.closest('[data-buy]');
  if (b && !b.disabled) buy(b.dataset.buy);
};

// ---- Versus setup (versus.js) ----
$('btnVsBack').onclick = () => show('title');
$('vsOpts').onclick = e => {
  const b = e.target.closest('[data-vsmode], [data-vsfood], [data-vsdiff]');
  if (!b) return;
  if (b.dataset.vsmode) vs.mode = b.dataset.vsmode;
  if (b.dataset.vsfood) vs.food = +b.dataset.vsfood;
  if (b.dataset.vsdiff) { const [side, level] = b.dataset.vsdiff.split(':'); vs.diff[side] = level; }
  saveVersus();
  renderVersus();
};
$('vsOpts').onchange = e => {
  if (e.target.id === 'vsGimmick') { vs.gimmick = e.target.value; saveVersus(); renderVersus(); }
};
$('vsTeams').onclick = e => {
  if (e.target.id === 'btnVsFight') return startVersus();
  const random = e.target.closest('[data-vsrandom]');
  if (random) return randomizeTeam(random.dataset.vsrandom);
  const clear = e.target.closest('[data-vsclear]');
  if (clear) { vs.teams[clear.dataset.vsclear] = []; saveVersus(); return renderVersus(); }
  const slot = e.target.closest('[data-vsslot]');
  if (slot) [vs.edit, vsSel] = slot.dataset.vsslot.split(':');
  else {
    // Clicking a team box edits that team and shows its first plant.
    const box = e.target.closest('[data-vsedit]');
    if (box && box.dataset.vsedit !== vs.edit) { vs.edit = box.dataset.vsedit; vsSel = vsTeam(vs.edit)[0] || vsSel; }
  }
  saveVersus();
  renderVersus();
};
$('vsFilters').onclick = e => {
  const b = e.target.closest('[data-vsfilter]');
  if (b) { vsFilter = b.dataset.vsfilter; renderVersus(); }
};
$('vsGrid').onclick = e => {
  const b = e.target.closest('[data-vsplant]');
  if (b) { vsSel = b.dataset.vsplant; renderVersus(); }
};
$('vsDetail').onclick = e => {
  const eq = e.target.closest('[data-vsequip]');
  if (eq) {
    const problem = toggleVsMove(vs.edit, vsSel, eq.dataset.vsequip);
    if (problem) toast(problem);
    renderVersus();
  }
  if (e.target.id === 'btnVsToggle') toggleVsTeam(vs.edit, vsSel);
};

// ---- Almanac ----
$('almTabs').onclick = e => {
  const b = e.target.closest('[data-tab]');
  if (b) { almTab = b.dataset.tab; almSel = almTab === 'zombies' ? 'zombie' : 'peashooter'; renderAlmanac(); }
};
$('almList').onclick = e => {
  const b = e.target.closest('[data-plant], [data-zombie]');
  if (b) { almSel = b.dataset.plant || b.dataset.zombie; renderAlmanac(); }
};

// ---- Battle ----
// pointerdown (not click) on cards, because the cards are redrawn often
// and a click needs the same element under the mouse on press AND release.
for (const id of ['bAllies', 'bFoes']) {
  $(id).addEventListener('pointerdown', e => {
    const card = e.target.closest('[data-uid]');
    if (!card || !B) return;
    const uid = +card.dataset.uid;
    if (B.choice) playerTarget(uid);
    else { B.inspect = B.inspect === uid ? null : uid; render(); }
  });
  // Keyboard users press Enter or Space on a focused card.
  $(id).addEventListener('keydown', e => {
    const card = e.target.closest('[data-uid]');
    if (card && B?.choice && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); playerTarget(+card.dataset.uid); }
  });
}
$('bPanel').onclick = e => {
  const m = e.target.closest('[data-move]');
  if (m && !m.disabled) playerPickMove(m.dataset.move);
  if (e.target.closest('#btnWait')) playerWait();
  if (e.target.closest('#btnFeed')) playerFeed();
  if (e.target.closest('#btnCancel')) { B.choice = null; render(); }
};
$('bTop').onclick = e => {
  if (!B) return;
  if (e.target.id === 'btnSpeed') { B.speed = B.speed > 1 ? 1 : 2.5; render(); }
  if (e.target.id === 'btnFlee' && B.versus) return leaveVersus();   // "Quit" in versus
  if (e.target.id === 'btnFlee') {
    // Running away ends the fight with no rewards (and no penalty).
    B.over = true;
    B = null;
    show('world');
    toast('You ran away. The zombies will still be there.');
  }
};

// ---- Sound button ----
function renderMute() {
  $('btnMute').textContent = muted ? 'Sound off' : 'Sound on';
  $('btnMute').setAttribute('aria-pressed', String(!muted));
}
$('btnMute').onclick = () => { setMuted(!muted); renderMute(); };

// ---- The keyboard ----
// One handler for every key. What a key does depends on what's open.
const WALK_KEYS = {
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
};
let lastStep = 0;

document.addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'm' || k === 'M') { setMuted(!muted); renderMute(); return; }

  // Boxes on top of the screen come first.
  if (!$('howto').hidden) { if (k === 'Escape' || k === 'Enter') $('howto').hidden = true; return; }
  if (!$('dialog').hidden) {
    if (k === 'Enter' || k === ' ') { e.preventDefault(); advanceDialog(); }
    if (/^[1-9]$/.test(k)) chooseDialog(+k - 1);
    if (k === 'Escape' && dlg?.choices) closeDialog(null);
    return;
  }
  if (!$('prebattle').hidden) {
    if (k === 'Enter') { e.preventDefault(); fight(); }
    if (k === 'Escape') closePrebattle();
    return;
  }
  if (!$('result').hidden) {
    if (k === 'Enter') { e.preventDefault(); if (B?.versus) startVersus(); else leaveBattle(); }
    return;
  }

  if (currentScreen === 'world') {
    const dir = WALK_KEYS[k];
    if (dir) {
      e.preventDefault();
      // Holding a key repeats it very fast; walk at most every 90 ms.
      if (performance.now() - lastStep < 90) return;
      lastStep = performance.now();
      moveWorld(...DIRS[dir]);
    }
    return;
  }

  if (currentScreen === 'battle' && B) {
    if (/^[1-4]$/.test(k) && B.phase === 'player') {
      const id = B.actor.moves[+k - 1];
      if (id) playerPickMove(id);
    }
    if (k === '5') playerWait();
    if (k === 'f' || k === 'F') playerFeed();
    if (k === 'Escape' && B.choice) { B.choice = null; render(); }
    return;
  }

  if (['team', 'shop', 'almanac', 'ach'].includes(currentScreen) && k === 'Escape') goBack();
  if (currentScreen === 'versus' && k === 'Escape') show('title');
});
