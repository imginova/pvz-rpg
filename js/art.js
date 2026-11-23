/* =====================================================================
   art.js: the ASCII DRAWINGS of every plant and zombie, and their colors.

   Each drawing is 4 lines of text, plus an "ink" (a color map) of the
   same shape and a small palette:
     art   the drawing itself
     ink   one letter per character saying which palette color paints
           it. A space means the palette's `a` color (the main color).
     pal   the colors: { a: '#hex', b: '#hex', ... }
   For example Sunflower's ink paints its petals yellow (a), its face
   orange-brown (f), its eyes and smile (k) and its stem green (g).

   The colors were checked against pictures of every character on the
   Plants vs. Zombies Wiki (plantsvszombies.wiki.gg) on 2026-11-21. The
   drawings themselves are original ASCII art.

   Eyes use a light color (k) on purpose: the game's background is dark,
   so black eyes would disappear.

   They're written with String.raw so that a backslash (\) stays a
   backslash instead of starting an "escape" like \n (new line).
   Keep the art ASCII-only (plain keyboard characters). Fancy symbols
   come from other fonts with different widths and break the lines up.

   Zombies with armor have two drawings: the armored one (for example
   'cone') and the one shown when the armor breaks (BARE['cone']).
   ===================================================================== */

// art`...` turns a drawing into a list of its lines, dropping the empty
// first line that comes from starting the drawing on a new line.
// A drawing must never END with a backslash, because a backslash right
// before the closing backtick "escapes" it and the drawing never ends.
// That's why the drawings end with a space.
const art = (strings) => String.raw(strings).split('\n').slice(1);

// Colors many characters share.
const EYE = '#f2efe4';     // light eyes (see the note at the top)
const STEM = '#3f9b30';    // plant stems and leaves
const Z = {                // a basic zombie: skin, eyes, hair, coat, shirt, tie, pants
  s: '#9db38a', k: EYE, h: '#6a5038', c: '#7a5434', w: '#e9e4d6', r: '#d0403a', p: '#5e4a34',
};

const DRAWINGS = {
  // ================= PLANTS =================
  peashooter: {
    pal: { a: '#a8e04c', b: STEM, k: EYE },
    art: art`
  ,--.
 ~( o )=O
   '+'
 \__|__/ `,
    ink: art`

 b  k
   bbb
 bbbbbbb`,
  },
  repeater: {
    pal: { a: '#86cc38', b: '#357f27', k: EYE },
    art: art`
  ,--.
 ~(>o )=O
 ~ '+'
 \__|__/ `,
    ink: art`

 b kk
 b bbb
 bbbbbbb`,
  },
  snowpea: {
    pal: { a: '#8fd6f5', c: '#e4f8ff', b: STEM, k: EYE },
    art: art`
 *,--.
 *( o )=O
   '+'
 \__|__/ `,
    ink: art`
 c
 c  k
   bbb
 bbbbbbb`,
  },
  cabbagepult: {
    pal: { a: '#c5e8a0', c: '#8fd05a', b: STEM, k: EYE },
    art: art`
 (@)_
    \
  (o o)
 \_____/ `,
    ink: art`
 cccb
    b
   k k
 bbbbbbb`,
  },
  cactus: {
    pal: { a: '#4fb34a', c: '#ff5a6e', s: '#f2f2d0', k: EYE },
    art: art`
   @
 ,(o o),
 '|:::|'
  |:::|`,
    ink: art`
   c
   k k
   sss
   sss`,
  },
  puffshroom: {
    pal: { a: '#a066c8', c: '#ece0c4', k: EYE },
    art: art`

  .--.
 (____)
  |oo| `,
    ink: art`



  ckkc`,
  },
  wallnut: {
    pal: { a: '#c8883a', d: '#8b5a2b', k: EYE },
    art: art`
 .---.
/ O O \
|  -  |
 \___/ `,
    ink: art`

  k k
   d
`,
  },
  tallnut: {
    pal: { a: '#b07534', d: '#7a4a22', k: EYE },
    art: art`
 .---.
| O O |
|  ^  |
|_____| `,
    ink: art`

  k k
   d
`,
  },
  pumpkin: {
    pal: { a: '#f28c28', g: '#4e8a2e', k: '#ffd25a' },
    art: art`
  _)_
 / ^ ^\
( vvv )
 '---' `,
    ink: art`
  ggg
   k k
  kkk
`,
  },
  garlic: {
    pal: { a: '#f3ebd9', p: '#b48acd', g: '#7cb342', k: '#6a4a8a' },
    art: art`
   ^
  /|\
 (-_-)
  '"' `,
    ink: art`
   g
   p
 pk kp
`,
  },
  spikeweed: {
    pal: { a: '#ddd8c8', b: '#7a5634', k: EYE },
    art: art`

  o o
 ^v^v^v
/\/\/\/ `,
    ink: art`

  k k

bbbbbbb`,
  },
  sunflower: {
    pal: { a: '#ffd21f', f: '#c97a2c', g: STEM, k: EYE },
    art: art`
 \\|//
-(^u^)-
 //|\\
   |/ `,
    ink: art`

 fkkkf

   gg`,
  },
  sunshroom: {
    pal: { a: '#f2b92b', y: '#ffe9a0', c: '#f5e6c8', k: '#a0701a' },
    art: art`
  ___
 (* *)
 (___)
  |u| `,
    ink: art`

  y y

  ckc`,
  },
  marigold: {
    pal: { a: '#f7f5ee', y: '#ffc23c', g: STEM, k: '#a0701a' },
    art: art`
 *.*.*
*(^u^)*
 *'*'*
   | `,
    ink: art`

 ykkky

   g`,
  },
  aloe: {
    pal: { a: '#6bbf45', d: '#4fc3f0', k: EYE },
    art: art`
 \ | /  o
  \|/
 (o_o)
 /___\ `,
    ink: art`
        d

  k k
`,
  },
  cherrybomb: {
    pal: { a: '#e0283e', g: STEM, k: EYE },
    art: art`
  \ /
  / \
(>.)(.<)
 '-''-' `,
    ink: art`
  g g
  g g
 kk  kk
`,
  },
  jalapeno: {
    pal: { a: '#e02a24', g: STEM, k: EYE },
    art: art`
   ,
  ( \
  |><)
   \/ `,
    ink: art`
   g

   kk
`,
  },
  squash: {
    pal: { a: '#c9d68a', d: '#9aab5a', g: STEM, k: EYE },
    art: art`
  _\_
 /   \
( >:< )
 \_|_/ `,
    ink: art`
  ggg

  kkk
   d`,
  },
  melonpult: {
    pal: { a: '#c5e8a0', m: '#3e8e2a', l: '#9ed36a', b: STEM, k: EYE },
    art: art`
  (##)
    \
  (o o)
 \_____/ `,
    ink: art`
  mllm
    b
   k k
 bbbbbbb`,
  },
  fumeshroom: {
    pal: { a: '#8a52b8', c: '#dcebc8', n: '#6a3a98', k: EYE },
    art: art`
 .---.
(_____)=<
 |o o|
 |___| `,
    ink: art`

       nn
 ckckc
 ccccc`,
  },
  bonkchoy: {
    pal: { a: '#edefe0', g: '#4e9a2f', k: '#5a9a3a' },
    art: art`
  \|/
@(> <)@
  |=|
  /_\ `,
    ink: art`
  ggg
g k k g

`,
  },
  chomper: {
    pal: { a: '#9a4cc0', w: '#ffffff', g: STEM, k: EYE },
    art: art`
 /VVV\
|  o  >
 \^^^/
   |) `,
    ink: art`
  www
   k
  www
   gg`,
  },
  hypnoshroom: {
    pal: { a: '#f5a3c7', p: '#f5a3c7', b: '#9ad7f0', g: '#b6e7a0', y: '#fff2a8', c: '#f2ece4', r: '#e03a3a' },
    art: art`
 .-@-.
(@ @ @)
 '---'
  |o| `,
    ink: art`
 pbgbp
abg ybg
 ccccc
  crc`,
  },
  iceshroom: {
    pal: { a: '#8ad4f2', w: '#e6f8ff', c: '#ddeff5', k: '#3a8ac0' },
    art: art`
 /\/\/\
(______)
  |oo|
  |__| `,
    ink: art`

wwwwwwww
  ckkc
  cccc`,
  },
  torchwood: {
    pal: { a: '#6e4422', y: '#ffd23f', o: '#ff8c1a', k: '#ffb040' },
    art: art`
  )()(
 (_)()
 |> <|
 |___| `,
    ink: art`
  yyyy
 oooo
  k k
`,
  },
  kernelpult: {
    pal: { a: '#f7d133', h: '#6ba539', b: STEM, k: '#a07a10' },
    art: art`
   o_
  [::]\
 (|o o|)
  \\|// `,
    ink: art`
    b
      b
 h k k h
  hhhhh`,
  },
  potatomine: {
    pal: { a: '#c08a44', s: '#b0b0b0', r: '#ff2a2a', d: '#6b4a2b', k: EYE },
    art: art`
   o
   |
 (o_o)
~~~~~~~ `,
    ink: art`
   r
   s
  k k
ddddddd`,
  },
  bloomerang: {
    pal: { a: '#f4f1e6', c: '#5ab8e8', g: STEM, k: '#1e4e7a' },
    art: art`
  \v/
 >(@)<
  /^\
   |/ `,
    ink: art`

  ccc

   gg`,
  },
  laserbean: {
    pal: { a: '#a4d65a', g: STEM, r: '#ff3b3b' },
    art: art`
   v
 .-~-.
( >< )==
 '-.-' `,
    ink: art`
   g

  rr  rr
`,
  },
  citron: {
    pal: { a: '#f7941d', m: '#9aa5b1', c: '#7fdbff' },
    art: art`
  _^_
 /o o\
|(===)|
 \___/ `,
    ink: art`
  mmm
  c c
mmcccmm
`,
  },
  infinut: {
    pal: { a: '#4fd3f0', h: '#d8f8ff', m: '#6a7a8a' },
    art: art`
 .---.
/ O O \
\_____/
 [===] `,
    ink: art`

  h h

 mmmmm`,
  },
  goldbloom: {
    pal: { a: '#ffc928', w: '#fff08a', g: STEM },
    art: art`
 @ @ @
  \|/
   |
  \|/ `,
    ink: art`
 w w w
  ggg
   g
  ggg`,
  },
  sunbean: {
    pal: { a: '#f2c21b', g: '#7cb342', k: '#a0701a' },
    art: art`
   ,
 .-'-.
( ^v^ )
 '---' `,
    ink: art`
   g
   g
  kkk
`,
  },
  snapdragon: {
    pal: { a: '#c4c45a', r: '#e8582a', f: '#ff9a1a', g: STEM, k: EYE },
    art: art`
  /\/\
 ( o  >~~
  \__/
   \| `,
    ink: art`
  rrrr
   k   ff

   gg`,
  },
  coconut: {
    pal: { a: '#8a5a2e', y: '#ffd23f', m: '#6a4a2a', k: EYE },
    art: art`
   *
 .--._
(>   _O
 '--' `,
    ink: art`
   y

 k   mm
`,
  },
  iceberg: {
    pal: { a: '#bde9f2', k: '#1e6e9a' },
    art: art`

  .--.
 / ^^ \
 \_vv_/ `,
    ink: art`


   kk
   kk`,
  },
  empeach: {
    pal: { a: '#f6804a', b: '#4a90e2', c: '#6ec6ff' },
    art: art`
   O
   |
 (o.o)
 (___) `,
    ink: art`
   b
   b
  c c
`,
  },
  // Lightning Reed: a glowing cyan spark on a thin grass stem.
  lightningreed: {
    pal: { a: '#8ff4ff', w: '#ffffff', g: STEM, k: '#1e6e9a' },
    art: art`
 \ * /
 -(o)-
  /|\
   |/ `,
    ink: art`
   w
   k
  ggg
   gg`,
  },
  // Magnet-shroom: a silver horseshoe magnet on a dark red cap, pale lilac stem.
  magnetshroom: {
    pal: { a: '#c0283c', m: '#b8bcc4', t: '#e86a6a', c: '#cbbbe2', k: EYE },
    art: art`
 (\_/)
 .---.
(_o_o_)
  |_| `,
    ink: art`
 tmmmt

  k k
  ccc`,
  },
  // Umbrella Leaf: a big green leaf canopy over a small pale face.
  umbrellaleaf: {
    pal: { a: '#4caf3a', d: '#7ed957', b: '#cfe8a0', k: '#3a6a2a' },
    art: art`
 _\|/_
/_/|\_\
   |
  (u) `,
    ink: art`
 ddddd

   b
  bkb`,
  },

  // ================= ZOMBIES =================
  // The usual ink for a zombie's face line is " sksks": skin with light eyes.
  zombie: {
    pal: { ...Z, a: Z.s },
    art: art`
  ,,,
 (x_x)
 /[V]\
  / \ `,
    ink: art`
  hhh
 sksks
 cwrwc
  p p`,
  },
  flag: {
    pal: { ...Z, a: Z.s, f: '#d8343e', o: '#8a5a30' },
    art: art`
  ,,, |>
 (x_x)|
 /[V]\|
  / \ `,
    ink: art`
  hhh of
 skskso
 cwrwco
  p p`,
  },
  cone: {
    pal: { ...Z, a: Z.s, o: '#f07f1e', d: '#c4601a' },
    art: art`
   ^
  /_\
 (x_x)
 /[V]\ `,
    ink: art`
   o
  odo
 sksks
 cwrwc`,
  },
  bucket: {
    pal: { ...Z, a: Z.s, g: '#a8adb2', m: '#6e7378' },
    art: art`
 [___]
 (x_x)
 /[V]\
  / \ `,
    ink: art`
 mgrgm
 sksks
 cwrwc
  p p`,
  },
  paper: {
    pal: { ...Z, a: Z.s, g: '#c9c9c9', n: '#e8e4d2', d: '#4a4a4a' },
    art: art`
  ,,,
 (o_o)
[NEWS]
  / \ `,
    ink: art`
  ggg
 sksks
nddddn
  p p`,
  },
  paperMad: {
    pal: { ...Z, a: Z.s, g: '#c9c9c9', R: '#e0605a' },
    art: art`
  ,,,
 (>_<)!
 /[V]\
  / \ `,
    ink: art`
  ggg
 RkRkRR
 wwwww
  p p`,
  },
  pole: {
    pal: { ...Z, a: Z.s, y: '#e8c94a', b: '#2f6fd0', R: '#d02a30', t: '#d9b44a' },
    art: art`
  ,,, /
 (x_x)/
 /[0]/
  / \ `,
    ink: art`
  yyy t
 bkskbt
 RRwRt
  w w`,
  },
  football: {
    pal: { ...Z, a: Z.s, R: '#d0222c', g: '#d0d0d0', W: '#ededed' },
    art: art`
 (===)
 (x_x)
[|##|]
  / \ `,
    ink: art`
 RgggR
 sksks
RRRRRR
  W W`,
  },
  footballBare: {
    pal: { ...Z, a: Z.s, R: '#d0222c', W: '#ededed' },
    art: art`
  ,,,
 (x_x)
[|##|]
  / \ `,
    ink: art`
  hhh
 sksks
RRRRRR
  W W`,
  },
  dancer: {
    pal: { ...Z, a: Z.s, A: '#b5652a', W: '#dfe9f2', y: '#e8c040' },
    art: art`
 (@@@)
 (o_o)
 \|*|/
  / > `,
    ink: art`
 AAAAA
 sksks
 WWyWW
  W W`,
  },
  backup: {
    pal: { ...Z, a: Z.s, P: '#f0a0c0', G: '#5a9a3a' },
    art: art`
  ~~~
 (-_-)
 /|*|\
  < \ `,
    ink: art`
  hhh
 sksks
 PPPPP
  G G`,
  },
  door: {
    pal: { ...Z, a: Z.s, f: '#c4c4c4', m: '#7f8a8f', y: '#d4af37' },
    art: art`
 ,,,|#|
(x_x|#|
/[V]|#|
 / \|#| `,
    ink: art`
 hhhfmf
skskfmf
cwrwfyf
 p pfmf`,
  },
  imp: {
    pal: { ...Z, a: Z.s, R: '#a8302a' },
    art: art`

  ,,
 (x_x)
  /\ `,
    ink: art`

  hh
 sksks
  RR`,
  },
  snorkel: {
    pal: { ...Z, a: Z.s, y: '#f2c230', b: '#6ec1e4', W: '#3a7bd5' },
    art: art`
   |
  (o)
 (x_x)
~~~~~~~ `,
    ink: art`
   y
  bbb
 sksks
WWWWWWW`,
  },
  dolphin: {
    pal: { ...Z, a: Z.s, d: '#8c98a6', L: '#d8dee4', K: '#6a6a72', b: '#6ec1e4' },
    art: art`
  ,,,
 (o_o)
 _/|\__
<______> `,
    ink: art`
  hhh
 sbsbs
 dKKKdd
dLLLLLLd`,
  },
  digger: {
    pal: { ...Z, a: Z.s, y: '#e5b820', R: '#c8302a', B: '#2e5e9e', D: '#7a5634' },
    art: art`
  _T_
 (x_x)
 /[#]\
.:.:.:. `,
    ink: art`
  yyy
 sksks
 RBBBR
DDDDDDD`,
  },
  jack: {
    pal: { ...Z, a: Z.s, P: '#7a4ab0', W: '#f0eee8', R: '#d0342c', y: '#d4af37' },
    art: art`
  ,,, _
 (x_x)[?]
 /|=|\|
  / \ `,
    ink: art`
  hhh y
 sksksRyR
 PWPWPy
  P P`,
  },
  bungee: {
    pal: { ...Z, a: Z.s, K: '#8a8a8a', R: '#b8302a' },
    art: art`
   |
   |
 (x_x)
 /[#]\ `,
    ink: art`
   K
   K
 sksks
 RRRRR`,
  },
  catapult: {
    pal: { ...Z, a: Z.s, O: '#e07b2a', g: '#8c8f94', W: '#8a5a2e' },
    art: art`
  o
   \,,,
 _(x_x)
(o)--(o) `,
    ink: art`
  O
   ghhh
 Wsksks
gggWWggg`,
  },
  zomboni: {
    pal: { ...Z, a: Z.s, W: '#d9dee3', R: '#d0222c', K: '#7a7a82', I: '#bfe3f5' },
    art: art`
  ___,,,
 | Z(x_x)
 |_____|
 (o)~(o) `,
    ink: art`
  WWWhhh
 W Rsksks
 WWWWWWW
 KKKIKKK`,
  },
  gargantuar: {
    pal: { ...Z, a: Z.s, B: '#7a5a3a', W: '#8a5a30' },
    art: art`
 ,,,,,
(X _ X)
/|###|\=
 /   \ `,
    ink: art`
 hhhhh
sk s ks
sBBBBBsW
 B   B`,
  },
  yeti: {
    pal: { a: '#ededed', F: '#6f7a80', R: '#e33b3b' },
    art: art`
 .^^^.
 (o_o)
/|###|\
 /   \ `,
    ink: art`

  RFR

`,
  },
  zomboss: {
    pal: { ...Z, a: '#8a8f99', D: '#4a4e57', R: '#ff3a3a' },
    art: art`
 [=@=]
/|###|\
||(x)||
_/   \_ `,
    ink: art`
   s
 DDDDD
  RRR
DD   DD`,
  },
  zombossBare: {
    pal: { ...Z, a: '#8a8f99', D: '#4a4e57', R: '#ff3a3a' },
    art: art`
 [=x=]
/| # |\
||(x)||
_/   \_ `,
    ink: art`
   R
 D D D
  RRR
DD   DD`,
  },
  mummy: {
    pal: { a: '#e3dcc2', b: '#b8ae8c', r: '#e33b3b' },
    art: art`
 =====
 (x_x)
 /|=|\
 =/ \= `,
    ink: art`
 bbbbb
  r r
  b b
 b   b`,
  },
  explorer: {
    pal: { ...Z, a: Z.s, t: '#d8c59a', O: '#ff9a28', W: '#7a5230', m: '#b5452e', Y: '#f2c531', G: '#4e6b3a' },
    art: art`
 _===_ *
 (x_x)/
 /[Y]/
  / \ `,
    ink: art`
 ttttt O
 skmksW
 tYYYW
  G G`,
  },
  ra: {
    pal: { ...Z, a: Z.s, g: '#d4a93a', b: '#2b5fa8', W: '#7a5230', R: '#e8452c', w: '#efe9d9' },
    art: art`
 /=*=\ O
 (x_x)|
 /|#|\|
  / \ `,
    ink: art`
 gbgbg R
 sksksW
 gggggW
  w w`,
  },
  pianist: {
    pal: { ...Z, a: Z.s, H: '#2f4f8f', P: '#7a4a2a', w: '#f2eee2', K: '#5a5a62' },
    art: art`
  ,,,
 (x_x)
 [#####]
 |_._._| `,
    ink: art`
  HHH
 sksks
 PwKwKwP
 PPPPPPP`,
  },
  swash: {
    pal: { ...Z, a: Z.s, K: '#6a6a72', w: '#f0eee8', S: '#c9cdd3', R: '#b08a5a', y: '#d4af37' },
    art: art`
 _/x\_ |
 (x_x) |
 /|#|\=+
  / \ `,
    ink: art`
 KKwKK R
 skyks R
 KKKKKSR
  K K`,
  },
  impcannon: {
    pal: { ...Z, a: Z.s, K: '#7a7a82', W: '#8a5a2e', O: '#f28c28', r: '#d0342c' },
    art: art`
   ,,
  (x_x)
 [==@@=O
 (o)(o) `,
    ink: art`
   rr
  sksks
 KKKKKKO
 WWWWWW`,
  },
  hunter: {
    pal: { ...Z, a: Z.s, O: '#d98e3a', F: '#7a5233', w: '#eaf4fa' },
    art: art`
 (-^-) o
 (x_x)/
 /|#|/
  / \ `,
    ink: art`
 OOOOO w
 skskss
 FFFFs
  F F`,
  },
  wizard: {
    pal: { ...Z, a: Z.s, P: '#6a48a8', y: '#f2d24a', W: '#7a5230', O: '#c060f0', w: '#e6e6e6' },
    art: art`
   /\ *
  /__\|
 (x_x)|
 /|#|\ `,
    ink: art`
   PP O
  PyPPW
 sksksW
 PwwwP`,
  },
  king: {
    pal: { ...Z, a: Z.s, y: '#e0b83a', R: '#c42a30', P: '#7a4ab0', G: '#8cc63f' },
    art: art`
 \^^^/
 (x_x)
 /|#|\
  / \ `,
    ink: art`
 yyyyy
 sksks
 RPPPR
  G G`,
  },
  glitter: {
    pal: { ...Z, a: Z.s, Y: '#f2d46a', P: '#f28ac0', W: '#ffffff', r: '#ff6a6a', b: '#5aa8ff', g: '#7ad860' },
    art: art`
  *,,*
 (x_x)~
 /|*|\~
  / \~~ `,
    ink: art`
  YYYY
 skskYr
 PPPPPb
  W Wgg`,
  },
  punk: {
    pal: { ...Z, a: Z.s, P: '#f06ab0', b: '#3f7fd0', K: '#6a6a72', T: '#a02a3a' },
    art: art`
  /|\
 (x_x)
 /|#|\
  / > `,
    ink: art`
  PbP
 sksks
 KKrKK
  T T`,
  },
  raptor: {
    pal: { a: '#3d78c9', y: '#f2c531', w: '#ede6d6' },
    art: art`
   __
  (x >
 _/ \
/  ^ ^ `,
    ink: art`

   y

   w w`,
  },
  jetpack: {
    pal: { ...Z, a: Z.s, G: '#b8c2cc', B: '#2f6fd0', O: '#f28c28' },
    art: art`
  ,,,
 (x_x)
 [|#|]
  vvv `,
    ink: art`
  hhh
 sksks
 BGGGO
  OOO`,
  },
  shieldz: {
    pal: { ...Z, a: Z.s, W: '#f2f2f2', R: '#d0342c', V: '#5fd35f', F: '#ff6a6a', g: '#b8c2cc' },
    art: art`
 (=|=)
)(v_v)(
 /|#|\
  / \ `,
    ink: art`
 WWRWW
FWVVVWF
 ggggg
  g g`,
  },
  engineer: {
    pal: { ...Z, a: Z.s, y: '#f2c12e', O: '#f28c28', W: '#e6e6e6', m: '#7a7f86', p: '#4a5a6a' },
    art: art`
 [___]
 (x_x)
 /|#|\T
  / \ `,
    ink: art`
 yyyyy
 sksks
 OWOWOm
  p p`,
  },
  scientist: {
    pal: { ...Z, a: Z.s, K: '#7a7a82', W: '#f2f2f2', g: '#6cd34a' },
    art: art`
  ,,,
 (o_o)
 /|+|\
  / \ `,
    ink: art`
  hhh
 sKKKs
 WWgWW
  p p`,
  },
  brainz: {
    pal: { ...Z, a: Z.s, h: '#5a5a6a', R: '#d0342c', B: '#5a60d0', y: '#f2c531' },
    art: art`
 _/^\_
 (x_x)
 /|S|\
 /   \ `,
    ink: art`
 hhhhh
 sksks
 RByBR
 B   B`,
  },
  tomorrowtron: {
    pal: { a: '#a8b0ba', D: '#4a4e57', Y: '#ffd23a', b: '#4fb3f2', R: '#ff3a3a' },
    art: art`
 [=@@=]
/|####|\
||(xx)||
_/    \_ `,
    ink: art`
   YY
 DbDDbD
   RR
DD    DD`,
  },

  // ---- More variety (2026-11-22). The "...Bare" drawings show the zombie
  // after its armor (ladder, pogo stick, ice block...) is gone. ----
  ladder: {
    pal: { ...Z, a: Z.s, R: '#c8303a', m: '#aab0b8' },
    art: art`
  ,,, H
 (x_x)H
 /[#]\H
  / \ H `,
    ink: art`
  hhh m
 sksksm
 RRRRRm
  p p m`,
  },
  ladderBare: {
    pal: { ...Z, a: Z.s, R: '#c8303a' },
    art: art`
  ,,,
 (x_x)
 /[#]\
  / \ `,
    ink: art`
  hhh
 sksks
 RRRRR
  p p`,
  },
  balloon: {
    pal: { ...Z, a: Z.s, R: '#e0303a', g: '#d8d8d8' },
    art: art`
   O
   |
 (x_x)
 /[V]\ `,
    ink: art`
   R
   g
 sksks
 cwrwc`,
  },
  pogo: {
    pal: { ...Z, a: Z.s, G: '#7a7a84', m: '#c0c4cc' },
    art: art`
  ,,,
 (x_x)
 /|#|\
  _I_ `,
    ink: art`
  hhh
 sksks
 GGGGG
  mmm`,
  },
  pogoBare: {
    pal: { ...Z, a: Z.s, G: '#7a7a84' },
    art: art`
  ,,,
 (x_x)
 /|#|\
  / \ `,
    ink: art`
  hhh
 sksks
 GGGGG
  G G`,
  },
  bobsled: {
    pal: { ...Z, a: Z.s, R: '#c8303a', W: '#a8a8b0', I: '#bfe9f5' },
    art: art`
 o o o o
[x][x][x]
\_______/
 ~~~~~~~ `,
    ink: art`
 s s s s
RkRRkRRkR
WWWWWWWWW
 IIIIIII`,
  },
  troglobite: {
    pal: { ...Z, a: Z.s, F: '#c9a06a', I: '#9fe3f5' },
    art: art`
 ,,, ___
(x_x)|  |
/|#|\|__|
 / \ `,
    ink: art`
 hhh III
sksksI  I
FFFFFIIII
 F F`,
  },
  troglobiteBare: {
    pal: { ...Z, a: Z.s, F: '#c9a06a' },
    art: art`
 ,,,
(x_x)
/|#|\
 / \ `,
    ink: art`
 hhh
sksks
FFFFF
 F F`,
  },
  prospector: {
    pal: { ...Z, a: Z.s, y: '#f2c12e', B: '#8a6a4a', R: '#e0303a', g: '#c9c9c9' },
    art: art`
  _n_
 (x_x)
 /|#|\=
  / \ `,
    ink: art`
  yyy
 sksks
 BgggBR
  p p`,
  },
  wrangler: {
    pal: { ...Z, a: Z.s, O: '#e0602a', W: '#f2f2f2', y: '#f2a01e' },
    art: art`
  ;;;
 (x_x)
 /|#|\@
  / \ `,
    ink: art`
  OOO
 sksks
 WWWWWW
  p p`,
  },
  chicken: {
    pal: { a: '#f2f2f2', r: '#e0303a', y: '#f2a01e', k: '#5a5a62' },
    art: art`

  ,
 (o>
  ^^ `,
    ink: art`

  r
  ky
  yy`,
  },
  octo: {
    pal: { ...Z, a: Z.s, O: '#a070d0', G: '#8a8a4a' },
    art: art`
 (@@@)
 (x_x)
 /|#|\
  / \ `,
    ink: art`
 OOOOO
 sksks
 GGGGG
  p p`,
  },
  boombox: {
    pal: { ...Z, a: Z.s, K: '#5a5a66', m: '#b8bcc4', b: '#ff5ab0', B: '#3a6ac8' },
    art: art`
  ___
 (x_x)
[o=o]|\
  / \ `,
    ink: art`
  KKK
 sksks
mbmbmBB
  p p`,
  },
  boomboxBare: {
    pal: { ...Z, a: Z.s, K: '#5a5a66', B: '#3a6ac8' },
    art: art`
  ___
 (x_x)
 /|#|\
  / \ `,
    ink: art`
  KKK
 sksks
 BBBBB
  p p`,
  },
  barrel: {
    pal: { ...Z, a: Z.s, P: '#8a4ab8', W: '#8a5a2e', R: '#c8303a' },
    art: art`
  ~~~
 (x_x)
(=====)
(=====) `,
    ink: art`
  PPP
 sksks
WRWWWRW
WRWWWRW`,
  },
  barrelBare: {
    pal: { ...Z, a: Z.s, P: '#8a4ab8', K: '#6a6a72' },
    art: art`
  ~~~
 (x_x)
 /|#|\
  / \ `,
    ink: art`
  PPP
 sksks
 KKKKK
  p p`,
  },
  footsoldier: {
    pal: { ...Z, a: Z.s, G: '#5f8a3a', m: '#7a7f86', O: '#f28c28' },
    art: art`
 (===)
 (x_x)
 /|#|\==>
  / \ `,
    ink: art`
 GGGGG
 sksks
 GGGGGmmO
  G G`,
  },
  pharaoh: {
    pal: { ...Z, a: Z.s, y: '#e0b83a', B: '#2b5fa8' },
    art: art`
 /=^=\
|(x_x)|
|=|=|=|
 \___/ `,
    ink: art`
 yyyyy
ysksksy
yByByBy
 yyyyy`,
  },

  // ---- Mini realms (Part 2, batch 1, 2026-11-22). Colors follow each
  // character's pictures on the Plants vs. Zombies Wiki. ----
  kernelcorn: {
    pal: { a: '#f4d03f', g: STEM, k: EYE, r: '#d0403a', d: '#6b6b6b' },
    art: art`
  ,/\,
 ~(oo)~
d=[##]=d
  /  \ `,
    ink: art`
  g  g
 r kk r
dd    dd
  g  g`,
  },
  spartichoke: {
    pal: { a: '#6f9e3a', r: '#d0403a', m: '#b8b8b8', k: EYE, b: '#8a6d3b' },
    art: art`
  ,vVv,
 [(o o)]|
 /WWWW\|
  \  / `,
    ink: art`
  rrrrr
 m k k mb
       b
`,
  },
  waterchestnut: {
    pal: { a: '#8a5a3a', w: '#4fa3e0', k: EYE, l: '#c9a27a' },
    art: art`
   .-.
 ~(o o)~
 (_____)
  ~~~~~ `,
    ink: art`

 w k k w
  lllll
  wwwww`,
  },
  shamrocket: {
    pal: { a: '#3cb44b', k: EYE, f: '#ff8c1a', y: '#ffd23a', g: '#2e7d32' },
    art: art`
  (\_/)
 (o . o)
  \_|_/
   /*\ `,
    ink: art`

  k   k
    g
   fyf`,
  },
  paparazzi: {
    pal: { ...Z, a: Z.s, m: '#3a3a3a', y: '#ffe680' },
    art: art`
  ,,,
 (x_x)[O]
 /[V]\/
  / \ `,
    ink: art`
  hhh
 sksksmym
 cwrwcc
  p p`,
  },
  actionhero: {
    pal: { ...Z, a: Z.s, r: '#d0403a', g: '#556b2f', o: '#ff8c1a' },
    art: art`
 =,,,=
 (x_x)
 /[V]\==>
  / \ `,
    ink: art`
 rhhhr
 sksks
 gwwwgggo
  p p`,
  },
  huge: {
    pal: { ...Z, a: Z.s, m: '#3a2a1a', c: '#7b2fa0', y: '#ffd23a' },
    art: art`
 \|||/
 (x_x)
 ~~~~~
/|_V_|\ `,
    ink: art`
 yyyyy
 sksks
 mmmmm
cccyccc`,
  },
  gladiantaur: {
    pal: { ...Z, a: Z.s, m: '#b8b8b8', b: '#7a5434' },
    art: art`
  ,,,
 (x_x)
 /|#|\__
 /\  /\ `,
    ink: art`
  mmm
 sksks
 smmmsbb
 bb  bb`,
  },
  valkyrie: {
    pal: { ...Z, a: Z.s, m: '#c8c8c8', w: EYE, y: '#e8b84a', b: '#8a6d3b' },
    art: art`
 >,^,<
 (x_x)|
 /[V]\|
  / \ `,
    ink: art`
 wmmmw
 sksksb
 cyyycb
  p p`,
  },
  smash: {
    pal: { ...Z, a: Z.s, r: '#d0342c', y: '#ffd23a' },
    art: art`
 [===]
 (x_x)
\[###]/
 /   \ `,
    ink: art`
 rrrrr
 sksks
sryyyrs
 r   r`,
  },
  fishyimp: {
    pal: { ...Z, a: Z.s, f: '#ff8c1a', w: '#4fa3e0' },
    art: art`
  ,,
 (x_x)
 <*)))><
  ~~~~ `,
    ink: art`
  hh
 sksks
 fffffff
  wwww`,
  },
  octopet: {
    pal: { a: '#c86ad6', k: EYE, w: '#4fa3e0' },
    art: art`
  .--.
 ( xx )
 /||||\
 ~~~~~~ `,
    ink: art`

   kk

 wwwwww`,
  },
  neptuna: {
    pal: { ...Z, a: Z.s, y: '#ffd23a', t: '#2e8b9a', g: '#c8c8c8' },
    art: art`
 ^^^ Y
 (x_x)|
 /[~]\|
  >==< `,
    ink: art`
 yyy g
 sksksg
 ttttttg
  tttt`,
  },
  spacecadet: {
    pal: { ...Z, a: Z.s, m: '#a8b0ba', b: '#4fb3f2' },
    art: art`
 .---.
(|x_x|)
 /[V]\
  / \ `,
    ink: art`
 mmmmm
mbsksbm
 cwrwc
  p p`,
  },
  cosmicimp: {
    pal: { ...Z, a: Z.s, v: '#9b59ff', y: '#ffd23a' },
    art: art`
  \ /
 (x.x)
 /{*}\
  ^ ^ `,
    ink: art`
  v v
 sksks
 vvyvv
  s s`,
  },
  gasgiant: {
    pal: { a: '#7fbf5a', k: EYE, g: '#b6e38a', m: '#5a8a3a' },
    art: art`
 ,~~~~,
( x_x  )
(  ~~  )
 '----' `,
    ink: art`
 gggggg
  k k
   gg
 mmmmmm`,
  },
};

// SPRITES[id] is just the drawing (a list of 4 lines). Other files use it.
const SPRITES = Object.fromEntries(Object.entries(DRAWINGS).map(([id, d]) => [id, d.art]));

// spriteHtml('sunflower'): the drawing as HTML, every character in its
// ink color. Characters next to each other with the same color share one
// <span>, which keeps the HTML small.
function spriteHtml(id, lines = SPRITES[id]) {
  const d = DRAWINGS[id];
  if (!d) return esc(lines.join('\n'));
  return lines.map((line, i) => {
    let html = '', run = '', runColor = null;
    for (let j = 0; j < line.length; j++) {
      const letter = d.ink[i]?.[j];
      const color = d.pal[letter] || d.pal.a;
      if (color !== runColor && run) { html += `<span style="color:${runColor}">${esc(run)}</span>`; run = ''; }
      runColor = color;
      run += line[j];
    }
    if (run) html += `<span style="color:${runColor}">${esc(run)}</span>`;
    return html;
  }).join('\n');
}

// The drawing to use once a zombie's armor is gone.
const BARE = {
  cone: 'zombie', bucket: 'zombie', paper: 'paperMad', door: 'zombie', football: 'footballBare', zomboss: 'zombossBare', tomorrowtron: 'zombossBare',
  ladder: 'ladderBare', pogo: 'pogoBare', troglobite: 'troglobiteBare', boombox: 'boomboxBare', barrel: 'barrelBare', pharaoh: 'mummy', spacecadet: 'zombie',
};

// Which drawing a unit uses right now (its id in DRAWINGS).
function spriteKey(u) {
  if (u.kind === 'zombie' && u.armorMax > 0 && u.armor <= 0 && BARE[u.id]) return BARE[u.id];
  return DRAWINGS[u.id] ? u.id : 'zombie';
}
const spriteFor = u => SPRITES[spriteKey(u)];

// Big letters for the title screen, 4 lines tall. Normal strings here,
// so every backslash is written twice ('\\' means one backslash).
const BIG_LETTERS = {
  L: [' _    ', '| |   ', '| |__ ', '|____|'],
  A: ['   _   ', '  /_\\  ', ' / _ \\ ', '/_/ \\_\\'],
  W: ['__      __', '\\ \\    / /', ' \\ \\/\\/ / ', '  \\_/\\_/  '],
  N: [' _  _ ', '| \\| |', '| .` |', '|_|\\_|'],
  E: [' ___ ', '| __|', '| _| ', '|___|'],
  G: ['  ___ ', ' / __|', '| (_ |', ' \\___|'],
  D: [' ___  ', '|   \\ ', '| |) |', '|___/ '],
  S: [' ___ ', '/ __|', '\\__ \\', '|___/'],
};

// bigText('LAWN') glues the big letters side by side, line by line.
const bigText = word => [0, 1, 2, 3].map(row => [...word].map(ch => BIG_LETTERS[ch][row]).join(''));

const TITLE_ART = [...bigText('LAWN'), ...bigText('LEGENDS')];
