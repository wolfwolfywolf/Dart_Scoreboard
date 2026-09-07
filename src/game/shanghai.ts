import type { Dart, ShanghaiEvent, ShanghaiSetup } from '../types';
import { throwerName } from './darts';

export interface ShanghaiPlayerStats {
  dartsThrown: number;
  hits: number; // darts that landed on the round's number
}

export interface ShanghaiTurn {
  player: number;
  member: number;
  thrower: string;
  round: number; // index into setup.numbers
  target: number;
  darts: Dart[];
  scored: number;
  shanghai: boolean;
}

export interface ShanghaiState {
  setup: ShanghaiSetup;
  scores: number[];
  /** roundScores[player][round], filled in as rounds complete. */
  roundScores: number[][];
  round: number;
  currentPlayer: number;
  turnDarts: Dart[];
  turnScore: number;
  finished: boolean;
  winner: number | null;
  /** Everyone tied for the top score when the game ended on points (empty otherwise). */
  tied: number[];
  /** Set when the game ended with a Shanghai: who hit it and on which number. */
  shanghai: { player: number; target: number } | null;
  stats: ShanghaiPlayerStats[];
  memberStats: ShanghaiPlayerStats[][];
  sideTurns: number[];
  thrower: string;
  turns: ShanghaiTurn[];
}

/** Single, double and triple of the number in one turn. On bull: two 25s and one 50. */
export function isShanghai(target: number, darts: Dart[]): boolean {
  const onTarget = darts.filter((d) => d.v === target);
  if (target === 25) {
    return onTarget.filter((d) => d.m === 1).length === 2 && onTarget.filter((d) => d.m === 2).length === 1;
  }
  const mults = new Set(onTarget.map((d) => d.m));
  return mults.has(1) && mults.has(2) && mults.has(3);
}

export function replayShanghai(setup: ShanghaiSetup, events: ShanghaiEvent[]): ShanghaiState {
  const n = setup.players.length;
  const rounds = setup.numbers.length;
  const st: ShanghaiState = {
    setup,
    scores: Array(n).fill(0),
    roundScores: Array.from({ length: n }, () => []),
    round: 0,
    currentPlayer: 0,
    turnDarts: [],
    turnScore: 0,
    finished: false,
    winner: null,
    tied: [],
    shanghai: null,
    stats: Array.from({ length: n }, () => ({ dartsThrown: 0, hits: 0 })),
    memberStats: setup.players.map((pl) =>
      Array.from({ length: Math.max(1, pl.members?.length ?? 1) }, () => ({ dartsThrown: 0, hits: 0 })),
    ),
    sideTurns: Array(n).fill(0),
    thrower: throwerName(setup.players[0], 0),
    turns: [],
  };
  if (rounds === 0 || n === 0) {
    st.finished = true;
    return st;
  }
  const memberOf = (p: number) => st.sideTurns[p] % st.memberStats[p].length;

  const finishOnPoints = () => {
    const top = Math.max(...st.scores);
    const leaders = st.scores.map((s, i) => (s === top ? i : -1)).filter((i) => i >= 0);
    st.finished = true;
    st.winner = leaders[0];
    st.tied = leaders.length > 1 ? leaders : [];
  };

  const endTurn = (p: number, shanghai: boolean) => {
    const target = setup.numbers[st.round];
    st.turns.push({
      player: p,
      member: memberOf(p),
      thrower: throwerName(setup.players[p], st.sideTurns[p]),
      round: st.round,
      target,
      darts: st.turnDarts,
      scored: st.turnScore,
      shanghai,
    });
    st.roundScores[p][st.round] = st.turnScore;
    st.sideTurns[p]++;
    st.turnDarts = [];
    st.turnScore = 0;
    if (shanghai) {
      st.finished = true;
      st.winner = p;
      st.shanghai = { player: p, target };
      return;
    }
    st.currentPlayer = (p + 1) % n;
    if (st.currentPlayer === 0) {
      st.round++;
      if (st.round >= rounds) {
        finishOnPoints();
        return;
      }
    }
    st.thrower = throwerName(setup.players[st.currentPlayer], st.sideTurns[st.currentPlayer]);
  };

  for (const ev of events) {
    if (st.finished) break;
    const p = st.currentPlayer;
    const target = setup.numbers[st.round];

    if (ev.t === 'endTurn') {
      while (st.turnDarts.length < 3) {
        st.turnDarts.push({ v: 0, m: 1 });
        st.stats[p].dartsThrown++;
        st.memberStats[p][memberOf(p)].dartsThrown++;
      }
      endTurn(p, isShanghai(target, st.turnDarts));
      continue;
    }

    const dart: Dart = { v: ev.v, m: ev.m };
    st.turnDarts.push(dart);
    st.stats[p].dartsThrown++;
    const member = st.memberStats[p][memberOf(p)];
    member.dartsThrown++;
    if (dart.v === target) {
      const value = target * dart.m; // bull: 25 or 50
      st.turnScore += value;
      st.scores[p] += value;
      st.stats[p].hits++;
      member.hits++;
    }
    if (st.turnDarts.length === 3) endTurn(p, isShanghai(target, st.turnDarts));
  }
  return st;
}

export function shanghaiLabel(target: number): string {
  return target === 25 ? 'Bull' : String(target);
}
