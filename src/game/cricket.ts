import type { CricketEvent, CricketSetup, Dart } from '../types';

export const CRICKET_NUMBERS = [20, 19, 18, 17, 16, 15, 25] as const;

export interface CricketPlayerStats {
  dartsThrown: number;
  marks: number;
}

export interface CricketTurn {
  player: number;
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
    turns: [],
  };
  let turnPoints = 0;
  let turnMarks = 0;

  const allClosed = (p: number) => st.marks[p].every((m) => m >= 3);
  const someoneOpen = (idx: number, except: number) =>
    st.marks.some((row, p) => p !== except && row[idx] < 3);

  const endTurn = () => {
    st.turns.push({ player: st.currentPlayer, darts: st.turnDarts, pointsScored: turnPoints, marksScored: turnMarks });
    st.turnDarts = [];
    turnPoints = 0;
    turnMarks = 0;
    st.currentPlayer = (st.currentPlayer + 1) % n;
  };

  for (const ev of events) {
    if (st.finished) break;
    const p = st.currentPlayer;
    const dart: Dart = { v: ev.v, m: ev.m };
    st.turnDarts.push(dart);
    st.stats[p].dartsThrown++;

    const idx = (CRICKET_NUMBERS as readonly number[]).indexOf(ev.v);
    if (idx >= 0) {
      const hits = ev.v === 25 ? Math.min(ev.m, 2) : ev.m;
      const value = ev.v; // bull scores 25 per mark
      for (let i = 0; i < hits; i++) {
        if (st.marks[p][idx] < 3) {
          st.marks[p][idx]++;
          st.stats[p].marks++;
          turnMarks++;
        } else if (someoneOpen(idx, p)) {
          st.points[p] += value;
          st.stats[p].marks++;
          turnMarks++;
          turnPoints += value;
        }
      }
    }

    const others = st.points.filter((_, i) => i !== p);
    if (allClosed(p) && (others.length === 0 || st.points[p] >= Math.max(...others))) {
      st.finished = true;
      st.winner = p;
      st.turns.push({ player: p, darts: st.turnDarts, pointsScored: turnPoints, marksScored: turnMarks });
      break;
    }
    if (st.turnDarts.length === 3) endTurn();
  }
  return st;
}
