/* =====================================================================
   realms.js: the MINI REALMS. Small side worlds that Crazy Dave can take
   you to once the story is over (Tomorrow-tron beaten). Each one has a
   few battles, a boss, and a new plant to win from that boss.

   Asked for on 2026-11-22: "add a few mini realms with new plants", with
   the realms "after story instead of tickets", 2-3 new zombies and a
   boss in each, and characters "from as weird of games as possible but
   still have them be official". They come in batches; this is batch 1.

   A realm is written exactly like a story chapter (see the notes at the
   top of world.js), plus:
     floor   the tile a beaten battle turns into (until the boss is beaten)
     foeScale  how strong its enemies are (instead of ENEMY_STAT_SCALE in
             config.js), so the realms are harder than the story's end
   Realms have no gate (G): you leave by talking to Crazy Dave (D).

   At the bottom, the realms are added to the end of CHAPTERS, so the
   map, battle and save code treats them like chapters. STORY_COUNT
   remembers how many story chapters come first: only those open with
   gates and count towards progress.reached.
   ===================================================================== */

const STORY_COUNT = CHAPTERS.length;

const REALMS = [
  // ---- Movie Studio ----
  {
    id: 'studio', name: 'Movie Studio', gimmick: 'cut', lvl: 11, floor: '_', foeScale: 2.1,
    pool: ['paparazzi', 'actionhero', 'footsoldier', 'glitter', 'punk', 'cone'],
    intro: [
      ['Dave', 'Welcome to the movies! I always wanted to be a star. A STAR, neighbor! Instead I sell plants out of my car.'],
      ['Dave', 'Careful: every few rounds the director yells "CUT!" and everybody\'s buffs AND troubles get wiped. Plan around it!'],
      ['Huge-Gigantacus', 'Mwa-ha-ha! This is MY blockbuster. And you\'re just an extra!'],
    ],
    map: [
      '%%%%%%%%%%%%%%%%%%%%%%%%',
      '%@_D_____%a______%____C%',
      '%____1___%_______%__%%_%',
      '%_____________2__%__%%_%',
      '%%%%%%_%%%%%%%%%%%_____%',
      '%C_____%_____3_________%',
      '%______%_%%%%%%%%%%%%%_%',
      '%________________B_____%',
      '%%%%%%%%%%%%%%%%%%%%%%%%',
    ],
    signs: {
      a: 'SIGN: "QUIET ON SET." Underneath, in crayon: "unless zombies."',
    },
    enc: {
      1: { name: 'Red Carpet', kind: 'zombie', lvl: 11, waves: [['paparazzi', 'paparazzi', 'cone'], ['paparazzi', 'actionhero', 'glitter']], reward: { coins: 120 },
        intro: [['Dave', 'Paparazzi! Their flashes blind your plants. Cleanse it off, or just squash them fast.']] },
      2: { name: 'Stunt Double', kind: 'zombie', lvl: 12, waves: [['actionhero', 'footsoldier', 'punk'], ['actionhero', 'actionhero', 'paparazzi']], reward: { coins: 140 },
        intro: [['Dave', 'The 80s Action Hero fires rockets at EVERYONE. He forgot to buy armor though. Hit him hard!']] },
      3: { name: 'Blockbuster', kind: 'zombie', lvl: 12, gimmicks: ['rush'], waves: [['paparazzi', 'glitter', 'punk'], ['actionhero', 'paparazzi', 'football']], reward: { coins: 160 } },
      B: { name: 'Huge-Gigantacus', kind: 'boss', lvl: 13, waves: [['paparazzi', 'actionhero', 'cone'], ['huge!', 'paparazzi']], reward: { plant: 'kernelcorn', coins: 400 },
        intro: [['Huge-Gigantacus', 'At last, our hero arrives! Let me tell you my ENTIRE evil plan. It starts when I was a small zombie...'], ['Dave', 'He talks a lot. Every third round he stops to give a speech. That\'s your moment!']] },
    },
  },

  // ---- Rome ----
  {
    id: 'rome', name: 'Rome', gimmick: 'arena', lvl: 12, floor: '.', foeScale: 1.9,
    pool: ['gladiantaur', 'valkyrie', 'wizard', 'king', 'bucket', 'cone'],
    intro: [
      ['Dave', 'Rome! Land of togas, columns and... is that a zombie HORSE? Half horse. Half zombie. All rude.'],
      ['Dave', 'This is an arena. The crowd loves a knockout: whoever defeats someone gets Power. That goes for the zombies too!'],
    ],
    map: [
      '########################',
      '#@.D....T....a....."..C#',
      '#..:::::::::::::::::...#',
      '#..:..%%%%%%%%%%%..:...#',
      '#..1..%,,,,,,,,,%..2...#',
      '#..:..%,,,,B,,,,%..:...#',
      '#..:..%%%%,,%%%%%..:...#',
      '#..:::::::,,::::::::.3.#',
      '########################',
    ],
    signs: {
      a: 'SIGN: "TODAY: PLANTS VS. GLADIATORS. Tickets: one brain."',
    },
    enc: {
      1: { name: 'Colosseum Gates', kind: 'zombie', lvl: 12, waves: [['valkyrie', 'bucket', 'cone'], ['gladiantaur', 'valkyrie']], reward: { coins: 140 },
        intro: [['Dave', 'The Valkyrie gets stronger every time one of her friends falls. Take her out first!']] },
      2: { name: 'Chariot Race', kind: 'zombie', lvl: 12, gimmicks: ['rush'], waves: [['gladiantaur', 'gladiantaur', 'imp'], ['gladiantaur', 'valkyrie', 'gladiantaur']], reward: { coins: 160 },
        intro: [['Dave', 'Gladiantaurs gallop right past your tanks! Unless your tank is a Tall-nut. Nobody jumps a Tall-nut.']] },
      3: { name: 'Senate Floor', kind: 'zombie', lvl: 13, waves: [['king', 'wizard', 'valkyrie'], ['valkyrie', 'gladiantaur', 'king']], reward: { coins: 180 } },
      B: { name: 'The Smash', kind: 'boss', lvl: 14, waves: [['valkyrie', 'gladiantaur', 'bucket'], ['smash!', 'valkyrie']], reward: { plant: 'spartichoke', coins: 450 },
        intro: [['The Smash', 'IN THIS CORNER... THE SMAAASH! I will body slam your salad into SOUP!'], ['Dave', 'His slams stun. Bring plants that can\'t be stunned, or Weaken him.']] },
    },
  },

  // ---- Underwater Palace ----
  {
    id: 'palace', name: 'Underwater Palace', gimmick: 'pool', lvl: 13, floor: ',', foeScale: 2.1,
    pool: ['fishyimp', 'octopet', 'snorkel', 'dolphin', 'octo', 'swash'],
    intro: [
      ['Dave', 'Blub blub! We\'re under the sea! I can breathe down here because I\'m wearing my special pot. Don\'t ask.'],
      ['Neptuna', 'Who dares enter my palace? My fishy friends will make plant soup of you!'],
    ],
    map: [
      '~~~~~~~~~~~~~~~~~~~~~~~~',
      '~@,D,,,~~~~~~~,,,,,,,C,~',
      '~,,,,1,,===,,,,,2,,,,,,~',
      '~~~~,,,~~~~~,,,~~~~~~,,~',
      '~a,,,,,~HHHHH~,,,,,,,,,~',
      '~,,~~~~~H,B,H~~~~~3,,,,~',
      '~,,,,,,,,,,,,,,,,,,,,,,~',
      '~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    signs: {
      a: 'SIGN: "NO SWIMMING." Everyone here is swimming.',
    },
    enc: {
      1: { name: 'Coral Gate', kind: 'zombie', lvl: 13, waves: [['fishyimp', 'fishyimp', 'snorkel'], ['octopet', 'fishyimp', 'snorkel']], reward: { coins: 160 },
        intro: [['Dave', 'Fishy Imps dive every other round, the opposite rounds from Snorkels. Lobs and hit-everyone moves reach them all!']] },
      2: { name: 'Ink Well', kind: 'zombie', lvl: 13, gimmicks: ['fog'], waves: [['octopet', 'octopet', 'dolphin'], ['octo', 'octopet', 'fishyimp']], reward: { coins: 180 },
        intro: [['Dave', 'Octo-Pets squirt ink and slip away from single attacks. Hit everyone at once!']] },
      3: { name: 'Sunken Treasury', kind: 'zombie', lvl: 14, waves: [['swash', 'barrel', 'fishyimp'], ['octopet', 'swash', 'dolphin']], reward: { coins: 200 } },
      B: { name: 'Neptuna', kind: 'boss', lvl: 14, waves: [['snorkel', 'fishyimp', 'octopet'], ['neptuna!', 'fishyimp']], reward: { plant: 'waterchestnut', coins: 500 },
        intro: [['Neptuna', 'Hear my song, little plants... and fight for ME!'], ['Dave', 'At half health she sings and hypnotizes a plant. A Ward blocks it!']] },
    },
  },

  // ---- Moon Base ----
  {
    id: 'moon', name: 'Moon Base', gimmick: 'lowgrav', lvl: 14, floor: '_', foeScale: 2.4,
    pool: ['spacecadet', 'cosmicimp', 'jetpack', 'shieldz', 'imp'],
    intro: [
      ['Dave', 'ONE SMALL STEP FOR DAVE! We\'re on the moon, neighbor! It\'s made of rocks. I was told cheese.'],
      ['Dave', 'Low gravity! All of your plants\' attacks float, like lobs: they sail over doors and reach anything.'],
    ],
    map: [
      '%%%%%%%%%%%%%%%%%%%%%%%%',
      '%@_D__%***********%___C%',
      '%_____%**1*****%**%_2__%',
      '%__a______*****%*_____%%',
      '%%%%%_%%****3**%***___%%',
      '%C____%%*******%%%%%_%%%',
      '%______________B_______%',
      '%%%%%%%%%%%%%%%%%%%%%%%%',
    ],
    signs: {
      a: 'SIGN: "MOON BASE Z. Please wipe your feet. Please wipe your brains."',
    },
    enc: {
      1: { name: 'Launch Pad', kind: 'zombie', lvl: 14, waves: [['spacecadet', 'spacecadet', 'cosmicimp'], ['jetpack', 'spacecadet', 'cosmicimp']], reward: { coins: 180 },
        intro: [['Dave', 'Space Cadets ride metal pods. Magnet-shroom LOVES metal pods.']] },
      2: { name: 'Crater Field', kind: 'zombie', lvl: 14, gimmicks: ['storm'], waves: [['cosmicimp', 'cosmicimp', 'cosmicimp', 'shieldz'], ['spacecadet', 'jetpack', 'shieldz']], reward: { coins: 200 },
        intro: [['Dave', 'Cosmic Imps make your plants Brittle: the next hit cracks them for extra damage. Shields and Wards help!']] },
      3: { name: 'Mission Control', kind: 'zombie', lvl: 15, waves: [['shieldz', 'spacecadet', 'cosmicimp'], ['spacecadet', 'spacecadet', 'jetpack', 'cosmicimp']], reward: { coins: 220 } },
      B: { name: 'Gas Giant', kind: 'boss', lvl: 15, waves: [['spacecadet', 'cosmicimp', 'shieldz'], ['gasgiant!', 'cosmicimp', 'cosmicimp']], reward: { plant: 'shamrocket', coins: 550 },
        intro: [['Gas Giant', 'I am... the GAS GIANT. Excuse me.'], ['Dave', 'Phew! Its gas makes your team Weak. Wards and cleansing are your friends.']] },
    },
  },
];

for (const r of REALMS) CHAPTERS.push({ ...r, realm: true });
const isRealm = i => !!CHAPTERS[i]?.realm;
