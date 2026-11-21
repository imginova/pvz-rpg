# Lawn Legends: project handoff

This file holds everything a new Claude session, or a person, needs to keep working on this project. Claude Code reads `CLAUDE.md` automatically when it starts in this folder. [`README.md`](README.md) is the beginner-friendly guide.

## What this is

**Lawn Legends** is a free, browser-based **Plants vs. Zombies fan RPG**: turn-based battles drawn in ASCII art, a walkable ASCII overworld, a story mode, a team of five, classes, customizable movesets, unlockable plants, battle gimmicks and achievements. It was made on 2026-11-21.

- **Owner:** the `imginova` GitHub account (Jake Harris's son), who also makes *Bare Bones Custom Night* and the ASCII FNAF games in `C:\git\bbcn`. They're new to programming, so explain changes in plain language and avoid jargon.
- **Where it lives:** its own folder, `C:\git\pvz-rpg`, a git repository of its own (on request: "its own repo"), separate from bbcn. **No GitHub repository exists yet**; the first commit ("First version of Lawn Legends") was made locally on `main` on 2026-11-21. Creating one (and a GitHub Pages deploy like bbcn's) is a decision for the owner.
- **Private Artifact link:** https://claude.ai/artifact/4c5fSL8CPDB1sndcHptmFS (only the owner and people they share it with through the page's Share menu can open it; see "Publishing" below).
- **No build step, no dependencies, no sound files.** `index.html` works when double-clicked.

## Fan game rules (keep these)

- **It stays free.** No price, ads or donations.
- **It must say it's a fan game.** The title screen and top bar say "a Plants vs. Zombies fan RPG" and "Not affiliated with PopCap Games or Electronic Arts". Never present it as an official PvZ game.
- **Only the names are borrowed.** Plant, zombie and character names (Crazy Dave, Penny, Dr. Zomboss, Super Brainz) are used on purpose (the owner asked for real names). Every ASCII drawing, sound, line of dialogue and mechanic number is original. Never paste in sprites, sound files, music or word-for-word text from the games.

## Working agreements with the owner

- **Make a plan before big features**, and ask about genuinely ambiguous design choices. The owner said "ask as many questions as you want whenever you need to ask". Small requests can be done directly.
- **Commit only when asked.** After each change, ask "Commit these changes?". Commit as `imginova <107283216+imginova@users.noreply.github.com>` (already set in this repo's local git config; check `git config user.email` on a new computer). No work email may appear in files or commits.
- **No strict upgrades.** Every plant must be a sidegrade: better at something, worse at something else (owner's rule). See the stat budget below.
- **Every zombie needs a counter**: a weakness the player can find and use, written in its `counter` field (owner's request: "cool zombies with unique attacks and counters").
- **Never wipe saved progress.** Loading keeps every saved key, even unknown ones (`loadProgress` in `save.js`). Moves or plants that no longer exist are skipped when used, never deleted from the save. Test any save change with a fake old save.
- **After every change, republish the private Artifact link** so the owner can play it right away.
- **Keep the split by job and keep the comments.** New code goes in the file whose job it matches, commented in the same beginner-friendly style (explain *why*, define jargon the first time).

## How the game works

- **Story mode:** 6 chapters, each a walkable ASCII map (`CHAPTERS` in `world.js`): Front Lawn (Day), Night Backyard (Night), The Pool, The Roof, Zomboss's Lair, then the post-game **Time Rift** with characters from across the series (Egypt, Wild West, Pirate Seas, Dark Ages, Frostbite Caves, Neon Mixtape Tour, Jurassic Marsh, Far Future). Walk with arrows/WASD/the on-screen pad. Bumping into a battle tile starts it. Battles block the path until beaten. The boss (`B`) only fights once every non-optional battle is won (`bossReady`); rogue plants (`R`/`Q`) and the secret Yeti (drawn as a tree) are optional. Beating the boss opens the gate (`G`). Crazy Dave (`D`) opens the shop, practice battles and tips. Chests (`C`) give coins and Plant Food.
- **Battles** (`battle.js`): your team (up to 5) against waves of up to 5 enemies. Each round every unit acts once, fastest first. Plants: pick one of 4 equipped moves and a target. **Sun** is shared: `SUN_START` 50, `SUN_INCOME` 25 per round, basic moves free, big moves cost sun and have cooldowns. "Soak up sun" skips a turn for +15. **Plant Food** (bought for 60, max 5) makes a plant's next move free and x2. Plants fully heal after every battle (no attrition) and heal 20% between waves. Losing gives half XP; running away gives nothing.
- **Classes** (owner's names): Shooters (all-rounders), Hearty (tanks), Sunny (support), Volatile (burst damage), Growers (gimmicks needing strategy). Each class has a 6-move pool; every plant learns 2 signature moves plus 4 from its class pool (6 total, by level) and equips any 4 on the Team screen.
- **Every plant has a passive ability** (owner's request), as hooks: `roundStart`, `waveStart`, `dealMult`, `takeMult`, `onHurt`, `onFall`, `onAllyFall`, `afterAttack`, `onDevour`, `onStatus`, `turnStart`, plus flags (`lobAll`, `pierceAll`, `dodge`, `dodgeStraight`, `reflect`, `echo`, `ricochet`, `beam`, `scorch`, `splashAll`, `torch`, `icyBonus`, `healBoost`, `coinBonus`, `butter`, `blocksVault`, `noStun`, `emp`, `immune`).
- **Stat budget (no strict upgrades):** `HP / 8 + ATK + DEF + SPD` is 30–40 for every plant; plants with a strong passive sit lower. Example pairs: Repeater vs Peashooter (more hits, slower, no Steady Aim), Tall-nut vs Wall-nut (tougher, slower, no Tough Shell), Melon-pult vs Cabbage-pult (splash, slowest), Laser Bean (hits everyone at half power, never crits).
- **Mechanics:** armor soaks damage before HP unless the attack **pierces**; **lobbed** attacks skip Screen Door armor and reach diving Snorkels; Torchwood sets allies' straight shots on fire; fire melts chill/freeze; **burning units can't be healed** (counter to Scientist); vault/leap/swing attacks ignore Taunt but must hit a Tall-nut; bosses can't be devoured or hypnotized and resist stuns 50% (E.M.Peach's stuns always work on machines). Statuses last a number of the affected unit's own turns; a unit buffing itself gets +1 so the buff covers its next turn.
- **Battle gimmicks** (`GIMMICKS` in `data.js`; owner asked for them twice): Day, Night, Pool, Roof, Fog, Gravestones, Drought, Last Stand, Conveyor Belt, Storm, Rush, Heat Wave, Sandstorm, Freezing Wind, Neon Jams, Time Warp. Each chapter has one; battles can add more.
- **Unlocks** (37 plants: 3 starters, Peashooter, Sunflower and Wall-nut; the other 34 are unlocked): story battles (`reward.plant`), rogue plants beaten in the overworld (owner's idea), Crazy Dave's shop, and tough / secret / tough-collection achievements (owner rejected "100-damage hit" as an unlock; Squash = Untouchable, Cactus = Seed Vault (own 20), Gold Bloom = secret Sunny Side Up). New plants join one level below your best plant.
- **Colors and designs:** every plant and zombie drawing is painted character by character in its real colors (`DRAWINGS` in `art.js`: `art` is the drawing, `ink` a same-shaped map of palette letters, `pal` the colors; a space in the ink means color `a`; `spriteHtml` turns it into HTML). Requested in two steps ("change the colors of each plant to be accurate", then "look up characters to truly see their accurate color pallet and design"). On 2026-11-21 every character was checked against its picture on plantsvszombies.wiki.gg (fandom.com blocks automated reads). Corrections found that way: Marigold has white petals and a yellow face, Bloomerang is white with a blue center, Infi-nut is a cyan hologram on a projector base, Snapdragon is an olive dragon with an orange-red crest, Squash is pale yellow-green, Spikeweed has pale spikes on a brown base, the Flag Zombie's flag is red, the Dancing Zombie's afro is orange-brown, the Swashbuckler dresses in black. **Eyes and anything black use light or mid-grey colors** because the background is dark and black text would vanish. The class color is still used for a plant's name and card border.
- **Leveling:** XP per beaten enemy is `6 + 2 × level` (×3 for bosses), shared with the whole team (bench gets 40%), and scaled by `xpFactor` so plants above the enemies' level learn less. This was added after a simulated playthrough hit the level cap by the Roof. `MAX_LEVEL` is 20.
- **Bosses:** boss zombies (`'name!'`) get `BOSS_HP` (2×) health; rogue plants get `ROGUE_HP` (3×). Dr. Zomboss and Tomorrow-tron were eased after testing: summons call 1 zombie every 5 turns, fury is Power for 3 turns (not permanent), and their first waves are lighter.
- **Achievements:** 25 in `ACHIEVEMENTS` (`world.js`), some `secret` (hidden until earned). Awarded with `award(id)` from `battle.js`, `save.js` and `screens.js`.

## How the code is organized

Plain classic scripts (not modules), loaded in this order by `index.html`. Top-level names are shared, so **names must be unique across files**:

1. `helpers.js`: `$`, `store` (localStorage with try/catch, prefix `lawnlegends:`), `pick`, `rand`, `chance`, `clamp`, `esc`, `shuffle`.
2. `config.js`: tuning numbers (sun, team size, XP curve `xpToNext`, `statScale`, damage formula constants, status strengths, Plant Food, animation delays). **Most balance changes happen here.**
3. `data.js`: `CLASSES`, `STATUS`, `MOVES` (plants and zombies) with special-move helpers, `PLANTS` (37), `ZOMBIES` (39, each with `counter`), `GIMMICKS`.
4. `world.js`: `CHAPTERS` (maps, encounters, dialogue), map tiles (`WALLS`, `TILE_STYLE`), `SHOP_PLANTS`, `ACHIEVEMENTS`.
5. `art.js`: `SPRITES` (4-line ASCII drawings; every drawing ends with a space so a final backslash can't escape the closing backtick), `BARE` (drawings once armor breaks), `spriteFor`, the title's big letters.
6. `sound.js`: `sfx` (Web Audio beeps), mute.
7. `save.js`: `progress` (owned plants, team, coins, cleared battles, chests, position, achievements, seen zombies, counters), `loadProgress`/`saveProgress`, `equipped`, `toggleMove`, `unlockPlant`, `giveXp`, `award`, `unlockText`.
8. `battle.js`: the battle state `B` and all rules: `startBattle`, rounds and turns, `useMove`, `hit` (the damage pipeline), statuses, AI, `winBattle`/`loseBattle`.
9. `render.js`: draws the battle (`render()`), only reads `B`.
10. `screens.js`: title, overworld (`MAPS`, `renderWorld`, `moveWorld`), dialog, prebattle, results, Team, Shop, Almanac, Achievements, toasts.
11. `input.js`: every click and key.
12. `main.js`: `boot()` and the `window.lawnLegends` test hook.

### Gotchas

- `index.html` is a **page fragment** (no doctype/html/head/body) because the Artifact publisher wraps it. It keeps `<meta charset="utf-8">` and the `[hidden]` rule in `style.css` so double-clicking it works.
- Adding a map tile character: put it in `WALLS` if it blocks, and in `TILE_STYLE` with a CSS class.
- Adding a zombie: stats, moves, `desc` and `counter` in `ZOMBIES`, a drawing in `SPRITES`, then use it in a wave.
- Adding a plant: `PLANTS` entry (class, stats within budget, passive, 6 `learn` entries, `unlock`), 2 signature moves in `MOVES`, a drawing in `SPRITES`, and an unlock source (story reward, rogue battle, shop price or achievement).

## Testing

There's no Node.js or Python on this Windows computer. What worked (2026-11-21):
- Build one all-in-one HTML file with Perl (Git Bash has it) by inlining `style.css` and the scripts, serve it with a small PowerShell `HttpListener` on `127.0.0.1:8765`, and open it in the Claude app's browser pane. The pane can't run scripts on `file://` pages.
- In the page, an auto-player (`setInterval` picking moves) plus `B.speed = 400` runs battles in milliseconds.
- **Use a separate test tab that never saves** (`store.set = () => {}` right after loading), so the owner's own save in the other tab isn't overwritten.
- **Checked:** every map's tiles are known and every battle, chest, sign, Dave and gate is reachable; every plant/zombie has a drawing and valid moves; every zombie has a counter; every plant has an unlock source; all 45 story battles run with no errors.
- **Simulated playthrough** (fresh save, a simple bot that picks random usable moves, best 5 plants by level, a practice battle after each loss): it finished all 6 chapters. Front Lawn: 0 losses, best plant Lv5; Night: 0, Lv8; Pool: 0, Lv10; Roof: 0, Lv13; Lair: 3 losses (all Dr. Zomboss), Lv15; Time Rift: 0, Lv19. 16 achievements along the way. Bosses with random teams of 5 at a fixed level: Dr. Zomboss 2/6 at Lv13 and 5/6 at Lv15; Tomorrow-tron 4/6 at Lv17. The early chapters are probably easy for a person; coins pile up (about 13,000 by the end, the shop needs about 2,250).
- **Not checked by a person yet:** how it feels to play, the balance with real decisions, the sounds, the phone layout beyond a look at the battle screen.

## Hosting (the public website)

- **Planned home:** GitHub repository `imginova/pvz-rpg` (public), website https://imginova.github.io/pvz-rpg/ (requested 2026-11-21: "link for browser (or at least to commit on browser)").
- `.github/workflows/deploy.yml` checks every script, runs `tools/build.js` (which wraps the `index.html` fragment in a real page in `dist/`, gitignored) and, on a push to `main`, deploys `dist/` to GitHub Pages. One-time setting on github.com: repo Settings → Pages → Source = **GitHub Actions**.
- `tools/build.js` is bbcn's build without the Google Analytics part (this game has no analytics). It was not run locally (this computer has no Node.js); GitHub runs it on every push.
- This computer has no `gh` CLI; pushing works through Git Credential Manager as `imginova` (same as bbcn).

## Publishing (the private Artifact link)

Publish `index.html` with every other file in `files` (`style.css` and all 12 `js/*.js`, each mapped to the same path). From a new session, first `read` the artifact URL, then publish with that `url`. The Artifact tool only publishes files inside the session's working folder or its scratchpad: a session started in `C:\git\pvz-rpg` can publish directly; the first publish (from a session in `C:\git\bbcn`) copied the files into the scratchpad first.
