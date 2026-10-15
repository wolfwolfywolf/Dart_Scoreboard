// Set the user-facing version in app.json, package.json and
// package-lock.json together (a lockfile left behind would be rewritten by
// the next npm install and block a later git pull).
//
//   npm run version:bump -- patch     1.0.0 -> 1.0.1 (fixes)
//   npm run version:bump -- minor     1.0.0 -> 1.1.0 (new features)
//   npm run version:bump -- 1.2.3     exact version
//
// The Android version code is not touched: EAS keeps it remotely and
// increments it on every production build (eas.json).
import { readFileSync, writeFileSync } from 'node:fs';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: npm run version:bump -- <patch|minor|major|x.y.z>');
  process.exit(1);
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, data) => writeFileSync(path, JSON.stringify(data, null, 2) + '\n');

const app = readJson('app.json');
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const current = app.expo.version;

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const parts = SEMVER.exec(current);
if (!parts) {
  console.error(`app.json version "${current}" is not x.y.z`);
  process.exit(1);
}
const [major, minor, patch] = parts.slice(1).map(Number);

let next;
if (arg === 'patch') next = `${major}.${minor}.${patch + 1}`;
else if (arg === 'minor') next = `${major}.${minor + 1}.0`;
else if (arg === 'major') next = `${major + 1}.0.0`;
else if (SEMVER.test(arg)) next = arg;
else {
  console.error(`Not a version or bump kind: ${arg}`);
  process.exit(1);
}

app.expo.version = next;
pkg.version = next;
lock.version = next;
lock.packages[''].version = next;
writeJson('app.json', app);
writeJson('package.json', pkg);
writeJson('package-lock.json', lock);
console.log(`${current} -> ${next} (app.json, package.json, package-lock.json)`);
