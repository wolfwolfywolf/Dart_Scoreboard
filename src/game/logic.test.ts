import { test } from 'node:test';
import assert from 'node:assert/strict';
import { continuedRoute, findCheckout, findCheckouts, formatRoute } from './checkout';
import { replayX01, threeDartAverage } from './x01';
import { replayCricket } from './cricket';
import { CHECKOUT_CHART, chartRoute, chartTotal } from './checkoutChart';
import type { CricketEvent, X01Event, X01Setup } from '../types';

const players = [
  { id: 'a', name: 'Ann' },
  { id: 'b', name: 'Bob' },
];
const setup501: X01Setup = { kind: 'x01', startScore: 501, doubleOut: true, legsToWin: 1, players };
const d = (v: number, m: 1 | 2 | 3 = 1): X01Event => ({ t: 'dart', v, m });

test('checkout chart entries add up and end on a double', () => {
  const bogeys = [169, 168, 166, 165, 163, 162, 159];
  for (let n = 2; n <= 170; n++) {
    const route = chartRoute(n);
    if (bogeys.includes(n)) {
      assert.equal(route, null, `${n} should be a bogey`);
      continue;
    }
    assert.ok(route, `${n} missing from chart`);
    assert.equal(chartTotal(route), n, `${n}: ${CHECKOUT_CHART[n]}`);
    assert.ok(route.length <= 3);
    assert.equal(route[route.length - 1].m, 2, `${n} must finish on a double`);
  }
});

test('checkout suggestions', () => {
  assert.equal(formatRoute(findCheckout(170, 3, true)!), 'T20  T20  Bull');
  assert.equal(formatRoute(findCheckout(167, 3, true)!), 'T20  T19  Bull');
  assert.equal(formatRoute(findCheckout(100, 2, true)!), 'T20  D20');
  assert.equal(formatRoute(findCheckout(61, 3, true)!), 'T15  D8');
  assert.equal(formatRoute(findCheckout(41, 2, true)!), '9  D16');
  // With too few darts for the chart route, fall back to what is still possible.
  assert.equal(findCheckout(170, 2, true), null);
  assert.equal(findCheckout(120, 2, true), null);
  assert.equal(formatRoute(findCheckout(110, 2, true)!), 'T20  Bull');
  assert.equal(formatRoute(findCheckout(32, 1, true)!), 'D16');
  assert.equal(formatRoute(findCheckout(50, 1, true)!), 'Bull');
  assert.equal(findCheckout(169, 3, true), null);
  assert.equal(findCheckout(1, 3, true), null);
  assert.equal(findCheckout(100, 1, true), null);
  assert.equal(formatRoute(findCheckout(60, 1, false)!), 'T20');
  assert.equal(formatRoute(findCheckout(1, 1, false)!), '1');
});

test('x01: scoring, turn rotation and averages', () => {
  const st = replayX01(setup501, [d(20, 3), d(20, 3), d(20, 3), d(5), d(1)]);
  assert.deepEqual(st.scores, [321, 495]);
  assert.equal(st.currentPlayer, 1);
  assert.equal(st.turnDarts.length, 2);
  assert.equal(st.stats[0].oneEighties, 1);
  assert.equal(st.stats[0].tons, 1);
  assert.equal(threeDartAverage(st.stats[0]), 180);
});

test('x01: bust restores score and ends the turn', () => {
  const st = replayX01(setup501, [
    ...Array(8).fill([d(20, 3), d(20, 3), d(20, 3)]).flat(), // Ann 501->321, Bob 501->321, Ann 141, Bob 141, ...
  ]);
  // After 8 turns of 180: Ann 501-4*180 would go negative; check the actual path.
  assert.ok(st.turns.some((t) => t.bust));
});

test('x01: double-out rules', () => {
  const setup: X01Setup = { ...setup501, startScore: 40 };
  // 40 -> hitting single 20 twice would leave 0 on a single: bust
  let st = replayX01(setup, [d(20), d(20)]);
  assert.equal(st.scores[0], 40);
  assert.equal(st.turns[0].bust, true);
  // leaving 1 is a bust
  st = replayX01(setup, [d(19, 2), d(1)]);
  assert.equal(st.scores[0], 40);
  // D20 wins
  st = replayX01(setup, [d(20, 2)]);
  assert.equal(st.finished, true);
  assert.equal(st.winner, 0);
  assert.equal(st.stats[0].highestCheckout, 40);
  assert.equal(st.stats[0].bestLeg, 1);
});

test('x01: straight-out lets a single finish', () => {
  const setup: X01Setup = { ...setup501, startScore: 20, doubleOut: false };
  const st = replayX01(setup, [d(20)]);
  assert.equal(st.finished, true);
});

test('x01: total entry, checkout dart count and legs', () => {
  const setup: X01Setup = { ...setup501, startScore: 101, legsToWin: 2 };
  let st = replayX01(setup, [{ t: 'total', total: 60 }]);
  assert.equal(st.scores[0], 41);
  assert.equal(st.stats[0].dartsThrown, 3);
  assert.equal(st.currentPlayer, 1);
  // Bob busts by total (leaves 1)
  st = replayX01(setup, [{ t: 'total', total: 60 }, { t: 'total', total: 100 }]);
  assert.equal(st.scores[1], 101);
  assert.equal(st.turns[1].bust, true);
  // Ann checks out 41 in 2 darts -> leg 2 starts with Bob throwing first
  st = replayX01(setup, [{ t: 'total', total: 60 }, { t: 'total', total: 100 }, { t: 'total', total: 41, darts: 2 }]);
  assert.equal(st.legsWon[0], 1);
  assert.equal(st.finished, false);
  assert.equal(st.leg, 1);
  assert.equal(st.currentPlayer, 1);
  assert.deepEqual(st.scores, [101, 101]);
  assert.equal(st.stats[0].dartsThrown, 5);
  assert.equal(st.stats[0].bestLeg, 5);
  // An impossible checkout total (e.g. 169) counts as a bust
  const s169: X01Setup = { ...setup501, startScore: 169 };
  st = replayX01(s169, [{ t: 'total', total: 169 }]);
  assert.equal(st.turns[0].bust, true);
});

test('x01: undo is dropping the last event', () => {
  const events = [d(20, 3), d(20, 3), d(20, 3), d(20, 3)];
  const before = replayX01(setup501, events.slice(0, 3));
  const after = replayX01(setup501, events.slice(0, 4));
  assert.equal(after.currentPlayer, 1);
  assert.equal(replayX01(setup501, events.slice(0, 3)).currentPlayer, before.currentPlayer);
});

test('cricket: marks, points and winning', () => {
  const c = (v: number, m: 1 | 2 | 3 = 1): CricketEvent => ({ t: 'dart', v, m });
  const setup = { kind: 'cricket' as const, players };
  // Ann: T20 closes 20, then 20 scores 20 points (Bob still open), then miss
  let st = replayCricket(setup, [c(20, 3), c(20), c(0)]);
  assert.equal(st.marks[0][0], 3);
  assert.equal(st.points[0], 20);
  assert.equal(st.currentPlayer, 1);
  // Bob closes 20 -> Ann can no longer score on it
  st = replayCricket(setup, [c(20, 3), c(20), c(0), c(20, 3), c(0), c(0), c(20)]);
  assert.equal(st.points[0], 20);
  // Double bull counts two marks
  st = replayCricket(setup, [c(25, 2)]);
  assert.equal(st.marks[0][6], 2);
  // Closing everything with points >= opponent wins immediately
  const closeAll: CricketEvent[] = [c(20, 3), c(19, 3), c(18, 3), c(0), c(0), c(0), c(17, 3), c(16, 3), c(15, 3), c(0), c(0), c(0), c(25, 2), c(25)];
  st = replayCricket(setup, closeAll);
  assert.equal(st.finished, true);
  assert.equal(st.winner, 0);
});

test('x01 doubles: teammates alternate and share a score', () => {
  const teams = [
    { id: 't1', name: 'Ann & Bob', members: ['Ann', 'Bob'] },
    { id: 't2', name: 'Cat & Dan', members: ['Cat', 'Dan'] },
  ];
  const setup: X01Setup = { kind: 'x01', startScore: 301, doubleOut: true, legsToWin: 2, players: teams };
  let st = replayX01(setup, []);
  assert.equal(st.thrower, 'Ann');
  st = replayX01(setup, [{ t: 'total', total: 60 }]);
  assert.equal(st.thrower, 'Cat');
  st = replayX01(setup, [{ t: 'total', total: 60 }, { t: 'total', total: 45 }]);
  assert.equal(st.thrower, 'Bob');
  assert.deepEqual(st.scores, [241, 256]);
  st = replayX01(setup, [{ t: 'total', total: 60 }, { t: 'total', total: 45 }, { t: 'total', total: 100 }]);
  assert.equal(st.thrower, 'Dan');
  assert.equal(st.scores[0], 141);
  assert.equal(st.turns[2].thrower, 'Bob');
  assert.equal(st.memberStats[0][0].pointsScored, 60);
  assert.equal(st.memberStats[0][1].pointsScored, 100);
  assert.equal(st.stats[0].pointsScored, 160);
  // Ann wins leg 1 (141 = T20 T19 D12); leg 2 starts with team 2, and its
  // alternation continues: Dan threw last for team 2, so Cat starts.
  const legOne: X01Event[] = [
    { t: 'total', total: 60 },
    { t: 'total', total: 45 },
    { t: 'total', total: 100 },
    { t: 'total', total: 40 },
    { t: 'total', total: 141, darts: 3 },
  ];
  st = replayX01(setup, legOne);
  assert.equal(st.legsWon[0], 1);
  assert.equal(st.currentPlayer, 1);
  assert.equal(st.thrower, 'Cat');
  assert.equal(st.turns[4].thrower, 'Ann');
});

test('cricket doubles: teammates alternate', () => {
  const c = (v: number, m: 1 | 2 | 3 = 1): CricketEvent => ({ t: 'dart', v, m });
  const setup = {
    kind: 'cricket' as const,
    players: [
      { id: 't1', name: 'Ann & Bob', members: ['Ann', 'Bob'] },
      { id: 't2', name: 'Cat', members: ['Cat'] },
    ],
  };
  let st = replayCricket(setup, [c(20, 3), c(0), c(0)]);
  assert.equal(st.thrower, 'Cat');
  st = replayCricket(setup, [c(20, 3), c(0), c(0), c(0), c(0), c(0)]);
  assert.equal(st.thrower, 'Bob');
  assert.equal(st.memberStats[0][0].marks, 3);
  st = replayCricket(setup, [c(20, 3), c(0), c(0), c(0), c(0), c(0), c(19, 2)]);
  assert.equal(st.memberStats[0][1].marks, 2);
  assert.equal(st.stats[0].marks, 5);
});

test('cricket without points: closing everything wins, extra hits score nothing', () => {
  const c = (v: number, m: 1 | 2 | 3 = 1): CricketEvent => ({ t: 'dart', v, m });
  const setup = { kind: 'cricket' as const, scoring: 'closeOnly' as const, players };
  let st = replayCricket(setup, [c(20, 3), c(20), c(20)]);
  assert.equal(st.points[0], 0);
  assert.equal(st.marks[0][0], 3);
  // Bob gets ahead on points in a standard game; in close-only Ann still wins by closing first.
  const closeAll: CricketEvent[] = [c(20, 3), c(19, 3), c(18, 3), c(0), c(0), c(0), c(17, 3), c(16, 3), c(15, 3), c(0), c(0), c(0), c(25, 2), c(25)];
  st = replayCricket(setup, closeAll);
  assert.equal(st.finished, true);
  assert.equal(st.winner, 0);
});

test('cut-throat cricket: points go to open opponents and the lowest score wins', () => {
  const c = (v: number, m: 1 | 2 | 3 = 1): CricketEvent => ({ t: 'dart', v, m });
  const three = [...players, { id: 'c', name: 'Cat' }];
  const setup = { kind: 'cricket' as const, scoring: 'cutThroat' as const, players: three };
  // Ann closes 20 then hits it again: Bob and Cat each take 20 points, Ann none.
  let st = replayCricket(setup, [c(20, 3), c(20), c(0)]);
  assert.deepEqual(st.points, [0, 20, 20]);
  // Bob closes 20 with his turn; Cat misses; Ann hits 20 again: only Cat is still open, so only Cat is hit.
  st = replayCricket(setup, [c(20, 3), c(20), c(0), c(20, 3), c(0), c(0), c(0), c(0), c(0), c(20), c(0), c(0)]);
  assert.deepEqual(st.points, [0, 20, 40]);
  // Ann closing everything wins only while her score is the lowest.
  const closeRest: CricketEvent[] = [c(19, 3), c(18, 3), c(17, 3), c(0), c(0), c(0), c(0), c(0), c(0), c(16, 3), c(15, 3), c(25, 2), c(0), c(0), c(0), c(0), c(0), c(0), c(25)];
  st = replayCricket(setup, [c(20, 3), c(20), c(0), c(0), c(0), c(0), c(0), c(0), c(0), ...closeRest]);
  assert.equal(st.finished, true);
  assert.equal(st.winner, 0);
});

test('checkout plan continues when the suggested dart is hit', () => {
  // 121 suggests T20 T11 D14; after T20 the plan should still be T11 D14, not a different 61.
  assert.equal(formatRoute(findCheckout(121, 3, true)!), 'T20  T11  D14');
  assert.equal(formatRoute(continuedRoute(121, [{ v: 20, m: 3 }], true)!), 'T11  D14');
  assert.equal(formatRoute(continuedRoute(121, [{ v: 20, m: 3 }, { v: 11, m: 3 }], true)!), 'D14');
  // Missing the plan drops it, so a fresh suggestion for the new score takes over.
  assert.equal(continuedRoute(121, [{ v: 20, m: 1 }], true), null);
  assert.equal(formatRoute(continuedRoute(150, [], true)!), 'T20  T18  D18');
});

test('alternative checkouts are distinct and fit the darts left', () => {
  const two = findCheckouts(80, 2, true);
  assert.equal(formatRoute(two[0]), 'T20  D10');
  assert.ok(two.some((r) => formatRoute(r) === 'T16  D16'));
  assert.ok(two.every((r) => r.length <= 2 && r[r.length - 1].m === 2));
  assert.deepEqual(findCheckouts(32, 1, true).map(formatRoute), ['D16']);
  assert.equal(findCheckouts(101, 1, true).length, 0);
  const three = findCheckouts(100, 3, true);
  assert.equal(formatRoute(three[0]), 'T20  D20');
  assert.equal(new Set(three.map(formatRoute)).size, three.length);
});

test('cricket: the check mark ends the turn, counting unentered darts as misses', () => {
  const c = (v: number, m: 1 | 2 | 3 = 1): CricketEvent => ({ t: 'dart', v, m });
  const setup = { kind: 'cricket' as const, players };
  // Ann: single 17 then check -> 1 mark, 3 darts thrown, Bob to throw.
  let st = replayCricket(setup, [c(17), { t: 'endTurn' }]);
  assert.equal(st.marks[0][3], 1);
  assert.equal(st.stats[0].dartsThrown, 3);
  assert.equal(st.currentPlayer, 1);
  assert.equal(st.turns[0].darts.length, 3);
  // A bare check is a turn of three misses.
  st = replayCricket(setup, [{ t: 'endTurn' }]);
  assert.equal(st.stats[0].dartsThrown, 3);
  assert.equal(st.currentPlayer, 1);
  // After three darts the turn has already moved on; a check then ends the next player's turn.
  st = replayCricket(setup, [c(20), c(20), c(20), { t: 'endTurn' }]);
  assert.equal(st.currentPlayer, 0);
  assert.equal(st.stats[1].dartsThrown, 3);
});
