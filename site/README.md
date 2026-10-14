# WolfysPub.com

Static site: landing page for Dart Scoreboard, its privacy policy and support
page. Plain HTML and CSS, no build step.

Deployed on Vercel with **Root Directory** set to `site`. `vercel.json` turns
on clean URLs, so `dart-scoreboard/privacy.html` is served at
`/dart-scoreboard/privacy`.

Before going live, replace `SUPPORT_EMAIL` in `dart-scoreboard/support.html`
with the real contact address. When the app is in the store, swap the
"coming soon" badges in `index.html` for links.
