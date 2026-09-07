import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { FrederickatheGreat_400Regular } from '@expo-google-fonts/fredericka-the-great';
import { WalterTurncoat_400Regular } from '@expo-google-fonts/walter-turncoat';
import type { CricketEvent, CricketGame, Game, GameSetup, ShanghaiEvent, X01Event } from './src/types';
import { newId } from './src/game/darts';
import { isGameFinished as isFinished, isShanghaiGame as isShanghai, isX01Game as isX01 } from './src/game/replay';
import {
  loadCurrentGame,
  loadHistory,
  loadRecentPlayers,
  saveCurrentGame,
  saveHistory,
  saveRecentPlayers,
} from './src/storage';
import { HomeScreen } from './src/screens/HomeScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { X01GameScreen } from './src/screens/X01GameScreen';
import { CricketGameScreen } from './src/screens/CricketGameScreen';
import { ShanghaiGameScreen } from './src/screens/ShanghaiGameScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HistoryDetailScreen } from './src/screens/HistoryDetailScreen';
import { colors } from './src/theme';

type Route =
  | { name: 'home' }
  | { name: 'setup'; initial?: GameSetup }
  | { name: 'game' }
  | { name: 'history' }
  | { name: 'historyDetail'; game: Game };

export default function App() {
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [game, setGame] = useState<Game | null>(null);
  const [history, setHistory] = useState<Game[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<string[]>([]);
  const [fontsLoaded, fontError] = useFonts({ FrederickatheGreat_400Regular, WalterTurncoat_400Regular });

  useEffect(() => {
    Promise.all([loadCurrentGame(), loadHistory(), loadRecentPlayers()]).then(([g, h, r]) => {
      setGame(g);
      setHistory(h);
      setRecentPlayers(r);
      setReady(true);
    });
  }, []);

  // Android hardware back button: step back one screen instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'home') return false;
      setRoute(route.name === 'historyDetail' ? { name: 'history' } : { name: 'home' });
      return true;
    });
    return () => sub.remove();
  }, [route]);

  const updateHistory = useCallback((next: Game[]) => {
    setHistory(next);
    saveHistory(next);
  }, []);

  /** Commit a new version of the active game, archiving it to history when it's over. */
  const commitGame = useCallback(
    (next: Game) => {
      const finished = isFinished(next);
      const withoutThis = history.filter((h) => h.id !== next.id);
      if (finished) {
        const archived = { ...next, finishedAt: next.finishedAt ?? Date.now() };
        setGame(archived);
        updateHistory([archived, ...withoutThis]);
        saveCurrentGame(null);
      } else {
        setGame(next);
        if (withoutThis.length !== history.length) updateHistory(withoutThis); // finish was undone
        saveCurrentGame(next);
      }
    },
    [history, updateHistory],
  );

  const startGame = (setup: GameSetup) => {
    const base = { id: newId(), startedAt: Date.now(), events: [] };
    const g: Game =
      setup.kind === 'x01'
        ? { ...base, setup }
        : setup.kind === 'shanghai'
          ? { ...base, setup }
          : { ...base, setup };
    setGame(g);
    saveCurrentGame(g);
    const people = setup.players.flatMap((p) => (p.members?.length ? p.members : [p.name]));
    const names = [...people, ...recentPlayers.filter((n) => !people.includes(n))];
    setRecentPlayers(names.slice(0, 12));
    saveRecentPlayers(names);
    setRoute({ name: 'game' });
  };

  const onX01Event = (ev: X01Event) => {
    if (game && isX01(game)) commitGame({ ...game, events: [...game.events, ev] });
  };
  const onCricketEvent = (ev: CricketEvent) => {
    if (game && game.setup.kind === 'cricket') {
      const g = game as CricketGame;
      commitGame({ ...g, events: [...g.events, ev] });
    }
  };
  const onShanghaiEvent = (ev: ShanghaiEvent) => {
    if (game && isShanghai(game)) commitGame({ ...game, events: [...game.events, ev] });
  };
  const onUndo = () => {
    if (!game || game.events.length === 0) return;
    const next = { ...game, events: game.events.slice(0, -1) } as Game;
    commitGame(next);
  };
  const abandon = () => {
    setGame(null);
    saveCurrentGame(null);
    setRoute({ name: 'home' });
  };
  const done = () => {
    setGame(null);
    setRoute({ name: 'home' });
  };
  const rematch = () => {
    if (!game) return;
    const setup = game.setup;
    // Rotate who throws first so the loser of the last game starts.
    const players = [...setup.players.slice(1), setup.players[0]];
    startGame({ ...setup, players });
  };

  // If the fonts fail to load we carry on with the system font rather than show nothing.
  if (!ready || (!fontsLoaded && !fontError)) return <View style={styles.root} />;

  let screen: React.ReactNode;
  switch (route.name) {
    case 'home':
      screen = (
        <HomeScreen
          current={game && !isFinished(game) ? game : null}
          onResume={() => setRoute({ name: 'game' })}
          onNewGame={() => setRoute({ name: 'setup', initial: game?.setup ?? history[0]?.setup })}
          onHistory={() => setRoute({ name: 'history' })}
        />
      );
      break;
    case 'setup':
      screen = (
        <SetupScreen
          recentPlayers={recentPlayers}
          onRecentPlayersChange={(names) => {
            setRecentPlayers(names);
            saveRecentPlayers(names);
          }}
          initial={route.initial}
          onBack={() => setRoute({ name: 'home' })}
          onStart={startGame}
        />
      );
      break;
    case 'game':
      if (!game) {
        screen = <HomeScreen current={null} onResume={() => undefined} onNewGame={() => setRoute({ name: 'setup' })} onHistory={() => setRoute({ name: 'history' })} />;
      } else if (isShanghai(game)) {
        screen = (
          <ShanghaiGameScreen
            game={game}
            onEvent={onShanghaiEvent}
            onUndo={onUndo}
            onBack={() => setRoute({ name: 'home' })}
            onAbandon={abandon}
            onRematch={rematch}
            onDone={done}
          />
        );
      } else if (isX01(game)) {
        screen = (
          <X01GameScreen
            game={game}
            onEvent={onX01Event}
            onUndo={onUndo}
            onBack={() => setRoute({ name: 'home' })}
            onAbandon={abandon}
            onRematch={rematch}
            onDone={done}
          />
        );
      } else {
        screen = (
          <CricketGameScreen
            game={game as CricketGame}
            onEvent={onCricketEvent}
            onUndo={onUndo}
            onBack={() => setRoute({ name: 'home' })}
            onAbandon={abandon}
            onRematch={rematch}
            onDone={done}
          />
        );
      }
      break;
    case 'history':
      screen = (
        <HistoryScreen
          history={history}
          onBack={() => setRoute({ name: 'home' })}
          onOpen={(g) => setRoute({ name: 'historyDetail', game: g })}
          onDelete={(id) => updateHistory(history.filter((h) => h.id !== id))}
          onClear={() => updateHistory([])}
        />
      );
      break;
    case 'historyDetail':
      screen = <HistoryDetailScreen game={route.game} onBack={() => setRoute({ name: 'history' })} />;
      break;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {screen}
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
