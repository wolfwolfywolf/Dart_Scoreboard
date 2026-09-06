import React, { useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CricketEvent, CricketGame, Multiplier } from '../types';
import { CRICKET_NUMBERS, marksPerRound, replayCricket } from '../game/cricket';
import { dartLabel } from '../game/darts';
import { DartKeypad } from '../components/DartKeypad';
import { CricketStatsTable } from '../components/Stats';
import { Button, Screen } from '../components/ui';
import { keyHeightFor, useLayout } from '../layout';
import { chalk, colors, fonts, radius, spacing } from '../theme';
import { Chalkboard } from '../components/Chalkboard';

const MARK_GLYPH = ['', '/', 'X', 'Ⓧ'];

export function CricketGameScreen({
  game,
  onEvent,
  onUndo,
  onBack,
  onAbandon,
  onRematch,
  onDone,
}: {
  game: CricketGame;
  onEvent: (ev: CricketEvent) => void;
  onUndo: () => void;
  onBack: () => void;
  onAbandon: () => void;
  onRematch: () => void;
  onDone: () => void;
}) {
  const { setup } = game;
  const state = useMemo(() => replayCricket(setup, game.events), [setup, game.events]);
  const p = state.currentPlayer;

  const confirmEnd = () =>
    Alert.alert('End game?', 'This game will be discarded and not saved to history.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'End game', style: 'destructive', onPress: onAbandon },
    ]);

  const onDart = (v: number, m: Multiplier) => onEvent({ t: 'dart', v, m });

  const { width, height, isWide, twoPane } = useLayout();
  const insets = useSafeAreaInsets();
  const [boardH, setBoardH] = useState<number | null>(null);
  const keypadPaneWidth = Math.min(460, Math.max(360, width * 0.45));
  // Side by side: four keypad rows (multiplier + three of keys) centred beside a board
  // that stretches to fill the column. Stacked: the board keeps its natural height and
  // the keys use whatever is left below it.
  const chrome = insets.top + insets.bottom + 52 + spacing * 2 + 16;
  const keyHeight = twoPane
    ? keyHeightFor(height - chrome - 60, 4, 38, 96)
    : keyHeightFor(height - chrome - (boardH ?? 330), 4, 38, isWide ? 72 : 60);
  const tall = twoPane;
  const boardRowHeight = tall ? Math.max(30, (height - 200) / 8) : undefined;
  const markSize = tall ? Math.min(34, Math.max(20, boardRowHeight! * 0.55)) : 22;

  const board = (
    <View style={twoPane ? styles.paneLeft : undefined} onLayout={(e) => setBoardH(e.nativeEvent.layout.height)}>
      <Chalkboard fill={tall}>
      <View style={[styles.board, tall && styles.boardTall]}>
        <View style={styles.row}>
          <View style={styles.numberCell} />
          {setup.players.map((pl, i) => (
            <View key={pl.id} style={[styles.playerCell, i === p && !state.finished && styles.activeCol]}>
              <Text style={[styles.playerName, i === p && { color: chalk.yellow }]} numberOfLines={1}>
                {pl.name}
              </Text>
              <Text style={styles.points}>{state.points[i]}</Text>
              <Text style={styles.mpr}>MPR {marksPerRound(state.stats[i]).toFixed(1)}</Text>
            </View>
          ))}
        </View>
        {CRICKET_NUMBERS.map((n, idx) => {
          const dead = state.marks.every((row) => row[idx] >= 3);
          return (
            <View key={n} style={[styles.row, tall && { flex: 1, alignItems: 'stretch' }]}>
              <View style={[styles.numberCell, tall && { justifyContent: 'center' }]}>
                <Text
                  style={[
                    styles.number,
                    tall && { fontSize: n === 25 ? Math.round(markSize * 0.7) : markSize },
                    dead && { color: chalk.dim, textDecorationLine: 'line-through' },
                  ]}
                  numberOfLines={1}
                >
                  {n === 25 ? 'Bull' : n}
                </Text>
              </View>
              {setup.players.map((pl, i) => (
                <View key={pl.id} style={[styles.markCell, tall && styles.cellTall, i === p && !state.finished && styles.activeCol]}>
                  <Text style={[styles.mark, tall && { fontSize: markSize + 4, minHeight: 0 }, state.marks[i][idx] >= 3 && { color: chalk.yellow }]}>
                    {MARK_GLYPH[Math.min(state.marks[i][idx], 3)]}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
      </Chalkboard>

      <View style={styles.turnDarts}>
        {[0, 1, 2].map((i) => {
          const d = state.turnDarts[i];
          return (
            <View key={i} style={[styles.dartSlot, d && styles.dartSlotFilled]}>
              <Text style={styles.dartText}>{d ? dartLabel(d) : '·'}</Text>
            </View>
          );
        })}
        <Text style={styles.toThrow}>{state.thrower} to throw</Text>
      </View>
    </View>
  );

  const keypad = (
    <View style={twoPane ? [styles.paneRight, { width: keypadPaneWidth, justifyContent: 'center' }] : styles.keypad}>
      <DartKeypad
        numbers={[20, 19, 18, 17, 16, 15]}
        onDart={onDart}
        onUndo={onUndo}
        canUndo={game.events.length > 0}
        keyHeight={keyHeight}
      />
    </View>
  );

  return (
    <Screen title="Cricket" onBack={onBack} right={<Button title="End" variant="ghost" small onPress={confirmEnd} />} fullWidth={twoPane}>
      {twoPane ? (
        <View style={styles.panes}>
          {board}
          {keypad}
        </View>
      ) : (
        <>
          {board}
          {keypad}
        </>
      )}

      <Modal visible={state.finished} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>🏆 {state.winner !== null ? setup.players[state.winner].name : ''} wins!</Text>
            <CricketStatsTable state={state} />
            <View style={{ height: 12 }} />
            <Button title="Rematch" onPress={onRematch} />
            <View style={{ height: 8 }} />
            <Button title="Done" variant="secondary" onPress={onDone} />
            <Button title="Undo last dart" variant="ghost" onPress={onUndo} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  board: { padding: 6 },
  boardTall: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  numberCell: { width: 62, alignItems: 'center', paddingVertical: 4 },
  number: { color: chalk.white, fontSize: 20, fontFamily: fonts.chalk },
  playerCell: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  playerName: { color: chalk.white, fontFamily: fonts.chalkHand, fontSize: 16 },
  points: { color: chalk.white, fontSize: 26, fontFamily: fonts.chalk },
  mpr: { color: chalk.dim, fontSize: 12, fontFamily: fonts.chalkHand },
  markCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  cellTall: { justifyContent: 'center', alignSelf: 'stretch' },
  activeCol: { backgroundColor: chalk.highlight },
  mark: { color: chalk.white, fontSize: 22, fontFamily: fonts.chalkHand, minHeight: 28 },
  turnDarts: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dartSlot: {
    width: 64,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dartSlotFilled: { backgroundColor: colors.card, borderColor: colors.accent },
  dartText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  toThrow: { color: colors.accent, fontWeight: '600', marginLeft: 'auto', fontSize: 15 },
  keypad: { flex: 1, justifyContent: 'flex-end' },
  panes: { flex: 1, flexDirection: 'row', gap: spacing },
  paneLeft: { flex: 1, alignSelf: 'stretch' },
  paneRight: { justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 8 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
});
