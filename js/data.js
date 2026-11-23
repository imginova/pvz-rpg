/* =====================================================================
   data.js: WHAT exists in the game. Classes, status effects, moves,
   plants, zombies and battle gimmicks.

   This file only DESCRIBES things. The rules that use these
   descriptions live in battle.js. A plant's "passive" (its special
   ability) is a small object of functions called "hooks": battle.js
   calls a hook at the right moment, for example roundStart() at the
   start of every round, or onHurt() whenever the plant takes damage.
   From level 15 a plant also has a second ability, `passive2`, written
   the same way; battle.js merges the two (see withSecond there).

   Helpers the hooks use (hit, healUnit, addStatus, gainSun, log,
   alliesOf, foesOf...) are defined in battle.js. That works because a
   hook only runs during a battle, long after every file has loaded.

   THE "NO STRICT UPGRADES" RULE: every plant has about the same stat
   budget (HP / 8 + attack + defense + speed is about 32 to 40; plants
   with a strong passive sit lower). A plant may be better at one job,
   but it always pays for it somewhere else. Repeater hits more often
   than Peashooter but is slower and has no Steady Aim; Tall-nut is
   tougher than Wall-nut but slower and loses Tough Shell. Keep it that
   way when you add plants.
   ===================================================================== */

// ---- The five classes ---------------------------------------------------
// `color` is the CSS class that paints the plant (see style.css).
const CLASSES = {
  shooter:  { name: 'Shooters', color: 'c-shooter',  desc: 'All-rounders. Steady damage, a bit of everything.' },
  hearty:   { name: 'Hearty',   color: 'c-hearty',   desc: 'Bulky tanks. Soak up hits and protect the team.' },
  sunny:    { name: 'Sunny',    color: 'c-sunny',    desc: 'Support. Make sun, heal and bring plants back.' },
  volatile: { name: 'Volatile', color: 'c-volatile', desc: 'Burst damage. Big explosions, often at a cost.' },
  grower:   { name: 'Growers',  color: 'c-grower',   desc: 'Gimmicks. Tricky plants that need a plan to shine.' },
};
const CLASS_ORDER = ['shooter', 'hearty', 'sunny', 'volatile', 'grower'];

// ---- Status effects -------------------------------------------------------
// Each status lasts a number of the AFFECTED unit's own turns (shield is
// the exception: it's a number of points that soaks up damage).
// `bad` statuses are removed by cleansing moves.
const STATUS = {
  chill:  { tag: 'CHILL',  bad: true,  desc: 'Half speed.' },
  freeze: { tag: 'FROZEN', bad: true,  desc: 'Skips its turn.' },
  stun:   { tag: 'STUN',   bad: true,  desc: 'Skips its turn.' },
  burn:   { tag: 'BURN',   bad: true,  desc: 'Loses 6% max HP each turn.' },
  weak:   { tag: 'WEAK',   bad: true,  desc: 'Deals 30% less damage.' },
  hypno:  { tag: 'HYPNO',  bad: true,  desc: 'Attacks its own side.' },
  sheep:  { tag: 'SHEEP',  bad: true,  desc: 'Turned into a sheep: can\'t act and takes 30% more damage.' },
  invuln: { tag: 'RAINBOW', bad: false, desc: 'Attacks aimed at it alone do nothing. Hit-everyone attacks still work.' },
  marked: { tag: 'MARKED', bad: true,  desc: 'Takes 30% more damage.' },
  brittle:{ tag: 'BRITTLE', bad: true, desc: 'The next hit it takes does 50% more damage, then it wears off.' },
  bounty: { tag: 'BOUNTY', bad: true,  desc: 'Defeat it while it has this for +50 sun.' },
  blind:  { tag: 'BLIND',  bad: true,  desc: 'Its next attack aimed at one target misses.' },
  sleep:  { tag: 'ASLEEP', bad: true,  desc: 'Skips its turns until it\'s hit or wakes up.' },
  silence:{ tag: 'SILENCED', bad: true, desc: 'Can only use plain attacks.' },
  regen:  { tag: 'REGEN',  bad: false, desc: 'Heals 8% of max HP each turn.' },
  counter:{ tag: 'COUNTER', bad: false, desc: 'Hits back the next enemy that attacks it alone.' },
  cover:  { tag: 'COVERED', bad: false, desc: 'A protector takes the attacks aimed at it.' },
  ward:   { tag: 'WARD',   bad: false, desc: 'New bad statuses can\'t stick.' },
  evade:  { tag: 'EVADE',  bad: false, desc: 'Dodges half of the attacks aimed at it alone.' },
  fiery:  { tag: 'FIERY',  bad: false, desc: 'Its attacks are fire and may burn.' },
  power:  { tag: 'POWER',  bad: false, desc: 'Deals 50% more damage.' },
  guard:  { tag: 'GUARD',  bad: false, desc: 'Takes 40% less damage.' },
  taunt:  { tag: 'TAUNT',  bad: false, desc: 'Enemies must attack it.' },
  thorns: { tag: 'THORNS', bad: false, desc: '30% of damage taken bounces back.' },
  fed:    { tag: 'FED',    bad: false, desc: 'Plant Food: next move is free and twice as strong.' },
  shield: { tag: 'SHIELD', bad: false, desc: 'Soaks up damage.' },
};

/* ---- Moves ------------------------------------------------------------------
   Every move, for plants AND zombies, lives in MOVES. The fields:
     name, desc      what the player reads
     cost            sun it costs (zombies never pay sun)
     cd              cooldown: turns before it can be used again
     target          'foe' (one enemy), 'foes' (every enemy), 'foe2' (one
                     enemy and one more next to it), 'randfoe' (each hit
                     picks a random enemy), 'ally', 'allies', 'self',
                     'fallen' (a wilted ally)
     power, hits     damage strength, and how many times it hits
     straight / lob  shot type: Torchwood lights straight shots; lobs fly
                     over Screen Doors and reach dug-in or diving zombies
     pierce          ignores armor (cones, buckets, helmets...)
     fire            a fire attack (melts chill and freeze)
     splash          part of the damage also hits the other enemies
     recoil          part of the user's max HP it costs to use
     status          [name, turns, chance] put on each target it hits
     self            [name, turns] put on the user
     heal            part of the TARGET's max HP healed
     shield          part of the USER's max HP given as a shield
     sun             sun gained
     cleanse         removes bad statuses
     revive          brings a wilted ally back with this part of its HP
     special         a function for anything unusual
     vault           (zombies) ignores taunt and jumps the front line
     ai              (enemies) 'weak' hits the lowest HP, 'back' the last plant
     w               (enemies) how often the AI picks it, default 1
     can             (enemies) a function: the AI only picks the move when it says true
*/
const MOVES = {
  // ======== Family moves ========
  // A few moves are shared, but only by plants of the same family (all the
  // peas, all the nuts, all the mushrooms...), so they always fit the plant.
  // Peas: Peashooter, Repeater, Snow Pea
  pea_volley:  { name: 'Pea Volley', cost: 50, cd: 2, target: 'foes', power: 6, straight: true, desc: 'Peas at every enemy.' },
  pea_aim:     { name: 'Take Aim', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Lines up its shots: Power for 2 turns.' },
  // Pults: Cabbage-pult, Melon-pult, Kernel-pult
  pult_arc:    { name: 'Arc Shot', cost: 50, cd: 2, target: 'foe', power: 16, lob: true, sure: true, desc: 'A high, careful lob that never misses.' },
  // Nuts: Wall-nut, Tall-nut, Infi-nut
  nut_shell:   { name: 'Shell Up', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Shield itself for 25% of its max HP.' },
  nut_wall:    { name: 'Nut Wall', cost: 75, cd: 4, target: 'allies', status: ['guard', 1, 1], desc: 'Stands in front of everyone: every ally Guards for a turn.' },
  // Flowers: Sunflower, Marigold, Gold Bloom
  flower_bloom:  { name: 'Bloom', cost: 75, cd: 3, target: 'allies', heal: 0.15, desc: 'Heal every ally 15%.' },
  flower_revive: { name: 'Second Bloom', cost: 100, cd: 5, target: 'fallen', revive: 0.4, desc: 'Bring a wilted ally back with 40% HP.' },
  // Mushrooms: Puff-shroom, Sun-shroom, Fume-shroom, Hypno-shroom, Ice-shroom
  puff_cloud:  { name: 'Spore Cloud', cost: 25, cd: 2, target: 'foes', power: 4, status: ['weak', 2, 1], desc: 'Weakens every enemy for 2 turns.' },
  // Icy plants: Snow Pea, Ice-shroom, Iceberg Lettuce
  frost_snare: { name: 'Frostbite', cost: 25, cd: 2, target: 'foe', power: 5, vsChilled: 3, status: ['chill', 2, 1], desc: 'Chills an enemy for 2 turns. TRIPLE damage if it\'s already chilled or frozen.' },
  // Fire plants: Jalapeno, Snapdragon, Torchwood
  fire_ignite: { name: 'Ignite', cost: 25, cd: 1, target: 'foe', power: 5, fire: true, status: ['burn', 3, 1], desc: 'Always burns for 3 turns.' },
  // Explosives: Cherry Bomb, Coconut Cannon, Potato Mine
  boom_fuse:   { name: 'Short Fuse', cost: 25, target: 'foe', power: 17, recoil: 0.1, desc: 'Big hit, but costs 10% of its own max HP.' },
  boom_kaboom: { name: 'Kaboom', cost: 100, cd: 4, target: 'foe', power: 26, splash: 0.5, desc: 'Huge hit; half of it splashes the other enemies.' },
  // Far Future plants: Laser Bean, Citron, Infi-nut
  future_overclock: { name: 'Overclock', cost: 75, cd: 4, target: 'allies', status: ['power', 1, 1], desc: 'Boosts everyone\'s power: every ally gets Power for a turn.' },

  // ======== Each plant's own moves ========
  // SHOOTERS
  pea_head:      { name: 'Headshot', cost: 50, cd: 2, target: 'foe', power: 16, straight: true, sure: true, desc: 'A big pea that never misses.' },
  pea_duck:      { name: 'Duck and Shoot', cost: 25, cd: 2, target: 'foe', power: 7, straight: true, self: ['guard', 1], desc: 'Shoot, then duck down: Guard for a turn.' },
  rep_grit: { name: 'Suppressing Fire', cost: 25, cd: 2, target: 'foe', power: 6, straight: true, special: (u, ts) => { for (const t of ts) { addStatus(t, 'weak', 1, { src: u }); addStatus(t, 'chill', 1, { src: u }); } }, desc: 'Pins an enemy down: Weak and chilled for a turn.' },
  rep_rapid:     { name: 'Rapid Fire', cost: 50, cd: 3, target: 'foe', power: 5, hits: 4, straight: true, desc: 'Four peas at one enemy.' },
  snow_icicle:   { name: 'Icicle', cost: 50, cd: 2, target: 'foe', power: 15, straight: true, sure: true, status: ['chill', 1, 1], desc: 'A sharp icicle that never misses and chills.' },
  cab_crisp: { name: 'Cabbage Patch', cost: 25, cd: 2, target: 'ally', heal: 0.15, status: ['power', 1, 1], desc: 'Tosses an ally a fresh leaf: heal 15% and Power for a turn.' },
  cab_slaw:      { name: 'Coleslaw', cost: 50, cd: 2, target: 'foes', power: 6, lob: true, desc: 'Shredded cabbage on every enemy.' },
  cab_salad: { name: 'Salad Bar', cost: 75, cd: 4, target: 'allies', status: ['regen', 3, 1], desc: 'Fresh leaves for everyone: every ally Regenerates (8% a turn) for 3 turns.' },
  cac_bristle:   { name: 'Bristle', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Puffs out its spines: Thorns for 3 turns.' },
  cac_needle:    { name: 'Long Needle', cost: 50, cd: 2, target: 'foe', power: 16, straight: true, sure: true, desc: 'A long needle that never misses.' },
  cac_hug:       { name: 'Prickly Hug', cost: 25, cd: 2, target: 'foe', power: 7, self: ['guard', 1], desc: 'Hugs a zombie (ouch!), then Guards for a turn.' },
  cac_heat: { name: 'Sandstorm Spines', cost: 50, cd: 3, target: 'foes', power: 6, pierce: true, desc: 'Needles on the wind: hits every enemy, piercing armor.' },
  puff_scatter:  { name: 'Scatter Spores', cost: 50, cd: 2, target: 'foes', power: 6, desc: 'Tiny puffs at every enemy.' },
  puff_hide: { name: 'Hide Under Cap', cost: 25, cd: 2, target: 'self', self: ['evade', 2], desc: 'Ducks under its cap: Evade (dodge half of the attacks aimed at it) for 2 turns.' },
  puff_pep: { name: 'Spore Burst', cost: 25, cd: 2, target: 'randfoe', power: 5, hits: 3, desc: 'Three quick puffs at random enemies.' },
  puff_shot:     { name: 'Spore Shot', cost: 50, cd: 2, target: 'foe', power: 16, sure: true, desc: 'A big spore that never misses.' },
  bloom_wind: { name: 'Wind Up', cost: 25, cd: 3, target: 'self', special: u => { u.flags.windup = true; log(`${u.name} winds up a huge throw!`); }, desc: 'Its next attack bounces to EVERY other enemy, not just 2.' },
  bloom_curve:   { name: 'Curveball', cost: 50, cd: 2, target: 'foe', power: 16, sure: true, desc: 'Curves around anything in the way. Never misses.' },
  bloom_catch:   { name: 'Catch', cost: 25, cd: 2, target: 'foe', power: 7, self: ['guard', 1], desc: 'Throws, catches, then Guards for a turn.' },
  bloom_storm:   { name: 'Petal Storm', cost: 50, cd: 2, target: 'foes', power: 6, desc: 'Petals at every enemy.' },
  laser_scope: { name: 'Charge Up', cost: 25, cd: 3, target: 'self', special: u => { u.flags.fullBeam = true; log(`${u.name} charges its beam!`); }, desc: 'Its next attack hits every enemy at FULL power instead of half.' },
  laser_deflect: { name: 'Recalibrate', cost: 25, cd: 4, target: 'self', special: u => { for (const k in u.cd) if (k !== 'laser_deflect') delete u.cd[k]; log(`${u.name} recalibrates: its other moves are ready!`); }, desc: 'Resets the cooldowns of all its other moves.' },
  laser_focus:   { name: 'Focus Beam', cost: 50, cd: 2, target: 'foe', power: 16, sure: true, desc: 'A tight beam that never misses.' },

  // HEARTY
  nut_stare:     { name: 'Big Stare', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'Stares down the zombies: Taunt for 2 turns.' },
  nut_block: { name: 'Block for You', cost: 50, cd: 3, target: 'ally', special: (u, ts) => coverAllies(u, ts, 2), desc: 'For 2 turns, Wall-nut takes every attack aimed at that ally.' },
  tall_thump:    { name: 'Thump', cost: 0, target: 'foe', power: 7, desc: 'A heavy lean onto a zombie.' },
  tall_shade: { name: 'Tall Shadow', cost: 75, cd: 4, target: 'allies', special: (u, ts) => coverAllies(u, ts, 1), desc: 'For a turn, Tall-nut takes every attack aimed at its allies.' },
  pump_grin:     { name: 'Spooky Grin', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'A jack-o\'-lantern grin: Taunt for 2 turns.' },
  pump_vines:    { name: 'Prickly Vines', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Grows prickly vines: Thorns for 3 turns.' },
  pump_hollow: { name: 'Gourd Guard', cost: 50, cd: 3, target: 'allies', shield: 0.1, desc: 'Shields every ally for 10% of Pumpkin\'s max HP.' },
  pump_harvest:  { name: 'Harvest Wall', cost: 75, cd: 4, target: 'allies', status: ['guard', 1, 1], desc: 'A wall of pumpkins: every ally Guards for a turn.' },
  gar_reek:      { name: 'Reek', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'Smells SO bad they can\'t look away: Taunt for 2 turns.' },
  gar_clove: { name: 'Garlic Bulb', cost: 25, cd: 2, target: 'self', special: garlicBulb, desc: 'Heals itself 15% for every enemy that is Weak right now (up to 60%).' },
  gar_bitter:    { name: 'Bitter Taste', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Tastes awful: Thorns for 3 turns.' },
  gar_ward: { name: 'Garlic Ward', cost: 25, cd: 2, target: 'ally', cleanse: true, status: ['ward', 2, 1], desc: 'Cleanse an ally and Ward it: no new bad statuses for 2 turns.' },
  spike_sharpen: { name: 'Sharpen', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Sharpens its spikes: Thorns for 3 turns.' },
  spike_dig: { name: 'Caltrops', cost: 25, cd: 2, target: 'foes', power: 3, pierce: true, status: ['chill', 1, 1], desc: 'Scatters spikes: every enemy takes a piercing poke and is chilled.' },
  spike_trap:    { name: 'Tire Trap', cost: 50, cd: 2, target: 'foe', power: 14, pierce: true, desc: 'A big spike that pierces armor. Pops vehicles!' },
  spike_field:   { name: 'Spike Field', cost: 75, cd: 4, target: 'allies', status: ['thorns', 2, 1], desc: 'Spikes all around the team: every ally gets Thorns for 2 turns.' },
  cit_lock: { name: 'Lock On', cost: 25, cd: 2, target: 'self', self: ['taunt', 1], special: u => addStatus(u, 'power', 2), desc: 'Draws fire like a bounty hunter: Taunt for a turn and Power for 2.' },
  cit_peel: { name: 'Peel Back', cost: 25, cd: 2, target: 'self', shield: 0.25, self: ['guard', 1], desc: 'Closes its peel: a shield of 25% of its max HP, and Guard for a turn.' },
  cit_cover: { name: 'Bounty', cost: 25, cd: 2, target: 'foe', status: ['bounty', 3, 1], desc: 'Puts a bounty on an enemy: defeat it within 3 turns for +50 sun.' },
  infi_lure: { name: 'Hologram Lure', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], special: u => addStatus(u, 'regen', 2), desc: 'A flashy hologram: Taunt for 2 turns while it repairs itself (Regen).' },
  infi_project:  { name: 'Project Shield', cost: 50, cd: 2, target: 'ally', shield: 0.3, desc: 'Projects a shield onto an ally: 30% of Infi-nut\'s max HP.' },

  // SUNNY
  sun_glow:      { name: 'Warm Glow', cost: 25, target: 'ally', heal: 0.25, desc: 'Heal an ally 25%.' },
  sun_smile: { name: 'Pep Talk', cost: 25, cd: 3, target: 'ally', special: pepTalk, desc: 'All of another ally\'s moves are ready again, and it gets Power for a turn.' },
  ss_glow: { name: 'Spore Glow', cost: 25, cd: 1, target: 'ally', status: ['regen', 3, 1], desc: 'An ally Regenerates (8% a turn) for 3 turns.' },
  ss_moon:       { name: 'Moon Sun', cost: 0, cd: 3, target: 'self', sun: 35, desc: 'Makes sun even in the dark: +35 sun.' },
  ss_dawn:       { name: 'Dawn Spores', cost: 100, cd: 5, target: 'fallen', revive: 0.4, desc: 'Spores that wake a wilted ally: back with 40% HP.' },
  mari_coin:     { name: 'Lucky Coin', cost: 0, cd: 3, target: 'self', sun: 35, desc: 'Finds a lucky gold coin: +35 sun.' },
  mari_polish: { name: 'Golden Hour', cost: 75, cd: 4, target: 'ally', special: (u, ts) => haste(u, ts[0]), desc: 'Another ally takes an extra turn right after this one.' },
  gold_glint: { name: 'Golden Glint', cost: 25, target: 'ally', heal: 0.2, shield: 0.1, desc: 'Heal an ally 20% and give it a small golden shield.' },
  gold_gleam: { name: 'Gleam', cost: 25, cd: 2, target: 'foe', status: ['blind', 2, 1], desc: 'A blinding flash: the enemy\'s next aimed attack misses.' },
  aloe_gel:      { name: 'Cooling Gel', cost: 75, cd: 3, target: 'allies', heal: 0.15, desc: 'Gel for everyone: heal every ally 15%.' },
  aloe_rub:      { name: 'Soothing Rub', cost: 25, cd: 2, target: 'ally', cleanse: true, status: ['power', 1, 1], desc: 'Cleanse an ally and give it Power for a turn.' },
  aloe_regrow:   { name: 'Regrow', cost: 100, cd: 5, target: 'fallen', revive: 0.4, desc: 'Aloe heals anything: a wilted ally comes back with 40% HP.' },
  aloe_dew: { name: 'Sap Share', cost: 0, cd: 3, target: 'ally', special: sapShare, desc: 'Gives 20% of Aloe\'s own HP to another ally (Soothing makes it 30% more).' },
  bean_shine: { name: 'Bean Shine', cost: 25, cd: 1, target: 'ally', heal: 0.15, special: u => healUnit(u, u.maxHp * 0.15, u), desc: 'Heal an ally AND itself 15%.' },
  bean_sprout:   { name: 'Sun Sprout', cost: 0, cd: 3, target: 'self', sun: 35, desc: 'Sprouts a little sun: +35 sun.' },
  bean_huddle:   { name: 'Sunny Huddle', cost: 75, cd: 3, target: 'allies', heal: 0.15, desc: 'A warm huddle: heal every ally 15%.' },
  bean_skin:     { name: 'Tough Skin', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Shield itself for 25% of its max HP.' },

  // VOLATILE
  cherry_double: { name: 'Double Trouble', cost: 50, cd: 2, target: 'foe', power: 9, hits: 2, fire: true, desc: 'Both cherries pop on one enemy.' },
  cherry_temper: { name: 'Hot Temper', cost: 50, cd: 3, target: 'self', self: ['power', 3], special: u => addStatus(u, 'burn', 2), desc: 'Power for 3 turns, but its fuse burns it.' },
  jal_spicy:     { name: 'Extra Spicy', cost: 50, cd: 3, target: 'self', self: ['power', 3], special: u => addStatus(u, 'burn', 2), desc: 'Power for 3 turns, but it burns itself.' },
  jal_kick: { name: 'Flare Up', cost: 50, cd: 2, target: 'self', special: flareUp, desc: 'Every burning enemy flares up for 14 power.' },
  jal_wave:      { name: 'Heat Wave', cost: 50, cd: 2, target: 'foes', power: 8, fire: true, desc: 'Hot air at every enemy.' },
  sq_belly:      { name: 'Belly Flop', cost: 50, cd: 2, target: 'foes', power: 8, desc: 'Flops on the whole crowd: hits every enemy.' },
  sq_glare: { name: 'Hmm...', cost: 25, cd: 2, target: 'foe', power: 10, execute: 3, desc: 'Sizes up an enemy, then SQUASH: triple damage if it\'s below 40% HP.' },
  sq_slam:       { name: 'Body Slam', cost: 75, cd: 3, target: 'foe', power: 20, status: ['stun', 1, 0.5], desc: 'A huge slam. 50% chance to stun.' },
  sq_bounce:     { name: 'Bounce', cost: 25, cd: 1, target: 'foe2', power: 11, desc: 'Squashes an enemy, then bounces onto a second one.' },
  mel_rind:      { name: 'Thick Rind', cost: 25, cd: 2, target: 'self', shield: 0.2, desc: 'Hides behind its rind: a shield of 20% of its max HP.' },
  mel_smash:     { name: 'Watermelon Smash', cost: 100, cd: 4, target: 'foe', power: 26, splash: 0.5, desc: 'The biggest melon. Half of it splashes the other enemies.' },
  mel_juice:     { name: 'Sticky Juice', cost: 50, cd: 2, target: 'foes', power: 6, status: ['chill', 1, 0.5], desc: 'Hits every enemy; 50% chance each to chill.' },
  fume_blast:    { name: 'Fume Blast', cost: 25, cd: 1, target: 'foe', power: 14, desc: 'A strong blast of fumes.' },
  fume_breath: { name: 'Corrode', cost: 25, cd: 2, target: 'foe', power: 4, status: ['marked', 3, 1], desc: 'Corroding fumes: the enemy takes 30% more damage for 3 turns.' },
  fume_storm:    { name: 'Stink Storm', cost: 100, cd: 4, target: 'foes', power: 8, status: ['marked', 2, 1], special: u => { for (const f of foesOf(u)) addStatus(f, 'weak', 2, { src: u }); }, desc: 'Hits every enemy, and every enemy is Weak AND Marked (takes 30% more) for 2 turns.' },
  bonk_hay:      { name: 'Haymaker', cost: 50, cd: 2, target: 'foe', power: 20, desc: 'One huge punch.' },
  bonk_pump:     { name: 'Pump Up', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Gets pumped: Power for 2 turns.' },
  bonk_combo:    { name: 'Combo', cost: 75, cd: 3, target: 'foe', power: 6, hits: 4, desc: 'A four-punch combo.' },
  bonk_rope: { name: 'Rope-a-dope', cost: 25, cd: 2, target: 'self', self: ['counter', 2], desc: 'Leans back: the next enemy that swings at it gets punched back (12 power).' },
  snap_roar:     { name: 'Dragon Roar', cost: 25, cd: 2, target: 'foes', status: ['weak', 1, 1], desc: 'A scary roar: every enemy is Weak for a turn.' },
  snap_bite:     { name: 'Dragon Bite', cost: 25, cd: 1, target: 'foe', power: 15, desc: 'A big chomp.' },
  snap_stoke: { name: 'Stoke the Flames', cost: 25, cd: 2, target: 'self', special: stoke, desc: 'Every burning enemy burns 2 turns longer.' },
  coco_broadside:{ name: 'Broadside', cost: 50, cd: 2, target: 'foes', power: 8, desc: 'A cannon volley at every enemy.' },
  coco_reload:   { name: 'Reload', cost: 25, cd: 3, target: 'self', special: u => { u.flags.loaded = true; log(`${u.name} is loaded again!`); }, desc: 'Loads a fresh coconut: its next attack does double damage.' },

  // GROWERS
  chomp_burp:    { name: 'Burp', cost: 25, cd: 2, target: 'self', heal: 0.2, cleanse: true, desc: 'A big burp: heal itself 20% and cleanse.' },
  chomp_drool:   { name: 'Drool', cost: 25, cd: 1, target: 'foe', power: 4, status: ['weak', 2, 1], desc: 'Slimy drool makes an enemy Weak for 2 turns.' },
  chomp_snap:    { name: 'Snap Jaws', cost: 50, cd: 3, target: 'foe', status: ['stun', 1, 1], desc: 'Snaps its jaws shut on an enemy: stun for a turn.' },
  chomp_lunge: { name: 'Gobble', cost: 25, cd: 1, target: 'foe', power: 12, lifesteal: 0.5, desc: 'A big bite that heals Chomper for half the damage.' },
  hyp_trance: { name: 'Lullaby', cost: 50, cd: 3, target: 'foe', status: ['sleep', 3, 1], desc: 'Puts an enemy to sleep for up to 3 turns. Hitting it wakes it up.' },
  hyp_dazzle:    { name: 'Dazzle', cost: 50, cd: 2, target: 'foes', power: 5, status: ['weak', 1, 0.4], desc: 'Rainbow sparkles at every enemy; 40% chance each to Weaken.' },
  hyp_calm: { name: 'Confuse', cost: 25, cd: 2, target: 'foe', status: ['hypno', 1, 0.5], desc: '50% chance the enemy attacks its own side next turn (not bosses).' },
  ice_shiver:    { name: 'Shiver', cost: 50, cd: 2, target: 'foes', power: 5, status: ['chill', 1, 0.4], desc: 'A cold wave at every enemy; 40% chance each to chill.' },
  ice_pack: { name: 'Cryo Sleep', cost: 0, cd: 4, target: 'self', heal: 0.4, special: u => addStatus(u, 'freeze', 1), desc: 'Freezes itself solid: heal 40%, but skip its next turn.' },
  torch_bark: { name: 'Kindling', cost: 25, cd: 2, target: 'ally', status: ['fiery', 2, 1], desc: 'Lights an ally up: for 2 turns its attacks are fire and may burn.' },
  torch_smoke:   { name: 'Smoke Screen', cost: 50, cd: 2, target: 'foes', power: 5, status: ['weak', 1, 0.4], desc: 'Smoke at every enemy; 40% chance each to Weaken.' },
  torch_flare:   { name: 'Flare', cost: 50, cd: 2, target: 'foe', power: 14, fire: true, desc: 'A burst of flame.' },
  ker_husk:      { name: 'Husk Up', cost: 25, cd: 2, target: 'self', shield: 0.2, desc: 'Wraps up in its husk: a shield of 20% of its max HP.' },
  ker_pop:       { name: 'Popcorn', cost: 50, cd: 2, target: 'foes', power: 5, lob: true, status: ['weak', 1, 0.4], desc: 'Popcorn on every enemy; 40% chance each to Weaken.' },
  ker_slick:     { name: 'Butter Slick', cost: 50, cd: 3, target: 'foes', power: 3, lob: true, status: ['chill', 1, 1], desc: 'Slippery butter everywhere: every enemy is chilled.' },
  pm_pop:        { name: 'Pop Up', cost: 0, target: 'foe', power: 9, desc: 'Pops out of the dirt for a quick hit.' },
  pm_dirt:       { name: 'Kick Up Dirt', cost: 50, cd: 2, target: 'foes', power: 5, status: ['weak', 1, 0.4], desc: 'Dirt at every enemy; 40% chance each to Weaken.' },
  pm_burrow:     { name: 'Burrow', cost: 25, cd: 2, target: 'self', shield: 0.2, special: u => addStatus(u, 'guard', 1), desc: 'Digs down: a small shield and Guard for a turn.' },
  berg_slide:    { name: 'Ice Slide', cost: 50, cd: 2, target: 'foes', power: 4, status: ['chill', 1, 1], desc: 'Slippery ice under every enemy: all chilled.' },
  berg_crunch:   { name: 'Crunch', cost: 25, cd: 1, target: 'foe', power: 13, desc: 'A crunchy leaf slap.' },
  berg_chill: { name: 'Brain Freeze', cost: 25, cd: 2, target: 'foe', special: (u, ts) => { for (const t of ts) { dispel(t); addStatus(t, 'chill', 1, { src: u }); } }, desc: 'Strips an enemy\'s buffs (shield, Power, Guard...) and chills it.' },
  emp_short:     { name: 'Short Circuit', cost: 50, cd: 3, target: 'foe', status: ['stun', 1, 1], desc: 'Fries an enemy\'s nerves: stun for a turn.' },
  emp_static:    { name: 'Static Field', cost: 25, cd: 1, target: 'foe', power: 4, status: ['weak', 2, 1], desc: 'Static makes an enemy Weak for 2 turns.' },
  emp_overload:  { name: 'Overload', cost: 25, cd: 1, target: 'foe', power: 14, desc: 'A big zap.' },
  emp_recharge: { name: 'Disable', cost: 25, cd: 3, target: 'foe', status: ['silence', 2, 1], desc: 'Fries its circuits: the enemy can only use plain attacks for 2 turns.' },

  // NEW PLANTS (unlocked by achievements)
  lr_zap:      { name: 'Zap', cost: 0, target: 'foe', power: 8, special: (u, ts, b) => arc(u, ts[0], 8 * b, 1), desc: 'A zap that arcs to one more enemy for half damage.' },
  lr_static:   { name: 'Static Build', cost: 25, cd: 2, target: 'self', special: u => { u.flags.charge = Math.min(3, (u.flags.charge || 0) + 2); log(`${u.name} builds up static!`); }, desc: 'Builds 2 charges (see Overcharge).' },
  lr_storm:    { name: 'Thunderstorm', cost: 75, cd: 3, target: 'randfoe', power: 5, hits: 6, desc: 'Six bolts at random enemies.' },
  lr_chain:    { name: 'Chain Lightning', cost: 50, cd: 2, target: 'foe', power: 12, special: (u, ts, b) => arc(u, ts[0], 12 * b, 2), desc: 'Hits an enemy, then arcs to 2 more for half damage.' },
  lr_clap:     { name: 'Thunderclap', cost: 50, cd: 3, target: 'foes', power: 4, status: ['stun', 1, 0.25], label: 'Shocked', desc: 'Hits every enemy; 25% chance each to stun.' },
  lr_jump:     { name: 'Jumpstart', cost: 75, cd: 5, target: 'ally', special: jumpstart, desc: 'Charges another ally up like Plant Food: its next move is free and twice as strong.' },
  mag_junk:    { name: 'Junk Toss', cost: 0, target: 'foe', power: 8, lob: true, desc: 'Throws scrap. Stronger for every piece of metal it has pulled this battle.' },
  mag_pull:    { name: 'Magnet Pull', cost: 25, cd: 2, target: 'foe', special: magnetPull, desc: 'Rips ALL metal armor off an enemy (buckets, helmets, doors...). Robot bosses only lose half.' },
  mag_scrap:   { name: 'Scrap Shield', cost: 25, cd: 2, target: 'self', special: u => addShield(u, u.maxHp * (0.2 + 0.05 * Math.min(6, u.flags.metal || 0))), desc: 'A shield of scrap: 20% of its max HP, +5% per piece of metal pulled.' },
  mag_flip:    { name: 'Polarity Flip', cost: 50, cd: 3, target: 'foes', special: (u, ts) => { for (const t of ts) dispel(t); log('Every enemy loses its buffs!', 'good'); }, desc: 'Strips the buffs (shields, Power, Guard...) from every enemy.' },
  mag_attract: { name: 'Attract', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], special: u => { for (const f of foesOf(u)) ripMetal(u, f, f.armorMax * 0.1); }, desc: 'Pulls everything in: Taunt for 2 turns and tugs a little metal off every enemy.' },
  um_slap:     { name: 'Leaf Slap', cost: 0, target: 'foe', power: 7, desc: 'A slap with a big leaf.' },
  um_open:     { name: 'Open Umbrella', cost: 50, cd: 3, target: 'allies', status: ['evade', 1, 1], desc: 'Shelters the team: every ally Evades for a turn.' },
  um_rain:     { name: 'Raincoat', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Shield itself for 25% of its max HP.' },
  um_bounce:   { name: 'Bounce Back', cost: 25, cd: 2, target: 'self', self: ['counter', 2], desc: 'The next enemy that attacks it gets bounced back (12 power).' },
  um_shade:    { name: 'Shade', cost: 25, cd: 1, target: 'ally', status: ['regen', 3, 1], desc: 'Cool shade: an ally Regenerates (8% a turn) for 3 turns.' },
  um_pour:     { name: 'Downpour', cost: 75, cd: 4, target: 'foes', power: 4, status: ['chill', 1, 1], special: u => { for (const a of alliesOf(u)) delete a.st.burn; log('The rain puts out every burning plant!', 'good'); }, desc: 'Rain on everyone: every enemy is chilled and every ally stops burning.' },

  // ======== Level 10 moves: each plant's big finisher, or the move that ties its kit together ========
  pea_gatling:   { name: 'Gatling Burst', cost: 100, cd: 4, target: 'foe', power: 6, hits: 6, straight: true, desc: 'Six peas in a row at one enemy.' },
  rep_rampage:   { name: 'Pea Rampage', cost: 100, cd: 5, target: 'randfoe', power: 7, hits: 8, straight: true, desc: 'Eight angry peas at random enemies.' },
  snow_zero:     { name: 'Absolute Zero', cost: 100, cd: 5, target: 'foes', power: 8, straight: true, status: ['freeze', 1, 1], desc: 'Freezes every enemy solid.' },
  cab_head:      { name: 'Head of Lettuce', cost: 100, cd: 4, target: 'foe', power: 30, lob: true, status: ['weak', 2, 1], desc: 'One enormous lettuce. The enemy is Weak for 2 turns.' },
  cac_sniper:    { name: 'Long Range Spine', cost: 100, cd: 4, target: 'foe', power: 40, pierce: true, sure: true, desc: 'One huge needle that pierces armor and never misses.' },
  puff_army:     { name: 'Puff Army', cost: 75, cd: 4, target: 'randfoe', power: 5, hits: 8, desc: 'A swarm of eight puffs at random enemies.' },
  bloom_tornado: { name: 'Bloom Tornado', cost: 100, cd: 4, target: 'foes', power: 9, hits: 2, desc: 'Spinning petals hit every enemy twice.' },
  laser_ray:     { name: 'Death Ray', cost: 100, cd: 5, target: 'foe', power: 30, pierce: true, desc: 'A huge piercing beam (Beam spreads it to every enemy).' },
  lr_superstorm: { name: 'Superstorm', cost: 100, cd: 5, target: 'foes', power: 8, status: ['stun', 1, 0.4], label: 'Shocked', special: u => { u.flags.charge = 3; log(`${u.name} is fully charged!`, 'good'); }, desc: 'Hits every enemy (40% to stun each), then it is fully charged.' },
  tall_tower:    { name: 'Tall-nut Tower', cost: 100, cd: 5, target: 'allies', special: (u, ts) => { coverAllies(u, ts, 2); addStatus(u, 'guard', 2); }, desc: 'For 2 turns Tall-nut takes every attack aimed at its allies, and Guards.' },
  pump_lantern:  { name: 'Jack-o\'-Lantern', cost: 100, cd: 5, target: 'foes', status: ['blind', 2, 1], special: u => addStatus(u, 'taunt', 2), desc: 'A spooky glow: every enemy is blinded and Pumpkin Taunts for 2 turns.' },
  gar_gas:       { name: 'Garlic Gas', cost: 100, cd: 5, target: 'foes', status: ['weak', 3, 1], special: u => addStatus(u, 'taunt', 2), desc: 'Every enemy is Weak for 3 turns and has to attack Garlic for 2.' },
  spike_rock:    { name: 'Spikerock', cost: 100, cd: 99, target: 'self', shield: 0.5, self: ['thorns', 99], desc: 'Upgrades to Spikerock for the rest of the battle: a big shield and Thorns that never wear off. Once per battle.' },
  cit_overload:  { name: 'Plasma Overload', cost: 100, cd: 4, target: 'foe', power: 32, special: u => addStatus(u, 'stun', 1, { label: 'Cooling down' }), desc: 'A massive plasma ball, then it cools down for a turn.' },
  infi_infinite: { name: 'Infinite Projection', cost: 100, cd: 5, target: 'allies', shield: 0.15, status: ['regen', 2, 1], desc: 'Every ally gets a hologram shield (15% of Infi-nut\'s max HP) and Regen.' },
  um_fort:       { name: 'Umbrella Fort', cost: 100, cd: 5, target: 'allies', status: ['guard', 2, 1], desc: 'Every ally Guards for 2 turns.' },
  sun_flare:     { name: 'Solar Flare', cost: 0, cd: 5, target: 'self', special: solarFlare, desc: 'Spends ALL your sun: every enemy takes 1 power per 10 sun spent.' },
  ss_fullmoon:   { name: 'Full Moon', cost: 50, cd: 5, target: 'allies', sun: 60, status: ['regen', 2, 1], desc: '+60 sun, and every ally Regenerates for 2 turns.' },
  mari_age:      { name: 'Golden Age', cost: 100, cd: 6, target: 'self', special: goldenAge, desc: 'Every other ally takes an extra turn right after this one.' },
  aloe_bath:     { name: 'Aloe Bath', cost: 100, cd: 5, target: 'allies', heal: 0.35, cleanse: true, desc: 'Heal every ally 35% and cleanse them.' },
  gold_reburst:  { name: 'Second Burst', cost: 0, cd: 99, target: 'self', sun: 100, desc: 'Bursts with gold again: +100 sun. Once per battle.' },
  bean_fortress: { name: 'Sunny Fortress', cost: 50, cd: 5, target: 'self', sun: 50, self: ['taunt', 2], special: u => addStatus(u, 'guard', 2), desc: '+50 sun, then Taunt and Guard for 2 turns: every hit it takes makes even more sun.' },
  cherry_kamikaze: { name: 'Kamikaze Kaboom', cost: 50, target: 'foes', power: 22, special: kamikaze, desc: 'Blows itself up: hits every enemy for 22, then wilts (and Last Blast goes off too).' },
  jal_inferno:   { name: 'Inferno Row', cost: 100, cd: 5, target: 'foes', power: 16, fire: true, status: ['burn', 3, 1], desc: 'Burns every enemy for 3 turns.' },
  sq_giant:      { name: 'Giant Squash', cost: 100, cd: 4, target: 'foe', power: 40, pierce: true, execute: 2, desc: 'The biggest squish. Pierces armor; double damage below 40% HP.' },
  mel_winter:    { name: 'Winter Melon', cost: 100, cd: 4, target: 'foe', power: 20, special: u => { for (const f of foesOf(u)) addStatus(f, 'chill', 2, { src: u }); }, desc: 'A frozen melon: big splash, and every enemy is chilled for 2 turns.' },
  fume_gloom:    { name: 'Gloom Cloud', cost: 100, cd: 4, target: 'foes', power: 7, hits: 3, desc: 'Gloomy fumes hit every enemy three times.' },
  bonk_flurry:   { name: 'Final Flurry', cost: 100, cd: 4, target: 'foe', power: 5, hits: 8, desc: 'Eight punches at one enemy.' },
  snap_storm:    { name: 'Dragonstorm', cost: 100, cd: 5, target: 'foes', power: 10, fire: true, status: ['burn', 4, 1], desc: 'Every enemy burns for 4 turns.' },
  coco_full:     { name: 'Full Broadside', cost: 100, cd: 4, target: 'foe', power: 22, splash: 0.3, pre: u => { u.flags.loaded = true; }, desc: 'Loads and fires at once: a double-damage shot with a big splash.' },
  chomp_mega:    { name: 'Mega Chomp', cost: 100, cd: 5, target: 'foe', special: megaChomp, desc: 'Swallows ANY enemy whole, no matter its HP (bosses take a huge bite instead). Then it chews.' },
  hyp_mass:      { name: 'Mass Hypnosis', cost: 100, cd: 5, target: 'foes', status: ['hypno', 2, 0.5], desc: 'Each enemy has a 50% chance to fight for you for 2 turns (not bosses).' },
  ice_shatter:   { name: 'Shatter', cost: 75, cd: 4, target: 'self', special: shatter, desc: 'Every chilled or frozen enemy shatters for 20 power.' },
  torch_lane:    { name: 'Torch Lane', cost: 100, cd: 5, target: 'allies', status: ['fiery', 3, 1], special: u => { for (const a of alliesOf(u)) addStatus(a, 'power', 1); }, desc: 'Every ally is Fiery for 3 turns and gets Power for a turn.' },
  ker_cob:       { name: 'Cob Cannon', cost: 100, cd: 5, target: 'foe', power: 30, splash: 0.5, status: ['stun', 1, 1], label: 'Buttered', desc: 'A giant cob: big splash, and the target is buttered.' },
  pm_field:      { name: 'Mine Field', cost: 75, cd: 5, target: 'foes', power: 12, pierce: true, special: u => { u.flags.armed = true; }, desc: 'Mines under every enemy (piercing), and it re-arms itself.' },
  berg_glacier:  { name: 'Glacier', cost: 100, cd: 5, target: 'self', special: glacier, desc: 'Every chilled enemy freezes solid; every other enemy is chilled for 2 turns.' },
  emp_blackout:  { name: 'Total Blackout', cost: 100, cd: 5, target: 'foes', status: ['silence', 2, 1], special: u => { for (const f of foesOf(u)) if (f.data.vehicle) addStatus(f, 'stun', 2, { src: u, label: 'Shorted' }); }, desc: 'Every enemy is silenced for 2 turns; machines are stunned too.' },
  mag_storm:     { name: 'Magnetic Storm', cost: 100, cd: 5, target: 'self', special: u => { for (const f of foesOf(u)) ripMetal(u, f, f.boss ? Math.ceil(f.armor / 2) : f.armor); }, desc: 'Rips the metal armor off every enemy (robot bosses lose half).' },

  // ======== Level 13 moves: a second big move for every plant (2026-11-22, when the max level went to 15) ========
  pea_tracer:     { name: 'Tracer Pea', cost: 50, cd: 3, target: 'foe', power: 10, straight: true, status: ['marked', 2, 1], desc: 'A glowing pea: the enemy is Marked (takes 30% more damage) for 2 turns.' },
  rep_cross:      { name: 'Crossfire', cost: 50, cd: 2, target: 'foe2', power: 11, straight: true, desc: 'Two streams of peas: hits an enemy and one more.' },
  snow_hail:      { name: 'Hailstorm', cost: 75, cd: 3, target: 'randfoe', power: 6, hits: 4, straight: true, status: ['chill', 1, 1], desc: 'Four icy peas at random enemies; each one chills.' },
  cab_stuffed:    { name: 'Stuffed Cabbage', cost: 75, cd: 3, target: 'foe', power: 18, special: u => { const h = mostHurt(u); if (h) healUnit(h, h.maxHp * 0.15, u); }, desc: 'A big lob, and the most hurt ally eats the leftovers: heal 15%.' },
  cac_bloom:      { name: 'Desert Bloom', cost: 50, cd: 4, target: 'self', heal: 0.25, self: ['thorns', 3], desc: 'Blooms a flower: heal itself 25% and get Thorns for 3 turns.' },
  puff_sleep:     { name: 'Sleepy Spores', cost: 50, cd: 3, target: 'foes', power: 3, status: ['sleep', 2, 0.3], desc: 'Drowsy spores at every enemy; 30% chance each to fall asleep for 2 turns.' },
  wn_explode:     { name: 'Explode-o-nut', cost: 100, cd: 4, target: 'foes', power: 12, useDef: true, fire: true, desc: 'A red-hot nut that blows up on every enemy. DEFENSE-based.' },
  tn_timber:      { name: 'Timber!', cost: 75, cd: 4, target: 'foes', power: 10, useDef: true, status: ['stun', 1, 0.3], label: 'Flattened', desc: 'Falls across the whole crowd (DEFENSE-based); 30% chance each to stun.' },
  pump_pie:       { name: 'Pumpkin Pie', cost: 50, cd: 3, target: 'ally', heal: 0.15, status: ['regen', 2, 1], desc: 'Bakes an ally a pie: heal 15% and Regenerate for 2 turns.' },
  gar_bomb:       { name: 'Clove Bomb', cost: 50, cd: 3, target: 'foes', power: 6, vsWeak: 2, desc: 'Garlic cloves at every enemy: DOUBLE damage to Weak enemies.' },
  spk_wall:       { name: 'Thorn Wall', cost: 50, cd: 3, target: 'ally', status: ['thorns', 2, 1], special: (u, ts) => { if (ts[0]) addStatus(ts[0], 'guard', 1); }, desc: 'Grows spikes around an ally: Thorns for 2 turns, and it Guards for a turn.' },
  sun_twin:       { name: 'Twin Sunflower', cost: 50, cd: ONCE_PER_BATTLE, target: 'self', special: u => { u.flags.twin = true; log(`${u.name} grows a second head!`, 'good'); }, desc: 'Grows a second head: Sunny Disposition makes 20 sun a round for the rest of the battle. Once per battle.' },
  ss_beam:        { name: 'Moonbeam', cost: 25, cd: 2, target: 'ally', heal: 0.25, special: (u, ts, boost) => { if (B.g.has('night') && ts[0]) healUnit(ts[0], ts[0].maxHp * 0.15 * boost, u); }, desc: 'Heal an ally 25% (40% at Night).' },
  mari_rush:      { name: 'Gold Rush', cost: 50, cd: 3, target: 'foes', power: 6, special: (u, ts) => gainSun(5 * ts.length, u), desc: 'Coins rain on every enemy: +5 sun for each one hit.' },
  aloe_wrap:      { name: 'Aloe Wrap', cost: 50, cd: 3, target: 'ally', heal: 0.2, status: ['ward', 2, 1], desc: 'Wraps an ally in gel: heal 20% and Ward it (no new bad statuses) for 2 turns.' },
  cherry_sparkler: { name: 'Sparkler', cost: 25, cd: 2, target: 'foes', power: 4, fire: true, status: ['burn', 2, 0.3], desc: 'Fizzy sparks at every enemy; 30% chance each to burn.' },
  jal_ghost:      { name: 'Ghost Pepper', cost: 50, cd: 3, target: 'foe', power: 10, fire: true, status: ['burn', 3, 1], special: (u, ts) => { if (ts[0]?.hp > 0) addStatus(ts[0], 'weak', 2, { src: u }); }, desc: 'The hottest pepper there is: burns for 3 turns and makes the enemy Weak for 2.' },
  sq_mighty:      { name: 'Mighty Leap', cost: 25, cd: 2, target: 'foe', power: 13, vault: true, sure: true, desc: 'Leaps over everyone onto any enemy: ignores Taunt and never misses.' },
  mel_mortar:     { name: 'Melon Mortar', cost: 75, cd: 3, target: 'randfoe', power: 9, hits: 3, desc: 'Three melons at random enemies.' },
  fume_choke:     { name: 'Choking Fumes', cost: 50, cd: 3, target: 'foe2', power: 10, status: ['silence', 1, 1], desc: 'Hits an enemy and one more; both are Silenced for a turn.' },
  bonk_kick:      { name: 'Spinning Kick', cost: 50, cd: 3, target: 'foes', power: 8, desc: 'A spinning kick that hits every enemy.' },
  chomp_seconds:  { name: 'Second Helping', cost: 25, cd: 4, target: 'self', self: ['power', 1], special: u => { delete u.cd.chomp_devour; }, desc: 'Still hungry: Devour is ready again, and Power for a turn.' },
  hyp_mirror:     { name: 'Mirror Swirl', cost: 50, cd: 3, target: 'self', special: u => { u.flags.mirror = true; }, desc: 'Swirly mirror eyes: the next enemy that hits it is hypnotized for 2 turns (not bosses).' },
  ice_grip:       { name: 'Winter\'s Grip', cost: 75, cd: 4, target: 'foe', status: ['freeze', 2, 1], desc: 'Freezes an enemy solid for 2 turns (3 with Permafrost).' },
  torch_wild:     { name: 'Wildfire', cost: 75, cd: 3, target: 'foes', power: 8, fire: true, status: ['burn', 2, 0.4], desc: 'Fire spreads to every enemy; 40% chance each to burn.' },
  kern_pop:       { name: 'Pop Pop Pop', cost: 50, cd: 2, target: 'randfoe', power: 5, hits: 3, desc: 'Three popping kernels at random enemies.' },
  pm_mash:        { name: 'Mashed Potato', cost: 75, cd: 4, target: 'foes', power: 10, pierce: true, status: ['stun', 1, 0.3], label: 'Mashed', desc: 'Blows up under the whole crowd (pierces armor); 30% chance each to stun.' },
  bloom_return:   { name: 'Return to Sender', cost: 25, cd: 3, target: 'self', self: ['counter', 2], desc: 'Ready to catch: the next enemy that attacks it alone gets hit back.' },
  laser_scorch:   { name: 'Scorching Beam', cost: 50, cd: 2, target: 'foe', power: 14, fire: true, status: ['burn', 2, 0.3], desc: 'A burning beam (Beam spreads it); 30% chance to burn each enemy it hits.' },
  cit_hunter:     { name: 'Bounty Hunter', cost: 50, cd: 3, target: 'foe', power: 16, special: (u, ts) => { if (ts[0] && ts[0].hp <= 0) { gainSun(25, u); log('Bounty claimed! +25 sun.', 'good'); } }, desc: 'A hunter\'s shot: +25 sun if it defeats the enemy.' },
  inf_decoy:      { name: 'Holo Decoy', cost: 50, cd: 3, target: 'ally', status: ['evade', 2, 1], desc: 'Projects a decoy next to an ally: it Evades for 2 turns.' },
  gold_ray:       { name: 'Golden Ray', cost: 50, cd: 3, target: 'foes', power: 6, status: ['blind', 2, 0.3], desc: 'A ray of gold at every enemy; 30% chance each to blind.' },
  bean_stalk:     { name: 'Beanstalk', cost: 50, cd: 4, target: 'allies', heal: 0.1, special: (u, ts) => gainSun(5 * ts.length, u), desc: 'Grows a beanstalk: heal every ally 10% and +5 sun for each one.' },
  snap_tail:      { name: 'Tail Swipe', cost: 50, cd: 3, target: 'foe2', power: 12, status: ['stun', 1, 0.3], label: 'Swiped', desc: 'Swipes an enemy and one more; 30% chance each to stun.' },
  coco_grape:     { name: 'Grapeshot', cost: 50, cd: 3, target: 'foes', power: 6, hits: 2, desc: 'A spray of shot: hits every enemy twice.' },
  ice_avalanche:  { name: 'Avalanche', cost: 75, cd: 4, target: 'foes', power: 10, vsChilled: 2, desc: 'Snow buries every enemy: DOUBLE damage to chilled or frozen ones.' },
  emp_brown:      { name: 'Brownout', cost: 50, cd: 3, target: 'foes', power: 4, status: ['weak', 2, 1], special: (u, ts) => { for (const t of ts) if (t.hp > 0 && t.data.vehicle) addStatus(t, 'silence', 2, { src: u }); }, desc: 'Dims everything: every enemy is Weak for 2 turns, and machines are Silenced too.' },
  lr_rod:         { name: 'Lightning Rod', cost: 25, cd: 3, target: 'self', self: ['taunt', 2], special: u => { u.flags.rod = true; }, desc: 'Draws the storm: Taunt for 2 turns, and every hit it takes adds a charge.' },
  mag_recycle:    { name: 'Recycle', cost: 25, cd: 3, target: 'self', special: (u, ts, boost) => healUnit(u, u.maxHp * Math.min(0.4, 0.1 + 0.05 * (u.flags.metal || 0)) * boost, u), desc: 'Turns scrap into food: heal 10%, +5% for each piece of metal pulled this battle (up to 40%).' },
  umb_rain:       { name: 'Rain Dance', cost: 75, cd: 4, target: 'allies', status: ['regen', 2, 1], special: (u, ts) => { for (const t of ts) delete t.st.burn; }, desc: 'Cool rain: every ally stops burning and Regenerates for 2 turns.' },

  // ======== Realm plants (Part 2, batch 1: 2026-11-22) ========
  // Kernel Corn (Plants vs. Zombies: Garden Warfare)
  kc_cob:       { name: 'Cob Buster', cost: 0, target: 'foe', power: 6, hits: 2, straight: true, desc: 'Two quick corn shots.' },
  kc_hop:       { name: 'Husk Hop', cost: 25, cd: 3, target: 'self', self: ['evade', 2], desc: 'Hops out of the way: Evade for 2 turns.' },
  kc_butter:    { name: 'Butter Blast', cost: 50, cd: 3, target: 'foe', power: 8, status: ['stun', 1, 1], label: 'Buttered', desc: 'A blast of butter: always butters (stuns) for a turn.' },
  kc_spray:     { name: 'Corn Spray', cost: 50, cd: 2, target: 'randfoe', power: 5, hits: 4, straight: true, desc: 'Four corn shots at random enemies.' },
  kc_grenade:   { name: 'Kernel Grenade', cost: 50, cd: 3, target: 'foes', power: 7, desc: 'A grenade full of kernels: hits every enemy.' },
  kc_salute:    { name: 'Commando Salute', cost: 50, cd: 4, target: 'allies', status: ['power', 1, 1], desc: 'Rallies the squad: every ally gets Power for a turn.' },
  kc_shuck:     { name: 'Shuck Shot', cost: 100, cd: 5, target: 'foes', power: 14, pierce: true, desc: 'Calls in an airstrike: hits every enemy and pierces armor.' },
  kc_lock:      { name: 'Lock and Load', cost: 25, cd: 3, target: 'self', self: ['power', 2], special: u => { u.flags.barrage = 2; }, desc: 'Power for 2 turns, and its next attack sets off a Butter Barrage.' },
  // Spartichoke (Plants vs. Zombies 2 and Heroes)
  sp_jab:       { name: 'Spike Jab', cost: 0, target: 'foe', power: 9, desc: 'A thorny jab.' },
  sp_shield:    { name: 'Leaf Shield', cost: 25, cd: 2, target: 'self', self: ['guard', 2], desc: 'Raises its leaf shield: Guard for 2 turns.' },
  sp_spear:     { name: 'Spear Throw', cost: 25, cd: 1, target: 'foe', power: 13, sure: true, desc: 'A thrown spear that never misses.' },
  sp_charge:    { name: 'Spartan Charge', cost: 50, cd: 2, target: 'foe', power: 18, desc: 'A shield-first charge.' },
  sp_sparta:    { name: 'This Is Sparta!', cost: 50, cd: 3, target: 'self', self: ['taunt', 2], special: u => addStatus(u, 'power', 2), desc: 'A battle cry: Taunt and Power for 2 turns.' },
  sp_phalanx:   { name: 'Phalanx', cost: 75, cd: 4, target: 'allies', status: ['guard', 1, 1], desc: 'Shields up, side by side: every ally Guards for a turn.' },
  sp_kick:      { name: 'Spartan Kick', cost: 100, cd: 4, target: 'foe', power: 30, status: ['stun', 1, 0.5], label: 'Kicked', desc: 'A mighty kick: 50% chance to stun.' },
  sp_volley:    { name: 'Spear Volley', cost: 75, cd: 3, target: 'foes', power: 9, pierce: true, desc: 'Spears rain on every enemy, piercing armor.' },
  // Water Chestnut (Plants vs. Zombies Heroes)
  wc_bonk:      { name: 'Shell Bonk', cost: 0, target: 'foe', power: 8, desc: 'A hard-shelled bonk.' },
  wc_bob:       { name: 'Bob Up', cost: 25, cd: 2, target: 'self', shield: 0.2, cleanse: true, desc: 'Bobs to the surface: a shield of 20% of its max HP, and it cleanses itself.' },
  wc_splash:    { name: 'Splash', cost: 25, cd: 2, target: 'foes', power: 4, status: ['chill', 1, 0.5], desc: 'Splashes every enemy; 50% chance each to chill.' },
  wc_cover:     { name: 'Take Cover', cost: 50, cd: 3, target: 'ally', special: (u, ts) => coverAllies(u, ts, 2), desc: 'For 2 turns, Water Chestnut takes every attack aimed at that ally.' },
  wc_tide:      { name: 'Tide Pool', cost: 75, cd: 4, target: 'allies', status: ['regen', 2, 1], desc: 'A cool tide pool: every ally Regenerates for 2 turns.' },
  wc_whirl:     { name: 'Whirlpool', cost: 50, cd: 3, target: 'foe', power: 12, status: ['stun', 1, 0.5], label: 'Spun', desc: 'Spins an enemy around: 50% chance to stun.' },
  wc_tsunami:   { name: 'Tsunami', cost: 100, cd: 5, target: 'foes', power: 10, status: ['chill', 2, 1], desc: 'A giant wave: hits and chills every enemy for 2 turns.' },
  wc_wall:      { name: 'Water Wall', cost: 75, cd: 4, target: 'allies', shield: 0.1, desc: 'A wall of water: shields every ally for 10% of Water Chestnut\'s max HP.' },
  // Shamrocket (Plants vs. Zombies Heroes)
  sham_pop:     { name: 'Clover Pop', cost: 0, target: 'foe', power: 9, desc: 'A pop of clover leaves.' },
  sham_launch:  { name: 'Launch', cost: 50, cd: 2, target: 'foe', power: 20, recoil: 0.08, desc: 'Rockets into an enemy, but it costs 8% of its own max HP.' },
  sham_trail:   { name: 'Rocket Trail', cost: 25, cd: 2, target: 'foes', power: 4, fire: true, status: ['burn', 2, 0.3], desc: 'Flies over everyone, trailing fire; 30% chance each to burn.' },
  sham_gold:    { name: 'Pot of Gold', cost: 0, cd: 4, target: 'self', sun: 30, desc: 'Finds the pot of gold at the end of the rainbow: +30 sun.' },
  sham_orbit:   { name: 'Orbit', cost: 25, cd: 2, target: 'self', self: ['evade', 2], desc: 'Flies up into orbit: Evade for 2 turns.' },
  sham_meteor:  { name: 'Meteor Shower', cost: 75, cd: 3, target: 'randfoe', power: 7, hits: 4, fire: true, desc: 'Four flaming meteors at random enemies.' },
  sham_moon:    { name: 'Moonshot', cost: 100, cd: 4, target: 'foe', power: 34, sure: true, desc: 'Flies to the moon and back: a huge hit that never misses.' },
  sham_rainbow: { name: 'Rainbow Blast', cost: 75, cd: 4, target: 'foes', power: 10, special: (u, ts) => { for (const t of ts) if (t.hp > 0) addStatus(t, pick(['weak', 'chill', 'blind']), 2, { src: u }); }, desc: 'A blast of rainbow: hits every enemy, and each one is Weak, chilled or blinded for 2 turns.' },

  // ======== Signature moves (each belongs to one plant) ========
  pea_shot:    { name: 'Pea Shot', cost: 0, target: 'foe', power: 10, straight: true, desc: 'The classic pea.' },
  pea_barrage: { name: 'Pea Barrage', cost: 50, cd: 2, target: 'foe', power: 6, hits: 3, straight: true, desc: 'Three peas at one enemy.' },
  rep_double:  { name: 'Double Pea', cost: 0, target: 'foe', power: 6, hits: 2, straight: true, desc: 'Two peas.' },
  rep_storm:   { name: 'Pea Storm', cost: 75, cd: 3, target: 'randfoe', power: 6, hits: 5, straight: true, desc: 'Five peas at random enemies.' },
  snow_pea:    { name: 'Frozen Pea', cost: 0, target: 'foe', power: 8, straight: true, status: ['chill', 2, 1], desc: 'Chills for 2 turns.' },
  snow_volley: { name: 'Blizzard Volley', cost: 50, cd: 3, target: 'foes', power: 5, straight: true, status: ['chill', 2, 1], desc: 'Chills every enemy.' },
  cab_lob:     { name: 'Cabbage', cost: 0, target: 'foe', power: 10, lob: true, desc: 'A lobbed cabbage.' },
  cab_rain:    { name: 'Cabbage Rain', cost: 50, cd: 2, target: 'randfoe', power: 6, hits: 3, lob: true, desc: 'Three cabbages at random enemies.' },
  cac_spike:   { name: 'Spike', cost: 0, target: 'foe', power: 9, straight: true, desc: 'A sharp needle.' },
  cac_rain:    { name: 'Needle Rain', cost: 50, cd: 2, target: 'randfoe', power: 5, hits: 4, desc: 'Four needles at random enemies.' },
  puff:        { name: 'Puff', cost: 0, target: 'foe', power: 8, desc: 'A little spore puff.' },
  puff_cloud:  { name: 'Spore Cloud', cost: 25, cd: 2, target: 'foes', power: 4, status: ['weak', 2, 1], desc: 'Weakens every enemy for 2 turns.' },

  nut_roll:    { name: 'Roll', cost: 0, target: 'foe', power: 9, useDef: true, desc: 'Damage is based on DEFENSE, not attack.' },
  nut_bowl:    { name: 'Wall-nut Bowling', cost: 75, cd: 3, target: 'foe', power: 14, useDef: true, special: bowl, desc: 'Bowls into an enemy, then bounces into up to 3 more (each bounce does 75% of the last). DEFENSE-based.' },
  nut_regrow:  { name: 'Regrow Shell', cost: 25, cd: 2, target: 'self', heal: 0.3, desc: 'Heal itself 30%.' },
  tall_stand:  { name: 'Stand Tall', cost: 0, cd: 1, target: 'self', self: ['taunt', 1], special: u => addStatus(u, 'guard', 1), desc: 'Free Taunt and Guard for a turn.' },
  tall_topple: { name: 'Topple', cost: 50, cd: 3, target: 'foe', power: 14, useDef: true, status: ['stun', 1, 1], desc: 'Falls on an enemy (DEFENSE-based) and stuns it.' },
  pump_bash:   { name: 'Gourd Bash', cost: 0, target: 'foe', power: 8, desc: 'A pumpkin-y thump.' },
  pump_shell:  { name: 'Pumpkin Shell', cost: 25, cd: 1, target: 'ally', shield: 0.3, desc: 'Shield an ally for 30% of Pumpkin\'s max HP.' },
  gar_breath:  { name: 'Garlic Breath', cost: 0, target: 'foe', power: 7, status: ['weak', 1, 0.3], desc: '30% chance to Weaken.' },
  gar_stench:  { name: 'Stench', cost: 25, cd: 2, target: 'foes', status: ['weak', 2, 1], desc: 'Weakens every enemy for 2 turns.' },
  spike_prick: { name: 'Prick', cost: 0, target: 'foe', power: 8, pierce: true, desc: 'Pierces armor.' },
  spike_strip: { name: 'Spike Strip', cost: 25, cd: 2, target: 'foes', power: 5, pierce: true, desc: 'Pierces armor on every enemy.' },

  sun_petal:   { name: 'Petal Toss', cost: 0, target: 'foe', power: 7, desc: 'A soft petal.' },
  sun_make:    { name: 'Make Sun', cost: 0, cd: 2, target: 'self', sun: 30, desc: '+30 sun.' },
  ss_puff:     { name: 'Spore Puff', cost: 0, target: 'foe', power: 7, desc: 'A sleepy spore.' },
  ss_spurt:    { name: 'Growth Spurt', cost: 25, cd: 3, target: 'self', heal: 0.2, special: u => { u.flags.grown = true; log(`${u.name} is all grown up!`); }, desc: 'Grow up right away and heal 20%.' },
  mari_petal:  { name: 'Gold Petal', cost: 0, target: 'foe', power: 6, sun: 5, desc: 'A shiny petal. +5 sun.' },
  mari_bright: { name: 'Bright Side', cost: 25, cd: 2, target: 'allies', cleanse: true, desc: 'Cleanse every ally.' },
  aloe_spray:  { name: 'Aloe Spray', cost: 0, target: 'foe', power: 6, desc: 'A sticky squirt.' },
  aloe_squirt: { name: 'Soothe', cost: 25, target: 'ally', heal: 0.35, desc: 'Heal an ally 35%.' },

  cherry_fizz:  { name: 'Fizz', cost: 0, target: 'foe', power: 9, fire: true, status: ['burn', 2, 0.1], desc: '10% chance to burn.' },
  cherry_blast: { name: 'Cherry Blast', cost: 75, cd: 3, target: 'foes', power: 18, desc: 'BOOM. Hits every enemy hard.' },
  jal_sauce:    { name: 'Hot Sauce', cost: 0, target: 'foe', power: 8, fire: true, status: ['burn', 2, 0.4], desc: '40% chance to burn.' },
  jal_row:      { name: 'Fire Row', cost: 75, cd: 3, target: 'foes', power: 14, fire: true, status: ['burn', 2, 1], desc: 'Burns every enemy.' },
  sq_leap:      { name: 'Hop', cost: 0, target: 'foe', power: 11, desc: 'A small squish.' },
  sq_squash:    { name: 'Squash', cost: 25, cd: 1, target: 'foe', power: 20, pierce: true, desc: 'A huge squish that pierces armor.' },
  mel_seed:     { name: 'Seed Spit', cost: 0, target: 'foe', power: 7, desc: 'Spits melon seeds.' },
  mel_melon:    { name: 'Melon', cost: 25, target: 'foe', power: 15, desc: 'A heavy melon.' },
  fume_puff:    { name: 'Fume', cost: 0, target: 'foe2', power: 8, desc: 'Hits an enemy and one more.' },
  fume_cloud:   { name: 'Toxic Cloud', cost: 75, cd: 3, target: 'foes', power: 9, status: ['weak', 1, 1], desc: 'Hits and weakens every enemy.' },
  bonk_rapid:   { name: 'Rapid Punch', cost: 0, target: 'foe', power: 4, hits: 3, desc: 'Three quick jabs.' },
  bonk_upper:   { name: 'Uppercut', cost: 25, cd: 1, target: 'foe', power: 14, status: ['stun', 1, 0.25], desc: '25% chance to stun.' },

  chomp_bite:   { name: 'Chomp', cost: 0, target: 'foe', power: 12, desc: 'A big bite.' },
  chomp_devour: { name: 'Devour', cost: 50, cd: 4, target: 'foe', special: devour, desc: 'Swallows an enemy at 40% HP or less whole (bosses just take damage). Then it chews for a turn.' },
  hyp_swirl:    { name: 'Dizzy Swirl', cost: 0, target: 'foe', power: 6, status: ['hypno', 1, 0.15], desc: '15% chance to hypnotize for a turn.' },
  hyp_hypno:    { name: 'Hypnotize', cost: 75, cd: 4, target: 'foe', status: ['hypno', 2, 1], desc: 'The enemy fights for you for 2 turns (not bosses).' },
  ice_chip:     { name: 'Ice Chip', cost: 0, target: 'foe', power: 7, status: ['chill', 1, 1], desc: 'Chills for a turn.' },
  ice_deep:     { name: 'Deep Freeze', cost: 75, cd: 4, target: 'foes', power: 4, status: ['freeze', 1, 1], desc: 'Freezes every enemy for a turn.' },
  torch_ember:  { name: 'Ember', cost: 0, target: 'foe', power: 8, fire: true, status: ['burn', 2, 0.3], desc: '30% chance to burn.' },
  torch_bonfire:{ name: 'Bonfire', cost: 50, cd: 3, target: 'allies', status: ['power', 2, 1], desc: 'Every ally gets Power for 2 turns.' },
  ker_kernel:   { name: 'Kernel', cost: 0, target: 'foe', power: 7, desc: 'A lobbed kernel.' },
  ker_butter:   { name: 'Butter', cost: 50, cd: 3, target: 'foe', power: 6, status: ['stun', 1, 1], label: 'Buttered', desc: 'Always butters (stuns) for a turn.' },
  pm_spudow:    { name: 'Spudow', cost: 50, cd: 3, target: 'foe', power: 24, pierce: true, desc: 'A huge blast that pierces armor.' },
  pm_rearm:     { name: 'Re-arm', cost: 25, cd: 3, target: 'self', special: u => { u.flags.armed = true; log(`${u.name} is armed again!`); }, desc: 'Bury the mine again (see its ability).' },

  // ---- Plants from across the series (PvZ 2, Garden Warfare) ----
  bloom_throw:   { name: 'Bloomerang', cost: 0, target: 'foe', power: 8, desc: 'A boomerang throw (bounces, see its ability).' },
  bloom_spin:    { name: 'Petal Spin', cost: 25, cd: 2, target: 'foe', power: 6, hits: 2, desc: 'Two throws, and both bounce.' },
  laser:         { name: 'Laser', cost: 0, target: 'foe', power: 12, desc: 'A laser beam (see its ability).' },
  laser_burst:   { name: 'Laser Burst', cost: 50, cd: 3, target: 'foe', power: 18, pierce: true, desc: 'A huge beam that pierces armor.' },
  cit_plasma:    { name: 'Plasma Ball', cost: 0, target: 'foe', power: 9, desc: 'A zap of citrus energy.' },
  cit_charge:    { name: 'Charged Plasma', cost: 50, cd: 3, target: 'foe', power: 22, desc: 'A fully charged plasma ball.' },
  infi_zap:      { name: 'Holo Zap', cost: 0, target: 'foe', power: 7, pierce: true, desc: 'A hologram zap that pierces armor.' },
  infi_barrier:  { name: 'Holo Barrier', cost: 50, cd: 3, target: 'allies', shield: 0.12, desc: 'Shield every ally for 12% of Infi-nut\'s max HP.' },
  gold_flash:    { name: 'Gold Flash', cost: 0, target: 'foe', power: 6, status: ['weak', 1, 0.3], desc: '30% chance to Weaken.' },
  gold_shower:   { name: 'Gold Shower', cost: 50, cd: 3, target: 'allies', heal: 0.1, cleanse: true, desc: 'Heal every ally 10% and cleanse them.' },
  bean_bonk:     { name: 'Bean Bonk', cost: 0, target: 'foe', power: 7, desc: 'A bonk with a bean.' },
  bean_bait:     { name: 'Shiny Bait', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'Taunt for 2 turns. Every hit it takes makes sun!' },
  snap_breath:   { name: 'Flame Breath', cost: 0, target: 'foe', power: 9, fire: true, status: ['burn', 2, 0.3], desc: '30% chance to burn.' },
  snap_inferno:  { name: 'Inferno', cost: 75, cd: 3, target: 'foes', power: 12, fire: true, status: ['burn', 2, 1], desc: 'Burns every enemy.' },
  coco_shot:     { name: 'Coconut Plink', cost: 0, target: 'foe', power: 8, desc: 'A small coconut.' },
  coco_cannon:   { name: 'Coconut Cannon', cost: 50, cd: 2, target: 'foe', power: 24, splash: 0.3, desc: 'BOOM. 30% splashes the other enemies.' },
  berg_chip:     { name: 'Ice Chunk', cost: 0, target: 'foe', power: 7, status: ['chill', 1, 0.3], desc: '30% chance to chill.' },
  berg_freeze:   { name: 'Flash Freeze', cost: 50, cd: 3, target: 'foe', status: ['freeze', 1, 1], special: u => { u.flags.icy = true; }, desc: 'Freeze an enemy and get Cold Feet ready again.' },
  emp_zap:       { name: 'Static', cost: 0, target: 'foe', power: 7, desc: 'A little shock.' },
  emp_pulse:     { name: 'EMP Pulse', cost: 75, cd: 4, target: 'foes', special: empPulse, desc: 'Stuns every machine, and each other enemy 40% of the time.' },

  // ======== Zombie moves ========
  z_bite:     { name: 'Bite', target: 'foe', power: 10 },
  z_rally:    { name: 'Wave the Flag', cd: 3, target: 'allies', status: ['power', 2, 1], w: 2 },
  z_vault:    { name: 'Pole Vault', cd: 3, target: 'foe', power: 12, vault: true, ai: 'back', w: 3 },
  z_tackle:   { name: 'Tackle', target: 'foe', power: 13 },
  z_charge:   { name: 'Charge', cd: 3, target: 'foes', power: 7, status: ['stun', 1, 0.2], label: 'Dazed', w: 2 },
  z_backup:   { name: 'Backup Dancers', cd: 3, target: 'self', special: u => summon(u, ['backup', 'backup']), w: 3 },
  z_scratch:  { name: 'Scratch', target: 'foe', power: 9, ai: 'weak' },
  z_leap:     { name: 'Dolphin Leap', cd: 3, target: 'foe', power: 12, vault: true, ai: 'back', w: 3 },
  z_icetrail: { name: 'Ice Trail', cd: 2, target: 'foes', power: 6, status: ['chill', 2, 1], w: 2 },
  z_runover:  { name: 'Run Over', cd: 1, target: 'foe', power: 18 },
  z_pick:     { name: 'Pickaxe', target: 'foe', power: 11, ai: 'back' },
  z_snatch: { name: 'Bungee Snatch', cd: 3, target: 'foe', power: 6, vault: true, lob: true, special: snatch, w: 3 },
  z_ball:     { name: 'Basketball', cd: 1, target: 'randfoe', power: 7, hits: 3, lob: true, w: 2 },
  z_smash:    { name: 'Smash', cd: 1, target: 'foe', power: 24 },
  z_imptoss:  { name: 'Imp Toss', cd: 3, target: 'self', special: u => summon(u, ['imp']), w: 2 },
  z_pound:    { name: 'Ground Pound', cd: 3, target: 'foes', power: 10, w: 2 },
  z_stomp:    { name: 'Robo Stomp', target: 'foe', power: 22 },
  z_fire:     { name: 'Fireball', cd: 4, target: 'foes', power: 10, fire: true, status: ['burn', 2, 0.5], w: 2 },
  z_ice:      { name: 'Iceball', cd: 4, target: 'foes', power: 8, status: ['chill', 2, 1], w: 2 },
  z_horde:    { name: 'Summon Horde', cd: 5, target: 'self', special: u => summon(u, [pick(['cone', 'bucket', 'pole', 'imp', 'paper'])]), w: 3 },
  z_snow:     { name: 'Snowball', target: 'foe', power: 10, status: ['chill', 1, 1] },
  z_blizzard: { name: 'Yeti Breath', cd: 3, target: 'foes', power: 6, status: ['chill', 2, 1], w: 2 },
  z_paper:    { name: 'Paper Swat', target: 'foe', power: 8 },
  z_door:     { name: 'Door Slam', target: 'foe', power: 9, status: ['stun', 1, 0.1], label: 'Dazed' },

  // ---- Zombies from across the series ----
  z_wrap:       { name: 'Mummy Wrap', cd: 3, target: 'foe', power: 5, status: ['stun', 1, 1], label: 'Wrapped', w: 2 },
  z_torch:      { name: 'Torch Swing', target: 'foe', power: 10, special: torchSwing },
  z_sunsteal:   { name: 'Sun Steal', cd: 2, target: 'self', special: sunSteal, can: u => B.suns[u.side === 'ally' ? 'foe' : 'ally'] > 0, w: 3 },
  z_piano:      { name: 'Piano Smash', target: 'foe', power: 12 },
  z_ragtime:    { name: 'Ragtime', cd: 3, target: 'allies', status: ['power', 2, 1], w: 2 },
  z_swing:      { name: 'Rope Swing', cd: 3, target: 'foe', power: 12, vault: true, ai: 'back', w: 3 },
  z_cannon:     { name: 'Cannon Blast', cd: 2, target: 'foes', power: 9, w: 2 },
  z_freezeball: { name: 'Freeze Ball', cd: 2, target: 'foe', power: 8, status: ['freeze', 1, 1], can: u => !u.st.chill, w: 3 },
  z_sheep:      { name: 'Sheep Spell', cd: 3, target: 'self', special: u => sheepRandom(u, 1, 2), can: u => foesOf(u).some(p => !p.st.sheep), w: 3 },
  z_scepter:    { name: 'Scepter Tap', target: 'foe', power: 6, w: 0.5 },
  z_knight:     { name: 'Knight!', cd: 2, target: 'self', special: knight, can: u => knightable(u).length > 0, w: 3 },
  z_rainbow:    { name: 'Rainbow Trail', cd: 2, target: 'ally', status: ['invuln', 1, 1], w: 3 },
  z_kick:       { name: 'Punk Kick', target: 'foe', power: 12, special: (u, ts) => { for (const t of ts) { delete t.st.shield; delete t.st.taunt; } } },
  z_pounce:     { name: 'Pounce', target: 'foe', power: 7, hits: 2, ai: 'weak' },
  z_swoop:      { name: 'Jetpack Swoop', target: 'foe', power: 10, ai: 'back' },
  z_forcefield: { name: 'Force Field', cd: 3, target: 'allies', special: forceField, can: u => alliesOf(u).length > 1, w: 3 },
  z_jackhammer: { name: 'Jackhammer', target: 'foe', power: 11 },
  z_patch:      { name: 'Patch Up', cd: 3, target: 'self', special: patchUp, can: u => alliesOf(u).some(z => z.armorMax > 0 && z.armor < z.armorMax), w: 3 },
  z_labzap:     { name: 'Lab Zap', target: 'foe', power: 9 },
  z_healstation:{ name: 'Heal Station', cd: 3, target: 'allies', heal: 0.15, w: 3 },
  z_heroic:     { name: 'Heroic Kick', target: 'foe', power: 15 },
  z_supercharge:{ name: 'Super Charge', cd: 4, target: 'self', special: u => { u.flags.charging = true; log(`${u.name} is charging a Brainz Beam! Stun him to cancel it!`, 'bad'); }, w: 3 },
  z_beam:       { name: 'Brainz Beam', target: 'foes', power: 16, w: 0 },
  z_laser:      { name: 'Laser Sweep', cd: 3, target: 'foes', power: 11, fire: true, status: ['burn', 1, 0.5], w: 2 },
  z_future:     { name: 'Call the Future', cd: 5, target: 'self', special: u => summon(u, [pick(['jetpack', 'shieldz', 'punk'])]), w: 2 },
  z_sheepray:   { name: 'Sheep Ray', cd: 4, target: 'self', special: u => sheepRandom(u, 2, 1), can: u => foesOf(u).some(p => !p.st.sheep), w: 2 },

  // ---- More zombie variety (added 2026-11-22) ----
  z_ladderbash: { name: 'Ladder Bash', target: 'foe', power: 11 },
  z_pogo:       { name: 'Pogo Bounce', target: 'foe', power: 11, vault: true, ai: 'back', can: u => u.armor > 0, w: 3 },
  z_sled:       { name: 'Sled Slam', cd: 2, target: 'foes', power: 7, w: 3 },
  z_iceshove:   { name: 'Ice Block Shove', cd: 2, target: 'foe', power: 12, status: ['chill', 1, 1], can: u => u.armor > 0, w: 3 },
  z_club:       { name: 'Club', target: 'foe', power: 11 },
  z_dynamite:   { name: 'Dynamite Jump', cd: 99, target: 'foe', power: 18, vault: true, ai: 'back', can: u => !u.flags.fuseOut, special: u => { u.flags.fuseOut = true; }, w: 5 },
  z_lasso:      { name: 'Lasso', target: 'foe', power: 9, status: ['chill', 1, 0.3] },
  z_peck:       { name: 'Peck', target: 'foe', power: 6, ai: 'weak' },
  z_octo:       { name: 'Octo Throw', cd: 3, target: 'foe', power: 4, status: ['stun', 2, 1], label: 'Octopused', w: 3 },
  z_beat:       { name: 'Drop the Beat', cd: 4, target: 'foes', status: ['stun', 1, 0.6], label: 'Dazed', can: u => u.armor > 0, w: 3 },
  z_barrelroll: { name: 'Barrel Roll', cd: 2, target: 'foes', power: 7, can: u => u.armor > 0, w: 3 },
  z_zpg:        { name: 'ZPG Rocket', cd: 2, target: 'foes', power: 8, w: 2 },
  z_blaster:    { name: 'Z-6 Blaster', target: 'foe', power: 10 },
  z_crush:      { name: 'Sarcophagus Slam', target: 'foe', power: 13 },
  // ---- Realm zombies (Part 2, batch 1) ----
  z_flash:      { name: 'Flash Photo', cd: 2, target: 'foe', status: ['blind', 2, 1], w: 2 },
  z_rocket:     { name: 'Rocket Launcher', cd: 3, target: 'foes', power: 8, w: 3 },
  z_villain:    { name: 'Evil Punch', target: 'foe', power: 16 },
  z_henchmen:   { name: 'Henchmen!', cd: 4, target: 'self', special: u => summon(u, [pick(['paparazzi', 'actionhero'])]), w: 2 },
  z_trample:    { name: 'Trample', target: 'foe', power: 13, vault: true, ai: 'back' },
  z_spear:      { name: 'Spear Throw', target: 'foe', power: 12, ai: 'weak' },
  z_bodyslam:   { name: 'Body Slam', target: 'foe', power: 15, status: ['stun', 1, 0.5], label: 'Slammed' },
  z_flex:       { name: 'Flex', cd: 3, target: 'self', status: ['power', 2, 1], special: u => addStatus(u, 'guard', 1), w: 2 },
  z_ink:        { name: 'Ink Squirt', cd: 3, target: 'foes', status: ['blind', 2, 0.4], w: 2 },
  z_trident:    { name: 'Trident', target: 'foe', power: 14 },
  z_tide:       { name: 'Tidal Wave', cd: 3, target: 'foes', power: 7, status: ['chill', 2, 1], w: 2 },
  z_school:     { name: 'School of Fish', cd: 4, target: 'self', special: u => summon(u, ['fishyimp']), w: 2 },
  z_podblaster: { name: 'Pod Blaster', target: 'foe', power: 10, sure: true },
  z_cosmicray:  { name: 'Cosmic Ray', cd: 2, target: 'foe', power: 5, status: ['brittle', 2, 1], w: 2 },
  z_gascloud:   { name: 'Gas Cloud', cd: 2, target: 'foes', power: 4, status: ['weak', 2, 1], special: (u, ts) => { for (const t of ts) if (t.hp > 0 && chance(0.3)) addStatus(t, 'burn', 2, { src: u }); }, w: 2 },
  z_swell:      { name: 'Swell Up', cd: 4, target: 'self', shield: 0.15, w: 2 },
};

// ---- Helpers for the special moves above ----

// Explorer: a lit torch burns and burns through shields (until it's put out).
function torchSwing(u, targets) {
  const t = targets[0];
  if (!t || t.hp <= 0 || u.flags.torchOut) return;
  delete t.st.shield;
  addStatus(t, 'burn', 2, { src: u });
}

// Ra Zombie: takes sun from you. You get it all back when it's defeated.
function sunSteal(u) {
  const from = u.side === 'ally' ? 'foe' : 'ally';
  const n = Math.min(25, B.suns[from]);
  B.suns[from] -= n;
  u.flags.stolen = (u.flags.stolen || 0) + n;
  log(`${u.name} stole ${n} sun!`, 'bad');
}

// Wizard and Tomorrow-tron: turn random plants into sheep.
function sheepRandom(u, count, turns) {
  for (const t of shuffle(foesOf(u).filter(p => !p.st.sheep)).slice(0, count)) {
    if (addStatus(t, 'sheep', turns, { src: u })) log(`${t.name} was turned into a sheep! Baa.`, 'bad');
  }
}

// King Zombie: turns a plain zombie into an armored Knight.
const knightable = u => alliesOf(u).filter(z => z !== u && z.kind === 'zombie' && z.armor <= 0 && !z.boss);
function knight(u) {
  const z = pick(knightable(u));
  if (!z) return;
  z.armor = z.armorMax = Math.round(40 * statScale(z.side));
  z.armorKind = 'crown';
  log(`${u.name} knights ${z.name}! It gets armor.`, 'bad');
}

// Shield Zombie: force fields on every other zombie.
function forceField(u) {
  for (const z of alliesOf(u)) if (z !== u) addShield(z, u.maxHp * 0.2);
  log(`${u.name} puts up force fields!`, 'bad');
}

// Engineer: repairs half of an ally's armor.
function patchUp(u) {
  const z = alliesOf(u).filter(a => a.armorMax > 0 && a.armor < a.armorMax).sort((a, b) => a.armor - b.armor)[0];
  if (!z) return;
  z.armor = Math.min(z.armorMax, z.armor + Math.round(z.armorMax / 2));
  log(`${u.name} patches up ${z.name}'s ${ARMOR_NAMES[z.armorKind]}!`, 'bad');
}

// E.M.Peach: machines are always stunned, everyone else 40% of the time.
function empPulse(u) {
  for (const t of foesOf(u)) {
    if (t.data.vehicle || chance(0.4)) addStatus(t, 'stun', 1, { src: u, label: 'Shorted' });
  }
}

// Devour: Chomper swallows a weak enemy whole, then chews for a turn.
function devour(u, targets, boost) {
  const t = targets[0];
  if (!t || t.hp <= 0) return;
  if (!t.boss && t.hp <= t.maxHp * 0.4) {
    log(`${u.name} swallowed ${t.name} whole!`, 'good');
    t.hp = 0;
    fallUnit(t, u);
    if (mine(u)) progress.stats.devoured++;
    if (u.data.passive?.onDevour) u.data.passive.onDevour(u);
  } else {
    log(`${t.name} is too big to swallow!`);
    hit(u, t, 14 * boost, {});
  }
  addStatus(u, 'stun', 1, { label: 'Chewing' });
}

// Bungee Snatch: steals the target's shield and buffs and stuns it.
function snatch(u, targets) {
  const t = targets[0];
  if (!t || t.hp <= 0) return;
  // Bungee Zombies are lobbed in, so an Umbrella Leaf bounces them off.
  if ((t.side === 'ally' || B.versus) && sideList(t.side).some(p => p.hp > 0 && p.data.passive?.umbrella)) { log(`${u.name} bounces off the umbrella!`, 'good'); return; }
  for (const s of ['shield', 'power', 'guard', 'taunt', 'thorns', 'fed']) delete t.st[s];
  log(`${u.name} snatched ${t.name}'s buffs!`, 'bad');
  addStatus(t, 'stun', 1, { label: 'Snatched' });
}

// ---- Helpers for the plant moves with unusual effects ----

// dispel(t): strips every good status (buffs) off a unit.
function dispel(t) {
  for (const k in t.st) if (STATUS[k] && !STATUS[k].bad) delete t.st[k];
}

// Wall-nut Bowling: after the first hit, the nut bounces from enemy to
// enemy (never the same one twice in a row), weaker each bounce.
function bowl(u, targets, boost) {
  let last = targets[0];
  let power = 14 * boost * 0.75;
  for (let bounce = 0; bounce < 3; bounce++) {
    const next = pick(foesOf(u).filter(f => f !== last));
    if (!next) break;
    log('Bounce!');
    hit(u, next, power, { useDef: true, aoe: true });
    power *= 0.75;
    last = next;
  }
}

// Garlic Bulb: heals more the more enemies are Weak (Garlic's whole kit
// is about making enemies Weak).
function garlicBulb(u) {
  const weak = foesOf(u).filter(f => f.st.weak).length;
  if (!weak) return log('No enemy is Weak, so the bulb does nothing.');
  healUnit(u, u.maxHp * Math.min(0.6, 0.15 * weak));
}

// Sunflower's Solar Flare: turns all your saved-up sun into damage.
function solarFlare(u) {
  const spent = B.suns[u.side];
  if (spent < 10) return log('Not enough sun to flare!');
  B.suns[u.side] = 0;
  log(`${u.name} spends ${spent} sun on a SOLAR FLARE!`, 'good');
  for (const f of foesOf(u)) hit(u, f, spent / 10, { aoe: true, fire: true });
}

// Marigold's Golden Age: every other ally acts again right after this turn.
function goldenAge(u) {
  const others = alliesOf(u).filter(a => a !== u);
  for (const a of others.reverse()) B.queue.unshift(a.uid);
  log('A Golden Age! Every ally gets an extra turn!', 'good');
}

// The ally on u's side with the smallest share of its HP left.
function mostHurt(u) { return alliesOf(u).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]; }

// How many charges Lightning Reed's Overcharge needs (2 with Supercell).
const chargeNeed = u => 3 - (u.data.passive.quickCharge || 0);

// Cherry Bomb's Kamikaze Kaboom: it wilts after the blast, and its own
// Last Blast ability goes off as it wilts. Together they were too strong
// in versus (its team won 9 battles in 10), so on 2026-11-22 the blast
// went from 30 to 22 power and Last Blast from 20 to 12.
function kamikaze(u) {
  log(`${u.name} gives everything!`, 'good');
  u.hp = 0;
  fallUnit(u, null);
}

// Chomper's Mega Chomp: like Devour, but any non-boss enemy fits.
function megaChomp(u, targets) {
  const t = targets[0];
  if (!t || t.hp <= 0) return;
  if (!t.boss) {
    log(`${u.name} swallows ${t.name} in one MEGA CHOMP!`, 'good');
    t.hp = 0;
    fallUnit(t, u);
    if (mine(u)) progress.stats.devoured++;
    u.data.passive?.onDevour?.(u);
  } else {
    log(`${t.name} is too big even for a Mega Chomp!`);
    hit(u, t, 30, {});
  }
  addStatus(u, 'stun', 1, { label: 'Chewing' });
}

// Ice-shroom's Shatter: chilled and frozen enemies break apart.
function shatter(u) {
  const icy = foesOf(u).filter(f => f.st.chill || f.st.freeze);
  if (!icy.length) return log('Nothing is frozen... yet.');
  for (const f of icy) hit(u, f, 20, { aoe: true });
}

// Iceberg Lettuce's Glacier: chilled enemies freeze, the rest get chilled.
function glacier(u) {
  for (const f of foesOf(u)) {
    if (f.st.chill) addStatus(f, 'freeze', 1, { src: u });
    else addStatus(f, 'chill', 2, { src: u });
  }
  log('A glacier slides over the lawn!', 'good');
}

// Wall-nut and Tall-nut: the protector takes attacks aimed at these allies.
function coverAllies(u, targets, turns) {
  for (const t of targets) {
    if (t === u || t.hp <= 0) continue;
    if (addStatus(t, 'cover', turns)) t.coverBy = u.uid;
  }
  log(`${u.name} stands guard!`, 'good');
}

// Sunflower's Pep Talk: another ally's cooldowns are cleared.
function pepTalk(u, targets) {
  for (const t of targets) {
    if (t === u) { log('Sunflower can\'t pep-talk itself!'); continue; }
    t.cd = {};
    addStatus(t, 'power', 1);
    log(`${t.name} is ready for anything!`, 'good');
  }
}

// Marigold's Golden Hour: an ally acts again right after this turn.
function haste(u, t) {
  if (!t || t === u || t.hp <= 0) return log('Golden Hour needs another plant!');
  B.queue.unshift(t.uid);
  log(`${t.name} gets an extra turn!`, 'good');
}

// Aloe's Sap Share: trade some of Aloe's own HP to heal an ally.
function sapShare(u, targets) {
  const t = targets[0];
  if (!t || t === u) return log('Aloe can\'t share with itself!');
  const give = Math.min(u.hp - 1, Math.round(u.maxHp * 0.2));
  if (give <= 0) return;
  u.hp -= give;
  pop(u, '-' + give, 'dmg');
  healUnit(t, give, u);
}

// Jalapeno's Flare Up: every burning enemy takes a hit.
function flareUp(u) {
  const burning = foesOf(u).filter(f => f.st.burn);
  if (!burning.length) return log('Nothing is burning... yet.');
  for (const f of burning) hit(u, f, 14, { aoe: true, fire: true });
}

// Snapdragon's Stoke the Flames: burns last longer.
function stoke(u) {
  const burning = foesOf(u).filter(f => f.st.burn);
  for (const f of burning) f.st.burn += 2;
  log(burning.length ? 'The flames roar higher!' : 'Nothing is burning... yet.', burning.length ? 'good' : '');
}

// Lightning Reed: a hit that arcs on to `count` more enemies at half power.
function arc(u, from, power, count) {
  for (const o of shuffle(foesOf(u).filter(x => x !== from)).slice(0, count)) hit(u, o, power * 0.5, { aoe: true });
}

// Lightning Reed's Jumpstart: like Plant Food for another ally.
function jumpstart(u, targets) {
  for (const t of targets) {
    if (t === u) { log('Lightning Reed can\'t jumpstart itself!'); continue; }
    t.st.fed = 1;
    log(`${t.name} is supercharged: its next move is free and twice as strong!`, 'good');
  }
}

// Magnet-shroom: which armor is metal, and pulling it off.
const METAL = new Set(['bucket', 'helmet', 'door', 'mech', 'robo', 'crown', 'ladder', 'pogo', 'boombox', 'pod']);
function ripMetal(u, t, amount) {
  if (!t || t.armor <= 0 || !METAL.has(t.armorKind)) return false;
  t.armor = Math.max(0, t.armor - Math.round(amount));
  if (t.armor <= 0) {
    u.flags.metal = (u.flags.metal || 0) + 1;
    log(`${u.name} pulls off ${t.name}'s ${ARMOR_NAMES[t.armorKind]}!`, 'good');
    if (mine(u)) progress.stats.armorBroken++;
    t.data.passive?.armorBreak?.(t);
  }
  return true;
}
function magnetPull(u, targets) {
  const t = targets[0];
  if (!t || t.hp <= 0) return;
  const amount = t.boss ? Math.ceil(t.armor / 2) : t.armor;
  if (!ripMetal(u, t, amount)) return log(`${t.name} has nothing metal to pull.`);
  if (t.armor > 0) log(`${u.name} rips half of ${t.name}'s ${ARMOR_NAMES[t.armorKind]} away!`, 'good');
}

/* ---- Plants -------------------------------------------------------------------
   stats: [max HP, attack, defense, speed] at level 1.
   learn: [move id, level it's learned at]. Six moves that fit the plant:
          mostly its own, plus a few shared with its family (see "Family
          moves" in MOVES). You equip any four of the ones it has learned.
   shroom: mushrooms are 30% stronger at Night and 15% weaker in daytime.
   unlock: how you get it (shown in the Almanac).
*/
const PLANTS = {
  // ================= SHOOTERS =================
  peashooter: {
    name: 'Peashooter', cls: 'shooter', stats: [64, 13, 4, 15],
    passive: {
      name: 'Steady Aim', desc: '+10% damage each time in a row it attacks the same enemy (up to +30%).',
      dealMult(u, t) { return 1 + 0.1 * Math.min(3, u.flags.lastTarget === t.uid ? u.flags.streak : 0); },
      afterAttack(u, t) {
        u.flags.streak = u.flags.lastTarget === t.uid ? (u.flags.streak || 0) + 1 : 0;
        u.flags.lastTarget = t.uid;
      },
    },
    passive2: { name: 'Finisher', desc: '+30% damage to enemies below half HP.', dealMult(u, t) { return t.hp < t.maxHp / 2 ? 1.3 : 1; } },
    learn: [['pea_shot', 1], ['pea_aim', 1], ['pea_volley', 2], ['pea_barrage', 3], ['pea_head', 5], ['pea_duck', 7], ['pea_gatling', 10], ['pea_tracer', 13]],
    unlock: { how: 'start' }, flavor: 'Doesn\'t do much, but does it every turn.',
  },
  repeater: {
    name: 'Repeater', cls: 'shooter', stats: [72, 12, 5, 10],
    passive: {
      name: 'Double Tap', desc: 'Single-hit attacks on one enemy fire a second pea at 40% power. Slower than Peashooter.',
      echo: 0.4,
    },
    passive2: { name: 'Triple Tap', desc: 'Double Tap\'s second pea hits at 70% power instead of 40%.', echo: 0.3 },
    learn: [['rep_double', 1], ['rep_grit', 1], ['pea_aim', 2], ['rep_storm', 4], ['pea_volley', 6], ['rep_rapid', 8], ['rep_rampage', 10], ['rep_cross', 13]],
    unlock: { how: 'shop', price: 400 }, flavor: 'Two peas are better than one, if you can wait for them.',
  },
  snowpea: {
    name: 'Snow Pea', cls: 'shooter', stats: [62, 11, 4, 14],
    passive: {
      name: 'Cold Snap', desc: 'Deals 30% more damage to chilled or frozen enemies.',
      dealMult(u, t) { return (t.st.chill || t.st.freeze) ? 1.3 : 1; },
    },
    passive2: { name: 'Frosty Coat', desc: 'Enemies that hit it are chilled for a turn.', onHurt(u, src) { if (src && src.hp > 0 && src !== u) addStatus(src, 'chill', 1, { src: u }); } },
    learn: [['snow_pea', 1], ['frost_snare', 1], ['pea_aim', 3], ['snow_volley', 4], ['snow_icicle', 6], ['pea_volley', 8], ['snow_zero', 10], ['snow_hail', 13]],
    unlock: { how: 'story' }, flavor: 'Cool, calm and very, very cold.',
  },
  cabbagepult: {
    name: 'Cabbage-pult', cls: 'shooter', stats: [60, 12, 4, 13],
    passive: { name: 'Lobber', desc: 'All its attacks are lobbed: they fly over Screen Doors and reach diving or dug-in zombies.', lobAll: true },
    passive2: { name: 'Fresh Greens', desc: 'Each round, the most hurt ally heals 5%.', roundStart(u) { const h = mostHurt(u); if (h) healUnit(h, h.maxHp * 0.05, u); } },
    learn: [['cab_lob', 1], ['cab_crisp', 1], ['cab_rain', 3], ['pult_arc', 5], ['cab_slaw', 6], ['cab_salad', 8], ['cab_head', 10], ['cab_stuffed', 13]],
    unlock: { how: 'story' }, flavor: 'Throws cabbages. Nobody asked why.',
  },
  cactus: {
    name: 'Cactus', cls: 'shooter', stats: [64, 12, 5, 13],
    passive: {
      name: 'Needles', desc: 'All its attacks pierce armor, but deal 15% less to zombies with no armor.',
      pierceAll: true,
      dealMult(u, t) { return t.armor > 0 ? 1 : 0.85; },
    },
    passive2: { name: 'Armor Piercer', desc: '+20% damage to enemies wearing armor.', dealMult(u, t) { return t.armor > 0 ? 1.2 : 1; } },
    learn: [['cac_spike', 1], ['cac_bristle', 1], ['cac_rain', 3], ['cac_needle', 5], ['cac_hug', 6], ['cac_heat', 8], ['cac_sniper', 10], ['cac_bloom', 13]],
    unlock: { how: 'achievement', id: 'seedvault' }, flavor: 'Hugs not recommended.',
  },
  puffshroom: {
    name: 'Puff-shroom', cls: 'shooter', shroom: true, stats: [40, 10, 2, 20],
    passive: { name: 'Tiny', desc: '30% chance to dodge attacks aimed at it alone. Very fragile.', dodge: 0.3 },
    passive2: { name: 'Small Target', desc: 'Hit-everyone attacks do 30% less damage to it.', takeMult(u, src, mv) { return mv.aoe ? 0.7 : 1; } },
    learn: [['puff', 1], ['puff_scatter', 1], ['puff_cloud', 3], ['puff_pep', 4], ['puff_hide', 6], ['puff_shot', 8], ['puff_army', 10], ['puff_sleep', 13]],
    unlock: { how: 'story' }, flavor: 'Small, fast and hard to hit.',
  },

  // ================= HEARTY =================
  wallnut: {
    name: 'Wall-nut', cls: 'hearty', stats: [130, 6, 10, 6],
    passive: {
      name: 'Tough Shell', desc: 'Takes 25% less damage while above half HP.',
      takeMult(u) { return u.hp > u.maxHp / 2 ? 0.75 : 1; },
    },
    passive2: { name: 'Nutty Resolve', desc: 'Heals 6% each round while below half HP.', roundStart(u) { if (u.hp < u.maxHp / 2) healUnit(u, u.maxHp * 0.06); } },
    learn: [['nut_roll', 1], ['nut_stare', 1], ['nut_shell', 2], ['nut_regrow', 3], ['nut_block', 5], ['nut_wall', 7], ['nut_bowl', 10], ['wn_explode', 13]],
    unlock: { how: 'start' }, flavor: 'A nut that refuses to crack.',
  },
  tallnut: {
    name: 'Tall-nut', cls: 'hearty', stats: [150, 5, 12, 4],
    passive: {
      name: 'Towering', desc: 'Leaping and vaulting attacks must hit it, and it can\'t be stunned. No Tough Shell, and very slow.',
      blocksVault: true, noStun: true,
    },
    passive2: { name: 'Immovable', desc: 'Takes 20% less damage while Taunting.', takeMult(u) { return u.st.taunt ? 0.8 : 1; } },
    learn: [['tall_stand', 1], ['tall_thump', 1], ['nut_shell', 2], ['tall_topple', 4], ['tall_shade', 6], ['nut_wall', 8], ['tall_tower', 10], ['tn_timber', 13]],
    unlock: { how: 'story' }, flavor: 'Nobody jumps over Tall-nut.',
  },
  pumpkin: {
    name: 'Pumpkin', cls: 'hearty', stats: [100, 6, 9, 7],
    passive: {
      name: 'Pumpkin Patch', desc: 'Each round, shields the most hurt ally for 4% of Pumpkin\'s max HP.',
      roundStart(u) {
        const hurt = alliesOf(u).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (hurt) addShield(hurt, u.maxHp * 0.04);   // was 8%: Pumpkin was far stronger than any other plant
      },
    },
    passive2: { name: 'Hollow Guard', desc: 'When an ally wilts, shields every ally still standing for 4% of Pumpkin\'s max HP.', onAllyFall(u) { for (const a of alliesOf(u)) addShield(a, u.maxHp * 0.04); } },
    learn: [['pump_bash', 1], ['pump_shell', 1], ['pump_grin', 2], ['pump_vines', 4], ['pump_hollow', 5], ['pump_harvest', 7], ['pump_lantern', 10], ['pump_pie', 13]],
    unlock: { how: 'story' }, flavor: 'A plant that wears a plant.',
  },
  garlic: {
    name: 'Garlic', cls: 'hearty', stats: [90, 6, 8, 9],
    passive: {
      name: 'Stinky', desc: 'Enemies that hit Garlic become Weak for a turn.',
      onHurt(u, src) { if (src && src.hp > 0 && src !== u) addStatus(src, 'weak', 1); },
    },
    passive2: { name: 'Pungent', desc: 'Weak enemies do 20% less damage to it (on top of being Weak).', takeMult(u, src) { return src?.st.weak ? 0.8 : 1; } },
    learn: [['gar_breath', 1], ['gar_reek', 1], ['gar_stench', 3], ['gar_clove', 4], ['gar_bitter', 6], ['gar_ward', 8], ['gar_gas', 10], ['gar_bomb', 13]],
    unlock: { how: 'shop', price: 450 }, flavor: 'Smells awful. That\'s the point.',
  },
  spikeweed: {
    name: 'Spikeweed', cls: 'hearty', stats: [64, 9, 8, 11],
    passive: {
      name: 'Spiky', desc: 'Bounces 30% of the damage it takes back. Double damage to vehicles (Zomboni, Catapult).',
      reflect: 0.3,
      dealMult(u, t) { return t.data.vehicle ? 2 : 1; },
    },
    passive2: { name: 'Puncture', desc: 'Its hits pop enemy shields.', onHit(u, t) { if (t.st.shield) { delete t.st.shield; log(`${u.name} pops ${t.name}'s shield!`, 'good'); } } },
    learn: [['spike_prick', 1], ['spike_sharpen', 1], ['spike_strip', 3], ['spike_dig', 4], ['spike_trap', 6], ['spike_field', 8], ['spike_rock', 10], ['spk_wall', 13]],
    unlock: { how: 'rogue' }, flavor: 'Pops tires for fun.',
  },

  // ================= SUNNY =================
  sunflower: {
    name: 'Sunflower', cls: 'sunny', stats: [72, 7, 5, 13],
    passive: {
      name: 'Sunny Disposition', desc: '+10 sun at the start of every round.',
      roundStart(u) { gainSun(u.flags.twin ? 20 : 10, u); },   // 20 after Twin Sunflower
    },
    passive2: { name: 'Parting Gift', desc: 'When it wilts, its team gets 75 sun.', onFall(u) { gainSun(75, u); log(`${u.name} leaves a parting gift: +75 sun.`, 'good'); } },
    learn: [['sun_petal', 1], ['sun_make', 1], ['sun_glow', 2], ['flower_bloom', 4], ['sun_smile', 6], ['flower_revive', 8], ['sun_flare', 10], ['sun_twin', 13]],
    unlock: { how: 'start' }, flavor: 'Always smiling, always making sun.',
  },
  sunshroom: {
    name: 'Sun-shroom', cls: 'sunny', shroom: true, stats: [54, 8, 4, 12],
    passive: {
      name: 'Growing Up', desc: '+5 sun each round. After 3 rounds it grows up: +15 sun each round instead.',
      roundStart(u) {
        if (B.round > 3 && !u.flags.grown) { u.flags.grown = true; log(`${u.name} grew up!`); }
        gainSun(u.flags.grown ? 15 : 5, u);
      },
    },
    passive2: { name: 'Big Cap', desc: 'Once grown up, it takes 20% less damage.', takeMult(u) { return u.flags.grown ? 0.8 : 1; } },
    learn: [['ss_puff', 1], ['ss_spurt', 1], ['ss_glow', 2], ['ss_moon', 4], ['puff_cloud', 6], ['ss_dawn', 8], ['ss_fullmoon', 10], ['ss_beam', 13]],
    unlock: { how: 'story' }, flavor: 'Starts small. Doesn\'t stay small.',
  },
  marigold: {
    name: 'Marigold', cls: 'sunny', stats: [56, 7, 5, 14],
    passive: {
      name: 'Golden', desc: '+50% coins from battles it fights in. 25% chance each round for +20 sun.',
      coinBonus: 0.5,
      roundStart(u) { if (chance(0.25)) gainSun(20, u); },
    },
    passive2: { name: 'Midas Touch', desc: 'Every enemy it defeats gives +25 sun.', onHit(u, t) { if (t.hp <= 0) { gainSun(25, u); log('Midas Touch! +25 sun.', 'good'); } } },
    learn: [['mari_petal', 1], ['mari_bright', 1], ['mari_polish', 2], ['mari_coin', 3], ['flower_bloom', 5], ['flower_revive', 7], ['mari_age', 10], ['mari_rush', 13]],
    unlock: { how: 'shop', price: 300 }, flavor: 'Pretty, and pretty rich.',
  },
  aloe: {
    name: 'Aloe', cls: 'sunny', stats: [62, 6, 6, 12],
    passive: {
      name: 'Soothing', desc: 'Heals itself 8% each round, and its heals are 30% stronger.',
      healBoost: 1.3,
      roundStart(u) { healUnit(u, u.maxHp * 0.08); },
    },
    passive2: { name: 'Spiky Leaves', desc: 'Bounces 15% of the damage it takes back.', reflect: 0.15 },
    learn: [['aloe_spray', 1], ['aloe_squirt', 1], ['aloe_gel', 3], ['aloe_rub', 4], ['aloe_regrow', 6], ['aloe_dew', 8], ['aloe_bath', 10], ['aloe_wrap', 13]],
    unlock: { how: 'shop', price: 350 }, flavor: 'Good for sunburns and zombie bites.',
  },

  // ================= VOLATILE =================
  cherrybomb: {
    name: 'Cherry Bomb', cls: 'volatile', stats: [56, 15, 3, 14],
    passive: {
      name: 'Last Blast', desc: 'When it wilts, it explodes for 12 power on every enemy.',
      // Was 20 power until 2026-11-22 (see kamikaze() above).
      onFall(u) {
        log(`${u.name} goes out with a BANG!`, 'good');
        for (const f of foesOf(u)) hit(u, f, 12, { aoe: true });
      },
    },
    passive2: { name: 'Hair Trigger', desc: 'The first time it drops below 30% HP, it gets Power for 2 turns.', onHurt(u) { if (!u.flags.trigger && u.hp > 0 && u.hp < u.maxHp * 0.3) { u.flags.trigger = true; addStatus(u, 'power', 2); log(`${u.name}'s fuse is lit!`, 'good'); } } },
    learn: [['cherry_fizz', 1], ['cherry_blast', 1], ['boom_fuse', 2], ['cherry_double', 4], ['boom_kaboom', 6], ['cherry_temper', 8], ['cherry_kamikaze', 10], ['cherry_sparkler', 13]],
    unlock: { how: 'story' }, flavor: 'Two cherries, one very short temper.',
  },
  jalapeno: {
    name: 'Jalapeno', cls: 'volatile', stats: [52, 16, 3, 13],
    passive: {
      name: 'Hot Headed', desc: '+50% damage to burning enemies. Careful: its fire melts chill and freeze.',
      dealMult(u, t) { return t.st.burn ? 1.5 : 1; },
    },
    passive2: { name: 'Fireproof', desc: 'Can\'t be burned (so Extra Spicy never hurts it).', immune: ['burn'] },
    learn: [['jal_sauce', 1], ['fire_ignite', 1], ['jal_row', 3], ['jal_wave', 4], ['jal_spicy', 6], ['jal_kick', 8], ['jal_inferno', 10], ['jal_ghost', 13]],
    unlock: { how: 'story' }, flavor: 'Hot. Very hot.',
  },
  squash: {
    name: 'Squash', cls: 'volatile', stats: [76, 17, 6, 7],
    passive: {
      name: 'Grudge', desc: 'When an ally wilts, Squash\'s next attack does double damage.',
      onAllyFall(u) { if (!u.flags.grudge) log(`${u.name} is FURIOUS.`); u.flags.grudge = true; },
      dealMult(u) { return u.flags.grudge ? 2 : 1; },
      afterAttack(u) { u.flags.grudge = false; },
    },
    passive2: { name: 'Heavyweight', desc: 'Can\'t be stunned, frozen or put to sleep.', noStun: true },
    learn: [['sq_leap', 1], ['sq_squash', 1], ['sq_bounce', 2], ['sq_belly', 4], ['sq_slam', 6], ['sq_glare', 8], ['sq_giant', 10], ['sq_mighty', 13]],
    unlock: { how: 'achievement', id: 'untouchable' }, flavor: 'Hmm? HMM!',
  },
  melonpult: {
    name: 'Melon-pult', cls: 'volatile', stats: [72, 17, 5, 5],
    passive: { name: 'Heavy Lob', desc: 'All its attacks are lobbed, and 30% of the damage splashes the other enemies. The slowest attacker.', lobAll: true, splashAll: 0.3 },
    passive2: { name: 'Tough Rind', desc: 'Takes 20% less damage from straight shots.', takeMult(u, src, mv) { return mv.straight ? 0.8 : 1; } },
    learn: [['mel_seed', 1], ['mel_melon', 1], ['mel_rind', 2], ['pult_arc', 4], ['mel_smash', 6], ['mel_juice', 8], ['mel_winter', 10], ['mel_mortar', 13]],
    unlock: { how: 'rogue' }, flavor: 'One melon. Big trouble.',
  },
  fumeshroom: {
    name: 'Fume-shroom', cls: 'volatile', shroom: true, stats: [66, 12, 5, 9],
    passive: { name: 'Fumes', desc: 'All its attacks pierce armor and go through Screen Doors.', pierceAll: true },
    passive2: { name: 'Lingering Fumes', desc: '25% chance its hits Mark the enemy (takes 30% more damage) for a turn.', onHit(u, t) { if (t.hp > 0 && chance(0.25)) addStatus(t, 'marked', 1, { src: u }); } },
    learn: [['fume_puff', 1], ['puff_cloud', 1], ['fume_cloud', 3], ['fume_blast', 4], ['fume_breath', 6], ['fume_storm', 8], ['fume_gloom', 10], ['fume_choke', 13]],
    unlock: { how: 'story' }, flavor: 'Bad breath, armor-proof.',
  },
  bonkchoy: {
    name: 'Bonk Choy', cls: 'volatile', stats: [70, 14, 5, 12],
    passive: {
      name: 'Counterpunch', desc: 'When an enemy hits it, 35% chance to punch back for 6 power.',
      onHurt(u, src) { if (src && src.hp > 0 && src !== u && u.hp > 0 && chance(0.35)) { log(`${u.name} punches back!`); hit(u, src, 6, { counter: true }); } },
    },
    passive2: { name: 'Second Wind', desc: 'The first time it drops below 30% HP, it heals 30%.', onHurt(u) { if (!u.flags.wind && u.hp > 0 && u.hp < u.maxHp * 0.3) { u.flags.wind = true; log(`${u.name} gets a second wind!`, 'good'); healUnit(u, u.maxHp * 0.3); } } },
    learn: [['bonk_rapid', 1], ['bonk_upper', 1], ['bonk_hay', 2], ['bonk_pump', 4], ['bonk_combo', 6], ['bonk_rope', 8], ['bonk_flurry', 10], ['bonk_kick', 13]],
    unlock: { how: 'shop', price: 500 }, flavor: 'Float like a leaf, punch like a cabbage.',
  },

  // ================= GROWERS =================
  chomper: {
    name: 'Chomper', cls: 'grower', stats: [90, 16, 5, 5],
    passive: {
      name: 'Big Appetite', desc: 'Swallowing an enemy with Devour heals it 30%.',
      onDevour(u) { healUnit(u, u.maxHp * 0.3); },
    },
    passive2: { name: 'Leftovers', desc: 'Heals 3% each round.', roundStart(u) { healUnit(u, u.maxHp * 0.03); } },
    learn: [['chomp_bite', 1], ['chomp_devour', 1], ['chomp_burp', 2], ['chomp_drool', 4], ['chomp_snap', 6], ['chomp_lunge', 8], ['chomp_mega', 10], ['chomp_seconds', 13]],
    unlock: { how: 'rogue' }, flavor: 'Chews slowly. Eats anything.',
  },
  hypnoshroom: {
    name: 'Hypno-shroom', cls: 'grower', shroom: true, stats: [58, 8, 5, 13],
    passive: {
      name: 'Mesmerize', desc: 'Zombies that hit it have a 30% chance to be hypnotized for a turn (not bosses).',
      onHurt(u, src) {
        if (!src || !(src.kind === 'zombie' || B.versus) || src.side === u.side || src.hp <= 0 || src.boss) return;
        // Mirror Swirl (its level-13 move) hypnotizes the next attacker for sure.
        if (u.flags.mirror) { u.flags.mirror = false; log(`${src.name} stares into the swirl...`, 'good'); addStatus(src, 'hypno', 2); }
        else if (chance(0.3 + (u.data.passive.mesmerBonus || 0))) addStatus(src, 'hypno', 1);   // 50% with Swirly Aura
      },
    },
    passive2: { name: 'Swirly Aura', desc: 'Mesmerize works 50% of the time instead of 30%.', mesmerBonus: 0.2 },
    learn: [['hyp_swirl', 1], ['hyp_hypno', 1], ['puff_cloud', 2], ['hyp_trance', 4], ['hyp_dazzle', 6], ['hyp_calm', 8], ['hyp_mass', 10], ['hyp_mirror', 13]],
    unlock: { how: 'rogue' }, flavor: 'Look into its eyes...',
  },
  iceshroom: {
    name: 'Ice-shroom', cls: 'grower', shroom: true, stats: [60, 9, 6, 8],
    passive: { name: 'Permafrost', desc: 'Its chills and freezes last 1 turn longer.', icyBonus: 1 },
    passive2: { name: 'Brittle Air', desc: 'Each round, a random enemy becomes Brittle (its next hit taken does 50% more) for 2 turns.', roundStart(u) { const t = pick(foesOf(u)); if (t) addStatus(t, 'brittle', 2, { src: u }); } },
    learn: [['ice_chip', 1], ['frost_snare', 1], ['ice_deep', 2], ['puff_cloud', 4], ['ice_shiver', 6], ['ice_pack', 8], ['ice_shatter', 10], ['ice_grip', 13]],
    unlock: { how: 'rogue' }, flavor: 'Brrr.',
  },
  torchwood: {
    name: 'Torchwood', cls: 'grower', stats: [80, 8, 7, 8],
    passive: { name: 'Flaming Peas', desc: 'While it stands, allies\' straight shots catch fire: +40% damage and a 30% chance to burn.', torch: true },
    passive2: { name: 'Fire Bark', desc: 'Enemies that hit it have a 30% chance to burn for 2 turns.', onHurt(u, src) { if (src && src.hp > 0 && src !== u && chance(0.3)) addStatus(src, 'burn', 2, { src: u }); } },
    learn: [['torch_ember', 1], ['torch_bark', 1], ['torch_bonfire', 2], ['fire_ignite', 4], ['torch_smoke', 6], ['torch_flare', 8], ['torch_lane', 10], ['torch_wild', 13]],
    unlock: { how: 'rogue' }, flavor: 'Best friends with every Peashooter.',
  },
  kernelpult: {
    name: 'Kernel-pult', cls: 'grower', stats: [58, 10, 4, 12],
    passive: { name: 'Butter Luck', desc: 'All its attacks are lobbed and have a 25% chance to butter (stun) for a turn.', lobAll: true, butter: 0.25 },
    passive2: { name: 'Extra Butter', desc: 'Butter Luck goes up to a 35% chance.', butter: 0.1 },
    learn: [['ker_kernel', 1], ['ker_husk', 1], ['ker_butter', 2], ['pult_arc', 4], ['ker_pop', 6], ['ker_slick', 8], ['ker_cob', 10], ['kern_pop', 13]],
    unlock: { how: 'story' }, flavor: 'Corn or butter? It\'s a surprise.',
  },
  potatomine: {
    name: 'Potato Mine', cls: 'grower', stats: [48, 16, 4, 10],
    passive: {
      name: 'Buried', desc: 'Armed at the start of each wave. The first enemy to hit it takes a 25-power blast that pierces armor.',
      waveStart(u) { u.flags.armed = true; },
      onHurt(u, src) {
        if (u.flags.armed && src && src.hp > 0 && src !== u) {
          u.flags.armed = false;
          log('SPUDOW! The mine goes off!', 'good');
          hit(u, src, 25, { pierce: true, counter: true });
          if (u.data.passive.mineStun && src.hp > 0) addStatus(src, 'stun', 1, { src: u, label: 'Blasted' });   // Stun Mine
        }
      },
    },
    passive2: { name: 'Stun Mine', desc: 'Its Buried blast also stuns the enemy for a turn.', mineStun: true },
    learn: [['pm_pop', 1], ['pm_rearm', 1], ['pm_spudow', 2], ['boom_fuse', 4], ['pm_dirt', 6], ['pm_burrow', 8], ['pm_field', 10], ['pm_mash', 13]],
    unlock: { how: 'story' }, flavor: 'Step on it. We dare you.',
  },

  // ================= FROM ACROSS THE SERIES =================
  // (Plants vs. Zombies 2 and Garden Warfare. Found in the Time Rift,
  // in the shop and through an achievement.)
  bloomerang: {
    name: 'Bloomerang', cls: 'shooter', stats: [62, 12, 4, 14],
    passive: { name: 'Comeback', desc: 'Its attacks on one enemy bounce on to 2 other enemies for 40% damage.', ricochet: 0.4 },
    passive2: { name: 'Wide Arc', desc: 'Comeback bounces to 3 other enemies instead of 2.', extraBounce: 1 },
    learn: [['bloom_throw', 1], ['bloom_wind', 1], ['bloom_spin', 3], ['bloom_curve', 5], ['bloom_catch', 6], ['bloom_storm', 8], ['bloom_tornado', 10], ['bloom_return', 13]],
    unlock: { how: 'story' }, flavor: 'What goes around comes around. Usually into a zombie.',
  },
  laserbean: {
    name: 'Laser Bean', cls: 'shooter', stats: [58, 11, 4, 12],
    passive: { name: 'Beam', desc: 'Its attacks on one enemy hit EVERY enemy instead, but at half power, and they never land critical hits.', beam: 0.5 },
    passive2: { name: 'Focusing Lens', desc: 'Beam hits the enemy it aims at with FULL power (the others still take half).', lens: true },
    learn: [['laser', 1], ['laser_scope', 1], ['laser_burst', 3], ['laser_deflect', 5], ['laser_focus', 6], ['future_overclock', 8], ['laser_ray', 10], ['laser_scorch', 13]],
    unlock: { how: 'story' }, flavor: 'From the future. Still a bean.',
  },
  citron: {
    name: 'Citron', cls: 'hearty', stats: [96, 10, 7, 8],
    passive: {
      name: 'Peel Shield', desc: 'Starts every wave with a shield of 25% of its max HP. Hits harder than other Hearty plants.',
      waveStart(u) { addShield(u, u.maxHp * 0.25); },
    },
    passive2: { name: 'Citrus Burst', desc: 'Starts every wave with Power for 2 turns.', waveStart(u) { addStatus(u, 'power', 2); } },
    learn: [['cit_plasma', 1], ['cit_lock', 1], ['cit_charge', 3], ['cit_peel', 4], ['cit_cover', 6], ['future_overclock', 8], ['cit_overload', 10], ['cit_hunter', 13]],
    unlock: { how: 'shop', price: 600 }, flavor: 'A bounty-hunting orange from the future.',
  },
  infinut: {
    name: 'Infi-nut', cls: 'hearty', stats: [110, 6, 9, 7],
    passive: {
      name: 'Holo-Rebuild', desc: 'The first time it wilts in a battle, it rebuilds itself 2 rounds later with half its HP.',
      onFall(u) {
        // Once per battle, or twice with Infinite Rebuild.
        if ((u.flags.rebuilt || 0) >= 1 + (u.data.passive.extraRebuild || 0)) return;
        u.flags.rebuilt = (u.flags.rebuilt || 0) + 1;
        u.flags.rebuildAt = B.round + 2;
        log(`${u.name}'s hologram flickers... it will rebuild!`, 'good');
      },
    },
    passive2: { name: 'Infinite Rebuild', desc: 'Holo-Rebuild works twice per battle.', extraRebuild: 1 },
    learn: [['infi_zap', 1], ['infi_lure', 1], ['infi_barrier', 3], ['nut_shell', 4], ['infi_project', 6], ['future_overclock', 8], ['infi_infinite', 10], ['inf_decoy', 13]],
    unlock: { how: 'story' }, flavor: 'A wall-nut made of light. Hard to get rid of.',
  },
  goldbloom: {
    name: 'Gold Bloom', cls: 'sunny', stats: [50, 6, 4, 15],
    passive: {
      name: 'Golden Burst', desc: '+100 sun in the first round of every battle, and no sun after that.',
      roundStart(u) { if (B.round === 1) { gainSun(100, u); log(`${u.name} bursts with gold! +100 sun.`, 'good'); } },
    },
    passive2: { name: 'Shimmer', desc: 'Allies it heals also get a shield of 5% of Gold Bloom\'s max HP.', onHeal(u, t) { addShield(t, u.maxHp * 0.05); } },
    learn: [['gold_flash', 1], ['gold_glint', 1], ['gold_shower', 3], ['gold_gleam', 4], ['flower_revive', 6], ['flower_bloom', 8], ['gold_reburst', 10], ['gold_ray', 13]],
    unlock: { how: 'achievement', id: 'sunnyside' }, flavor: 'Blooms once. Blooms BIG.',
  },
  sunbean: {
    name: 'Sun Bean', cls: 'sunny', stats: [80, 6, 7, 9],
    passive: {
      name: 'Sunny Bruise', desc: 'Every time an enemy hits it, you get 10 sun. Tougher than other Sunny plants, but makes no sun on its own.',
      onHurt(u, src) { if (src) gainSun(10, u); },
    },
    passive2: { name: 'Solar Skin', desc: 'Takes 15% less damage while its team has 200 sun or more.', takeMult(u) { return B.suns[u.side] >= 200 ? 0.85 : 1; } },
    learn: [['bean_bonk', 1], ['bean_bait', 1], ['bean_shine', 2], ['bean_sprout', 4], ['bean_huddle', 6], ['bean_skin', 8], ['bean_fortress', 10], ['bean_stalk', 13]],
    unlock: { how: 'shop', price: 400 }, flavor: 'Hit it. Go on. It wants you to.',
  },
  snapdragon: {
    name: 'Snapdragon', cls: 'volatile', stats: [64, 14, 4, 11],
    passive: { name: 'Firebreather', desc: 'Its fire attacks on one enemy also scorch one more enemy for 50%, and its burns last a turn longer.', scorch: 0.5 },
    passive2: { name: 'Dragon Heart', desc: 'Its fire attacks heal it for 15% of the damage they deal.', onHit(u, t, dmg, mv) { if (mv.fire) healUnit(u, dmg * 0.15); } },
    learn: [['snap_breath', 1], ['fire_ignite', 1], ['snap_inferno', 3], ['snap_bite', 4], ['snap_stoke', 6], ['snap_roar', 8], ['snap_storm', 10], ['snap_tail', 13]],
    unlock: { how: 'story' }, flavor: 'A dragon. A small one. Still a dragon.',
  },
  coconut: {
    name: 'Coconut Cannon', cls: 'volatile', stats: [70, 18, 5, 6],
    passive: {
      name: 'Loaded', desc: 'Its first attack each wave does double damage. Very slow.',
      waveStart(u) { u.flags.loaded = true; },
      dealMult(u) { return u.flags.loaded ? 2 : 1; },
      afterAttack(u) { u.flags.loaded = false; },
    },
    passive2: { name: 'Powder Keg', desc: 'When it wilts, it fires one last coconut (20 power) at the healthiest enemy.', onFall(u) { const t = foesOf(u).sort((a, b) => b.hp - a.hp)[0]; if (t) { log(`${u.name} fires one last coconut!`, 'good'); hit(u, t, 20, { aoe: true }); } } },
    learn: [['coco_shot', 1], ['coco_cannon', 1], ['boom_fuse', 3], ['coco_broadside', 4], ['boom_kaboom', 6], ['coco_reload', 8], ['coco_full', 10], ['coco_grape', 13]],
    unlock: { how: 'rogue' }, flavor: 'Arr! One shot, one zombie.',
  },
  iceberg: {
    name: 'Iceberg Lettuce', cls: 'grower', stats: [56, 8, 5, 13],
    passive: {
      name: 'Cold Feet', desc: 'The first enemy to hit it each wave is frozen for a turn.',
      waveStart(u) { u.flags.icy = true; },
      onHurt(u, src) {
        if (u.flags.icy && src && src.hp > 0 && src !== u) {
          u.flags.icy = false;
          log(`${src.name} stepped on ${u.name}!`, 'good');
          addStatus(src, 'freeze', 1, { src: u });
        }
      },
    },
    passive2: { name: 'Cracking Cold', desc: 'Enemies it freezes also become Brittle (their next hit taken does 50% more) for 2 turns.', brittleFreeze: true },
    learn: [['berg_chip', 1], ['berg_freeze', 1], ['frost_snare', 2], ['berg_slide', 4], ['berg_crunch', 6], ['berg_chill', 8], ['berg_glacier', 10], ['ice_avalanche', 13]],
    unlock: { how: 'story' }, flavor: 'Cold, crunchy and slippery.',
  },
  empeach: {
    name: 'E.M.Peach', cls: 'grower', stats: [60, 9, 5, 12],
    passive: {
      name: 'EMP', desc: 'Double damage to machines (vehicles and robots), and machines can never shrug off its stuns.',
      emp: true,
      dealMult(u, t) { return t.data.vehicle ? 2 : 1; },
    },
    passive2: { name: 'Overcharged', desc: '+50% damage to stunned, frozen or Silenced enemies.', dealMult(u, t) { return t.st.stun || t.st.freeze || t.st.silence ? 1.5 : 1; } },
    learn: [['emp_zap', 1], ['emp_short', 1], ['emp_pulse', 3], ['emp_static', 4], ['emp_overload', 6], ['emp_recharge', 8], ['emp_blackout', 10], ['emp_brown', 13]],
    unlock: { how: 'rogue' }, flavor: 'Robots hate this peach.',
  },

  // ================= ACHIEVEMENT PLANTS =================
  lightningreed: {
    name: 'Lightning Reed', cls: 'shooter', stats: [56, 12, 3, 16],
    passive: {
      name: 'Overcharge', desc: 'Every attack adds a charge. At 3 charges its next attack does 50% more and stuns, then the charges reset.',
      dealMult(u) { return (u.flags.charge || 0) >= chargeNeed(u) ? 1.5 : 1; },
      // Lightning Rod (its level-13 move): hits taken while it Taunts add charges.
      onHurt(u) { if (u.flags.rod && u.st.taunt) u.flags.charge = Math.min(chargeNeed(u), (u.flags.charge || 0) + 1); },
      afterAttack(u, t) {
        if ((u.flags.charge || 0) >= chargeNeed(u)) {
          u.flags.charge = 0;
          if (t && t !== u && t.hp > 0) addStatus(t, 'stun', 1, { src: u, label: 'Shocked' });
        } else {
          u.flags.charge = (u.flags.charge || 0) + 1;
        }
      },
    },
    passive2: { name: 'Supercell', desc: 'Overcharge only needs 2 charges.', quickCharge: 1 },
    learn: [['lr_zap', 1], ['lr_static', 1], ['lr_storm', 2], ['lr_chain', 4], ['lr_clap', 6], ['lr_jump', 8], ['lr_superstorm', 10], ['lr_rod', 13]],
    unlock: { how: 'achievement', id: 'stormchaser' }, flavor: 'Crackles when it\'s happy. It\'s always crackling.',
  },
  magnetshroom: {
    name: 'Magnet-shroom', cls: 'grower', shroom: true, stats: [62, 9, 5, 11],
    passive: {
      name: 'Magnetic', desc: 'Its hits pull off a quarter of an enemy\'s METAL armor (buckets, helmets, doors, robots). +10% damage for each piece it has pulled off this battle (up to +60%).',
      dealMult(u) { return 1 + 0.1 * Math.min(6, u.flags.metal || 0); },
      onHit(u, t) { if (t.hp > 0) ripMetal(u, t, t.armorMax * 0.25); },
    },
    passive2: { name: 'Strong Field', desc: 'Each round, it tugs a little metal off a random armored enemy.', roundStart(u) { const t = pick(foesOf(u).filter(x => x.armor > 0)); if (t) ripMetal(u, t, t.armorMax * 0.1); } },
    learn: [['mag_junk', 1], ['mag_pull', 1], ['puff_cloud', 2], ['mag_scrap', 4], ['mag_flip', 6], ['mag_attract', 8], ['mag_storm', 10], ['mag_recycle', 13]],
    unlock: { how: 'achievement', id: 'scrapper' }, flavor: 'Loves metal. Keeps all of it.',
  },
  umbrellaleaf: {
    name: 'Umbrella Leaf', cls: 'hearty', stats: [92, 6, 9, 8],
    passive: { name: 'Umbrella', desc: 'Catches every lobbed enemy attack meant for the team (basketballs, Bungee Zombies) and takes it at half damage.', umbrella: true },
    passive2: { name: 'Wide Brim', desc: 'Umbrella takes lobbed attacks at a quarter damage instead of half.', wideBrim: true },
    learn: [['um_slap', 1], ['um_open', 1], ['um_rain', 2], ['um_bounce', 4], ['um_shade', 6], ['um_pour', 8], ['um_fort', 10], ['umb_rain', 13]],
    unlock: { how: 'achievement', id: 'dunk' }, flavor: 'Always ready for a rainy day. Or a basketball.',
  },
  // ================= REALM PLANTS =================
  // (Part 2, batch 1, 2026-11-22.) Won from the mini realms' bosses. Each is a
  // real plant from one of the odder official games.
  kernelcorn: {
    name: 'Kernel Corn', cls: 'shooter', stats: [62, 13, 4, 14],
    passive: {
      name: 'Butter Barrage', desc: 'Every 3rd attack calls in a Butter Barrage: every enemy takes 5 power, and each has a 25% chance to be buttered (stunned).',
      afterAttack(u) {
        u.flags.barrage = (u.flags.barrage || 0) + 1;
        if (u.flags.barrage < 3) return;
        u.flags.barrage = 0;
        log('BUTTER BARRAGE!', 'good');
        for (const f of foesOf(u)) if (hit(u, f, 5, { aoe: true, lob: true }) > 0 && chance(0.25)) addStatus(f, 'stun', 1, { src: u, label: 'Buttered' });
      },
    },
    passive2: { name: 'Air Support', desc: 'When it wilts, it calls in one last Shuck Shot: every enemy takes 10 power.', onFall(u) { log(`${u.name} calls in air support!`, 'good'); for (const f of foesOf(u)) hit(u, f, 10, { aoe: true }); } },
    learn: [['kc_cob', 1], ['kc_hop', 1], ['kc_butter', 2], ['kc_spray', 4], ['kc_grenade', 6], ['kc_salute', 8], ['kc_shuck', 10], ['kc_lock', 13]],
    unlock: { how: 'story' }, flavor: 'A commando from Garden Warfare. Butter makes everything better, especially airstrikes.',
  },
  spartichoke: {
    name: 'Spartichoke', cls: 'hearty', stats: [100, 11, 7, 8],
    passive: { name: 'Spartan', desc: '+50% damage to enemies wearing armor. Hits harder than most Hearty plants.', dealMult(u, t) { return t.armor > 0 ? 1.5 : 1; } },
    passive2: { name: 'Shield Wall', desc: 'Starts every wave Guarding for 2 turns.', waveStart(u) { addStatus(u, 'guard', 2); } },
    learn: [['sp_jab', 1], ['sp_shield', 1], ['sp_spear', 2], ['sp_charge', 4], ['sp_sparta', 6], ['sp_phalanx', 8], ['sp_kick', 10], ['sp_volley', 13]],
    unlock: { how: 'story' }, flavor: 'From Plants vs. Zombies 2 and Heroes. Tonight, it dines in the garden!',
  },
  waterchestnut: {
    name: 'Water Chestnut', cls: 'hearty', stats: [120, 6, 9, 7],
    passive: { name: 'Amphibious', desc: 'Any of its attacks can reach diving or dug-in zombies, and in Pool battles it takes 20% less damage.', amphibious: true, takeMult() { return B.g.has('pool') ? 0.8 : 1; } },
    passive2: { name: 'Waterlogged', desc: 'Heals 4% each round (8% in Pool battles).', roundStart(u) { healUnit(u, u.maxHp * (B.g.has('pool') ? 0.08 : 0.04)); } },
    learn: [['wc_bonk', 1], ['wc_bob', 1], ['wc_splash', 2], ['wc_cover', 4], ['wc_tide', 6], ['wc_whirl', 8], ['wc_tsunami', 10], ['wc_wall', 13]],
    unlock: { how: 'story' }, flavor: 'From Plants vs. Zombies Heroes. Happiest in the water. Grumpiest out of it.',
  },
  shamrocket: {
    name: 'Shamrocket', cls: 'volatile', stats: [54, 15, 3, 15],
    passive: { name: 'Lucky Launch', desc: '25% chance for any hit to do double damage (a lucky clover!).', dealMult(u) { if (chance(0.25 + (u.data.passive.luck || 0))) { log('Lucky!', 'good'); return 2; } return 1; } },
    passive2: { name: 'Four-Leaf', desc: 'Lucky Launch happens 40% of the time.', luck: 0.15 },
    learn: [['sham_pop', 1], ['sham_launch', 1], ['sham_trail', 2], ['sham_gold', 4], ['sham_orbit', 6], ['sham_meteor', 8], ['sham_moon', 10], ['sham_rainbow', 13]],
    unlock: { how: 'story' }, flavor: 'From Plants vs. Zombies Heroes. A clover with a rocket strapped on. What could go wrong?',
  },
};
const PLANT_ORDER = Object.keys(PLANTS);

/* ---- Zombies ------------------------------------------------------------------
   stats: [max HP, attack, defense, speed] at level 1.
   armor: [points, kind]. Armor soaks up damage before HP, unless the
          attack pierces. 'door' armor is skipped by lobbed attacks.
   vehicle: Spikeweed does double damage to it.
   boss: can't be devoured or hypnotized, shrugs off stuns half the time.
*/
const ZOMBIES = {
  zombie:   { name: 'Zombie', stats: [40, 9, 4, 8], moves: ['z_bite'], coins: 5, desc: 'Your everyday zombie.' },
  flag:     { name: 'Flag Zombie', stats: [40, 9, 4, 11], moves: ['z_bite', 'z_rally'], coins: 8, desc: 'Waves its flag to Power up the others.' },
  cone:     { name: 'Conehead', stats: [40, 9, 4, 8], armor: [35, 'cone'], moves: ['z_bite'], coins: 7, desc: 'A traffic cone makes it tougher.' },
  bucket:   { name: 'Buckethead', stats: [40, 9, 4, 7], armor: [75, 'bucket'], moves: ['z_bite'], coins: 10, desc: 'A bucket makes it MUCH tougher. Pierce it!' },
  paper:    {
    name: 'Newspaper Zombie', stats: [40, 8, 4, 8], armor: [25, 'paper'], moves: ['z_paper'], coins: 8,
    desc: 'Break its paper and it gets angry: permanent Power and much faster.',
    passive: { name: 'Enraged', armorBreak(u) { log(`${u.name} is ENRAGED!`, 'bad'); u.st.power = 99; u.spd += 8; } },
  },
  pole:     { name: 'Pole Vaulter', stats: [45, 10, 3, 16], moves: ['z_bite', 'z_vault'], coins: 8, desc: 'Vaults over taunting plants to hit your back line.' },
  football: { name: 'Football Zombie', stats: [50, 12, 6, 13], armor: [80, 'helmet'], moves: ['z_tackle', 'z_charge'], coins: 14, desc: 'Fast, armored and hits hard.' },
  dancer:   { name: 'Dancing Zombie', stats: [55, 10, 4, 12], moves: ['z_bite', 'z_backup'], coins: 12, desc: 'Calls in backup dancers.' },
  backup:   { name: 'Backup Dancer', stats: [28, 8, 3, 10], moves: ['z_bite'], coins: 2, desc: 'Here for the dance.' },
  door:     { name: 'Screen Door Zombie', stats: [40, 9, 4, 7], armor: [70, 'door'], moves: ['z_door'], coins: 10, desc: 'Its door blocks shots. Lobbed attacks go right over it.' },
  imp:      { name: 'Imp', stats: [26, 11, 2, 19], moves: ['z_scratch'], coins: 4, desc: 'Tiny, fast, and goes for your weakest plant.' },
  snorkel:  {
    name: 'Snorkel Zombie', stats: [42, 10, 4, 10], moves: ['z_bite'], coins: 9,
    desc: 'Dives underwater every other round. Only lobs and hit-everyone attacks reach it then.',
    passive: { name: 'Dive', roundStart(u) { u.flags.under = B.round % 2 === 1; if (u.flags.under) log(`${u.name} dives under!`); } },
  },
  dolphin:  { name: 'Dolphin Rider', stats: [48, 11, 3, 17], moves: ['z_bite', 'z_leap'], coins: 10, desc: 'Leaps over taunting plants.' },
  digger:   {
    name: 'Digger Zombie', stats: [42, 10, 5, 10], moves: ['z_pick'], coins: 10,
    desc: 'Tunnels underground: straight shots do half damage. Digs up behind your team.',
    passive: { name: 'Tunnel', takeMult(u, src, mv) { return mv && mv.straight && !mv.lob ? 0.5 : 1; } },
  },
  jack:     {
    name: 'Jack-in-the-Box', stats: [44, 9, 4, 11], moves: ['z_bite'], coins: 12,
    desc: 'Explodes on its 3rd turn, hitting your whole team. Defeat it first!',
    passive: {
      name: 'Pop Goes', turnStart(u) {
        u.flags.ticks = (u.flags.ticks || 0) + 1;
        if (u.flags.ticks === 2) log(`${u.name}'s music is speeding up...`, 'bad');
        if (u.flags.ticks >= 3) {
          log(`POP! ${u.name} explodes!`, 'bad');
          for (const p of foesOf(u)) hit(u, p, 22, { aoe: true });
          u.hp = 0; fallUnit(u, null, true);
          return 'skip';
        }
      },
    },
  },
  bungee:   { name: 'Bungee Zombie', stats: [36, 8, 3, 14], moves: ['z_bite', 'z_snatch'], coins: 9, desc: 'Drops in and snatches shields and buffs.' },
  catapult: { name: 'Catapult Zombie', stats: [60, 11, 6, 6], vehicle: true, moves: ['z_ball'], coins: 12, desc: 'Lobs basketballs at random plants.' },
  zomboni:  {
    name: 'Zomboni', stats: [70, 13, 7, 9], vehicle: true, moves: ['z_runover', 'z_icetrail'], coins: 20,
    desc: 'Leaves an icy trail that chills your team. Can\'t be chilled or frozen itself.',
    passive: { name: 'Ice Machine', immune: ['chill', 'freeze'] },
  },
  gargantuar: {
    name: 'Gargantuar', stats: [90, 18, 7, 6], moves: ['z_smash', 'z_imptoss', 'z_pound'], coins: 40,
    desc: 'Huge. Smashes plants and throws Imps.',
    passive: { name: 'Big Throw', onHurt(u) { if (!u.flags.threw && u.hp > 0 && u.hp < u.maxHp / 2) { u.flags.threw = true; log(`${u.name} throws its Imp!`); summon(u, ['imp']); } } },
  },
  yeti:     { name: 'Zombie Yeti', stats: [80, 14, 6, 10], moves: ['z_snow', 'z_blizzard'], coins: 60, desc: 'Rarely seen. Very cold. Very rich.' },
  zomboss:  {
    name: 'Dr. Zomboss', stats: [90, 14, 8, 9], armor: [70, 'mech'], vehicle: true, moves: ['z_stomp', 'z_fire', 'z_ice', 'z_horde'], coins: 150,
    desc: 'The evil genius in his giant robot. Calls in zombies and gets furious at half health.',
    passive: { name: 'Zombot', onHurt(u) { if (!u.flags.mad && u.hp > 0 && u.hp < u.maxHp / 2) { u.flags.mad = true; u.st.power = 3; u.spd += 4; log('Dr. Zomboss is FURIOUS! Power for 3 turns!', 'bad'); } } },
  },

  // ---- From across the series (PvZ 2, Garden Warfare, Heroes) ----
  mummy: {
    name: 'Mummy Zombie', stats: [48, 10, 5, 8], moves: ['z_bite', 'z_wrap'], coins: 10,
    desc: 'Wraps plants in bandages so they can\'t move.',
    counter: 'Its dry wraps burn easily: fire does double damage.',
    passive: { name: 'Dry Wraps', takeMult(u, src, mv) { return mv.fire ? 2 : 1; } },
  },
  explorer: {
    name: 'Explorer Zombie', stats: [46, 11, 4, 10], moves: ['z_torch'], coins: 11,
    desc: 'Its torch burns plants and burns right through shields.',
    counter: 'Chill or freeze it once and its torch goes out for good.',
    passive: {
      name: 'Torch', onStatus(u, name) {
        if ((name === 'chill' || name === 'freeze') && !u.flags.torchOut) { u.flags.torchOut = true; log(`${u.name}'s torch goes out!`, 'good'); }
      },
    },
  },
  ra: {
    name: 'Ra Zombie', stats: [44, 9, 4, 11], moves: ['z_bite', 'z_sunsteal'], coins: 12,
    desc: 'Steals sun with its staff.',
    counter: 'Defeat it to get every stolen sun back. Spend your sun before it steals it!',
    passive: {
      name: 'Sun Staff', onFall(u) {
        if (u.flags.stolen) { log(`${u.name} drops ${u.flags.stolen} stolen sun!`, 'good'); gainSun(u.flags.stolen); }
      },
    },
  },
  pianist: {
    name: 'Pianist Zombie', stats: [60, 9, 5, 7], moves: ['z_piano', 'z_ragtime'], coins: 12,
    desc: 'Plays ragtime that Powers up every zombie.',
    counter: 'Defeat it and the music stops: every zombie loses its Power.',
    passive: {
      name: 'Ragtime', onFall(u) {
        for (const z of alliesOf(u)) if (z.st.power && z.st.power < 50) delete z.st.power;
        log('The music stops!', 'good');
      },
    },
  },
  swash: {
    name: 'Swashbuckler Zombie', stats: [46, 11, 4, 15], moves: ['z_bite', 'z_swing'], coins: 10,
    desc: 'Swings in on a rope over your front line.',
    counter: 'Taunt can\'t stop its swing, but a Tall-nut is too tall to swing over.',
  },
  impcannon: {
    name: 'Imp Cannon', stats: [50, 12, 6, 6], vehicle: true, moves: ['z_cannon', 'z_imptoss'], coins: 14,
    desc: 'Blasts your whole team and fires Imps.',
    counter: 'When it\'s defeated it backfires, hurting every other zombie.',
    passive: {
      name: 'Backfire', onFall(u) {
        log(`${u.name} backfires!`, 'good');
        for (const z of alliesOf(u)) hit(u, z, 15, { aoe: true, counter: true });
      },
    },
  },
  hunter: {
    name: 'Hunter Zombie', stats: [48, 10, 4, 10], moves: ['z_bite', 'z_freezeball'], coins: 11,
    desc: 'Throws snowballs that freeze plants solid.',
    counter: 'A chilled Hunter can\'t throw snowballs.',
  },
  wizard: {
    name: 'Wizard Zombie', stats: [42, 9, 3, 10], moves: ['z_bite', 'z_sheep'], coins: 13,
    desc: 'Turns plants into sheep.',
    counter: 'Cleanse turns a sheep back. Defeating the Wizard frees every sheep.',
    passive: {
      name: 'Sheep Magic', onFall(u) {
        for (const p of B.plants) if (p.st.sheep) { delete p.st.sheep; log(`${p.name} turns back into a plant!`, 'good'); }
      },
    },
  },
  king: {
    name: 'King Zombie', stats: [60, 7, 5, 6], moves: ['z_scepter', 'z_knight'], coins: 14,
    desc: 'Knights plain zombies, giving them armor. Barely fights himself.',
    counter: 'Defeat him first, before he makes a whole army of Knights.',
  },
  glitter: {
    name: 'Glitter Zombie', stats: [44, 9, 4, 13], moves: ['z_bite', 'z_rainbow'], coins: 12,
    desc: 'Its rainbow trail protects another zombie from single attacks.',
    counter: 'Hit-everyone attacks go straight through the rainbow.',
  },
  punk: {
    name: 'Punk Zombie', stats: [50, 12, 4, 12], moves: ['z_kick'], coins: 11,
    desc: 'Kicks off shields and Taunt.',
    counter: 'Its mohawk is a big target: lobbed attacks do 50% more.',
    passive: { name: 'Mosh', takeMult(u, src, mv) { return mv.lob ? 1.5 : 1; } },
  },
  raptor: {
    name: 'Zombie Raptor', stats: [34, 11, 3, 22], moves: ['z_pounce'], coins: 9,
    desc: 'Super fast. Pounces twice on your weakest plant.',
    counter: 'Very fragile, and chill slows it right down. Taunt still works on it.',
  },
  jetpack: {
    name: 'Jetpack Zombie', stats: [44, 10, 3, 15], moves: ['z_swoop'], coins: 11,
    desc: 'Flies over your team. Dodges half of all straight shots.',
    counter: 'Lobbed attacks always hit it and do 50% more.',
    passive: { name: 'Flying', dodgeStraight: 0.5, takeMult(u, src, mv) { return mv.lob ? 1.5 : 1; } },
  },
  shieldz: {
    name: 'Shield Zombie', stats: [56, 8, 6, 7], vehicle: true, moves: ['z_bite', 'z_forcefield'], coins: 13,
    desc: 'A robot that puts force fields on every other zombie.',
    counter: 'Defeat it and every force field vanishes. It\'s a machine, so E.M.Peach and Spikeweed hurt it extra.',
    passive: { name: 'Generator', onFall(u) { for (const z of alliesOf(u)) delete z.st.shield; log('The force fields flicker out!', 'good'); } },
  },
  engineer: {
    name: 'Engineer Zombie', stats: [52, 10, 5, 9], moves: ['z_jackhammer', 'z_patch'], coins: 12,
    desc: 'Repairs the armor of other zombies.',
    counter: 'Armor-piercing attacks make his repairs useless.',
  },
  scientist: {
    name: 'Scientist Zombie', stats: [46, 8, 4, 11], moves: ['z_labzap', 'z_healstation'], coins: 12,
    desc: 'Heals every zombie with a heal station.',
    counter: 'Burning zombies can\'t be healed. Set them on fire!',
  },
  brainz: {
    name: 'Super Brainz', stats: [70, 15, 6, 11], moves: ['z_heroic', 'z_supercharge'], coins: 30,
    desc: 'A zombie superhero. Charges up a Brainz Beam that hits your whole team.',
    counter: 'While he\'s CHARGING, stun or freeze him to cancel the beam. Or Guard up!',
  },
  tomorrowtron: {
    name: 'Zombot Tomorrow-tron', stats: [85, 15, 8, 10], armor: [80, 'robo'], vehicle: true,
    moves: ['z_stomp', 'z_laser', 'z_future', 'z_sheepray'], coins: 200,
    desc: 'Dr. Zomboss\'s robot from the far future. Lasers, sheep rays and future zombies.',
    counter: 'Pierce its armor. It\'s a machine: E.M.Peach\'s stuns always work on it.',
    passive: { name: 'Future Fury', onHurt(u) { if (!u.flags.mad && u.hp > 0 && u.hp < u.maxHp / 2) { u.flags.mad = true; u.st.power = 3; log('Tomorrow-tron overclocks! Power for 3 turns!', 'bad'); } } },
  },

  // ---- More variety (added 2026-11-22, checked against the wiki's pictures) ----
  ladder: {
    name: 'Ladder Zombie', stats: [48, 10, 5, 9], armor: [55, 'ladder'], moves: ['z_ladderbash'], coins: 12,
    desc: 'Carries a metal ladder. While it has it, EVERY zombie climbs right over your taunting plants.',
    counter: 'Break the ladder, or have Magnet-shroom pull it off. Then Taunt works again.',
    passive: { name: 'Ladder', ladder: true },
  },
  balloon: {
    name: 'Balloon Zombie', stats: [40, 9, 4, 12], moves: ['z_bite'], coins: 10,
    desc: 'Floats above the lawn on a balloon: takes only 25% damage until the balloon pops.',
    counter: 'Any piercing attack (Cactus, Spikeweed, Fume-shroom...) or lob pops the balloon.',
    passive: {
      name: 'Floating', takeMult(u, src, mv) {
        if (u.flags.popped) return 1;
        if (mv.pierce || mv.lob) { u.flags.popped = true; log(`POP! ${u.name}'s balloon bursts!`, 'good'); return 1; }
        return 0.25;
      },
    },
  },
  pogo: {
    name: 'Pogo Zombie', stats: [44, 10, 4, 14], armor: [35, 'pogo'], moves: ['z_bite', 'z_pogo'], coins: 11,
    desc: 'Bounces over your front line on a metal pogo stick.',
    counter: 'A Tall-nut stops the bounce. Break the pogo stick, or have Magnet-shroom take it, and it can\'t bounce.',
  },
  bobsled: {
    name: 'Zombie Bobsled Team', stats: [56, 9, 5, 17], vehicle: true, moves: ['z_bite', 'z_sled'], coins: 14,
    desc: 'Four zombies on a sled, sliding into your whole team. Chilled plants take double from them.',
    counter: 'It\'s a vehicle: Spikeweed and E.M.Peach wreck it. Cleanse chill off your plants first.',
    passive: { name: 'Ice Slide', dealMult(u, t) { return t.st.chill || t.st.freeze ? 2 : 1; } },
  },
  troglobite: {
    name: 'Troglobite', stats: [50, 11, 5, 7], armor: [90, 'ice'], moves: ['z_club', 'z_iceshove'], coins: 14,
    desc: 'A caveman pushing a giant block of ice that chills your plants.',
    counter: 'Any FIRE attack melts the whole ice block at once.',
    passive: {
      name: 'Ice Block', onHurt(u, src, dmg, mv) {
        if (mv.fire && u.armor > 0) { u.armor = 0; log(`${u.name}'s ice block melts away!`, 'good'); }
      },
    },
  },
  prospector: {
    name: 'Prospector Zombie', stats: [46, 11, 4, 11], moves: ['z_pick', 'z_dynamite'], coins: 13,
    desc: 'Once per battle, a dynamite jump onto your BACK plant for big damage.',
    counter: 'Set it on fire before it jumps: the fuse lights early and the dynamite blows up on it instead.',
    passive: {
      name: 'Dynamite', onStatus(u, name) {
        if (name === 'burn' && !u.flags.fuseOut) {
          u.flags.fuseOut = true;
          log(`${u.name}'s dynamite goes off in its hands!`, 'good');
          zap(u, u.maxHp * 0.3, 'is blown up by its own dynamite');
        }
      },
    },
  },
  wrangler: {
    name: 'Chicken Wrangler', stats: [50, 9, 4, 10], moves: ['z_lasso'], coins: 12,
    desc: 'The first time it\'s hit, three Zombie Chickens run loose.',
    counter: 'Hit-everyone attacks clean up chickens. Or defeat it in one big hit.',
    passive: { name: 'Chickens!', onHurt(u) { if (!u.flags.loose && u.hp > 0) { u.flags.loose = true; log('The chickens get loose!', 'bad'); summon(u, ['chicken', 'chicken', 'chicken']); } } },
  },
  chicken: {
    name: 'Zombie Chicken', stats: [12, 7, 1, 24], moves: ['z_peck'], coins: 1,
    desc: 'Tiny, fast and pecks your weakest plant.',
    counter: 'Anything that hits everyone.',
  },
  octo: {
    name: 'Octo Zombie', stats: [48, 10, 5, 9], moves: ['z_bite', 'z_octo'], coins: 12,
    desc: 'Throws an octopus that wraps a plant up for 2 turns.',
    counter: 'Cleanse unwraps the plant, and Garlic\'s Ward stops the octopus from sticking.',
  },
  boombox: {
    name: 'Boombox Zombie', stats: [46, 9, 4, 11], armor: [40, 'boombox'], moves: ['z_bite', 'z_beat'], coins: 13,
    desc: 'Its boombox drops a beat that stuns most of your team.',
    counter: 'Break the boombox (or have Magnet-shroom take it) and the music stops for good.',
  },
  barrel: {
    name: 'Barrel Roller', stats: [48, 10, 5, 9], armor: [70, 'barrel'], moves: ['z_bite', 'z_barrelroll'], coins: 13,
    desc: 'Rolls a barrel into your whole team. Imps jump out when the barrel breaks.',
    counter: 'Hit-everyone attacks catch the Imps as they jump out. Pierce the barrel to skip it.',
    passive: { name: 'Stowaways', armorBreak(u) { log('Imps jump out of the barrel!', 'bad'); summon(u, ['imp', 'imp']); } },
  },
  footsoldier: {
    name: 'Foot Soldier', stats: [50, 11, 5, 12], moves: ['z_blaster', 'z_zpg'], coins: 13,
    desc: 'Fires rockets at your whole team and rocket-jumps to dodge (Evade) every other round.',
    counter: 'Hit-everyone attacks ignore Evade. Hit it on the rounds it\'s on the ground.',
    passive: { name: 'Rocket Jump', roundStart(u) { if (B.round % 2 === 1) addStatus(u, 'evade', 1); } },
  },
  pharaoh: {
    name: 'Pharaoh Zombie', stats: [52, 11, 6, 5], armor: [150, 'sarcophagus'], moves: ['z_crush'], coins: 16,
    desc: 'Locked inside a huge golden sarcophagus. Very slow.',
    counter: 'Piercing attacks go straight through the sarcophagus.',
  },

  // ---- Realm zombies (Part 2, batch 1, 2026-11-22). Each is a real character
  // from an official game, picked from the odder corners of the series
  // (owner: "as weird of games as possible but still have them be official"). ----
  // Movie Studio
  paparazzi: {
    name: 'Paparazzi Zombie', stats: [42, 9, 4, 13], moves: ['z_bite', 'z_flash'], coins: 11,
    desc: 'From Plants vs. Zombies Heroes. Snaps photos: the flash blinds a plant (its next attack misses).',
    counter: 'Fragile, and cleansing moves wipe the Blind off.',
  },
  actionhero: {
    name: '80s Action Hero', stats: [58, 11, 2, 9], moves: ['z_bite', 'z_rocket'], coins: 14,
    desc: 'From Garden Warfare 2. Fires a rocket that hits your whole team.',
    counter: 'Almost no defense: big single hits wreck him. Guard soaks the rocket.',
  },
  huge: {
    name: 'Huge-Gigantacus', stats: [80, 14, 7, 10], moves: ['z_villain', 'z_henchmen'], coins: 150,
    desc: 'A super-villain from Plants vs. Zombies Heroes. Calls in henchmen and LOVES giving evil speeches.',
    counter: 'Every 3rd round he stops to give a speech and skips his turn: that\'s the time for your biggest moves.',
    passive: { name: 'Monologue', turnStart(u) { if (B.round % 3 === 0) { log(`${u.name} gives a long evil speech...`, 'good'); return 'skip'; } } },
  },
  // Rome
  gladiantaur: {
    name: 'Gladiantaur', stats: [52, 12, 5, 18], moves: ['z_trample'], coins: 13,
    desc: 'A gladiator centaur from Plants vs. Zombies Heroes. Gallops past taunting plants to trample your back line.',
    counter: 'Tall-nut is too tall to jump over, and chill slows it right down.',
  },
  valkyrie: {
    name: 'Valkyrie', stats: [50, 11, 5, 11], armor: [40, 'helmet'], moves: ['z_bite', 'z_spear'], coins: 13,
    desc: 'From Plants vs. Zombies Heroes. Every time another zombie falls, she gets Power for 2 turns.',
    counter: 'Defeat her first, or Weaken her: Weak cancels out her Power.',
    passive: { name: 'Fallen Warriors', onAllyFall(u) { addStatus(u, 'power', 2); log(`${u.name} grows stronger!`, 'bad'); } },
  },
  smash: {
    name: 'The Smash', stats: [90, 15, 7, 7], moves: ['z_bodyslam', 'z_flex'], coins: 150,
    desc: 'A wrestling champion from Plants vs. Zombies Heroes. His body slams stun, and he flexes for Power and Guard.',
    counter: 'Very slow. Plants that can\'t be stunned (Tall-nut, or Squash at Lv15) shrug off his slams, and Weak takes the sting out.',
  },
  // Underwater Palace
  fishyimp: {
    name: 'Fishy Imp', stats: [30, 11, 2, 18], moves: ['z_scratch'], coins: 6,
    desc: 'An imp riding a fish, from Plants vs. Zombies Heroes. Dives underwater every other round: only lobs and hit-everyone attacks reach it then.',
    counter: 'Tiny: any hit-everyone attack or lob finishes it off.',
    passive: { name: 'Amphibious', roundStart(u) { u.flags.under = B.round % 2 === 0; if (u.flags.under) log(`${u.name} dives under!`); } },
  },
  octopet: {
    name: 'Octo-Pet', stats: [46, 9, 4, 10], moves: ['z_bite', 'z_ink'], coins: 11,
    desc: 'A pet octopus from Plants vs. Zombies Heroes. Squirts ink that can blind your whole team, and slips away from 30% of single attacks.',
    counter: 'Hit-everyone attacks never miss it, and cleansing wipes off the ink.',
    passive: { name: 'Slippery', dodge: 0.3 },
  },
  neptuna: {
    name: 'Neptuna', stats: [76, 13, 6, 12], moves: ['z_trident', 'z_tide', 'z_school'], coins: 150,
    desc: 'Queen of the deep, from Plants vs. Zombies Heroes. Tidal waves chill your team, she calls in Fishy Imps, and at half health her siren song hypnotizes a plant.',
    counter: 'A Ward (Garlic Ward, Aloe Wrap) blocks her song, and hit-everyone attacks clear out her Fishy Imps.',
    passive: { name: 'Siren Song', onHurt(u) { if (!u.flags.sang && u.hp > 0 && u.hp < u.maxHp / 2) { u.flags.sang = true; const t = pick(foesOf(u)); if (t) { log(`${u.name} sings a siren song!`, 'bad'); addStatus(t, 'hypno', 2); } } } },
  },
  // Moon Base
  spacecadet: {
    name: 'Space Cadet', stats: [40, 10, 4, 12], armor: [45, 'pod'], moves: ['z_podblaster'], coins: 11,
    desc: 'From Garden Warfare 2 and Battle for Neighborville. Flies in a metal space pod, and its blaster never misses.',
    counter: 'The pod is metal: Magnet-shroom rips it off, and piercing attacks go straight through.',
  },
  cosmicimp: {
    name: 'Cosmic Imp', stats: [28, 11, 2, 19], moves: ['z_scratch', 'z_cosmicray'], coins: 6,
    desc: 'A tiny imp from outer space, from Plants vs. Zombies Heroes. Its cosmic ray makes a plant Brittle (its next hit taken does 50% more).',
    counter: 'Very fragile. A Ward blocks Brittle, and a shield soaks up the cracked hit.',
  },
  gasgiant: {
    name: 'Gas Giant', stats: [95, 12, 6, 6], moves: ['z_gascloud', 'z_swell', 'z_bite'], coins: 150,
    desc: 'A huge, gassy zombie from Plants vs. Zombies Heroes. Its gas makes your team Weak and can burn, and it swells up behind a shield.',
    counter: 'Ward and cleansing moves clear the gas, and it\'s very slow. Shield poppers (Punk-style, or Spikeweed at Lv15) undo its swell.',
  },
};

// How to beat the original zombies (shown in the Almanac and when you
// click a zombie in battle). The newer zombies above have it built in.
const ORIGINAL_COUNTERS = {
  zombie: 'Anything works. Just hit it.',
  flag: 'Defeat it first so the others don\'t get Powered up.',
  cone: 'Hit hard to knock the cone off, or pierce through it.',
  bucket: 'Armor-piercing attacks (Spikeweed, Fume-shroom, Cactus, Squash) go right through the bucket.',
  paper: 'Save a big hit for after the paper breaks, or pierce through and never make it mad.',
  pole: 'Taunt can\'t stop the vault, but a Tall-nut is too tall to jump.',
  football: 'Pierce the helmet, or stun it with Butter or Pollen Daze.',
  dancer: 'Defeat the dancer and the backup stops coming. Hit-everyone attacks clean up backups.',
  backup: 'Hit-everyone attacks.',
  door: 'Lobbed attacks fly over the door. Fume-shroom and other piercing attacks go through it.',
  imp: 'Fragile: any hit-everyone attack. Protect your weakest plant.',
  snorkel: 'Lob at it while it\'s diving, or hit everyone.',
  dolphin: 'A Tall-nut stops the leap.',
  digger: 'Lobbed attacks reach it underground; straight shots barely do.',
  jack: 'Defeat it before its 3rd turn, or Guard up when the music speeds up.',
  bungee: 'Don\'t stack shields on one plant when it\'s around. Defeat it fast.',
  catapult: 'It\'s a vehicle: Spikeweed does double damage. Taunt doesn\'t stop basketballs.',
  zomboni: 'Spikeweed pops its tires for double damage. Fire undoes its chills.',
  gargantuar: 'Taunt with a Hearty plant, and finish off the Imp it throws.',
  yeti: 'Fire melts its chills. It runs away with a fortune if you lose!',
  zomboss: 'Pierce the robot armor, and save Guard or Hold the Line for when he\'s furious.',
};
for (const id in ORIGINAL_COUNTERS) ZOMBIES[id].counter = ORIGINAL_COUNTERS[id];

/* ---- Battle gimmicks ------------------------------------------------------------
   Every battle has one or more of these. They change the rules for that
   fight only. `income` replaces SUN_INCOME, `startSun` replaces SUN_START.
   The day/night/pool/roof/lair ones come from the chapter; the others are
   added to single battles in world.js.
*/
const GIMMICKS = {
  day:       { name: 'Day', desc: 'Mushrooms are sleepy: 15% weaker.' },
  night:     { name: 'Night', desc: 'Only 15 sun per round. Mushrooms are awake: 30% stronger.', income: 15 },
  pool:      { name: 'Pool', desc: 'Fire is 25% weaker. Chills last a turn longer.' },
  roof:      { name: 'Roof', desc: 'The roof is slanted: straight shots do 25% less, lobs do 25% more.' },
  fog:       { name: 'Fog', desc: 'You can\'t see enemy health, and single-target attacks miss 15% of the time.' },
  graves:    { name: 'Gravestones', desc: 'A zombie climbs out of a grave every 3 rounds.' },
  drought:   { name: 'Drought', desc: 'No sun each round. You start with 150.', income: 0, startSun: 150 },
  laststand: { name: 'Last Stand', desc: 'No sun each round, but you start with 400. Spend it wisely.', income: 0, startSun: 400 },
  conveyor:  { name: 'Conveyor Belt', desc: 'Each turn, a plant can only use 2 random moves out of its 4.' },
  storm:     { name: 'Storm', desc: 'Lightning strikes someone (either side) every 3 rounds.' },
  rush:      { name: 'Rush', desc: 'Zombies are 50% faster.' },
  heatwave:  { name: 'Heat Wave', desc: 'Fire is 50% stronger, and nothing can be chilled or frozen.' },
  // From across the series:
  sandstorm: { name: 'Sandstorm', desc: 'Zombies hide in the blowing sand: +3 defense.' },
  frostwind: { name: 'Freezing Wind', desc: 'Every round, a random plant gets chilled.' },
  neon:      { name: 'Neon Jams', desc: 'The music changes every 2 rounds: Punk Jam Powers up zombies, Pop Jam Weakens them.' },
  timewarp:  { name: 'Time Warp', desc: 'Time is broken: the turn order is random every round. Speed doesn\'t matter.' },
  // From the mini realms (Part 2):
  cut:       { name: 'Cut!', desc: 'Every 3 rounds the director yells CUT: every status on everyone (good and bad) is cleared. Shields stay.' },
  arena:     { name: 'Arena', desc: 'The crowd loves a knockout: whoever defeats an enemy gets Power for 2 turns.' },
  lowgrav:   { name: 'Low Gravity', desc: 'Plant attacks float: every plant attack is lobbed (over Screen Doors, and down to diving zombies).' },
};
