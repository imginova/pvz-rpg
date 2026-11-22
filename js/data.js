/* =====================================================================
   data.js: WHAT exists in the game. Classes, status effects, moves,
   plants, zombies and battle gimmicks.

   This file only DESCRIBES things. The rules that use these
   descriptions live in battle.js. A plant's "passive" (its special
   ability) is a small object of functions called "hooks": battle.js
   calls a hook at the right moment, for example roundStart() at the
   start of every round, or onHurt() whenever the plant takes damage.

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
  frost_snare: { name: 'Frostbite', cost: 25, cd: 2, target: 'foe', power: 5, status: ['chill', 2, 1], desc: 'Chill an enemy for 2 turns.' },
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
  rep_grit:      { name: 'Grit Teeth', cost: 25, cd: 2, target: 'self', self: ['guard', 1], special: u => addStatus(u, 'power', 1), desc: 'Gets angry: Power and Guard for a turn.' },
  rep_rapid:     { name: 'Rapid Fire', cost: 50, cd: 3, target: 'foe', power: 5, hits: 4, straight: true, desc: 'Four peas at one enemy.' },
  snow_icicle:   { name: 'Icicle', cost: 50, cd: 2, target: 'foe', power: 15, straight: true, sure: true, status: ['chill', 1, 1], desc: 'A sharp icicle that never misses and chills.' },
  cab_crisp:     { name: 'Crisp Up', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Freshens its leaves: Power for 2 turns.' },
  cab_slaw:      { name: 'Coleslaw', cost: 50, cd: 2, target: 'foes', power: 6, lob: true, desc: 'Shredded cabbage on every enemy.' },
  cab_salad:     { name: 'Salad Bar', cost: 75, cd: 4, target: 'allies', heal: 0.12, desc: 'Shares fresh leaves: heal every ally 12%.' },
  cac_bristle:   { name: 'Bristle', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Puffs out its spines: Thorns for 3 turns.' },
  cac_needle:    { name: 'Long Needle', cost: 50, cd: 2, target: 'foe', power: 16, straight: true, sure: true, desc: 'A long needle that never misses.' },
  cac_hug:       { name: 'Prickly Hug', cost: 25, cd: 2, target: 'foe', power: 7, self: ['guard', 1], desc: 'Hugs a zombie (ouch!), then Guards for a turn.' },
  cac_heat:      { name: 'Desert Heat', cost: 75, cd: 4, target: 'allies', status: ['power', 1, 1], desc: 'Desert sun fires everyone up: every ally gets Power for a turn.' },
  puff_scatter:  { name: 'Scatter Spores', cost: 50, cd: 2, target: 'foes', power: 6, desc: 'Tiny puffs at every enemy.' },
  puff_hide:     { name: 'Hide Under Cap', cost: 25, cd: 2, target: 'foe', power: 7, self: ['guard', 1], desc: 'Puff, then hide under its cap: Guard for a turn.' },
  puff_pep:      { name: 'Pep Up', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Small but fired up: Power for 2 turns.' },
  puff_shot:     { name: 'Spore Shot', cost: 50, cd: 2, target: 'foe', power: 16, sure: true, desc: 'A big spore that never misses.' },
  bloom_wind:    { name: 'Wind Up', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Winds up a big throw: Power for 2 turns.' },
  bloom_curve:   { name: 'Curveball', cost: 50, cd: 2, target: 'foe', power: 16, sure: true, desc: 'Curves around anything in the way. Never misses.' },
  bloom_catch:   { name: 'Catch', cost: 25, cd: 2, target: 'foe', power: 7, self: ['guard', 1], desc: 'Throws, catches, then Guards for a turn.' },
  bloom_storm:   { name: 'Petal Storm', cost: 50, cd: 2, target: 'foes', power: 6, desc: 'Petals at every enemy.' },
  laser_scope:   { name: 'Targeting Scope', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Locks on: Power for 2 turns.' },
  laser_deflect: { name: 'Deflector', cost: 25, cd: 2, target: 'foe', power: 7, self: ['guard', 1], desc: 'Fires, then raises a deflector: Guard for a turn.' },
  laser_focus:   { name: 'Focus Beam', cost: 50, cd: 2, target: 'foe', power: 16, sure: true, desc: 'A tight beam that never misses.' },

  // HEARTY
  nut_stare:     { name: 'Big Stare', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'Stares down the zombies: Taunt for 2 turns.' },
  nut_block:     { name: 'Block for You', cost: 50, cd: 2, target: 'ally', shield: 0.3, desc: 'Shield an ally for 30% of Wall-nut\'s max HP.' },
  tall_thump:    { name: 'Thump', cost: 0, target: 'foe', power: 7, desc: 'A heavy lean onto a zombie.' },
  tall_shade:    { name: 'Tall Shadow', cost: 50, cd: 2, target: 'ally', shield: 0.3, desc: 'Shield an ally for 30% of Tall-nut\'s max HP.' },
  pump_grin:     { name: 'Spooky Grin', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'A jack-o\'-lantern grin: Taunt for 2 turns.' },
  pump_vines:    { name: 'Prickly Vines', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Grows prickly vines: Thorns for 3 turns.' },
  pump_hollow:   { name: 'Hollow Shell', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Shield itself for 25% of its max HP.' },
  pump_harvest:  { name: 'Harvest Wall', cost: 75, cd: 4, target: 'allies', status: ['guard', 1, 1], desc: 'A wall of pumpkins: every ally Guards for a turn.' },
  gar_reek:      { name: 'Reek', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'Smells SO bad they can\'t look away: Taunt for 2 turns.' },
  gar_clove:     { name: 'Clove Armor', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Shield itself for 25% of its max HP.' },
  gar_bitter:    { name: 'Bitter Taste', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Tastes awful: Thorns for 3 turns.' },
  gar_ward:      { name: 'Garlic Ward', cost: 50, cd: 2, target: 'ally', shield: 0.3, desc: 'Ward an ally: a shield of 30% of Garlic\'s max HP.' },
  spike_sharpen: { name: 'Sharpen', cost: 25, cd: 3, target: 'self', self: ['thorns', 3], desc: 'Sharpens its spikes: Thorns for 3 turns.' },
  spike_dig:     { name: 'Dig In', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Digs into the dirt: a shield of 25% of its max HP.' },
  spike_trap:    { name: 'Tire Trap', cost: 50, cd: 2, target: 'foe', power: 14, pierce: true, desc: 'A big spike that pierces armor. Pops vehicles!' },
  spike_field:   { name: 'Spike Field', cost: 75, cd: 4, target: 'allies', status: ['thorns', 2, 1], desc: 'Spikes all around the team: every ally gets Thorns for 2 turns.' },
  cit_lock:      { name: 'Lock On', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'Draws fire like a bounty hunter: Taunt for 2 turns.' },
  cit_peel:      { name: 'Peel Back', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Closes its peel: a shield of 25% of its max HP.' },
  cit_cover:     { name: 'Cover Fire', cost: 50, cd: 2, target: 'ally', shield: 0.3, desc: 'Shield an ally for 30% of Citron\'s max HP.' },
  infi_lure:     { name: 'Hologram Lure', cost: 25, cd: 2, target: 'self', self: ['taunt', 2], desc: 'A flashy hologram: Taunt for 2 turns.' },
  infi_project:  { name: 'Project Shield', cost: 50, cd: 2, target: 'ally', shield: 0.3, desc: 'Projects a shield onto an ally: 30% of Infi-nut\'s max HP.' },

  // SUNNY
  sun_glow:      { name: 'Warm Glow', cost: 25, target: 'ally', heal: 0.25, desc: 'Heal an ally 25%.' },
  sun_smile:     { name: 'Sunny Smile', cost: 25, cd: 2, target: 'ally', cleanse: true, status: ['power', 1, 1], desc: 'Cheer an ally up: cleanse it and give it Power for a turn.' },
  ss_glow:       { name: 'Spore Glow', cost: 25, target: 'ally', heal: 0.25, desc: 'Heal an ally 25%.' },
  ss_moon:       { name: 'Moon Sun', cost: 0, cd: 3, target: 'self', sun: 35, desc: 'Makes sun even in the dark: +35 sun.' },
  ss_dawn:       { name: 'Dawn Spores', cost: 100, cd: 5, target: 'fallen', revive: 0.4, desc: 'Spores that wake a wilted ally: back with 40% HP.' },
  mari_coin:     { name: 'Lucky Coin', cost: 0, cd: 3, target: 'self', sun: 35, desc: 'Finds a lucky gold coin: +35 sun.' },
  mari_polish:   { name: 'Polish Petals', cost: 25, target: 'ally', heal: 0.25, desc: 'Heal an ally 25%.' },
  gold_glint:    { name: 'Golden Glint', cost: 25, target: 'ally', heal: 0.25, desc: 'Heal an ally 25%.' },
  gold_gleam:    { name: 'Gleam', cost: 25, cd: 2, target: 'ally', cleanse: true, status: ['power', 1, 1], desc: 'A shining gleam: cleanse an ally and give it Power for a turn.' },
  aloe_gel:      { name: 'Cooling Gel', cost: 75, cd: 3, target: 'allies', heal: 0.15, desc: 'Gel for everyone: heal every ally 15%.' },
  aloe_rub:      { name: 'Soothing Rub', cost: 25, cd: 2, target: 'ally', cleanse: true, status: ['power', 1, 1], desc: 'Cleanse an ally and give it Power for a turn.' },
  aloe_regrow:   { name: 'Regrow', cost: 100, cd: 5, target: 'fallen', revive: 0.4, desc: 'Aloe heals anything: a wilted ally comes back with 40% HP.' },
  aloe_dew:      { name: 'Morning Dew', cost: 0, cd: 3, target: 'self', sun: 35, desc: 'Catches the morning sun: +35 sun.' },
  bean_shine:    { name: 'Bean Shine', cost: 25, target: 'ally', heal: 0.25, desc: 'Heal an ally 25%.' },
  bean_sprout:   { name: 'Sun Sprout', cost: 0, cd: 3, target: 'self', sun: 35, desc: 'Sprouts a little sun: +35 sun.' },
  bean_huddle:   { name: 'Sunny Huddle', cost: 75, cd: 3, target: 'allies', heal: 0.15, desc: 'A warm huddle: heal every ally 15%.' },
  bean_skin:     { name: 'Tough Skin', cost: 25, cd: 1, target: 'self', shield: 0.25, desc: 'Shield itself for 25% of its max HP.' },

  // VOLATILE
  cherry_double: { name: 'Double Trouble', cost: 50, cd: 2, target: 'foe', power: 9, hits: 2, fire: true, desc: 'Both cherries pop on one enemy.' },
  cherry_temper: { name: 'Hot Temper', cost: 50, cd: 3, target: 'self', self: ['power', 3], special: u => addStatus(u, 'burn', 2), desc: 'Power for 3 turns, but its fuse burns it.' },
  jal_spicy:     { name: 'Extra Spicy', cost: 50, cd: 3, target: 'self', self: ['power', 3], special: u => addStatus(u, 'burn', 2), desc: 'Power for 3 turns, but it burns itself.' },
  jal_kick:      { name: 'Spicy Kick', cost: 25, target: 'foe', power: 17, recoil: 0.1, fire: true, desc: 'A big fiery kick that costs 10% of its own max HP.' },
  jal_wave:      { name: 'Heat Wave', cost: 50, cd: 2, target: 'foes', power: 8, fire: true, desc: 'Hot air at every enemy.' },
  sq_belly:      { name: 'Belly Flop', cost: 50, cd: 2, target: 'foes', power: 8, desc: 'Flops on the whole crowd: hits every enemy.' },
  sq_glare:      { name: 'Hmm...', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Stares at a zombie, getting ready: Power for 2 turns.' },
  sq_slam:       { name: 'Body Slam', cost: 75, cd: 3, target: 'foe', power: 20, status: ['stun', 1, 0.5], desc: 'A huge slam. 50% chance to stun.' },
  sq_bounce:     { name: 'Bounce', cost: 25, cd: 1, target: 'foe', power: 9, hits: 2, desc: 'Bounces on an enemy twice.' },
  mel_rind:      { name: 'Thick Rind', cost: 25, cd: 2, target: 'self', shield: 0.2, desc: 'Hides behind its rind: a shield of 20% of its max HP.' },
  mel_smash:     { name: 'Watermelon Smash', cost: 100, cd: 4, target: 'foe', power: 26, splash: 0.5, desc: 'The biggest melon. Half of it splashes the other enemies.' },
  mel_juice:     { name: 'Sticky Juice', cost: 50, cd: 2, target: 'foes', power: 6, status: ['chill', 1, 0.5], desc: 'Hits every enemy; 50% chance each to chill.' },
  fume_blast:    { name: 'Fume Blast', cost: 25, cd: 1, target: 'foe', power: 14, desc: 'A strong blast of fumes.' },
  fume_breath:   { name: 'Deep Breath', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Breathes in: Power for 2 turns.' },
  fume_storm:    { name: 'Stink Storm', cost: 100, cd: 4, target: 'foes', power: 14, desc: 'A huge cloud that hits every enemy hard.' },
  bonk_hay:      { name: 'Haymaker', cost: 50, cd: 2, target: 'foe', power: 20, desc: 'One huge punch.' },
  bonk_pump:     { name: 'Pump Up', cost: 25, cd: 2, target: 'self', self: ['power', 2], desc: 'Gets pumped: Power for 2 turns.' },
  bonk_combo:    { name: 'Combo', cost: 75, cd: 3, target: 'foe', power: 6, hits: 4, desc: 'A four-punch combo.' },
  bonk_rope:     { name: 'Rope-a-dope', cost: 25, cd: 2, target: 'self', self: ['guard', 1], special: u => addStatus(u, 'taunt', 1), desc: 'Leans back and lets them swing: Guard and Taunt for a turn.' },
  snap_roar:     { name: 'Dragon Roar', cost: 25, cd: 2, target: 'foes', status: ['weak', 1, 1], desc: 'A scary roar: every enemy is Weak for a turn.' },
  snap_bite:     { name: 'Dragon Bite', cost: 25, cd: 1, target: 'foe', power: 15, desc: 'A big chomp.' },
  snap_stoke:    { name: 'Stoke the Flames', cost: 50, cd: 3, target: 'self', self: ['power', 3], desc: 'Builds up its fire: Power for 3 turns.' },
  coco_broadside:{ name: 'Broadside', cost: 50, cd: 2, target: 'foes', power: 8, desc: 'A cannon volley at every enemy.' },
  coco_reload:   { name: 'Reload', cost: 25, cd: 3, target: 'self', special: u => { u.flags.loaded = true; log(`${u.name} is loaded again!`); }, desc: 'Loads a fresh coconut: its next attack does double damage.' },

  // GROWERS
  chomp_burp:    { name: 'Burp', cost: 25, cd: 2, target: 'self', heal: 0.2, cleanse: true, desc: 'A big burp: heal itself 20% and cleanse.' },
  chomp_drool:   { name: 'Drool', cost: 25, cd: 1, target: 'foe', power: 4, status: ['weak', 2, 1], desc: 'Slimy drool makes an enemy Weak for 2 turns.' },
  chomp_snap:    { name: 'Snap Jaws', cost: 50, cd: 3, target: 'foe', status: ['stun', 1, 1], desc: 'Snaps its jaws shut on an enemy: stun for a turn.' },
  chomp_lunge:   { name: 'Lunge', cost: 25, cd: 1, target: 'foe', power: 14, desc: 'Lunges with its big mouth.' },
  hyp_trance:    { name: 'Trance', cost: 50, cd: 3, target: 'foe', status: ['stun', 1, 1], desc: 'Puts an enemy in a trance: stun for a turn.' },
  hyp_dazzle:    { name: 'Dazzle', cost: 50, cd: 2, target: 'foes', power: 5, status: ['weak', 1, 0.4], desc: 'Rainbow sparkles at every enemy; 40% chance each to Weaken.' },
  hyp_calm:      { name: 'Calm Mind', cost: 25, cd: 2, target: 'self', heal: 0.2, cleanse: true, desc: 'Heal itself 20% and cleanse.' },
  ice_shiver:    { name: 'Shiver', cost: 50, cd: 2, target: 'foes', power: 5, status: ['chill', 1, 0.4], desc: 'A cold wave at every enemy; 40% chance each to chill.' },
  ice_pack:      { name: 'Ice Pack', cost: 25, cd: 2, target: 'self', heal: 0.2, cleanse: true, desc: 'Heal itself 20% and cleanse.' },
  torch_bark:    { name: 'Charred Bark', cost: 25, cd: 2, target: 'self', heal: 0.2, cleanse: true, desc: 'Heal itself 20% and cleanse.' },
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
  berg_chill:    { name: 'Chill Out', cost: 25, cd: 2, target: 'self', heal: 0.2, cleanse: true, desc: 'Heal itself 20% and cleanse.' },
  emp_short:     { name: 'Short Circuit', cost: 50, cd: 3, target: 'foe', status: ['stun', 1, 1], desc: 'Fries an enemy\'s nerves: stun for a turn.' },
  emp_static:    { name: 'Static Field', cost: 25, cd: 1, target: 'foe', power: 4, status: ['weak', 2, 1], desc: 'Static makes an enemy Weak for 2 turns.' },
  emp_overload:  { name: 'Overload', cost: 25, cd: 1, target: 'foe', power: 14, desc: 'A big zap.' },
  emp_recharge:  { name: 'Recharge', cost: 25, cd: 2, target: 'self', heal: 0.2, cleanse: true, desc: 'Heal itself 20% and cleanse.' },

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
  bloom_spin:    { name: 'Petal Spin', cost: 50, cd: 2, target: 'foe', power: 6, hits: 2, desc: 'Two throws, and both bounce.' },
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
  z_snatch:   { name: 'Bungee Snatch', cd: 3, target: 'foe', power: 6, vault: true, special: snatch, w: 3 },
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
  z_sunsteal:   { name: 'Sun Steal', cd: 2, target: 'self', special: sunSteal, can: () => B.sun > 0, w: 3 },
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
  const n = Math.min(25, B.sun);
  B.sun -= n;
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
  z.armor = z.armorMax = Math.round(40 * statScale(z.lvl));
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
    if (u.side === 'ally') progress.stats.devoured++;
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
  for (const s of ['shield', 'power', 'guard', 'taunt', 'thorns', 'fed']) delete t.st[s];
  log(`${u.name} snatched ${t.name}'s buffs!`, 'bad');
  addStatus(t, 'stun', 1, { label: 'Snatched' });
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
    learn: [['pea_shot', 1], ['pea_aim', 1], ['pea_volley', 2], ['pea_barrage', 3], ['pea_head', 5], ['pea_duck', 7]],
    unlock: { how: 'start' }, flavor: 'Doesn\'t do much, but does it every turn.',
  },
  repeater: {
    name: 'Repeater', cls: 'shooter', stats: [72, 12, 5, 10],
    passive: {
      name: 'Double Tap', desc: 'Single-hit attacks on one enemy fire a second pea at 40% power. Slower than Peashooter.',
      echo: 0.4,
    },
    learn: [['rep_double', 1], ['rep_grit', 1], ['pea_aim', 2], ['rep_storm', 4], ['pea_volley', 6], ['rep_rapid', 8]],
    unlock: { how: 'shop', price: 400 }, flavor: 'Two peas are better than one, if you can wait for them.',
  },
  snowpea: {
    name: 'Snow Pea', cls: 'shooter', stats: [62, 11, 4, 14],
    passive: {
      name: 'Cold Snap', desc: 'Deals 30% more damage to chilled or frozen enemies.',
      dealMult(u, t) { return (t.st.chill || t.st.freeze) ? 1.3 : 1; },
    },
    learn: [['snow_pea', 1], ['frost_snare', 1], ['pea_aim', 3], ['snow_volley', 4], ['snow_icicle', 6], ['pea_volley', 8]],
    unlock: { how: 'story' }, flavor: 'Cool, calm and very, very cold.',
  },
  cabbagepult: {
    name: 'Cabbage-pult', cls: 'shooter', stats: [60, 12, 4, 13],
    passive: { name: 'Lobber', desc: 'All its attacks are lobbed: they fly over Screen Doors and reach diving or dug-in zombies.', lobAll: true },
    learn: [['cab_lob', 1], ['cab_crisp', 1], ['cab_rain', 3], ['pult_arc', 5], ['cab_slaw', 6], ['cab_salad', 8]],
    unlock: { how: 'story' }, flavor: 'Throws cabbages. Nobody asked why.',
  },
  cactus: {
    name: 'Cactus', cls: 'shooter', stats: [64, 12, 5, 13],
    passive: {
      name: 'Needles', desc: 'All its attacks pierce armor, but deal 15% less to zombies with no armor.',
      pierceAll: true,
      dealMult(u, t) { return t.armor > 0 ? 1 : 0.85; },
    },
    learn: [['cac_spike', 1], ['cac_bristle', 1], ['cac_rain', 3], ['cac_needle', 5], ['cac_hug', 6], ['cac_heat', 8]],
    unlock: { how: 'achievement', id: 'seedvault' }, flavor: 'Hugs not recommended.',
  },
  puffshroom: {
    name: 'Puff-shroom', cls: 'shooter', shroom: true, stats: [40, 10, 2, 20],
    passive: { name: 'Tiny', desc: '30% chance to dodge attacks aimed at it alone. Very fragile.', dodge: 0.3 },
    learn: [['puff', 1], ['puff_scatter', 1], ['puff_cloud', 3], ['puff_pep', 4], ['puff_hide', 6], ['puff_shot', 8]],
    unlock: { how: 'story' }, flavor: 'Small, fast and hard to hit.',
  },

  // ================= HEARTY =================
  wallnut: {
    name: 'Wall-nut', cls: 'hearty', stats: [130, 6, 10, 6],
    passive: {
      name: 'Tough Shell', desc: 'Takes 25% less damage while above half HP.',
      takeMult(u) { return u.hp > u.maxHp / 2 ? 0.75 : 1; },
    },
    learn: [['nut_roll', 1], ['nut_stare', 1], ['nut_shell', 2], ['nut_regrow', 3], ['nut_block', 5], ['nut_wall', 7]],
    unlock: { how: 'start' }, flavor: 'A nut that refuses to crack.',
  },
  tallnut: {
    name: 'Tall-nut', cls: 'hearty', stats: [150, 5, 12, 4],
    passive: {
      name: 'Towering', desc: 'Leaping and vaulting attacks must hit it, and it can\'t be stunned. No Tough Shell, and very slow.',
      blocksVault: true, noStun: true,
    },
    learn: [['tall_stand', 1], ['tall_thump', 1], ['nut_shell', 2], ['tall_topple', 4], ['tall_shade', 6], ['nut_wall', 8]],
    unlock: { how: 'story' }, flavor: 'Nobody jumps over Tall-nut.',
  },
  pumpkin: {
    name: 'Pumpkin', cls: 'hearty', stats: [100, 6, 9, 7],
    passive: {
      name: 'Pumpkin Patch', desc: 'Each round, shields the most hurt ally for 8% of Pumpkin\'s max HP.',
      roundStart(u) {
        const hurt = alliesOf(u).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (hurt) addShield(hurt, u.maxHp * 0.08);
      },
    },
    learn: [['pump_bash', 1], ['pump_shell', 1], ['pump_grin', 2], ['pump_vines', 4], ['pump_hollow', 5], ['pump_harvest', 7]],
    unlock: { how: 'story' }, flavor: 'A plant that wears a plant.',
  },
  garlic: {
    name: 'Garlic', cls: 'hearty', stats: [90, 6, 8, 9],
    passive: {
      name: 'Stinky', desc: 'Enemies that hit Garlic become Weak for a turn.',
      onHurt(u, src) { if (src && src.hp > 0 && src !== u) addStatus(src, 'weak', 1); },
    },
    learn: [['gar_breath', 1], ['gar_reek', 1], ['gar_stench', 3], ['gar_clove', 4], ['gar_bitter', 6], ['gar_ward', 8]],
    unlock: { how: 'shop', price: 450 }, flavor: 'Smells awful. That\'s the point.',
  },
  spikeweed: {
    name: 'Spikeweed', cls: 'hearty', stats: [64, 9, 8, 11],
    passive: {
      name: 'Spiky', desc: 'Bounces 30% of the damage it takes back. Double damage to vehicles (Zomboni, Catapult).',
      reflect: 0.3,
      dealMult(u, t) { return t.data.vehicle ? 2 : 1; },
    },
    learn: [['spike_prick', 1], ['spike_sharpen', 1], ['spike_strip', 3], ['spike_dig', 4], ['spike_trap', 6], ['spike_field', 8]],
    unlock: { how: 'rogue' }, flavor: 'Pops tires for fun.',
  },

  // ================= SUNNY =================
  sunflower: {
    name: 'Sunflower', cls: 'sunny', stats: [72, 7, 5, 13],
    passive: {
      name: 'Sunny Disposition', desc: '+10 sun at the start of every round.',
      roundStart(u) { gainSun(10, u); },
    },
    learn: [['sun_petal', 1], ['sun_make', 1], ['sun_glow', 2], ['flower_bloom', 4], ['sun_smile', 6], ['flower_revive', 8]],
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
    learn: [['ss_puff', 1], ['ss_spurt', 1], ['ss_glow', 2], ['ss_moon', 4], ['puff_cloud', 6], ['ss_dawn', 8]],
    unlock: { how: 'story' }, flavor: 'Starts small. Doesn\'t stay small.',
  },
  marigold: {
    name: 'Marigold', cls: 'sunny', stats: [56, 7, 5, 14],
    passive: {
      name: 'Golden', desc: '+50% coins from battles it fights in. 25% chance each round for +20 sun.',
      coinBonus: 0.5,
      roundStart(u) { if (chance(0.25)) gainSun(20, u); },
    },
    learn: [['mari_petal', 1], ['mari_bright', 1], ['mari_polish', 2], ['mari_coin', 3], ['flower_bloom', 5], ['flower_revive', 7]],
    unlock: { how: 'shop', price: 300 }, flavor: 'Pretty, and pretty rich.',
  },
  aloe: {
    name: 'Aloe', cls: 'sunny', stats: [62, 6, 6, 12],
    passive: {
      name: 'Soothing', desc: 'Heals itself 8% each round, and its heals are 30% stronger.',
      healBoost: 1.3,
      roundStart(u) { healUnit(u, u.maxHp * 0.08); },
    },
    learn: [['aloe_spray', 1], ['aloe_squirt', 1], ['aloe_gel', 3], ['aloe_rub', 4], ['aloe_regrow', 6], ['aloe_dew', 8]],
    unlock: { how: 'shop', price: 350 }, flavor: 'Good for sunburns and zombie bites.',
  },

  // ================= VOLATILE =================
  cherrybomb: {
    name: 'Cherry Bomb', cls: 'volatile', stats: [56, 15, 3, 14],
    passive: {
      name: 'Last Blast', desc: 'When it wilts, it explodes for 20 power on every enemy.',
      onFall(u) {
        log(`${u.name} goes out with a BANG!`, 'good');
        for (const f of foesOf(u)) hit(u, f, 20, { aoe: true });
      },
    },
    learn: [['cherry_fizz', 1], ['cherry_blast', 1], ['boom_fuse', 2], ['cherry_double', 4], ['boom_kaboom', 6], ['cherry_temper', 8]],
    unlock: { how: 'story' }, flavor: 'Two cherries, one very short temper.',
  },
  jalapeno: {
    name: 'Jalapeno', cls: 'volatile', stats: [52, 16, 3, 13],
    passive: {
      name: 'Hot Headed', desc: '+50% damage to burning enemies. Careful: its fire melts chill and freeze.',
      dealMult(u, t) { return t.st.burn ? 1.5 : 1; },
    },
    learn: [['jal_sauce', 1], ['fire_ignite', 1], ['jal_row', 3], ['jal_wave', 4], ['jal_spicy', 6], ['jal_kick', 8]],
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
    learn: [['sq_leap', 1], ['sq_squash', 1], ['sq_bounce', 2], ['sq_belly', 4], ['sq_slam', 6], ['sq_glare', 8]],
    unlock: { how: 'achievement', id: 'untouchable' }, flavor: 'Hmm? HMM!',
  },
  melonpult: {
    name: 'Melon-pult', cls: 'volatile', stats: [72, 17, 5, 5],
    passive: { name: 'Heavy Lob', desc: 'All its attacks are lobbed, and 30% of the damage splashes the other enemies. The slowest attacker.', lobAll: true, splashAll: 0.3 },
    learn: [['mel_seed', 1], ['mel_melon', 1], ['mel_rind', 2], ['pult_arc', 4], ['mel_smash', 6], ['mel_juice', 8]],
    unlock: { how: 'rogue' }, flavor: 'One melon. Big trouble.',
  },
  fumeshroom: {
    name: 'Fume-shroom', cls: 'volatile', shroom: true, stats: [66, 12, 5, 9],
    passive: { name: 'Fumes', desc: 'All its attacks pierce armor and go through Screen Doors.', pierceAll: true },
    learn: [['fume_puff', 1], ['puff_cloud', 1], ['fume_cloud', 3], ['fume_blast', 4], ['fume_breath', 6], ['fume_storm', 8]],
    unlock: { how: 'story' }, flavor: 'Bad breath, armor-proof.',
  },
  bonkchoy: {
    name: 'Bonk Choy', cls: 'volatile', stats: [70, 14, 5, 12],
    passive: {
      name: 'Counterpunch', desc: 'When an enemy hits it, 35% chance to punch back for 6 power.',
      onHurt(u, src) { if (src && src.hp > 0 && src !== u && u.hp > 0 && chance(0.35)) { log(`${u.name} punches back!`); hit(u, src, 6, { counter: true }); } },
    },
    learn: [['bonk_rapid', 1], ['bonk_upper', 1], ['bonk_hay', 2], ['bonk_pump', 4], ['bonk_combo', 6], ['bonk_rope', 8]],
    unlock: { how: 'shop', price: 500 }, flavor: 'Float like a leaf, punch like a cabbage.',
  },

  // ================= GROWERS =================
  chomper: {
    name: 'Chomper', cls: 'grower', stats: [90, 16, 5, 5],
    passive: {
      name: 'Big Appetite', desc: 'Swallowing an enemy with Devour heals it 30%.',
      onDevour(u) { healUnit(u, u.maxHp * 0.3); },
    },
    learn: [['chomp_bite', 1], ['chomp_devour', 1], ['chomp_burp', 2], ['chomp_drool', 4], ['chomp_snap', 6], ['chomp_lunge', 8]],
    unlock: { how: 'rogue' }, flavor: 'Chews slowly. Eats anything.',
  },
  hypnoshroom: {
    name: 'Hypno-shroom', cls: 'grower', shroom: true, stats: [58, 8, 5, 13],
    passive: {
      name: 'Mesmerize', desc: 'Zombies that hit it have a 30% chance to be hypnotized for a turn (not bosses).',
      onHurt(u, src) { if (src && src.kind === 'zombie' && src.hp > 0 && !src.boss && chance(0.3)) addStatus(src, 'hypno', 1); },
    },
    learn: [['hyp_swirl', 1], ['hyp_hypno', 1], ['puff_cloud', 2], ['hyp_trance', 4], ['hyp_dazzle', 6], ['hyp_calm', 8]],
    unlock: { how: 'rogue' }, flavor: 'Look into its eyes...',
  },
  iceshroom: {
    name: 'Ice-shroom', cls: 'grower', shroom: true, stats: [60, 9, 6, 8],
    passive: { name: 'Permafrost', desc: 'Its chills and freezes last 1 turn longer.', icyBonus: 1 },
    learn: [['ice_chip', 1], ['frost_snare', 1], ['ice_deep', 2], ['puff_cloud', 4], ['ice_shiver', 6], ['ice_pack', 8]],
    unlock: { how: 'rogue' }, flavor: 'Brrr.',
  },
  torchwood: {
    name: 'Torchwood', cls: 'grower', stats: [80, 8, 7, 8],
    passive: { name: 'Flaming Peas', desc: 'While it stands, allies\' straight shots catch fire: +40% damage and a 30% chance to burn.', torch: true },
    learn: [['torch_ember', 1], ['torch_bark', 1], ['torch_bonfire', 2], ['fire_ignite', 4], ['torch_smoke', 6], ['torch_flare', 8]],
    unlock: { how: 'rogue' }, flavor: 'Best friends with every Peashooter.',
  },
  kernelpult: {
    name: 'Kernel-pult', cls: 'grower', stats: [58, 10, 4, 12],
    passive: { name: 'Butter Luck', desc: 'All its attacks are lobbed and have a 25% chance to butter (stun) for a turn.', lobAll: true, butter: 0.25 },
    learn: [['ker_kernel', 1], ['ker_husk', 1], ['ker_butter', 2], ['pult_arc', 4], ['ker_pop', 6], ['ker_slick', 8]],
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
        }
      },
    },
    learn: [['pm_pop', 1], ['pm_rearm', 1], ['pm_spudow', 2], ['boom_fuse', 4], ['pm_dirt', 6], ['pm_burrow', 8]],
    unlock: { how: 'story' }, flavor: 'Step on it. We dare you.',
  },

  // ================= FROM ACROSS THE SERIES =================
  // (Plants vs. Zombies 2 and Garden Warfare. Found in the Time Rift,
  // in the shop and through a secret achievement.)
  bloomerang: {
    name: 'Bloomerang', cls: 'shooter', stats: [62, 12, 4, 14],
    passive: { name: 'Comeback', desc: 'Its attacks on one enemy bounce on to 2 other enemies for 40% damage.', ricochet: 0.4 },
    learn: [['bloom_throw', 1], ['bloom_wind', 1], ['bloom_spin', 3], ['bloom_curve', 5], ['bloom_catch', 6], ['bloom_storm', 8]],
    unlock: { how: 'story' }, flavor: 'What goes around comes around. Usually into a zombie.',
  },
  laserbean: {
    name: 'Laser Bean', cls: 'shooter', stats: [58, 11, 4, 12],
    passive: { name: 'Beam', desc: 'Its attacks on one enemy hit EVERY enemy instead, but at half power, and they never land critical hits.', beam: 0.5 },
    learn: [['laser', 1], ['laser_scope', 1], ['laser_burst', 3], ['laser_deflect', 5], ['laser_focus', 6], ['future_overclock', 8]],
    unlock: { how: 'story' }, flavor: 'From the future. Still a bean.',
  },
  citron: {
    name: 'Citron', cls: 'hearty', stats: [96, 10, 7, 8],
    passive: {
      name: 'Peel Shield', desc: 'Starts every wave with a shield of 25% of its max HP. Hits harder than other Hearty plants.',
      waveStart(u) { addShield(u, u.maxHp * 0.25); },
    },
    learn: [['cit_plasma', 1], ['cit_lock', 1], ['cit_charge', 3], ['cit_peel', 4], ['cit_cover', 6], ['future_overclock', 8]],
    unlock: { how: 'shop', price: 600 }, flavor: 'A bounty-hunting orange from the future.',
  },
  infinut: {
    name: 'Infi-nut', cls: 'hearty', stats: [110, 6, 9, 7],
    passive: {
      name: 'Holo-Rebuild', desc: 'The first time it wilts in a battle, it rebuilds itself 2 rounds later with half its HP.',
      onFall(u) {
        if (u.flags.rebuilt) return;
        u.flags.rebuilt = true;
        u.flags.rebuildAt = B.round + 2;
        log(`${u.name}'s hologram flickers... it will rebuild!`, 'good');
      },
    },
    learn: [['infi_zap', 1], ['infi_lure', 1], ['infi_barrier', 3], ['nut_shell', 4], ['infi_project', 6], ['future_overclock', 8]],
    unlock: { how: 'story' }, flavor: 'A wall-nut made of light. Hard to get rid of.',
  },
  goldbloom: {
    name: 'Gold Bloom', cls: 'sunny', stats: [50, 6, 4, 15],
    passive: {
      name: 'Golden Burst', desc: '+100 sun in the first round of every battle, and no sun after that.',
      roundStart(u) { if (B.round === 1) { gainSun(100, u); log(`${u.name} bursts with gold! +100 sun.`, 'good'); } },
    },
    learn: [['gold_flash', 1], ['gold_glint', 1], ['gold_shower', 3], ['gold_gleam', 4], ['flower_revive', 6], ['flower_bloom', 8]],
    unlock: { how: 'achievement', id: 'sunnyside' }, flavor: 'Blooms once. Blooms BIG.',
  },
  sunbean: {
    name: 'Sun Bean', cls: 'sunny', stats: [80, 6, 7, 9],
    passive: {
      name: 'Sunny Bruise', desc: 'Every time an enemy hits it, you get 10 sun. Tougher than other Sunny plants, but makes no sun on its own.',
      onHurt(u, src) { if (src) gainSun(10, u); },
    },
    learn: [['bean_bonk', 1], ['bean_bait', 1], ['bean_shine', 2], ['bean_sprout', 4], ['bean_huddle', 6], ['bean_skin', 8]],
    unlock: { how: 'shop', price: 400 }, flavor: 'Hit it. Go on. It wants you to.',
  },
  snapdragon: {
    name: 'Snapdragon', cls: 'volatile', stats: [64, 14, 4, 11],
    passive: { name: 'Firebreather', desc: 'Its fire attacks on one enemy also scorch one more enemy for 50%, and its burns last a turn longer.', scorch: 0.5 },
    learn: [['snap_breath', 1], ['fire_ignite', 1], ['snap_inferno', 3], ['snap_bite', 4], ['snap_stoke', 6], ['snap_roar', 8]],
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
    learn: [['coco_shot', 1], ['coco_cannon', 1], ['boom_fuse', 3], ['coco_broadside', 4], ['boom_kaboom', 6], ['coco_reload', 8]],
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
    learn: [['berg_chip', 1], ['berg_freeze', 1], ['frost_snare', 2], ['berg_slide', 4], ['berg_crunch', 6], ['berg_chill', 8]],
    unlock: { how: 'story' }, flavor: 'Cold, crunchy and slippery.',
  },
  empeach: {
    name: 'E.M.Peach', cls: 'grower', stats: [60, 9, 5, 12],
    passive: {
      name: 'EMP', desc: 'Double damage to machines (vehicles and robots), and machines can never shrug off its stuns.',
      emp: true,
      dealMult(u, t) { return t.data.vehicle ? 2 : 1; },
    },
    learn: [['emp_zap', 1], ['emp_short', 1], ['emp_pulse', 3], ['emp_static', 4], ['emp_overload', 6], ['emp_recharge', 8]],
    unlock: { how: 'rogue' }, flavor: 'Robots hate this peach.',
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
};
