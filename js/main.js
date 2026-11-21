/* =====================================================================
   main.js: starts the game. Loaded LAST, so everything else exists.

   It also makes window.lawnLegends, a "test hook": a way to look at
   (and poke) the game from the browser's developer console, for
   example lawnLegends.battle shows the current fight. It's harmless to
   leave in.
   ===================================================================== */

window.lawnLegends = {
  get battle() { return B; },
  get progress() { return progress; },
  startBattle, unlockPlant, giveXp, award, saveProgress,
};

function boot() {
  $('titleArt').textContent = TITLE_ART.join('\n');
  renderMute();
  show('title');
}

boot();
