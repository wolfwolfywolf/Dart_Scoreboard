import type { CricketEvent, CricketSetup, Dart } from '../types';
import { throwerName } from './darts';

export const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, 25] as const;

export interface CricketPlayerStats {
  dartsThrown: number;
  marks: number;
}

export interface CricketTurn {
  player: number;
  member: number;
  thrower: string;
  darts: Dart[];
  pointsScored: number;
  marksScored: number;
}

export interface CricketState {
  setup: CricketSetup;
  /** marks[player][index into CRICKET_NUMBERS], capped at 3 */
  marks: number[][];
  points: number[];
  currentPlayer: number;
  turnDarts: Dart[];
  finished: boolean;
  winner: number | null;
  stats: CricketPlayerStats[];
  /** Per-teammate stats, memberStats[side][member]. One entry per side in singles. */
  memberStats: CricketPlayerStats[][];
  sideTurns: number[];
  thrower: string;
  turns: CricketTurn[];
}

export function marksPerRound(s: CricketPlayerStats): number {
  return s.dartsThrown === 0 ? 0 : (s.marks / s.dartsThrown) * 3;
}

export function replayCricket(setup: CricketSetup, events: CricketEvent[]): CricketState {
  const n = setup.players.length;
  const st: CricketState = {
    setup,
    marks: Array.from({ length: n }, () => Array(CRICKET_NUMBERS.length).fill(0)),
    points: Array(n).fill(0),
    currentPlayer: 0,
    turnDarts: [],
    finished: false,
    winner: null,
    stats: Array.from({ length: n }, () => ({ dartsThrown: 0, marks: 0 })),
    memberStats: setup.players.map((pl) =>
      Array.from({ length: Math.max(1, pl.members?.length ?? 1) }, () => ({ dartsThrown: 0, marks: 0 })),
    ),
    sideTurns: Array(n).fill(0),
    thrower: throwerName(setup.players[0], 0),
    turns: [],
  };
  let turnPoints = 0;
  let turnMarks = 0;
  const memberOf = (p: number) => st.sideTurns[p] % st.memberStats[p].length;
  const pushTurn = (p: number) => {
    st.turns.push({
      player: p,
      member: memberOf(p),
      thrower: throwerName(setup.players[p], st.sideTurns[p]),
      darts: st.turnDarts,
      pointsScored: turnPoints,
      marksScored: turnMarks,
    });
    st.sideTurns[p]++;
  };

  const points = (setup.scoring ?? 'points') === 'points';
  const allClosed = (p: number) => st.marks[p].every((m) => m >= 3);
  const someoneOpen = (idx: number, except: number) =>
    st.marks.some((row, p) => p !== except && row[idx] < 3);

  const endTurn = () => {
    pushTurn(st.currentPlayer);
    st.turnDarts = [];
    turnPoints = 0;
    turnMarks = 0;
    st.currentPlayer = (st.currentPlayer + 1) % n;
    st.thrower = throwerName(setup.players[st.currentPlayer], st.sideTurns[st.currentPlayer]);
  };

  for (const ev of events) {
    if (st.finished) break;
    const p = st.currentPlayer;
    const dart: Dart = { v: ev.v, m: ev.m };
    st.turnDarts.push(dart);
    st.stats[p].dartsThrown++;
    const member = st.memberStats[p][memberOf(p)];
    member.dartsThrown++;

    const idx = (CRICKET_NUMBERS as readonly number[]).indexOf(ev.v);
    if (idx >= 0) {
      const hits = ev.v === 25 ? Math.min(ev.m, 2) : ev.m;
      const value = ev.v; // bull scores 25 per mark
      for (let i = 0; i < hits; i++) {
        if (st.marks[p][idx] < 3) {
          st.marks[p][idx]++;
          st.stats[p].marks++;
          member.marks++;
          turnMarks++;
        } else if (points && someoneOpen(idx, p)) {
          st.points[p] += value;
          st.stats[p].marks++;
          member.marks++;
          turnMarks++;
          turnPoints += value;
        }
      }
    }

    const others = st.points.filter((_, i) => i !== p);
    if (allClosed(p) && (!points || others.length === 0 || st.points[p] >= Math.max(...others))) {
      st.finished = true;
      st.winner = p;
      pushTurn(p);
      break;
    }
    if (st.turnDarts.length === 3) endTurn();
  }
  return st;
}
