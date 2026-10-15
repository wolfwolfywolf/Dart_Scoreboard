# WolfysPub.com

Static site: landing page for Dart Scoreboard, its privacy policy and support
page. Plain HTML and CSS, no build step.

Deployed on Vercel with **Root Directory** set to `site`. Each page is a
folder with an `index.html`, so `/dart-scoreboard/privacy` works without
any rewrite rules.

When the app is public on Google Play, turn the Google Play "coming soon"
badge in `index.html` into a link to
https://play.google.com/store/apps/details?id=com.wolfyspub.dartscoreboard.

`dart-scoreboard/privacy/index.html` is the privacy policy Google Play
links to; `docs/PRIVACY_POLICY.md` is a Markdown copy. Change both
together and update the date.
