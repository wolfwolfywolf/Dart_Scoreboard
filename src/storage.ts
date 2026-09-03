import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Game } from './types';

const KEYS = {
  current: 'darts:current-game',
  history: 'darts:history',
  players: 'darts:recent-players',
};

async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage failures are non-fatal: the game keeps running in memory.
  }
}

export const loadCurrentGame = () => loadJSON<Game | null>(KEYS.current, null);
export const saveCurrentGame = (game: Game | null) =>
  game ? saveJSON(KEYS.current, game) : AsyncStorage.removeItem(KEYS.current).catch(() => undefined);

export const loadHistory = () => loadJSON<Game[]>(KEYS.history, []);
export const saveHistory = (games: Game[]) => saveJSON(KEYS.history, games);

export const loadRecentPlayers = () => loadJSON<string[]>(KEYS.players, []);
export const saveRecentPlayers = (names: string[]) => saveJSON(KEYS.players, names.slice(0, 12));
