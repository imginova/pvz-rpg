/* =====================================================================
   world.js: the STORY. The five chapters with their overworld maps,
   every battle you can bump into, what Crazy Dave says, the shop and
   the achievements.

   Like data.js, this file only describes things. screens.js draws the
   maps and battle.js runs the fights.

   ---- How to read a map ----
   Each map is a list of text rows. Every character is one tile:
     #  hedge     T  tree     ~  water    H  house    +  gravestone
     M  chimney   %  metal wall           (all of these block you)
     .  grass     :  path     "  flowers  =  bridge   ^  roof   _  floor
     ,  sand      *  snow
     @  where you start       D  Crazy Dave           C  treasure chest
     G  gate to the next chapter (opens after the boss)
     a b c d e    signs (their text is in `signs`)
     anything else is a battle, listed in `enc` by its character.
   Battles block the way until you beat them. Rows don't have to be the
   same length: short rows are filled up with hedge.
   ===================================================================== */

/* A battle (`enc`) has:
     name     shown before the fight
     kind     'zombie' (drawn z), 'key' (gives a plant, drawn Z),
              'rogue' (a rogue plant, drawn R), 'boss' (drawn B),
              'secret' (drawn as a tree!), 'hero' (a mini-boss, drawn S)
     lvl      the level of every enemy in it
     waves    lists of enemies, fought one wave after another.
              'cone' is a zombie id from data.js; 'football!' is a BOSS
              version (BOSS_HP times the health); 'R:chomper' is a
              rogue plant.
     gimmicks extra battle gimmicks (the chapter's own is added too)
     intro    lines said before the fight: [speaker, text]
     reward   { plant: id } and/or { coins: n } for the first win
*/
const CHAPTERS = [
  {
    id: 'lawn', name: 'Front Lawn', gimmick: 'day', lvl: 2, bossAch: 'lawn',
    pool: ['zombie', 'cone', 'flag', 'paper', 'bucket'],
    intro: [
      ['Dave', 'WABBY WABBO! Neighbor! The zombies are coming up the street, and they want your BRAINS.'],
      ['Dave', 'Good thing your plants want to fight. Walk around with the arrow keys or WASD, and bump into a zombie to battle it.'],
      ['Dave', 'Beat every zombie on the lawn, and the big one by the gate will come out to play.'],
    ],
    map: [
      '##############################',
      '#HHHH#..T......"......T....a.#',
      '#HHHH#.D...1.......T.........#',
      '#H@.....::::::::::::::::::...#',
      '#HHHH#..:..T......T....:..2..#',
      '######..:.....###......:.....#',
      '#C...3..:.....#C#...4..:..T..#',
      '#.......:..T..#.#......:.....#',
      '#..T....::::::::::::::R:.....#',
      '#..5...."...T......"...:..B..G',
      '##############################',
    ],
    signs: {
      a: 'SIGN: "Keep off the grass." Somebody crossed out "grass" and wrote "BRAINS".',
    },
    enc: {
      1: { name: 'Lawn Stragglers', kind: 'key', lvl: 1, waves: [['zombie', 'zombie']],
        intro: [['Dave', 'Two slowpokes! Peashooter hits, Wall-nut gets hit, and Sunflower makes the sun you spend on big moves.']],
        reward: { plant: 'cherrybomb' } },
      2: { name: 'Cone Zone', kind: 'key', lvl: 2, waves: [['cone', 'zombie'], ['zombie', 'cone', 'zombie']],
        intro: [['Dave', 'Coneheads! The cone soaks up damage before the zombie does. Hit it until it falls off.']],
        reward: { plant: 'snowpea' } },
      3: { name: 'Flag Day', kind: 'key', lvl: 2, waves: [['flag', 'zombie', 'cone']],
        intro: [['Dave', 'A Flag Zombie makes the others stronger. Knock him out first!']],
        reward: { plant: 'potatomine' } },
      4: { name: 'Paper Chase', kind: 'zombie', lvl: 3, gimmicks: ['graves'], waves: [['paper', 'zombie'], ['paper', 'cone', 'zombie']],
        intro: [['Dave', 'Gravestones! A new zombie climbs out every few rounds. And never rip a Newspaper Zombie\'s paper unless you\'re ready for him.']],
        reward: { coins: 60 } },
      5: { name: 'Bucket Brigade', kind: 'zombie', lvl: 3, waves: [['bucket', 'zombie'], ['cone', 'bucket']],
        intro: [['Dave', 'Buckets are TOUGH. Attacks that pierce armor go right through them.']],
        reward: { coins: 60 } },
      R: { name: 'Rogue Chomper', kind: 'rogue', lvl: 3, waves: [['R:chomper', 'zombie']],
        intro: [['Chomper', 'GRRRRAAAH! *chomp chomp*'], ['Dave', 'That Chomper got so hungry he forgot whose side he\'s on! Beat him and maybe he\'ll calm down.']],
        reward: { plant: 'chomper' } },
      B: { name: 'The Big Game', kind: 'boss', lvl: 4, waves: [['zombie', 'cone', 'flag'], ['football!', 'cone']],
        intro: [['Zombie', 'HUT HUT... BRAAAINS!'], ['Dave', 'The Football Zombie! He\'s the boss of this lawn. Taunt with Wall-nut and keep him busy!']],
        outro: [['Dave', 'TOUCHDOWN! For us! The gate is open. On to the backyard!']],
        reward: { coins: 150 } },
    },
  },
  {
    id: 'night', name: 'Night Backyard', gimmick: 'night', lvl: 5, bossAch: 'night',
    pool: ['zombie', 'cone', 'paper', 'pole', 'door', 'bucket'],
    intro: [
      ['Dave', 'It\'s NIGHT. Less sun falls at night, so every sun counts.'],
      ['Dave', 'But mushrooms LOVE the dark. They hit 30% harder at night. In the daytime they get sleepy.'],
    ],
    map: [
      '##############################',
      '#.....T....+....#...........?#',
      '#.@..D.....+..1.#..+...T.....#',
      '#..::::::::::::::::::::::....#',
      '#..:..+...T.....#....+...:...#',
      '#..:..2.....+...#..3.....:.+.#',
      '#..:........C...#........:...#',
      '#..::::::::::::4:::::::::R...#',
      '#.....+..T..........+....:...#',
      '#..b....+........T.......:.B.G',
      '##############################',
    ],
    signs: {
      b: 'SIGN: "Beware of the dog." The dog is not here. The dog was very smart.',
    },
    enc: {
      1: { name: 'Night Shift', kind: 'key', lvl: 4, waves: [['zombie', 'cone', 'zombie']],
        intro: [['Dave', 'Here we go! I found a Puff-shroom packet behind this zombie. Probably.']],
        reward: { plant: 'puffshroom' } },
      2: { name: 'Grave Danger', kind: 'key', lvl: 4, gimmicks: ['graves'], waves: [['paper', 'paper'], ['pole', 'zombie']],
        intro: [['Dave', 'Pole Vaulters jump right over taunting plants and hit your back row. Tricky!']],
        reward: { plant: 'sunshroom' } },
      3: { name: 'Pea Soup Fog', kind: 'key', lvl: 5, gimmicks: ['fog'], waves: [['pole', 'cone'], ['bucket', 'pole']],
        intro: [['Dave', 'FOG! I can\'t see a thing. You can\'t see their health, and your shots miss sometimes.']],
        reward: { plant: 'fumeshroom' } },
      4: { name: 'Screen Time', kind: 'zombie', lvl: 5, waves: [['door', 'zombie'], ['door', 'cone', 'pole']],
        intro: [['Dave', 'Screen doors block straight shots. Lob something over, or use something that pierces!']],
        reward: { coins: 90 } },
      R: { name: 'Rogue Hypno-shroom', kind: 'rogue', lvl: 5, waves: [['R:hypnoshroom', 'pole', 'zombie']],
        intro: [['Hypno-shroom', 'Look into my eyes... you are getting very... zombie-ish...'], ['Dave', 'It hypnotized ITSELF! Snap it out of it!']],
        reward: { plant: 'hypnoshroom' } },
      '?': { name: 'Something Furry', kind: 'secret', lvl: 6, waves: [['yeti!']],
        intro: [['???', '...a cold wind blows. Something big and white is standing in the corner.'], ['Dave', 'Is that... THE ZOMBIE YETI?! They say it carries a fortune in coins!']],
        reward: { coins: 300 } },
      B: { name: 'Disco Inferno', kind: 'boss', lvl: 6, waves: [['zombie', 'cone', 'paper'], ['dancer!', 'backup', 'backup']],
        intro: [['Zombie', '*funky music starts playing*'], ['Dave', 'The Dancing Zombie! He keeps calling in backup dancers. Hit him, not them, if you can!']],
        outro: [['Dave', 'The music stopped! Grab your swimsuit, we\'re going to the pool.']],
        reward: { coins: 220 } },
    },
  },
  {
    id: 'pool', name: 'The Pool', gimmick: 'pool', lvl: 8, bossAch: 'pool',
    pool: ['snorkel', 'dolphin', 'cone', 'bucket', 'jack', 'door', 'football'],
    intro: [
      ['Dave', 'The POOL! Fire fizzles near water: 25% weaker. But chills last a turn longer.'],
      ['Dave', 'Snorkel Zombies dive underwater every other round. Only lobbed or hit-everyone attacks can reach them then.'],
    ],
    map: [
      '##############################',
      '#..@.D....~~~~~~~~~~~~..c...C#',
      '#.::::::..~~~~~~~~~~~~.......#',
      '#.....1:..~~~~~~~~~~~~...2...#',
      '#.....:::==============:::...#',
      '#..T....:.~~~~~~~~~~~~...:...#',
      '#C......3.~~~~~~~~~~~~...4...#',
      '#.......:.~~~~~~~~~~~~...:...#',
      '#..Q....::=============R::...#',
      '#.........~~~~~~~~~~~~...:.B.G',
      '##############################',
    ],
    signs: {
      c: 'SIGN: "No running. No diving. No zombies." Two out of three isn\'t bad.',
    },
    enc: {
      1: { name: 'Shallow End', kind: 'key', lvl: 6, waves: [['snorkel', 'zombie', 'cone']],
        intro: [['Dave', 'A Snorkel Zombie! Watch for when he dives.']],
        reward: { plant: 'tallnut' } },
      2: { name: 'Flipper Frenzy', kind: 'key', lvl: 7, waves: [['dolphin', 'snorkel'], ['dolphin', 'bucket', 'snorkel']],
        intro: [['Dave', 'Dolphin Riders leap like Pole Vaulters. A Tall-nut is too tall to jump over!']],
        reward: { plant: 'jalapeno' } },
      3: { name: 'Surprise Party', kind: 'zombie', lvl: 7, gimmicks: ['rush'], waves: [['jack', 'cone', 'zombie'], ['jack', 'snorkel']],
        intro: [['Dave', 'Jack-in-the-Box zombies EXPLODE on their third turn. And they\'re all in a hurry today!']],
        reward: { coins: 120 } },
      4: { name: 'Heat Wave', kind: 'zombie', lvl: 7, gimmicks: ['heatwave'], waves: [['football', 'snorkel'], ['door', 'dolphin', 'bucket']],
        intro: [['Dave', 'Phew, it\'s HOT. Fire is stronger, and nothing can be chilled or frozen.']],
        reward: { coins: 120 } },
      R: { name: 'Rogue Spikeweed', kind: 'rogue', lvl: 7, waves: [['R:spikeweed', 'door', 'cone']],
        intro: [['Spikeweed', 'Hssss. Step on me. I dare you.'], ['Dave', 'Spikeweed is guarding the bridge! Careful, hitting it hurts YOU too.']],
        reward: { plant: 'spikeweed' } },
      Q: { name: 'Rogue Ice-shroom', kind: 'rogue', lvl: 8, gimmicks: ['storm'], waves: [['R:iceshroom', 'snorkel', 'snorkel']],
        intro: [['Ice-shroom', 'Chiiiill out...'], ['Dave', 'A storm and an Ice-shroom! Bring something warm.']],
        reward: { plant: 'iceshroom' } },
      B: { name: 'Zamboni Season', kind: 'boss', lvl: 8, waves: [['snorkel', 'dolphin'], ['zomboni!', 'snorkel']],
        intro: [['Zombie', '*VROOOM*'], ['Dave', 'A ZOMBONI! It\'s freezing over my pool! Spikeweed pops its tires, you know.']],
        outro: [['Dave', 'Pool\'s closed for zombies! Next stop: the ROOF.']],
        reward: { coins: 300 } },
    },
  },
  {
    id: 'roof', name: 'The Roof', gimmick: 'roof', lvl: 10, bossAch: 'roof',
    pool: ['bungee', 'catapult', 'jack', 'imp', 'bucket', 'football'],
    intro: [
      ['Dave', 'The ROOF! It\'s slanted, so straight shots are 25% weaker and lobs are 25% stronger.'],
      ['Dave', 'Time for catapult plants! Kernels, cabbages, melons... I love lunch.'],
    ],
    map: [
      '##############################',
      '#^^@^D^^^^^^MM^^^^^^^^^^^^^^C#',
      '#^^:::::::^^MM^^^1^^^^^MM^^^^#',
      '#^^^^^^^^:^^^^^^^^^^^^^MM^^^^#',
      '#^^MM^^^^:::::::::::::::::^^^#',
      '#^^MM^^2^^^^^^^MM^^^^^^^^:^^^#',
      '#^^^^^^^^^^^^^^MM^^3^^^^^:^^^#',
      '#C^^^^^^^^^^^^^^^^^^^^^^^R^^^#',
      '#^^^^^4^^^^MM^^^^^^^^^^^^:^^^#',
      '#^^d^^^^^^^MM^^^^^^^^^^^^:^B^G',
      '##############################',
    ],
    signs: {
      d: 'SIGN: "Satellite dish. Do not touch." It\'s picking up zombie radio. All they play is groaning.',
    },
    enc: {
      1: { name: 'Drop In', kind: 'key', lvl: 8, waves: [['bungee', 'zombie', 'cone']],
        intro: [['Dave', 'Bungee Zombies drop from the sky and steal shields and buffs!']],
        reward: { plant: 'cabbagepult' } },
      2: { name: 'Slam Dunk', kind: 'key', lvl: 9, waves: [['catapult', 'cone'], ['catapult', 'bucket', 'bungee']],
        intro: [['Dave', 'Catapult Zombies throw basketballs at random plants. Hit them hard!']],
        reward: { plant: 'kernelpult' } },
      3: { name: 'Dry Spell', kind: 'key', lvl: 9, gimmicks: ['drought'], waves: [['jack', 'imp', 'imp'], ['bucket', 'jack']],
        intro: [['Dave', 'DROUGHT! No sun falls today. You get 150 and that\'s it.']],
        reward: { plant: 'pumpkin' } },
      4: { name: 'Thunder Roof', kind: 'zombie', lvl: 10, gimmicks: ['storm'], waves: [['football', 'bungee'], ['catapult', 'football', 'imp']],
        intro: [['Dave', 'A thunderstorm! Lightning strikes anyone, plant or zombie.']],
        reward: { coins: 160 } },
      R: { name: 'Rogue Melon-pult', kind: 'rogue', lvl: 10, waves: [['R:melonpult', 'catapult', 'imp']],
        intro: [['Melon-pult', 'THUNK.'], ['Dave', 'A rogue Melon-pult on the roof! Its melons splash everyone. Spread out! Well, you can\'t. Good luck!']],
        reward: { plant: 'melonpult' } },
      B: { name: 'Big Trouble', kind: 'boss', lvl: 11, waves: [['bucket', 'imp', 'bungee'], ['gargantuar!', 'imp']],
        intro: [['Zombie', 'GAAAAARGH!'], ['Dave', 'A GARGANTUAR! He\'s got an Imp on his back. Hit him hard and he\'ll throw it.']],
        outro: [['Dave', 'Timber! I know where they\'re coming from now. Dr. Zomboss\'s secret lair. Let\'s GO!']],
        reward: { coins: 400 } },
    },
  },
  {
    id: 'lair', name: 'Zomboss\'s Lair', gimmick: 'roof', lvl: 12, bossAch: 'zomboss',
    pool: ['digger', 'gargantuar', 'football', 'dancer', 'jack', 'catapult', 'scientist', 'engineer'],
    intro: [
      ['Dave', 'The lair of Dr. Zomboss. It smells like old socks and evil.'],
      ['Dave', 'Watch out for Digger Zombies. They tunnel up behind your team, and straight shots barely touch them.'],
    ],
    map: [
      '##############################',
      '#_@_D_____%%%%%_________e___C#',
      '#_::::::__%___%__1___________#',
      '#_____:___%___%_______%%%%%__#',
      '#__%%_:___%%_%%_______%___%__#',
      '#__%%_::::::::::::::::::2_%__#',
      '#_____________________%___%__#',
      '#_3___%%%%%___R_______%%_%%__#',
      '#_____%_______________:______#',
      '#_____%_C_%___________:___B__G',
      '##############################',
    ],
    signs: {
      e:'SIGN: "Zomboss Industries: Employee of the Month: Zombie." It\'s the same zombie every month.',
    },
    enc: {
      1: { name: 'Underground Lab', kind: 'zombie', lvl: 11, waves: [['digger', 'digger', 'bucket'], ['scientist', 'digger', 'cone']],
        intro: [['Dave', 'Diggers! Lob things at them. And that Scientist heals zombies... unless they\'re ON FIRE.']],
        reward: { coins: 200 } },
      2: { name: 'Assembly Line', kind: 'zombie', lvl: 12, gimmicks: ['conveyor'], waves: [['gargantuar', 'imp'], ['football', 'engineer', 'dancer']],
        intro: [['Dave', 'A conveyor belt! Your plants only get 2 random moves each turn. And an Engineer to fix their armor!']],
        reward: { coins: 200 } },
      3: { name: 'Last Stand', kind: 'zombie', lvl: 12, gimmicks: ['laststand'], waves: [['zomboni', 'catapult', 'jack'], ['bucket', 'football', 'scientist']],
        intro: [['Dave', 'LAST STAND! 400 sun and not one more. Make it count.']],
        reward: { coins: 200 } },
      R: { name: 'Rogue Torchwood', kind: 'rogue', lvl: 12, waves: [['R:torchwood', 'digger', 'door']],
        intro: [['Torchwood', 'The doctor promised me a fireplace...'], ['Dave', 'Torchwood joined Zomboss for a FIREPLACE? Let\'s show him what friends are for.']],
        reward: { plant: 'torchwood' } },
      B: { name: 'Dr. Zomboss', kind: 'boss', lvl: 13, waves: [['football', 'imp', 'cone'], ['zomboss!']],
        intro: [['Zomboss', 'So, the NEIGHBOR has finally come. My Zombot will turn your garden into compost!'], ['Dave', 'That\'s a big robot. Its armor is thick, so pierce it, and watch out when he gets angry!']],
        outro: [['Zomboss', 'Curses! Defeated by... SALAD!'], ['Dave', 'YOU DID IT, NEIGHBOR! The lawn is... wait. WAIT. He jumped into a TIME PORTAL!'],
          ['Penny', 'Greetings, user. I am Penny, Dave\'s time-traveling RV. Temporal readings show Dr. Zomboss is hiding across ALL of history.'],
          ['Dave', 'The gate (G) leads to the Time Rift. Let\'s go get him! And grab some tacos from the past.']],
        reward: { coins: 600 } },
    },
  },
  {
    // The Time Rift: characters from across the whole series.
    id: 'rift', name: 'Time Rift', gimmick: 'day', lvl: 15, bossAch: 'rift',
    pool: ['mummy', 'explorer', 'ra', 'pianist', 'swash', 'hunter', 'wizard', 'king', 'glitter', 'punk', 'raptor', 'jetpack', 'shieldz'],
    intro: [
      ['Penny', 'Arrival confirmed. This area is a temporal mess: Ancient Egypt, the Wild West, Pirate Seas, the Dark Ages, Frostbite Caves, Neon Mixtape Tour, Jurassic Marsh and the Far Future, all in one backyard.'],
      ['Dave', 'Every era has its own zombies. Click them in battle to see how to beat them. Every zombie has a weakness!'],
    ],
    map: [
      '##############################',
      '#.@.D.....#,,,,1,,,#.....2...#',
      '#.::::::..#,,,,,,,,#..:......#',
      '#.....:5..#,,,,:,,,#..:..T...#',
      '#.....::::::::::::::::::.....#',
      '#~~~~~=~~~#****:***#..:...R..#',
      '#.3...=...#****4***#..:......#',
      '#~~~~~=~~~#***:****#..:::::6.#',
      '#.....:::::::::::::::7:......#',
      '#..Q.....8.....9....:....B..f#',
      '##############################',
    ],
    signs: {
      f: 'PENNY: "Warning: this sign exists in 14 time periods at once. Please do not lick it."',
    },
    enc: {
      1: { name: 'Tomb Raiders', kind: 'key', lvl: 13, gimmicks: ['sandstorm'], waves: [['mummy', 'explorer'], ['ra', 'mummy', 'explorer']],
        intro: [['Penny', 'Ancient Egypt. A sandstorm is blowing.'], ['Dave', 'Mummies burn easy, Explorers hate the cold, and that Ra Zombie STEALS SUN. Spend it fast!']],
        reward: { plant: 'bloomerang' } },
      2: { name: 'Saloon Showdown', kind: 'key', lvl: 13, waves: [['pianist', 'zombie', 'cone'], ['pianist', 'bucket', 'pole']],
        intro: [['Penny', 'The Wild West.'], ['Dave', 'A Pianist! His ragtime powers up every zombie. Take him out and the music stops!']],
        reward: { plant: 'laserbean' } },
      3: { name: 'Walk the Plank', kind: 'key', lvl: 14, waves: [['swash', 'swash', 'impcannon']],
        intro: [['Penny', 'Pirate Seas.'], ['Dave', 'Swashbucklers swing over Taunt, and the Imp Cannon backfires on its own crew when it breaks!']],
        reward: { plant: 'snapdragon' } },
      4: { name: 'Cold Snap', kind: 'key', lvl: 14, gimmicks: ['frostwind'], waves: [['hunter', 'hunter', 'cone'], ['hunter', 'bucket', 'explorer']],
        intro: [['Penny', 'Frostbite Caves. Temperature: very no.'], ['Dave', 'Hunters freeze plants solid. Chill them and they can\'t throw!']],
        reward: { plant: 'iceberg' } },
      5: { name: 'Royal Court', kind: 'key', lvl: 15, waves: [['king', 'zombie', 'zombie'], ['wizard', 'king', 'cone']],
        intro: [['Penny', 'The Dark Ages.'], ['Dave', 'The King makes Knights, and the Wizard makes SHEEP. Cleanse your sheep, or beat the Wizard!']],
        reward: { plant: 'infinut' } },
      6: { name: 'Neon Mixtape', kind: 'zombie', lvl: 15, gimmicks: ['neon'], waves: [['glitter', 'punk', 'zombie'], ['glitter', 'punk', 'bucket']],
        intro: [['Penny', 'Neon Mixtape Tour. The music changes every two rounds.'], ['Dave', 'Glitter\'s rainbow blocks single hits, so hit everyone! And lob at the Punks.']],
        reward: { coins: 250 } },
      7: { name: 'Raptor Run', kind: 'zombie', lvl: 15, waves: [['raptor', 'raptor', 'raptor'], ['raptor', 'raptor', 'bucket']],
        intro: [['Penny', 'Jurassic Marsh.'], ['Dave', 'RAPTORS! Super fast, super fragile. Chill them and hit everyone!']],
        reward: { coins: 250 } },
      8: { name: 'Future Shock', kind: 'zombie', lvl: 16, gimmicks: ['storm'], waves: [['jetpack', 'shieldz', 'cone'], ['jetpack', 'jetpack', 'shieldz']],
        intro: [['Penny', 'The Far Future. My home!'], ['Dave', 'Jetpacks dodge straight shots, so lob! And break the Shield Zombie to pop every force field.']],
        reward: { coins: 250 } },
      9: { name: 'Super Brainz', kind: 'hero', lvl: 16, waves: [['punk', 'glitter'], ['brainz!', 'imp']],
        intro: [['Super Brainz', 'Never fear, Super Brainz is here! To eat your brains!'], ['Dave', 'A zombie SUPERHERO? When he starts CHARGING, stun him or brace yourself!']],
        reward: { coins: 300 } },
      R: { name: 'Rogue Coconut Cannon', kind: 'rogue', lvl: 14, waves: [['R:coconut', 'swash', 'swash']],
        intro: [['Coconut Cannon', 'ARRR! Me loyalty be to whoever pays in coconuts!'], ['Dave', 'A pirate plant! It hits REALLY hard on its first shot each wave.']],
        reward: { plant: 'coconut' } },
      Q: { name: 'Rogue E.M.Peach', kind: 'rogue', lvl: 16, waves: [['R:empeach', 'jetpack', 'shieldz']],
        intro: [['E.M.Peach', 'BZZT. SYSTEMS HACKED. PEACH... IS... ZOMBIE.'], ['Penny', 'It has been reprogrammed. Defeat it to reboot it.']],
        reward: { plant: 'empeach' } },
      B: { name: 'Tomorrow-tron', kind: 'boss', lvl: 17, gimmicks: ['timewarp'], waves: [['jetpack', 'shieldz', 'cone'], ['tomorrowtron!']],
        intro: [['Zomboss', 'You followed me through TIME? Then meet my greatest creation: ZOMBOT TOMORROW-TRON!'], ['Penny', 'Warning: time is unstable. Turn order will be random.']],
        outro: [['Zomboss', 'NOOO! Beaten in the past, the present AND the future!'], ['Penny', 'Temporal readings: normal. Dr. Zomboss has nowhere left to hide.'],
          ['Dave', 'That\'s it, neighbor. You saved ALL OF TIME. THE END! (Keep battling, leveling and collecting every plant!)']],
        reward: { coins: 800 } },
    },
  },
];

// ---- Map tiles -----------------------------------------------------------------
// WALLS are the characters you can't walk through.
// TILE_STYLE gives each map character a CSS class (colors in style.css).
const WALLS = new Set(['#', 'T', '~', 'H', '+', 'M', '%']);
const TILE_STYLE = {
  '#': 't-hedge', 'T': 't-tree', '~': 't-water', 'H': 't-house', '+': 't-grave', 'M': 't-chimney', '%': 't-metal',
  '.': 't-grass', ':': 't-path', '"': 't-flower', '=': 't-bridge', '^': 't-roof', '_': 't-floor',
  ',': 't-sand', '*': 't-snow',
};

// ---- Crazy Dave's shop -----------------------------------------------------------
// Plants with unlock.how === 'shop' are sold here, plus Plant Food.
const SHOP_PLANTS = PLANT_ORDER.filter(id => PLANTS[id].unlock.how === 'shop');

/* ---- Achievements ------------------------------------------------------------------
   secret: the name and description stay hidden ("???") until you earn it.
   reward: { coins } or { plant }. The tough ones and a few secret ones
   unlock plants (see the plants' unlock in data.js).
   The checks themselves happen in battle.js and save.js, which call
   award('id') when something is done.
*/
const ACHIEVEMENTS = {
  firstwin:    { name: 'First Sprout', desc: 'Win your first battle.', reward: { coins: 50 } },
  fullteam:    { name: 'Full Bloom', desc: 'Bring 5 plants into a battle.', reward: { coins: 50 } },
  lawn:        { name: 'Lawn Saved', desc: 'Beat the Front Lawn boss.', reward: { coins: 100 } },
  night:       { name: 'Night Owl', desc: 'Beat the Night Backyard boss.', reward: { coins: 150 } },
  pool:        { name: 'Pool Party', desc: 'Beat the Pool boss.', reward: { coins: 200 } },
  roof:        { name: 'Raise the Roof', desc: 'Beat the Roof boss.', reward: { coins: 250 } },
  zomboss:     { name: 'Zomboss Down', desc: 'Defeat Dr. Zomboss.', reward: { coins: 500 } },
  rift:        { name: 'Time Lord', desc: 'Defeat Zombot Tomorrow-tron in the Time Rift.', reward: { coins: 800 } },
  sunhoard:    { name: 'Sun Hoarder', desc: 'Have 500 sun at once in a battle.', reward: { coins: 100 } },
  chillout:    { name: 'Chill Out', desc: 'Chill or freeze 25 enemies.', reward: { coins: 100 } },
  bottomless:  { name: 'Bottomless', desc: 'Devour 10 zombies with Chomper.', reward: { coins: 150 } },
  turncoat:    { name: 'Turncoat', desc: 'Have a hypnotized zombie defeat another zombie.', reward: { coins: 100 } },
  triple:      { name: 'Triple Threat', desc: 'Defeat 3 enemies with one move.', reward: { coins: 150 } },
  laststand:   { name: 'Last Sprout Standing', desc: 'Win a battle with only one plant still standing.', reward: { coins: 150 } },
  grown:       { name: 'Fully Grown', desc: 'Get a plant to level 10.', reward: { coins: 200 } },
  customer:    { name: 'Crazy Customer', desc: 'Spend 1000 coins in Crazy Dave\'s shop.', reward: { coins: 100 } },
  untouchable: { name: 'Untouchable', desc: 'TOUGH: Beat a chapter boss without any plant wilting.', reward: { plant: 'squash' } },
  purebreed:   { name: 'Pure Breed', desc: 'TOUGH: Win a story battle with 5 plants that are all the same class.', reward: { coins: 300 } },
  seedvault:   { name: 'Seed Vault', desc: 'TOUGH: Own 20 different plants.', reward: { plant: 'cactus' } },
  almanac:     { name: 'Almanac Complete', desc: 'TOUGH: Own every plant.', reward: { coins: 1000 } },
  yeti:        { name: 'Abominable', desc: 'Defeat the Zombie Yeti hiding in the backyard.', secret: true, reward: { coins: 200 } },
  nuts:        { name: 'Nuts About Nuts', desc: 'Win a battle where every plant on your team is Hearty.', secret: true, reward: { coins: 200 } },
  sunnyside:   { name: 'Sunny Side Up', desc: 'Win a battle using only Sunny plants.', secret: true, reward: { plant: 'goldbloom' } },
  overkill:    { name: 'Overkill', desc: 'Deal 150 damage with a single hit.', secret: true, reward: { coins: 200 } },
  lazy:        { name: 'Lazy Gardener', desc: 'Soak up sun 5 times in one battle and still win.', secret: true, reward: { coins: 150 } },
  stormchaser: { name: 'Storm Chaser', desc: 'TOUGH: Win a Storm battle without any plant wilting.', reward: { plant: 'lightningreed' } },
  scrapper:    { name: 'Scrap Collector', desc: 'Break 30 pieces of zombie armor.', reward: { plant: 'magnetshroom' } },
  dunk:        { name: 'Rejected!', desc: 'Defeat 10 Catapult Zombies.', reward: { plant: 'umbrellaleaf' } },
};
