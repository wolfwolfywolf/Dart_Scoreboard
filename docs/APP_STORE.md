# Publishing Dart Scoreboard on the App Store

A checklist for the first iOS release and for updates, the companion to
`docs/PLAY_STORE.md`. The app is the same Expo codebase; iOS needs no
separate project in the repository (`ios/` is generated at build time and
git-ignored).

**No Mac is needed.** EAS builds and signs in Expo's cloud, and `eas submit`
uploads to Apple, all from the Chromebook. What you do need is a paid
Apple Developer account. A Mac, iPhone or iPad only makes screenshots
easier (see below).

## What's already in the repository

| Item | Where |
|---|---|
| Bundle ID `com.wolfyspub.dartscoreboard` (permanent once the app exists in App Store Connect) | `app.json` `ios.bundleIdentifier` |
| iPad support, all orientations | `app.json` `ios.supportsTablet`, `orientation` |
| Export compliance answered ("no non-exempt encryption"), so TestFlight doesn't ask on every build | `app.json` `ios.config.usesNonExemptEncryption` |
| Dark root view behind the app (no white flash on rotation or keyboard) | `expo-system-ui` + `backgroundColor` |
| Build profiles shared with Android (`preview` = internal install, `production` = store, auto-incrementing build number) | `eas.json` |
| CI that compiles the iOS app for the simulator on every native change | `.github/workflows/ios-build.yml` |
| 1024×1024 app icon with no transparency (Apple rejects alpha) | `assets/icon.png` |
| Privacy policy and support pages | https://wolfyspub.com/dart-scoreboard/privacy, `/support` |
| Store listing text | below |

Third-party privacy manifests (React Native, AsyncStorage, Expo modules)
ship inside their packages and are merged by the build. The app itself
collects nothing, so no `ios.privacyManifests` entry is needed.

## One-time setup (you)

1. **Apple Developer Program** at https://developer.apple.com/programs/enroll
   (US$99 a year). Enrol on the web or in the Apple Developer app on an
   iPhone or iPad. Your Apple ID needs two-factor authentication.
   - **Individual**: quick, but the App Store shows *your legal name* as the
     seller, not "WolfysPub Games".
   - **Organization**: shows "WolfysPub Games" but needs a registered legal
     entity and a D-U-N-S number (free, takes days to weeks).

   Decide this before enrolling; switching later means a migration request
   to Apple.
2. **Agreements**: in App Store Connect → Business, accept the Free Apps
   agreement (shown once the membership is active).
3. **Expo/EAS**: already set up for Android (`eas login` on the Chromebook).
   Nothing else to install.

## Build and upload

```sh
cd ~/Dart_Scoreboard
git pull
npm install
eas build --platform ios --profile production
```

The first time, EAS asks to log in to your Apple account (Apple ID, password,
then the 2FA code from your iPhone or a text message). Answer **yes** to let
EAS create the distribution certificate and provisioning profile, and **no**
to a push notification key (the app sends none). EAS stores them; later
builds don't ask. `eas credentials` shows or replaces them.

Then send the build to App Store Connect:

```sh
eas submit --platform ios --latest
```

If App Store Connect has no app for the bundle ID yet, `eas submit` offers
to create it (name "Dart Scoreboard", primary language English). Once it
exists, put its Apple ID number (App Store Connect → App Information →
Apple ID) in `eas.json` under `submit.production.ios.ascAppId` so later
submits don't ask. Apple processes the upload for 5–15 minutes before it
appears in TestFlight.

## Set up the app in App Store Connect

1. **App Information**: category Sports (secondary: Utilities, optional).
   Content rights: no third-party content (the fonts are open-licensed).
   Age rating questionnaire: answer "None" / "No" throughout → 4+.
2. **App Privacy**: privacy policy URL from above, then "Data Not Collected".
3. **Pricing and Availability**: free, all territories (or pick).
4. **The version page** (1.0):
   - Name (max 30): `Dart Scoreboard`. App Store names are unique; if it's
     taken, `Dart Scoreboard: Darts Scorer`.
   - Subtitle (max 30): `301, 501, Cricket & Shanghai`
   - Promotional text (max 170): `Big-key scoring for 301, 501, 701, Cricket and Shanghai, with checkout hints that follow your plan. No account, no ads, nothing leaves your phone.`
   - Keywords (max 100, comma-separated, no spaces):
     `darts,dart,scorer,score,counter,x01,501,301,701,cricket,shanghai,checkout,doubles,pub,tracker,oche`
   - Description: the full description in `docs/PLAY_STORE.md` works as is.
   - Support URL: https://wolfyspub.com/dart-scoreboard/support.
     Marketing URL: https://wolfyspub.com.
   - Copyright: `2026 WolfysPub Games`
   - Screenshots: see below.
   - Build: pick the uploaded build.
   - App Review information: contact details; sign-in required: **no**;
     notes: "No account or network needed. Tap New game, add a player, start."
   - Version release: manual or automatic after approval.

### Screenshots (the only part where an Apple device helps)

Apple requires one set per display class it supports. Because the app runs
on iPad, two sets are needed, 1–10 images each, portrait or landscape:

- **iPhone 6.9"**: 1320 × 2868 (portrait) or 1290 × 2796.
- **iPad 13"**: 2064 × 2752 (portrait) or 2048 × 2732.

Smaller devices reuse these. Ways to get them:

- On a real iPhone Pro Max / iPad Pro 13" running a TestFlight build (side
  button + volume up).
- On a Mac, in the iOS Simulator (File → Save Screen).
- Without either: render the web preview (`npm run web`) at those exact
  pixel sizes with Playwright, as was done for layout checks (see
  `DEVELOPMENT_LOG.md` §7.3). Good enough for the store if they look right;
  web text rendering differs slightly from iOS.

Show the same four scenes as on Play: a game in progress, the setup screen,
the checkout chart, a Cricket board.

## Test, then release

1. **TestFlight internal testing**: add yourself (and up to 100 people with
   App Store Connect access) as internal testers; builds are available as
   soon as processing ends, no review. Install the TestFlight app on the
   iPhone and accept the invite.
2. **External testing** (optional, up to 10,000 by email or public link):
   needs a short Beta App Review on the first build. Unlike Google Play,
   there is no minimum tester count or test period before release.
3. **Submit for Review** from the version page. Review usually takes one to
   two days. Common first-time rejections for an app like this: missing
   iPad screenshots, a support URL that doesn't load, or a name that's too
   close to an existing app.

## Installing on your own iPhone without the store

- **During development**: install Expo Go from the App Store, run
  `npx expo start --tunnel` on the Chromebook and scan the QR code with the
  iPhone's Camera app. No Apple account needed.
- **A real build outside TestFlight**: `eas device:create` (open the link
  on the iPhone to register it), then
  `eas build --platform ios --profile preview`. Ad hoc builds only install
  on registered devices. TestFlight is usually simpler.

## Updates

Bump the version with `npm run version:bump -- patch` (or `minor`; it updates
`app.json`, `package.json` and the lockfile together, see `docs/PLAY_STORE.md`),
commit, then:

```sh
eas build --platform ios --profile production --auto-submit
```

`--auto-submit` runs `eas submit` when the build finishes. The build number
increments automatically. In App Store Connect add a new version (the +
next to iOS App), choose the build, write "What's New" and submit.

One build per platform is normal: `eas build --platform all` builds both,
and Android still goes to Play as in `docs/PLAY_STORE.md`.

## What only you can do

| Step | Needs |
|---|---|
| Enrol in the Apple Developer Program, choose individual or organization | Apple ID with 2FA, payment |
| First `eas build -p ios` (signing credentials) | Apple ID login + 2FA code |
| Accept agreements, fill in App Store Connect, submit for review | App Store Connect |
| Screenshots | an iPhone/iPad or Mac, or the web-preview route above |
| Test on a device | an iPhone or iPad (Expo Go or TestFlight) |
