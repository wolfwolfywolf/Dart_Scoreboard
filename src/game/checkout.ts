import type { Dart } from '../types';
import { chartRoute } from './checkoutChart';
import { dartLabel, dartValue } from './darts';

// Preferred finishing doubles, roughly in the order players like to be left on.
const DOUBLE_PREFERENCE = [16, 20, 8, 10, 12, 18, 4, 2, 14, 6, 19, 17, 15, 13, 11, 9, 7, 5, 3, 1];
const FINISH_DOUBLES: Dart[] = [
  ...DOUBLE_PREFERENCE.map((v) => ({ v, m: 2 as const })),
  { v: 25, m: 2 },
];

// Every scoring dart, in the order we'd like to suggest it as a set-up dart.
const SETUP_DARTS: Dart[] = [];
for (let v = 20; v >= 1; v--) SETUP_DARTS.push({ v, m: 3 });
for (let v = 20; v >= 1; v--) SETUP_DARTS.push({ v, m: 1 });
SETUP_DARTS.push({ v: 25, m: 1 });
for (let v = 20; v >= 1; v--) SETUP_DARTS.push({ v, m: 2 });
SETUP_DARTS.push({ v: 25, m: 2 });

// For straight-out games any dart can finish; prefer the fewest darts, biggest first.
const FINISH_ANY: Dart[] = [...SETUP_DARTS].sort((a, b) => dartValue(b) - dartValue(a));

/** Best single dart that scores exactly `n`, preferring single > treble > double. */
function exactDart(n: number, allowDouble = true): Dart | null {
  if (n >= 1 && n <= 20) return { v: n, m: 1 };
  if (n === 25) return { v: 25, m: 1 };
  if (n % 3 === 0 && n / 3 >= 1 && n / 3 <= 20) return { v: n / 3, m: 3 };
  if (allowDouble) {
    if (n === 50) return { v: 25, m: 2 };
    if (n % 2 === 0 && n / 2 >= 1 && n / 2 <= 20) return { v: n / 2, m: 2 };
  }
  return null;
}

function finishOne(remaining: number, doubleOut: boolean): Dart | null {
  const candidates = doubleOut ? FINISH_DOUBLES : FINISH_ANY;
  return candidates.find((d) => dartValue(d) === remaining) ?? null;
}

function finishTwo(remaining: number, doubleOut: boolean): Dart[] | null {
  const finals = doubleOut ? FINISH_DOUBLES : FINISH_ANY;
  for (const last of finals) {
    const need = remaining - dartValue(last);
    if (need <= 0) continue;
    const first = exactDart(need);
    if (first) return [first, last];
  }
  return null;
}

/**
 * Suggest a route to finish `remaining` with at most `dartsLeft` darts.
 * Returns null when no checkout exists (e.g. 169 or anything over 170 in double-out).
 */
export function findCheckout(remaining: number, dartsLeft: number, doubleOut: boolean): Dart[] | null {
  if (remaining <= 0 || dartsLeft <= 0) return null;
  if (doubleOut && remaining === 1) return null;
  if (doubleOut) {
    // Prefer the route everyone knows from the pub chart when there are enough darts for it.
    const standard = chartRoute(remaining);
    if (standard && standard.length <= dartsLeft) return standard;
  }
  const one = finishOne(remaining, doubleOut);
  if (one) return [one];
  if (dartsLeft < 2) return null;
  const two = finishTwo(remaining, doubleOut);
  if (two) return two;
  if (dartsLeft < 3) return null;
  for (const first of SETUP_DARTS) {
    const rest = remaining - dartValue(first);
    if (rest <= 1) continue;
    const tail = finishTwo(rest, doubleOut);
    if (tail) return [first, ...tail];
  }
  return null;
}

export function formatRoute(route: Dart[]): string {
  return route.map(dartLabel).join('  ');
}
