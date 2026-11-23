/* =====================================================================
   realms.js: the MINI REALMS. Small side worlds that Crazy Dave can take
   you to once the story is over (Tomorrow-tron beaten). Each one has a
   few battles, a boss, and a new plant to win from that boss.

   Asked for on 2026-11-22: "add a few mini realms with new plants", with
   the realms "after story instead of tickets", 2-3 new zombies and a
   boss in each, and characters "from as weird of games as possible but
   still have them be official". They came in three batches (batch 1:
   Movie Studio to Moon Base, batch 2: Fairy Forest to Steam Ages, batch 3:
   Renaissance Age to Modern Day, with the realm achievements in world.js).

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

  // ======== Batch 2 (2026-11-22) ========
  // ---- Fairy Forest ----
  {
    id: 'fairy', name: 'Fairy Forest', gimmick: 'fairy', lvl: 12, floor: '.', foeScale: 2.3,
    pool: ['abracadaver', 'gargologist', 'wizard', 'imp', 'bucket', 'cone'],
    intro: [
      ['Dave', 'Ooh, a fairy forest! Everything sparkles. I think a toadstool just winked at me.'],
      ['Dave', 'Watch out: every few rounds a fairy turns someone into a sheep. Could be a zombie. Could be YOU. Baa.'],
      ['Immorticia', 'Visitors! How delightful. I do love turning plants into livestock.'],
    ],
    map: [
      '########################',
      '#@.D..T"T....a...TT..C.#',
      '#....1..T..T.....T..2..#',
      '#.TT....T..TTT.......T.#',
      '#..T..""""...T..TT.....#',
      '#.....T..3...T...."""..#',
      '#C.TT....T.......T..B..#',
      '########################',
    ],
    signs: {
      a: 'SIGN: "Do not feed the fairies." Somebody has drawn a tiny sheep.',
    },
    enc: {
      1: { name: 'Enchanted Glade', kind: 'zombie', lvl: 12, waves: [['abracadaver', 'imp', 'cone'], ['abracadaver', 'gargologist', 'bucket']], reward: { coins: 140 },
        intro: [['Dave', 'Abracadaver turns plants into sheep! Cleansing or a Ward fixes that.']] },
      2: { name: 'Stone Circle', kind: 'zombie', lvl: 12, waves: [['gargologist', 'bucket', 'imp'], ['gargologist', 'abracadaver', 'football']], reward: { coins: 160 },
        intro: [['Dave', 'The Gargologist makes every zombie Guard. Strip it off, or take her out first.']] },
      3: { name: 'Witch\'s Hut', kind: 'zombie', lvl: 13, gimmicks: ['fog'], waves: [['abracadaver', 'abracadaver', 'wizard'], ['gargologist', 'wizard', 'abracadaver']], reward: { coins: 180 } },
      B: { name: 'Immorticia', kind: 'boss', lvl: 13, waves: [['abracadaver', 'gargologist', 'imp'], ['immorticia!', 'abracadaver', 'gargologist']], reward: { plant: 'rose', coins: 450 },
        intro: [['Immorticia', 'Double, double, plants in trouble!'], ['Dave', 'She flies on a broom, so straight shots miss a lot. Lob at her!']] },
    },
  },

  // ---- Circus ----
  {
    id: 'circus', name: 'Circus', gimmick: 'spotlight', lvl: 13, floor: ',', foeScale: 1.8,
    pool: ['unicornchupa', 'rodeogarg', 'chicken', 'wrangler', 'jack', 'imp'],
    intro: [
      ['Dave', 'LADIES AND GENTLEMEN, PLANTS AND ZOMBIES! Welcome to the greatest show on the lawn!'],
      ['Dave', 'The spotlight jumps around every round. Whoever it lands on gets Power AND has to be attacked. Showbiz!'],
    ],
    map: [
      '########################',
      '#@.D..HHH....a....HHH.C#',
      '#.....H1H.........H2H..#',
      '#..:::::::::::::::::...#',
      '#..:..,,,,,,,,,,,,..:..#',
      '#..:..,,,,,B,,,,,,..:..#',
      '#C.:..,,,,,,,,,,,,..:3.#',
      '#..::::::::::::::::::..#',
      '########################',
    ],
    signs: {
      a: 'SIGN: "TONIGHT: THE AMAZING ZOMBIES. Refunds: no. Brains: yes."',
    },
    enc: {
      1: { name: 'Big Top', kind: 'zombie', lvl: 13, waves: [['unicornchupa', 'jack', 'imp'], ['unicornchupa', 'unicornchupa', 'chicken', 'chicken']], reward: { coins: 160 },
        intro: [['Dave', 'A Unicorn Chupacabra! It steals your sun. And it\'s so sparkly! Squash it anyway.']] },
      2: { name: 'Rodeo Night', kind: 'zombie', lvl: 13, gimmicks: ['night'], waves: [['wrangler', 'chicken', 'chicken'], ['rodeogarg', 'imp']], reward: { coins: 180 },
        intro: [['Dave', 'The Rodeo Gargantuar lassoes your plants. Tall-nut laughs at lassos.']] },
      3: { name: 'Clown Car', kind: 'zombie', lvl: 14, waves: [['jack', 'jack', 'unicornchupa'], ['rodeogarg', 'unicornchupa', 'imp']], reward: { coins: 200 } },
      B: { name: 'Electric Boogaloo', kind: 'boss', lvl: 14, waves: [['unicornchupa', 'jack', 'imp'], ['boogaloo!', 'backup', 'backup']], reward: { plant: 'combustible', coins: 500 },
        intro: [['Electric Boogaloo', 'Hit it! Everybody do the Electric Slide! ...Into your FACE!'], ['Dave', 'While his dancers are up he takes less damage. Clear the dance floor first!']] },
    },
  },

  // ---- Kongfu World ----
  {
    id: 'kongfu', name: 'Kongfu World', gimmick: 'dojo', lvl: 13, floor: '.', foeScale: 2.1,
    pool: ['sumo', 'impmonk', 'minininja', 'imp', 'cone'],
    intro: [
      ['Dave', 'HI-YAH! Kongfu World! I studied kung fu once. For one afternoon. I was very good at bowing.'],
      ['Dave', 'Every few rounds everyone takes a fighting stance: the next attack aimed at them gets hit right back. Time your big moves!'],
      ['Impfinity', 'You face one Impfinity? No. You face... INFINITY!'],
    ],
    map: [
      '########################',
      '#@.D..""....a....""..C.#',
      '#....HHHH.1...HHHH.....#',
      '#....H__H.....H__H..2..#',
      '#....H__H.....H__H.....#',
      '#.3..HH_H.....H_HH.....#',
      '#..........B...........#',
      '########################',
    ],
    signs: {
      a: 'SIGN: "DOJO RULES: 1. Bow. 2. No brains in the dojo. 3. See rule 2."',
    },
    enc: {
      1: { name: 'Temple Steps', kind: 'zombie', lvl: 13, waves: [['impmonk', 'impmonk', 'cone'], ['sumo', 'impmonk', 'minininja']], reward: { coins: 160 },
        intro: [['Dave', 'Imp Monks swat away straight shots! Lob or hit everyone at once.']] },
      2: { name: 'Sumo Ring', kind: 'zombie', lvl: 13, waves: [['sumo', 'imp', 'imp'], ['sumo', 'sumo', 'impmonk']], reward: { coins: 180 },
        intro: [['Dave', 'The Sumo Wrestler shoves your tank right out of its Taunt. Big, slow, and VERY pushy.']] },
      3: { name: 'Shadow Dojo', kind: 'zombie', lvl: 14, gimmicks: ['fog'], waves: [['minininja', 'minininja', 'impmonk'], ['minininja', 'sumo', 'minininja', 'impmonk']], reward: { coins: 200 } },
      B: { name: 'Impfinity', kind: 'boss', lvl: 14, waves: [['impmonk', 'minininja', 'sumo'], ['impfinity!', 'impmonk']], reward: { plant: 'knuckles', coins: 500 },
        intro: [['Impfinity', 'Clone jutsu! ...That\'s a different show. Whatever. CLONES!'], ['Dave', 'Hit-everyone attacks get him and all his clones. Beat him and the clones vanish!']] },
    },
  },

  // ---- Sky City ----
  {
    id: 'sky', name: 'Sky City', gimmick: 'sky', lvl: 14, floor: '_', foeScale: 2.2,
    pool: ['lostpilot', 'hovergoat', 'jetpack', 'balloon', 'imp'],
    intro: [
      ['Dave', 'Sky City! A city in the clouds! Don\'t look down. I looked down. I\'m fine. I\'m FINE.'],
      ['Dave', 'Up here the wind blows lobs off course: straight shots hit harder and lobs hit softer. Peas, assemble!'],
    ],
    map: [
      '~~~~~~~~~~~~~~~~~~~~~~~~',
      '~@_Da_~~~~~~~~~~___C__~~',
      '~__1__=========__2____~~',
      '~_____~~~~~~~~~~______~~',
      '~~~=~~~~~~~~~~~~~~=~~~~~',
      '~___3___~~~~~~~~~___B_~~',
      '~_____C_====_====______~',
      '~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    signs: {
      a: 'SIGN: "MIND THE GAP." The gap is about two miles.',
    },
    enc: {
      1: { name: 'Cloud Dock', kind: 'zombie', lvl: 14, waves: [['lostpilot', 'balloon', 'imp'], ['hovergoat', 'lostpilot', 'balloon']], reward: { coins: 180 },
        intro: [['Dave', 'Lost Pilots dive-bomb your back row. Tall-nut blocks them. So does a really tall hat. Probably.']] },
      2: { name: 'Airship Deck', kind: 'zombie', lvl: 14, gimmicks: ['storm'], waves: [['hovergoat', 'hovergoat', 'jetpack'], ['lostpilot', 'lostpilot', 'hovergoat']], reward: { coins: 200 },
        intro: [['Dave', 'Hover-Goats are robots! E.M.Peach and Spikeweed love robots. In a fighting way.']] },
      3: { name: 'Thunderhead', kind: 'zombie', lvl: 15, waves: [['jetpack', 'lostpilot', 'balloon', 'balloon'], ['hovergoat', 'jetpack', 'lostpilot']], reward: { coins: 220 } },
      B: { name: 'Rustbolt', kind: 'boss', lvl: 15, waves: [['lostpilot', 'hovergoat', 'balloon'], ['rustbolt!', 'hovergoat']], reward: { plant: 'hurrikale', coins: 550 },
        intro: [['Rustbolt', 'Scrap metal! Rocket fists! I built myself out of junk, and I\'m PROUD of it!'], ['Dave', 'His armor is metal. Pierce it or pull it off with Magnet-shroom!']] },
    },
  },

  // ---- Steam Ages ----
  {
    id: 'steam', name: 'Steam Ages', gimmick: 'steam', lvl: 15, floor: '_', foeScale: 1.8,
    pool: ['madchemist', 'cyborg', 'engineer', 'shieldz', 'scientist'],
    intro: [
      ['Dave', 'Steam Ages! Gears! Pipes! Whistles! Everything here runs on steam. Even my sandwich.'],
      ['Dave', 'Every few rounds a steam vent scalds someone and they burn. Burning zombies can\'t be healed, so that might help!'],
    ],
    map: [
      '%%%%%%%%%%%%%%%%%%%%%%%%',
      '%@_D__M___a____M____C__%',
      '%_____M__1_____M___2___%',
      '%__M______MMM______M___%',
      '%__M__%%%%_____%%%%M___%',
      '%_3___%C_______B_%_____%',
      '%_____%%%%%%_%%%%%_____%',
      '%______________________%',
      '%%%%%%%%%%%%%%%%%%%%%%%%',
    ],
    signs: {
      a: 'SIGN: "CAUTION: HOT PIPES." Underneath: "and hot zombies."',
    },
    enc: {
      1: { name: 'Boiler Room', kind: 'zombie', lvl: 15, waves: [['madchemist', 'cyborg', 'cone'], ['cyborg', 'cyborg', 'madchemist']], reward: { coins: 200 },
        intro: [['Dave', 'Beat a Cyborg Zombie and a Vengeful Cyborg pops out. Save something for round two!']] },
      2: { name: 'Gear Works', kind: 'zombie', lvl: 15, waves: [['engineer', 'cyborg', 'bucket'], ['shieldz', 'cyborg', 'madchemist']], reward: { coins: 220 },
        intro: [['Dave', 'The Mad Chemist throws random potions and heals zombies. Set them on fire to stop the healing!']] },
      3: { name: 'Clock Tower', kind: 'zombie', lvl: 15, gimmicks: ['timewarp'], waves: [['madchemist', 'madchemist', 'cyborg'], ['cyborg', 'shieldz', 'engineer', 'madchemist']], reward: { coins: 240 } },
      B: { name: 'Z-Mech', kind: 'boss', lvl: 15, waves: [['cyborg', 'madchemist', 'engineer'], ['zmech!', 'cyborg']], reward: { plant: 'blueberry', coins: 600 },
        intro: [['Z-Mech', 'BEEP BOOP. Just kidding, it\'s an Imp in here. A really angry Imp. In a really big robot.'], ['Dave', 'Break the mech and the Imp keeps fighting, angrier and faster. Finish him quick!']] },
    },
  },

  // ======== Batch 3 (2026-11-22) ========
  // ---- Renaissance Age ----
  {
    id: 'renaissance', name: 'Renaissance Age', gimmick: 'invention', lvl: 13, floor: '_', foeScale: 2.1,
    pool: ['jester', 'mustache', 'madchemist', 'wizard', 'king'],
    intro: [
      ['Dave', 'The Renaissance! Art! Science! Flying machines! I invented something once. It was a sandwich with a sandwich inside.'],
      ['Dave', 'Every few rounds one of da Vinci\'s inventions boosts someone at random. Fingers crossed it\'s one of ours!'],
      ['Professor Brainstorm', 'Ah, test subjects! I mean... welcome!'],
    ],
    map: [
      '%%%%%%%%%%%%%%%%%%%%%%%%',
      '%@_D____H____a____H__C_%',
      '%___1___H_________H____%',
      '%_______HHHHH_HHHHH__2_%',
      '%___""""______""""_____%',
      '%_3_""""__B___""""_____%',
      '%C_____________________%',
      '%%%%%%%%%%%%%%%%%%%%%%%%',
    ],
    signs: {
      a: 'SIGN: "GALLERY. Please do not touch the art. Please do not EAT the art."',
    },
    enc: {
      1: { name: 'Art Gallery', kind: 'zombie', lvl: 13, waves: [['jester', 'jester', 'cone'], ['mustache', 'jester', 'king']], reward: { coins: 160 },
        intro: [['Dave', 'Jesters juggle your straight shots right back at you! Lob at them or hit everyone.']] },
      2: { name: 'Sculpture Garden', kind: 'zombie', lvl: 13, waves: [['mustache', 'mustache', 'imp'], ['jester', 'mustache', 'wizard']], reward: { coins: 180 },
        intro: [['Dave', 'The Mustache Monument barely moves, but it pumps up every zombie. Crack it with Marked or Brittle!']] },
      3: { name: 'Inventor\'s Workshop', kind: 'zombie', lvl: 14, gimmicks: ['storm'], waves: [['madchemist', 'jester', 'jester'], ['mustache', 'madchemist', 'jester']], reward: { coins: 200 } },
      B: { name: 'Professor Brainstorm', kind: 'boss', lvl: 14, waves: [['jester', 'mustache', 'king'], ['brainstorm!', 'jester']], reward: { plant: 'mirrornut', coins: 500 },
        intro: [['Professor Brainstorm', 'Behold my greatest invention: MORE ZOMBIES!'], ['Dave', 'At half health he has a "Eureka!" and heals. Set him on fire first: burning zombies can\'t heal.']] },
    },
  },

  // ---- Big Wave Beach ----
  {
    id: 'beach', name: 'Big Wave Beach', gimmick: 'tide', lvl: 14, floor: ',', foeScale: 1.8,
    pool: ['surfer', 'fisherman', 'snorkel', 'octo', 'dolphin'],
    intro: [
      ['Dave', 'Surf\'s up, neighbor! Sun, sand, and zombies in swim trunks. Mostly zombies.'],
      ['Dave', 'Every few rounds a big wave chills everyone and puts out fires. Fire plants, beware!'],
    ],
    map: [
      '~~~~~~~~~~~~~~~~~~~~~~~~',
      '~@,D,,,,,,a,,,,,,,,,C,,~',
      '~,,,,1,,,,,,,,,,,2,,,,,~',
      '~,,,,,,,,,,,,,,,,,,,,,,~',
      '~~~~~,,~~~~=====~~~~,,~~',
      '~~~~~,,~~~~=~~~=~~~~,,~~',
      '~,3,,,,,~~~=~B~=~~~,,,,~',
      '~,,,,,,,,,,=====,,,,,,,~',
      '~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    signs: {
      a: 'SIGN: "NO LIFEGUARD ON DUTY." The lifeguard is a zombie.',
    },
    enc: {
      1: { name: 'Low Tide', kind: 'zombie', lvl: 14, waves: [['surfer', 'surfer', 'snorkel'], ['fisherman', 'surfer', 'octo']], reward: { coins: 180 },
        intro: [['Dave', 'Surfers ride right past your tanks! Break the board, or bring a Tall-nut.']] },
      2: { name: 'Fishing Pier', kind: 'zombie', lvl: 14, waves: [['fisherman', 'fisherman', 'dolphin'], ['surfer', 'fisherman', 'snorkel', 'snorkel']], reward: { coins: 200 },
        intro: [['Dave', 'Fisherman Zombies hook your weakest plant. A Ward stops the hook!']] },
      3: { name: 'Shark Reef', kind: 'zombie', lvl: 15, gimmicks: ['pool'], waves: [['octo', 'surfer', 'fisherman'], ['dolphin', 'surfer', 'surfer', 'fisherman']], reward: { coins: 220 } },
      B: { name: 'Zombot Sharktronic Sub', kind: 'boss', lvl: 15, waves: [['surfer', 'fisherman', 'snorkel'], ['sharksub!', 'surfer']], reward: { plant: 'guacodile', coins: 550 },
        intro: [['Dr. Zomboss', 'You thought you were safe at the beach? MY SHARK SUB SAYS OTHERWISE!'], ['Dave', 'It dives every other round. Lobs and hit-everyone moves still reach it!']] },
    },
  },

  // ---- Lost City ----
  {
    id: 'lostcity', name: 'Lost City', gimmick: 'goldtiles', lvl: 14, floor: ',', foeScale: 1.8,
    pool: ['excavator', 'parasol', 'explorer', 'mummy', 'imp'],
    intro: [
      ['Dave', 'The Lost City! Gold everywhere! Can I keep some? No? Can I keep a LITTLE?'],
      ['Dave', 'The gold tiles give you extra sun every round, but the zombies run faster to grab the gold too.'],
    ],
    map: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T@.D..T,,,,,,a,,,T...C.T',
      'T.....T,,1,,,,,,,T..2..T',
      'T..:::::::::::::::::...T',
      'T..:..%%%%%%%%%%%..:...T',
      'T.3:..%,,,,B,,,,%..:...T',
      'T..:..%%%%,,%%%%%..:...T',
      'T..:::::::::::::::::...T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    signs: {
      a: 'SIGN: "TREASURE THIS WAY." Another sign underneath: "TRAP THIS WAY."',
    },
    enc: {
      1: { name: 'Temple Entrance', kind: 'zombie', lvl: 14, waves: [['excavator', 'parasol', 'explorer'], ['parasol', 'parasol', 'excavator']], reward: { coins: 180 },
        intro: [['Dave', 'Parasol Zombies block lobs. Straight shots go right under the parasol!']] },
      2: { name: 'Gold Vault', kind: 'zombie', lvl: 14, waves: [['excavator', 'excavator', 'mummy'], ['parasol', 'excavator', 'explorer', 'imp']], reward: { coins: 200 },
        intro: [['Dave', 'Excavators fling dirt at your back plants. Their shovels are metal: Magnet-shroom time!']] },
      3: { name: 'Collapsing Bridge', kind: 'zombie', lvl: 15, gimmicks: ['drought'], waves: [['parasol', 'explorer', 'excavator'], ['pharaoh', 'parasol', 'excavator']], reward: { coins: 220 } },
      B: { name: 'Zombot Aerostatic Gondola', kind: 'boss', lvl: 15, waves: [['excavator', 'parasol', 'explorer'], ['gondola!', 'parasol']], reward: { plant: 'redstinger', coins: 550 },
        intro: [['Dr. Zomboss', 'Behold my airship! I will drop zombies on you from ABOVE!'], ['Dave', 'It flies: lobs never miss it, and Hurrikale blows it away!']] },
    },
  },

  // ---- Modern Day / Zen Garden ----
  {
    id: 'modern', name: 'Modern Day', gimmick: 'zen', lvl: 15, floor: '.', foeScale: 2.1,
    pool: ['peazombie', 'wallnutzombie', 'zombie', 'cone', 'bucket', 'paper'],
    intro: [
      ['Dave', 'Back to the present! And look: my Zen Garden! I\'ve been watering it for YEARS.'],
      ['Dave', 'Uh oh. Somebody mixed zombie DNA with my plants. Peashooter Zombies! Wall-nut Zombies! This is why I don\'t do science.'],
      ['Dave', 'The garden is calm: each round the most hurt fighter on each side heals a little.'],
    ],
    map: [
      '########################',
      '#@.D..HHHH....a....."".#',
      '#.....HHHH..1......""C.#',
      '#..::::::::::::::::::..#',
      '#..:..""..""..""..2:...#',
      '#.3:..........B....:...#',
      '#C.::::::::::::::::::..#',
      '########################',
    ],
    signs: {
      a: 'SIGN: "DAVE\'S ZEN GARDEN. Inner peace: free. Plants: not free."',
    },
    enc: {
      1: { name: 'Zen Garden', kind: 'zombie', lvl: 15, waves: [['peazombie', 'wallnutzombie', 'cone'], ['peazombie', 'peazombie', 'wallnutzombie']], reward: { coins: 200 },
        intro: [['Dave', 'Peashooter Zombies shoot at your back row. Wall-nut Zombies just... sit there being tough. Pierce them!']] },
      2: { name: 'Zombotany', kind: 'zombie', lvl: 15, waves: [['wallnutzombie', 'wallnutzombie', 'peazombie'], ['peazombie', 'wallnutzombie', 'bucket', 'paper']], reward: { coins: 220 } },
      3: { name: 'Modern Lawn', kind: 'zombie', lvl: 15, gimmicks: ['fog'], waves: [['peazombie', 'paper', 'football'], ['wallnutzombie', 'peazombie', 'paper', 'imp']], reward: { coins: 240 } },
      B: { name: 'Treasure Yeti', kind: 'boss', lvl: 15, waves: [['peazombie', 'wallnutzombie', 'bucket'], ['treasureyeti!', 'peazombie']], reward: { plant: 'moonflower', coins: 600 },
        intro: [['Dave', 'A TREASURE YETI! It\'s carrying a fortune! Fire melts its frosty fur. Get it before it gets away!']] },
    },
  },
];

for (const r of REALMS) CHAPTERS.push({ ...r, realm: true });
const isRealm = i => !!CHAPTERS[i]?.realm;
