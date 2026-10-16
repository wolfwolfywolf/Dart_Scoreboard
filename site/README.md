# WolfysPub.com

Static site: the WolfysPub Games front page (`index.html`, one card per
product: Dart Scoreboard, OZZI Golf, Football Pool Manager, Wolfy's Derby
Game), the Dart Scoreboard page (`dart-scoreboard/`), its privacy policy and
support page. Plain HTML and CSS, no build step.

Deployed on Vercel with **Root Directory** set to `site`. Each page is a
folder with an `index.html`, so `/dart-scoreboard/privacy` works without
any rewrite rules.

When the app is in the store, swap the "coming soon" badges in
`dart-scoreboard/index.html` for links, and the status line on its card in
`index.html`. Product icons for the other apps are in `assets/` (the OZZI
Golf one is copied from the ozzigolf repo's `src/app/icon.svg`).
