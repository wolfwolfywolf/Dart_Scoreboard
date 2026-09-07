# Dart Scoreboard — development log

An indexed record of how this app came to be, kept so future work (by a
person or an AI assistant) can find the reasoning behind each decision,
the bugs that bit and why, and the workflow that runs it. Commit hashes
refer to this repository's `main` branch.

## Contents

1. [Origins and where the code lives](#1-origins-and-where-the-code-lives)
2. [Architecture in one page](#2-architecture-in-one-page)
3. [Game rules as implemented](#3-game-rules-as-implemented)
   - 3.1 [x01 (301 / 501 / 701)](#31-x01-301--501--701)
   - 3.2 [Cricket](#32-cricket)
   - 3.3 [Shanghai](#33-shanghai)
   - 3.4 [Doubles (teams of two)](#34-doubles-teams-of-two)
   - 3.5 [Checkout suggestions](#35-checkout-suggestions)
4. [Feature timeline (by commit)](#4-feature-timeline-by-commit)
5. [Bugs, causes, and lessons](#5-bugs-causes-and-lessons)
6. [UI conventions decided along the way](#6-ui-conventions-decided-along-the-way)
7. [Development workflow](#7-development-workflow)
   - 7.1 [Running on a phone from a Chromebook](#71-running-on-a-phone-from-a-chromebook)
   - 7.2 [Checks before pushing](#72-checks-before-pushing)
   - 7.3 [Visual verification without a device](#73-visual-verification-without-a-device)
   - 7.4 [Building installable apps](#74-building-installable-apps)
8. [Ideas not yet built](#8-ideas-not-yet-built)

---

## 1. Origins and where the code lives

- The app was first scaffolded as a subfolder (`darts-app/`) of an
  unrelated repository, then moved to its own repository,
  `wolfwolfywolf/Dart_Scoreboard`, with the app at the root (`57a5d19`).
- The template's Expo `LICENSE` file was removed since it carried Expo's
  copyright, not this project's (`95b133a`).
- Stack: Expo SDK 57, React Native 0.86, TypeScript. No navigation
  library; `App.tsx` switches screens by state. Persistence is
  AsyncStorage. Fonts load at runtime via `expo-font` so Expo Go works.

## 2. Architecture in one page

- **A game is a setup plus an append-only event log.** `src/game/x01.ts`,
  `cricket.ts` and `shanghai.ts` each export a pure `replay(setup, events)`
  that rebuilds the full state. Undo is "drop the last event". History
  stores the events, so every past game can be re-derived exactly.
- Events: x01 has `dart` and `total` (a whole turn as a number, with
  `darts` used on a checkout). Cricket and Shanghai have `dart` and
  `endTurn` (the ✓ key; unentered darts are recorded as misses).
- `src/game/replay.ts` holds the type guards (`isX01Game`, etc.) and
  `isGameFinished` / `gameWinner`, used by `App.tsx` and history.
- `src/game/checkout.ts` + `checkoutChart.ts`: finder and the standard
  170→2 chart (validated by a test that every entry adds up and ends on a
  double).
- `src/layout.ts`: `useLayout()` gives `isWide`, `isLandscape`,
  `twoPane` (wide *and* landscape), `contentWidth`; `keyHeightFor()`
  sizes keypad keys to the space left.
- Screens in `src/screens/`, shared pieces in `src/components/`
  (`DartKeypad`, `TotalKeypad`, `Chalkboard`, `Stats`, `ui`).
- Tests: `npm test` runs `src/game/logic.test.ts` with Node's test runner
  via `tsx`. `npm run typecheck` runs `tsc`.

## 3. Game rules as implemented

### 3.1 x01 (301 / 501 / 701)

- Double-out or straight-out. Bust when the score would go below zero,
  land on 1 (double-out), or reach zero without a double (double-out).
  A bust restores the turn's starting score and scores 0 for the turn.
- First to N legs (1, 2, 3, 5). Leg starter rotates by leg number.
- Two entry modes: per dart, or turn total. On a total that checks out,
  the app asks how many darts were used when more than one count is
  possible, so averages stay right.
- Stats: three-dart average, 100+/140+/180 counts, highest checkout,
  best leg (fewest darts).

### 3.2 Cricket

- Numbers 20–15 and Bull. Single/double/triple = 1/2/3 marks; double
  bull = 2 marks. Three marks closes a number.
- Three scoring options (setup):
  - **Points**: hits on a number you've closed score its value while any
    opponent still has it open. Win: all closed and points ≥ everyone.
  - **No points**: extra hits do nothing; first to close everything wins.
  - **Cut-throat**: hits on your closed number give its value to every
    opponent still open on it. Win: all closed with the *lowest* score.
- ✓ key ends a turn early; missing darts count as misses so marks per
  round is honest.

### 3.3 Shanghai

- Setup: tick any set of numbers from 1–20 plus Bull (quick picks 1–7,
  1–9, 1–20). One round per number, lowest to highest.
- Only the round's number scores: single = value, double = 2×,
  triple = 3×; Bull = 25 or 50.
- A single, double and triple of the number in one turn, in any order,
  is a Shanghai and wins immediately. On Bull: two 25s and one 50.
- No elimination. Highest total after the last round wins; ties are
  reported as ties.

### 3.4 Doubles (teams of two)

- Players are paired in the order added (1&2, 3&4 …). Each team shares
  a score; teammates alternate throws, and the alternation carries across
  legs so nobody throws twice running for their team.
- Stats are kept per team and per teammate (`memberStats`).

### 3.5 Checkout suggestions

- With a full turn, the standard chart route is shown (170: T20 T20 Bull,
  61: T15 D8, 41: 9 D16 …). With fewer darts, a search finds what is still
  possible (110 with two darts: T20 Bull).
- **The plan sticks**: if the thrower hits the suggested dart, the line
  continues that route (121 → T20 → "T11 D14") instead of re-planning
  for the new score. A miss re-plans. Up to two alternatives are listed.
- The double-out chart screen lists only finishable scores, from the
  score still needed downward, in as many columns as the screen allows.

## 4. Feature timeline (by commit)

| Commit | What |
|---|---|
| `95b133a` | Initial app: x01, Cricket, per-dart and total entry, checkout hints, history, stats. Template licence removed. |
| `57a5d19` | Package renamed for its own repo. |
| `97881d0` | Renamed to *Dart Scoreboard*; doubles added. |
| `49fc9ea` | Dartboard app icon set (generated by `scripts/make-icons.py`); "Treble" → "Triple"; 25 key removed, Bull follows the multiplier; Bull/Miss/Undo join the number grid. |
| `c2c9246` | Double lights up light blue (red reserved for destructive actions); x01 scoreboard fits 3 in a row and 4+ in rows of two. |
| `b1b4cf8` | Double-out chart screen; in-game hint uses standard routes. |
| `e8aa788` | Tablets and rotation: two-pane landscape, capped-width portrait, height-aware keys; web renderer added for previews. |
| `da30c05` | `@expo/ngrok` made a dev dependency so tunnel mode works out of the box. |
| `8292b0f` | Landscape fixes: chart button no longer pushed off-screen; Cricket board fills the left pane. |
| `df1d413` | Chalkboard scoreboards with chalk fonts; keys sized from measured layout. |
| `706e940` | Fix: chalkboard collapsed to zero height on phones (see §5). |
| `887c59f` | Fix: x01 cards wrapping on fractional-width screens (see §5); MPR removed from the Cricket board. |
| `6f65f39` | Cricket scoring option: points / no points. |
| `efbf69f` | Cut-throat Cricket. |
| `88237d9` | Long-press a name to rename or delete (game list and remembered names). |
| `4ec8e43` | "Created by WolfysPub.com" credit on the title screen. |
| `5be5767` | Fix: invisible name field in the edit sheet (see §5). |
| `1324aa8` | Adaptive chart (no bogeys, from the score needed, more columns); live checkout line under the chart button. |
| `32ee2c0` | Checkout plan continues through the turn; alternatives shown. |
| `2e6f772` | ✓ key to end a Cricket turn early. |
| `da4c49c` | Keypad labels never change with the multiplier (15 stays 15, Bull stays Bull). |
| `91e7b6e` | Shanghai. |
| `73a1863`, `82c0f3d` | Shanghai scoreboard tidied; "X to throw" line added for consistency. |

## 5. Bugs, causes, and lessons

- **Chalkboard rendered as an empty frame on Android/iOS** (`706e940`).
  The slate used `flex: 1` inside a parent with no fixed height. Browser
  flexbox sizes that to content; Yoga (native) resolves it to zero, and
  `overflow: hidden` clipped everything. *Lesson:* never `flex: 1` a
  child of an auto-height column on native. Verified with the
  `yoga-layout` package in Node before pushing the fix.
- **Edit-sheet text field invisible** (`5be5767`). Same cause: a shared
  input style carried `flex: 1` meant for a row layout.
- **x01 cards wrapping into a grid on the Pixel 7** (`887c59f`). Card
  widths were computed from the window width, which is fractional
  (411.43 pt); rounding overflowed the row by a hair. *Fix:* explicit rows
  whose cards share width by flex; no width arithmetic.
- **"Double out chart" button vanished in landscape** (`8292b0f`). The
  bottom-anchored keypad column overflowed and pushed the top of the
  column off-screen. *Fix:* size keys from the measured scoreboard height
  and put the mode switch and button on one row in landscape.
- **Metro "Failed to get the SHA-1" after `git pull`**: the dev server was
  still running while `npm install` replaced files. *Fix:* stop the
  server, `npx expo start --tunnel --clear`.
- **`git pull` refused (package.json modified)**: a local
  `npm install --save-dev` on the Chromebook had edited the manifest.
  *Fix:* make the package a real dependency in the repo; on the device
  `git checkout -- package.json package-lock.json` then pull.
- **Fonts**: the Fredericka the Great export is `FrederickatheGreat_400Regular`
  (lower-case "the"). Custom fonts on Android must not be combined with
  `fontWeight`; use the family alone.
- **Dashed borders** render badly on Android; use solid faint lines.

## 6. UI conventions decided along the way

- Keypad: multiplier row Single / Double (light blue) / Triple (amber);
  labels never change with the multiplier. Bull follows the multiplier
  (25 / 50; disabled under Triple). Miss and Undo look like number keys.
  Red is reserved for destructive actions (End game, delete).
- Scoreboard (x01, Shanghai): chalkboard cards; 1–2 players in a row,
  3 in a compact row, 4+ in rows of two. Cricket: chalkboard grid. Active
  player/team in yellow chalk; in doubles the teammate on the oche has an
  arrow. Marks per round is *not* shown on the board (only in stats).
- Under the cards: three dart slots for the current turn and "X to throw"
  on the right, on every game screen.
- Landscape on a wide screen: scoreboard left, keypad right (fixed width
  360–460). Portrait tablets: stacked, centred, max width 720.
- Names: long-press to edit or delete; renaming in a game also fixes the
  remembered name.

## 7. Development workflow

### 7.1 Running on a phone from a Chromebook

In the ChromeOS Linux terminal (Node 22 and git installed via apt/NodeSource):

```sh
cd ~/Dart_Scoreboard
git pull
npm install          # only needed when package.json changed
npx expo start --tunnel
```

Tunnel mode is required because the Linux container is behind its own
network. It needs an Expo account: a personal access token in
`EXPO_TOKEN` (set in `~/.bashrc`), or `npx expo login` if the account has
a password. Never paste tokens into chat; revoke and re-issue if one is
exposed. If port 8081 is busy, `pkill -f "expo start"` or accept 8082.
Scan the QR code with Expo Go on the phone.

The repository is private; cloning needs a GitHub fine-grained token as
the password (`git config --global credential.helper store` remembers it).

### 7.2 Checks before pushing

```sh
npm run typecheck
npm test
npx expo export --platform android --output-dir /tmp/export   # bundles with Metro
```

For any new layout structure, sanity-check the flex tree with the Yoga
engine (`yoga-layout` from npm) rather than trusting a browser render.

### 7.3 Visual verification without a device

`npm run web` runs the app in a browser (react-native-web). During
development a Playwright script seeded a game into `localStorage`
(`darts:current-game`) and screenshotted phone, phone-landscape, iPad
portrait and iPad landscape. Good for proportions and layout; **not** a
substitute for native (see §5).

### 7.4 Building installable apps

EAS Build (`eas build --platform android --profile preview` for an APK;
`--platform ios` needs an Apple developer account). Change
`ios.bundleIdentifier` / `android.package` in `app.json` to identifiers
you own first. Icons regenerate with `python3 scripts/make-icons.py`
(needs Pillow).

## 8. Ideas not yet built

- Optional round-by-round view or a win/loss record per player across
  history.
- Sound or haptic feedback on 180s and Shanghais.
- Optional "who throws first" choice or a bull-off at setup.
- Round the Clock / Killer as further games; the event-log engine pattern
  makes each a new `src/game/*.ts` plus a screen.
