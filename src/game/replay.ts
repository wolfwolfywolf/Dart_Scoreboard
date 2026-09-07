import type { CricketGame, Game, ShanghaiGame, X01Game } from '../types';
import { replayCricket } from './cricket';
import { replayShanghai } from './shanghai';
import { replayX01 } from './x01';

export function isX01Game(game: Game): game is X01Game {
  return game.setup.kind === 'x01';
}

export function isCricketGame(game: Game): game is CricketGame {
  return game.setup.kind === 'cricket';
}

export function isShanghaiGame(game: Game): game is ShanghaiGame {
  return game.setup.kind === 'shanghai';
}

export function gameWinner(game: Game): number | null {
  if (isX01Game(game)) return replayX01(game.setup, game.events).winner;
  if (isShanghaiGame(game)) return replayShanghai(game.setup, game.events).winner;
  return replayCricket(game.setup, game.events).winner;
}

export function isGameFinished(game: Game): boolean {
  if (isX01Game(game)) return replayX01(game.setup, game.events).finished;
  if (isShanghaiGame(game)) return replayShanghai(game.setup, game.events).finished;
  return replayCricket(game.setup, game.events).finished;
}
