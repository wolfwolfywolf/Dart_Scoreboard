import type { Dart, X01Event, X01Setup } from '../types';
import { findCheckout } from './checkout';
import { dartValue, throwerName } from './darts';

export interface X01PlayerStats {
  dartsThrown: number;
  pointsScored: number;
  tons: number; // turns of 100+
  ton40s: number; // turns of 140+
  oneEighties: number;
  highestCheckout: number;
  bestLeg: number | null; // fewest darts to win a leg
  legsWon: number;
}

export interface MemberStats {
  dartsThrown: number;
  pointsScored: number;
}

export interface X01Turn {
  player: number;
  /** Which teammate threw (index into players[player].members), 0 for singles. */
  member: number;
  thrower: string;
  leg: number;
  darts: Dart[]; // empty when entered as a total
  scored: number;
  startScore: number;
  bust: boolean;
  finished: boolean;
}

export interface X01State {
  setup: X01Setup;
  scores: number[];
  legsWon: number[];
  currentPlayer: number;
  turnDarts: Dart[];
  turnStartScore: number;
  leg: number;
  finished: boolean;
  winner: number | null;
  stats: X01PlayerStats[];
  /** Per-teammate stats, memberStats[side][member]. One entry per side in singles. */
  memberStats: MemberStats[][];
  /** Turns each side has completed in the whole game; decides which teammate throws next. */
  sideTurns: number[];
  /** Name of whoever is throwing right now. */
  thrower: string;
  turns: X01Turn[];
}

function emptyStats(): X01PlayerStats {
  return {
    dartsThrown: 0,
    pointsScored: 0,
    tons: 0,
    ton40s: 0,
    oneEighties: 0,
    highestCheckout: 0,
    bestLeg: null,
    legsWon: 0,
  };
}

export function threeDartAverage(s: { dartsThrown: number; pointsScored: number }): number {
  return s.dartsThrown === 0 ? 0 : (s.pointsScored / s.dartsThrown) * 3;
}

/** Rebuild the full game state from the setup and the event log. Undo is just "drop the last event". */
export function replayX01(setup: X01Setup, events: X01Event[]): X01State {
  const n = setup.players.length;
  const st: X01State = {
    setup,
    scores: Array(n).fill(setup.startScore),
    legsWon: Array(n).fill(0),
    currentPlayer: 0,
    turnDarts: [],
    turnStartScore: setup.startScore,
    leg: 0,
    finished: false,
    winner: null,
    stats: Array.from({ length: n }, emptyStats),
    memberStats: setup.players.map((pl) =>
      Array.from({ length: Math.max(1, pl.members?.length ?? 1) }, () => ({ dartsThrown: 0, pointsScored: 0 })),
    ),
    sideTurns: Array(n).fill(0),
    thrower: throwerName(setup.players[0], 0),
    turns: [],
  };
  let legDarts: number[] = Array(n).fill(0);
  const memberOf = (p: number) => st.sideTurns[p] % st.memberStats[p].length;
  const syncThrower = () => {
    st.thrower = throwerName(setup.players[st.currentPlayer], st.sideTurns[st.currentPlayer]);
  };

  const startLeg = (leg: number) => {
    st.leg = leg;
    st.scores = Array(n).fill(setup.startScore);
    legDarts = Array(n).fill(0);
    st.currentPlayer = leg % n;
    st.turnDarts = [];
    st.turnStartScore = setup.startScore;
    syncThrower();
  };

  const recordTurn = (p: number, scored: number, bust: boolean, finished: boolean, darts: Dart[]) => {
    const s = st.stats[p];
    const m = memberOf(p);
    s.pointsScored += scored;
    st.memberStats[p][m].pointsScored += scored;
    if (scored >= 100) s.tons++;
    if (scored >= 140) s.ton40s++;
    if (scored === 180) s.oneEighties++;
    st.turns.push({
      player: p,
      member: m,
      thrower: throwerName(setup.players[p], st.sideTurns[p]),
      leg: st.leg,
      darts,
      scored,
      startScore: st.turnStartScore,
      bust,
      finished,
    });
    st.sideTurns[p]++;
  };

  const nextTurn = () => {
    st.turnDarts = [];
    st.currentPlayer = (st.currentPlayer + 1) % n;
    st.turnStartScore = st.scores[st.currentPlayer];
    syncThrower();
  };

  const winLeg = (p: number, darts: Dart[]) => {
    const s = st.stats[p];
    s.legsWon++;
    st.legsWon[p]++;
    s.highestCheckout = Math.max(s.highestCheckout, st.turnStartScore);
    s.bestLeg = s.bestLeg === null ? legDarts[p] : Math.min(s.bestLeg, legDarts[p]);
    recordTurn(p, st.turnStartScore, false, true, darts);
    st.scores[p] = 0;
    if (st.legsWon[p] >= setup.legsToWin) {
      st.finished = true;
      st.winner = p;
    } else {
      startLeg(st.leg + 1);
    }
  };

  for (const ev of events) {
    if (st.finished) break;
    const p = st.currentPlayer;
    const s = st.stats[p];

    if (ev.t === 'dart') {
      const dart: Dart = { v: ev.v, m: ev.m };
      const value = dartValue(dart);
      const newScore = st.scores[p] - value;
      st.turnDarts.push(dart);
      s.dartsThrown++;
      st.memberStats[p][memberOf(p)].dartsThrown++;
      legDarts[p]++;
      const bust =
        newScore < 0 ||
        (setup.doubleOut && newScore === 1) ||
        (newScore === 0 && setup.doubleOut && ev.m !== 2);
      if (bust) {
        st.scores[p] = st.turnStartScore;
        recordTurn(p, 0, true, false, st.turnDarts);
        nextTurn();
      } else if (newScore === 0) {
        winLeg(p, st.turnDarts);
      } else {
        st.scores[p] = newScore;
        if (st.turnDarts.length === 3) {
          recordTurn(p, st.turnStartScore - newScore, false, false, st.turnDarts);
          nextTurn();
        }
      }
    } else {
      const dartsLeft = 3 - st.turnDarts.length;
      const newScore = st.scores[p] - ev.total;
      const canFinish = newScore === 0 && findCheckout(ev.total, dartsLeft, setup.doubleOut) !== null;
      const bust = newScore < 0 || (setup.doubleOut && newScore === 1) || (newScore === 0 && !canFinish);
      let used = dartsLeft;
      if (canFinish && ev.darts) used = Math.min(Math.max(ev.darts, 1), dartsLeft);
      s.dartsThrown += used;
      st.memberStats[p][memberOf(p)].dartsThrown += used;
      legDarts[p] += used;
      if (bust) {
        st.scores[p] = st.turnStartScore;
        recordTurn(p, 0, true, false, st.turnDarts);
        nextTurn();
      } else if (newScore === 0) {
        winLeg(p, st.turnDarts);
      } else {
        st.scores[p] = newScore;
        recordTurn(p, st.turnStartScore - newScore, false, false, st.turnDarts);
        nextTurn();
      }
    }
  }
  return st;
}

/** Which dart counts (1..3) could plausibly have been used to check out `total` from a fresh turn. */
export function possibleFinishDartCounts(total: number, dartsLeft: number, doubleOut: boolean): number[] {
  const out: number[] = [];
  for (let d = 1; d <= dartsLeft; d++) {
    if (findCheckout(total, d, doubleOut) !== null) out.push(d);
  }
  return out;
}
