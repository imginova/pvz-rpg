# Lawn Legends

A free **Plants vs. Zombies fan RPG** you play in the browser: turn-based battles drawn in ASCII art, an overworld you walk around, a story with six chapters, a team of five plants with their own abilities and customizable moves, battle gimmicks, rogue plants to recruit, a shop, achievements, and a versus mode where plants fight plants.

*Not affiliated with PopCap Games or Electronic Arts. Plants vs. Zombies belongs to them. All the art, sounds and writing here are original.*

## How to play it

Double-click `index.html`. It opens in your browser. There's nothing to install.

Your progress is saved in your browser, so you can close it and come back later.

## How to play

- **Walk** with the arrow keys, WASD, or the on-screen arrows.
- **Walk into a zombie** to start a battle. Once you beat a world's boss, its beaten battles show up as dim letters: step on one to fight it again for XP and coins. Walk into Crazy Dave (`D`) to shop, practice or get tips.
- In battle, each plant gets a turn. Click a move (or press `1`-`4`), then click who to use it on.
- **Sun** is shared by the team and refills every round. Big moves cost sun.
- **Click any zombie** in a battle to see what it does and **how to beat it**.
- On the **Team** screen, pick up to 5 plants and choose 4 moves for each.
- **Versus** (on the title screen): two teams of plants fight each other. Play against the computer (Easy, Normal or Hard), against a friend on the same computer, or watch the computer play itself. Every plant is unlocked there, and it never changes your story save.

The game's own "How to play" button explains the rest.

## How the code is put together

The game is split into files by job, so each file is small enough to read:

| File | Its job |
|---|---|
| `index.html` | The page structure: screens, buttons, empty boxes the game draws into |
| `style.css` | How everything looks: colors, fonts, layout |
| `js/helpers.js` | Tiny tools every file uses (saving, random picks) |
| `js/config.js` | The tuning numbers. **Change balance here first** |
| `js/data.js` | Every class, move, plant, zombie and battle gimmick |
| `js/world.js` | The story: chapter maps, battles, dialogue, shop, achievements |
| `js/art.js` | The ASCII drawings |
| `js/sound.js` | Sound effects, made by the browser (no sound files) |
| `js/save.js` | Your progress: plants, levels, moves, coins, achievements |
| `js/battle.js` | The battle rules |
| `js/render.js` | Draws the battle screen |
| `js/screens.js` | Every other screen: title, map, team, shop, almanac |
| `js/versus.js` | Versus mode: its setup screen, starting and ending versus battles, and the versus AI |
| `js/input.js` | Mouse clicks and keys |
| `js/main.js` | Starts the game |

### Ideas for changes you can try

- **Make a plant stronger or weaker:** change its `stats` in `js/data.js` (`[HP, attack, defense, speed]`).
- **Change how much sun you get:** `SUN_INCOME` in `js/config.js`.
- **Draw a new map:** edit a chapter's `map` in `js/world.js`. Each character is one tile; the comment at the top explains them.
- **Add a zombie:** copy one in `ZOMBIES` (`js/data.js`), give it a drawing in `js/art.js`, and put it in a battle's `waves`.

Every file starts with a comment explaining its job, so open one and read the top first.
