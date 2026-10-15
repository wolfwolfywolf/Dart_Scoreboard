# Publishing Dart Scoreboard on Google Play

A checklist for the first release and for updates. Everything in the
"repository" table is already done; the rest happens in your Expo and
Google accounts.

**Status (2026-10-15):** first bundle (1.0.0, version code 2) uploaded to
Internal testing and in Google's initial review. Steps marked ✓ are done.
The running record is in `docs/DEVELOPMENT_LOG.md` §8.

## What's already in the repository

| Item | Where |
|---|---|
| Permanent Android package name `com.wolfyspub.dartscoreboard` | `app.json` |
| EAS build profiles (`preview` = sideloadable APK, `production` = store bundle, auto-incrementing version code) | `eas.json` |
| Unused permissions stripped from the bundle (`blockedPermissions`), so the store lists none beyond internet access | `app.json` |
| Privacy policy, published at https://wolfyspub.com/dart-scoreboard/privacy | `site/dart-scoreboard/privacy/index.html` (copy in `docs/PRIVACY_POLICY.md`; change both together) |
| Store listing text and release notes | below |
| 512×512 store icon and 1024×500 feature graphic | `store/` |
| Version bump script | `npm run version:bump` (see [Updates](#updates)) |

## One-time setup (you) ✓

1. ✓ **Google Play developer account** at https://play.google.com/console.
   One-time fee, identity verification takes a day or two. A personal
   account must run a closed test with 12 testers for 14 days before
   production; an organization account (needs a D-U-N-S number) skips that.
2. ✓ **Publish the website** in `site/` on Vercel (import this repository,
   set Root Directory to `site`, add the `wolfyspub.com` domain). The
   privacy policy is then at `https://wolfyspub.com/dart-scoreboard/privacy`
   and the support page at `https://wolfyspub.com/dart-scoreboard/support`.
   Google requires a public URL for the policy.
3. ✓ **Expo account**: already have one. Install the CLI and link the project
   (run from the project folder; `eas init` writes the project ID into
   `app.json`, commit that change):

   ```sh
   npm install -g eas-cli
   eas login
   eas init
   ```

## Build the store bundle

```sh
cd ~/Dart_Scoreboard
git pull
eas build --platform android --profile production
```

EAS generates and stores the signing key on first build (answer yes when
asked). The build runs in Expo's cloud, about 15 minutes, and ends with a
download link for an `.aab` file. Download it to the Chromebook.

For a quick install on your own phone without the store, use
`--profile preview` instead, which gives an `.apk`.

## Create the app in Play Console ✓

1. **Create app**: name "Dart Scoreboard", app (not game), free.
2. **Set up your app** tasks, in order:
   - Privacy policy: the URL from step 2.
   - App access: "All functionality is available without special access".
   - Ads: no ads.
   - Content rating: fill in the questionnaire (no violence, no user
     interaction, no data) → rated for everyone.
   - Target audience: 13+ is simplest (avoids the Families policy).
   - News app: no. COVID app: no. Data safety: "does not collect or share
     any user data", data is not encrypted in transit (none is sent), users
     can request deletion by clearing app data.
   - Government app: no. Financial features: none. Health: none.
3. **Store listing** (Main store listing):
   - App name: Dart Scoreboard
   - Short description (max 80): `Score darts games: 301, 501, 701, Cricket and Shanghai, singles or doubles.`
   - Full description: see below.
   - App icon: `store/play-icon-512.png`
   - Feature graphic: `store/feature-graphic-1024x500.png`
   - Phone screenshots: at least 2 (take them on the Pixel: a game in
     progress, the setup screen, the checkout chart, a Cricket board).
     Tablet screenshots optional but recommended.
   - Category: Sports. Contact email: support@wolfyspub.com.
     Website: https://wolfyspub.com.

## Test, then release

1. **Internal testing** → Create release → upload the `.aab` → add testers
   by email → share the opt-in link. They install from the Play Store.
   (Bundle uploaded 2026-10-15; next is adding testers once review passes.)
2. **Closed testing** (personal accounts): create a track, add at least 12
   testers, keep it live 14 days, then apply for production access from
   the Dashboard. Testers must stay opted in for the whole 14 days; the
   count is of opted-in testers, not invitations sent.
3. **Production** → Create release → select the same bundle → review →
   Start rollout. First review usually takes a few days.
4. **Once the app is public**: turn the Google Play "coming soon" badge in
   `site/index.html` into a link to
   `https://play.google.com/store/apps/details?id=com.wolfyspub.dartscoreboard`
   (the App Store badge stays), and add the date to
   `docs/DEVELOPMENT_LOG.md` §8.

## Updates

Two numbers identify a build. The **version** (`1.0.0`, shown to users)
lives in `app.json` and `package.json`. The **version code** (an integer
Google uses to order builds) is kept by EAS (`appVersionSource: remote`)
and goes up by one on every production build, so it never needs editing.
Google rejects a bundle whose version code it has seen before, which is
why every upload needs a fresh `eas build`.

In the Claude session that makes the change (the Chromebook only pulls):

1. Bump the version: `npm run version:bump -- patch` for fixes (1.0.0 →
   1.0.1), `-- minor` for new features (1.0.0 → 1.1.0). This updates
   `app.json`, `package.json` and `package-lock.json` together.
2. Add the release notes for the new version under
   [Release notes](#release-notes) below.
3. Add a line to `docs/DEVELOPMENT_LOG.md` §8, run the checks, commit, push.

Then on the Chromebook:

```sh
cd ~/Dart_Scoreboard
git pull
eas build --platform android --profile production
```

Upload the new `.aab` in Play Console to the track the app is on
(Internal testing, Closed testing or Production) → Create release, and
paste the release notes. `eas submit --platform android` can do the
upload from the terminal once a Google service-account key is set up;
`eas.json` sends it to the internal track.

If a build ever fails with a version code clash (for example after a
bundle was uploaded that EAS didn't build), read the current value with
`eas build:version:get` and set it above Play's highest with
`eas build:version:set`.

## Release notes

Play Console's "Release notes" box (per language, 500 characters max).
Keep each version's text here so the history lives with the code.

### 1.1.0 (not built yet)

```
New: tap the other player's or team's side of the scoreboard to end the
current turn, just like the check button. Darts already entered still
count. Works in 301/501/701, Cricket and Shanghai.
Cricket with two players or teams now shows the numbers down the middle,
with one side's marks and score on each side.
```

### 1.0.0 (version code 2), 2026-10-15

_First release. The text entered in Play Console was not copied here;
paste it in from the Internal testing release so the record is complete._

## Full description (copy into Play Console)

Dart Scoreboard keeps score so you can keep throwing.

GAMES
• 301, 501 and 701 with double-out or straight-out, and first-to-N legs
• Cricket with standard points, no-points, or cut-throat scoring
• Shanghai on any numbers you choose, 1–20 and Bull

SCORING
• Tap each dart on a big keypad, or type the three-dart total
• Busts, double-out and checkout rules handled automatically
• Live checkout suggestions that follow your plan dart by dart
• A double-out chart that adapts to the score you need
• One-tap ✓ to end a turn with no score
• Undo anything, even after a game is won

PLAYERS
• Singles or doubles (two-person teams that alternate throws)
• Remembers your regular players for quick setup

STATS AND HISTORY
• Three-dart average, 100+ / 140+ / 180 counts, highest checkout, best leg
• Marks per round for Cricket, round-by-round totals for Shanghai
• Every finished game saved on your device with a turn-by-turn record

Works on phones and tablets, portrait or landscape. No account, no ads,
no data collection: everything stays on your device.

Created by WolfysPub Games · WolfysPub.com
