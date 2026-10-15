# Dart Scoreboard

Expo / React Native app (SDK 57) for keeping darts scores: x01, Cricket,
Shanghai, singles or doubles. Published by WolfysPub Games. Owner:
wolfwolfywolf. Web site for it lives in `site/` (Vercel).

Read before changing anything:

- `docs/DEVELOPMENT_LOG.md`: architecture, rules as implemented, every
  decision and bug so far, the development workflow, release status.
  Add to it in the same commit as any notable change.
- `docs/PLAY_STORE.md`: how releases get to Google Play.

Conventions that matter:

- A game is a setup plus an append-only event log; `src/game/*.ts` are pure
  `replay()` functions. Keep them pure and covered by `src/game/logic.test.ts`.
- Before pushing: `npm run typecheck`, `npm test`, and
  `npx expo export --platform android` must all pass.
- Never give a child `flex: 1` inside an auto-height column (native layout
  collapses it). Verify new layout structures with `yoga-layout`, not only a
  browser render.
- The owner runs the app from a Chromebook via `npx expo start --tunnel`
  and only ever pulls; all code changes are pushed from Claude sessions.
- `app.json` `android.package` and the EAS keystore are permanent.

@AGENTS.md
