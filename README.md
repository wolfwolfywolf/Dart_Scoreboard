# Dart Scoreboard

A phone app for keeping dart scores, built with [Expo](https://expo.dev) /
React Native so one TypeScript codebase runs on both iOS and Android.

## What it does

- **x01 games**: 301, 501 and 701, with double-out or straight-out finishes
  and "first to N legs" matches.
- **Cricket**: 15–20 and bull, with standard points, a no-points race to
  close, or cut-throat scoring; marks-per-round.
- **Singles or doubles**: in doubles, two-person teams share a score and the
  teammates alternate throws. Stats are kept for the team and for each player.
- **Two ways to enter scores** in x01: tap each dart (single/double/triple
  keypad) or type the three-dart total. Busts, double-out rules and checkout
  validation are handled for you.
- **Checkout suggestions** whenever the player on the oche is on a finish.
- **Undo** any dart or turn, even after a game has been won.
- **Stats**: three-dart average, 100+/140+/180 counts, highest checkout, best
  leg, marks per round.
- **History**: every finished game is saved on the phone with a turn-by-turn
  record. An unfinished game is saved too and can be resumed after the app is
  closed.
- Remembers recent player names so setting up the next game is two taps.

Everything is stored locally on the device; there's no account or server.

## Running it on your phone (no build tools needed)

1. Install **Expo Go** from the App Store or Google Play.
2. In this folder:

   ```sh
   npm install
   npm start
   ```

3. Scan the QR code that appears with your camera (iOS) or the Expo Go app
   (Android). The app loads over your Wi-Fi and reloads when you edit code.

Both phones and tablets are supported, in portrait and landscape. On a wide
landscape screen the scoreboard sits beside the keypad.

To preview in a desktop browser instead of a phone, run `npm run web`.

## Building installable apps

Use [EAS Build](https://docs.expo.dev/build/introduction/) to produce store-ready
binaries in the cloud (a free Expo account is enough to get started):

```sh
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview   # .apk you can sideload
eas build --platform ios                          # needs an Apple Developer account
```

Before publishing, change `ios.bundleIdentifier` and `android.package` in
`app.json` to identifiers you own, and replace the placeholder icons in
`assets/`.

## Development

```sh
npm run typecheck   # tsc
npm test            # unit tests for the scoring engines
```

Layout:

- `src/game/` — pure scoring logic. A game is a setup plus an append-only list
  of events (darts or turn totals); the state is rebuilt by replaying the
  events, which is what makes undo trivial and keeps history exact.
  - `x01.ts`, `cricket.ts` — the rules
  - `checkout.ts` — checkout finder / suggestions
  - `logic.test.ts` — tests
- `src/screens/` — Home, Setup, x01 game, Cricket game, History, History detail
- `src/components/` — keypads, stats tables, shared UI
- `src/storage.ts` — AsyncStorage persistence
- `App.tsx` — screen switching and game/history state
