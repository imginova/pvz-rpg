/* =====================================================================
   config.js: the tuning numbers. MOST BALANCE CHANGES HAPPEN HERE.

   If battles feel too long, too short, too easy or too hard, change a
   number in this file first. Every other file reads these names.
   ===================================================================== */

// ---- Sun: the team's shared resource ---------------------------------
// Basic moves are free. Stronger moves cost sun. The team has one sun
// counter that everyone spends from, like the sun bank in real PvZ.
const SUN_START = 50;    // sun at the start of a battle
const SUN_INCOME = 25;   // sun added at the start of every round
const SUN_MAX = 999;     // the counter never goes above this
const WAIT_SUN = 15;     // "Soak up sun" (skipping a turn) gives this much

// ---- Team and moves ---------------------------------------------------
const MAX_TEAM = 5;      // plants you can bring into a battle
const MAX_MOVES = 4;     // moves a plant can have equipped at once
const MAX_LEVEL = 10;

// statScale(side): how strong a unit's health (HP) and attack are compared
// to the numbers in data.js. Levels DON'T make anything stronger (owner's
// choice, 2026-11-22: "remove stats getting better as levels increase and
// instead have the starting stats be around level 7", and "make the
// zombies also level locked in strength"). Levels now only unlock moves.
//   - Your plants always get x1.72 (what level 7 used to give).
//   - Enemies (zombies and rogue plants) always get x1.5 (about old level
//     5). Plants used to end up about 2 levels above the zombies, and this
//     keeps that small edge; with both at x1.72 the bot lost much more.
// Later chapters are harder because of tougher zombie types, more waves
// and bosses, not levels.
const PLANT_STAT_SCALE = 1.72;
const ENEMY_STAT_SCALE = 1.5;
const statScale = side => (side === 'ally' ? PLANT_STAT_SCALE : ENEMY_STAT_SCALE);

// XP needed to go from `lvl` to `lvl + 1`.
const xpToNext = lvl => 20 + 15 * lvl;
const BENCH_XP = 0.4;    // plants NOT in the team still get 40% of the XP

// xpFactor(plant level, enemy level): plants far above the enemies learn
// less, plants below them learn more (up to double). This keeps your team
// close to the story's level instead of racing to the level cap, and helps
// a new or benched plant catch up. At the enemies' level: x1.
const xpFactor = (plantLvl, enemyLvl) => clamp(1 + 0.4 * (enemyLvl - plantLvl), 0.05, 2);

// ---- Damage -----------------------------------------------------------
// damage = power x (attack / 10) x (DEF_K / (DEF_K + defense)) x bonuses
// So a defense of 10 halves the damage, and a defense of 0 takes it all.
const DEF_K = 10;
const CRIT_CHANCE = 0.08;  // 8% of hits are critical hits...
const CRIT_MULT = 1.5;     // ...and do 50% more damage
const FIRE_BONUS = 1.4;    // Torchwood's flaming peas

// ---- Status effects (how strong each one is) --------------------------
const BURN_PART = 0.06;    // burning loses 6% of max HP every turn
const POWER_MULT = 1.5;    // "Power" status: 50% more damage
const WEAK_MULT = 0.7;     // "Weak" status: 30% less damage
const GUARD_MULT = 0.6;    // "Guard" status: 40% less damage taken
const THORNS_PART = 0.3;   // "Thorns" status: 30% of damage bounces back
const CHILL_SPEED = 0.5;   // "Chill" status: half speed
const BOSS_RESIST = 0.5;   // bosses shrug off stuns, freezes and sleep half the time
const MARK_MULT = 1.3;     // "Marked" status: takes 30% more damage
const EVADE_CHANCE = 0.5;  // "Evade" status: dodges half of the attacks aimed at it
const REGEN_PART = 0.08;   // "Regen" status: heals 8% of max HP each turn
const COUNTER_POWER = 12;  // "Counter" status: the power of the hit back
const BOUNTY_SUN = 50;     // Citron's Bounty: sun for defeating the marked enemy

// ---- Between waves and after battles ----------------------------------
const WAVE_HEAL = 0.2;     // plants heal 20% of max HP between waves
const BOSS_HP = 2;         // a boss zombie ('football!' in world.js) has 2x the HP
const ROGUE_HP = 3;        // a rogue plant boss has 3x a normal plant's HP
const ROGUE_ATK = 1.15;    // ...and 15% more attack

// ---- Plant Food (an item bought from Crazy Dave) ----------------------
// Using it on a plant makes that plant's next move free and twice as strong.
const PLANT_FOOD_MAX = 5;
const PLANT_FOOD_PRICE = 60;

// ---- Versus (plants vs plants, versus.js) ------------------------------
// Two tanky teams that heal and shield can stall forever, so versus has
// OVERTIME: after this round, every plant wilts a little each round, more
// every round (4% of max HP in the first overtime round, 8% in the second...).
const VS_OVERTIME_ROUND = 30;
const VS_OVERTIME_PART = 0.04;

// ---- Speed of the battle animation (milliseconds) ---------------------
const DELAY_FOE = 700;     // pause before an enemy acts
const DELAY_NEXT = 300;    // pause between turns

// A move whose cooldown is this long or longer can only be used once per
// battle (Spikerock, Second Burst). The game shows it as "once per battle".
const ONCE_PER_BATTLE = 99;
