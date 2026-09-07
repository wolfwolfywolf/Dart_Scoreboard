export type Multiplier = 1 | 2 | 3;

/** One dart. `v` is the segment hit: 0 = miss, 1..20, or 25 (bull). Bull is `v: 25, m: 2`. */
export interface Dart {
  v: number;
  m: Multiplier;
}

/**
 * A scoring side. In singles this is one person. In doubles it is a team:
 * `name` is the team label and `members` lists the two teammates, who
 * alternate throws.
 */
export interface Player {
  id: string;
  name: string;
  members?: string[];
}

export interface X01Setup {
  kind: 'x01';
  startScore: number;
  doubleOut: boolean;
  legsToWin: number;
  players: Player[];
}

export type CricketScoring =
  /** Standard: hits on a number you've closed score points while an opponent still has it open. */
  | 'points'
  /** Race to close: extra hits do nothing, first side to close everything wins. */
  | 'closeOnly'
  /** Cut-throat: hits on a closed number give points to every opponent who still has it open; lowest score wins. */
  | 'cutThroat';

export interface CricketSetup {
  kind: 'cricket';
  players: Player[];
  /** Missing on games saved before this option existed; treated as 'points'. */
  scoring?: CricketScoring;
}

export type GameSetup = X01Setup | CricketSetup;

export type X01Event =
  | { t: 'dart'; v: number; m: Multiplier }
  /** A whole turn entered as a total. `darts` is how many darts were used (matters on a checkout). */
  | { t: 'total'; total: number; darts?: number };

export type CricketEvent =
  | { t: 'dart'; v: number; m: Multiplier }
  /** Finish the turn early: any darts not entered count as misses. */
  | { t: 'endTurn' };

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
