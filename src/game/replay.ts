import type { CricketGame, Game, X01Game } from '../types';
import { replayCricket } from './cricket';
import { replayX01 } from './x01';

export function isX01Game(game: Game): game is X01Game {
  return game.setup.kind === 'x01';
}

export function isCricketGame(game: Game): game is CricketGame {
  return game.setup.kind === 'cricket';
}

export function gameWinner(game: Game): number | null {
  return isX01Game(game) ? replayX01(game.setup, game.events).winner : replayCricket(game.setup, game.events).winner;
}

export function isGameFinished(game: Game): boolean {
  return isX01Game(game) ? replayX01(game.setup, game.events).finished : replayCricket(game.setup, game.events).finished;
}
