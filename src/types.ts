export type Multiplier = 1 | 2 | 3;

/** One dart. `v` is the segment hit: 0 = miss, 1..20, or 25 (bull). Bull is `v: 25, m: 2`. */
export interface Dart {
  v: number;
  m: Multiplier;
}

export interface Player {
  id: string;
  name: string;
}

export interface X01Setup {
  kind: 'x01';
  startScore: number;
  doubleOut: boolean;
  legsToWin: number;
  players: Player[];
}

export interface CricketSetup {
  kind: 'cricket';
  players: Player[];
}

export type GameSetup = X01Setup | CricketSetup;

export type X01Event =
  | { t: 'dart'; v: number; m: Multiplier }
  /** A whole turn entered as a total. `darts` is how many darts were used (matters on a checkout). */
  | { t: 'total'; total: number; darts?: number };

export type CricketEvent = { t: 'dart'; v: number; m: Multiplier };

interface GameBase {
  id: string;
  startedAt: number;
  finishedAt?: number;
}

export interface X01Game extends GameBase {
  setup: X01Setup;
  events: X01Event[];
}

export interface CricketGame extends GameBase {
  setup: CricketSetup;
  events: CricketEvent[];
}

export type Game = X01Game | CricketGame;
