import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Multiplier, ShanghaiEvent, ShanghaiGame } from '../types';
import { dartLabel, isTeam } from '../game/darts';
import { replayShanghai, shanghaiLabel } from '../game/shanghai';
import { DartKeypad } from '../components/DartKeypad';
import { ShanghaiStatsTable } from '../components/Stats';
import { Chalkboard } from '../components/Chalkboard';
import { Button, Screen } from '../components/ui';
import { keyHeightFor, useLayout } from '../layout';
import { chalk, colors, fonts, radius, spacing } from '../theme';

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

export function ShanghaiGameScreen({
  game,
  onEvent,
  onUndo,
  onBack,
  onAbandon,
  onRematch,
  onDone,
}: {
  game: ShanghaiGame;
  onEvent: (ev: ShanghaiEvent) => void;
  onUndo: () => void;
  onBack: () => void;
  onAbandon: () => void;
  onRematch: () => void;
  onDone: () => void;
}) {
  const { setup } = game;
  const state = useMemo(() => replayShanghai(setup, game.events), [setup, game.events]);
  const [scoreboardH, setScoreboardH] = useState<number | null>(null);

  const p = state.currentPlayer;
  const target = setup.numbers[Math.min(state.round, setup.numbers.length - 1)];

  const { width, height, isWide, twoPane } = useLayout();
  const insets = useSafeAreaInsets();
  const keypadPaneWidth = Math.min(460, Math.max(360, width * 0.45));
  const n = setup.players.length;
  const columns = n <= 3 ? n : 2;
  const compact = n >= 3 && !twoPane;
  const big = isWide && n <= 2;
  const cardRowsList: number[][] = [];
  for (let i = 0; i < n; i += columns) cardRowsList.push(setup.players.map((_, idx) => idx).slice(i, i + columns));
  const estimated = 40 + (n >= 4 ? Math.ceil(n / 2) : 1) * (compact ? 100 : 130) + 60 + 76;
  const reserved = insets.top + insets.bottom + 52 + spacing * 2 + (twoPane ? 0 : (scoreboardH ?? estimated)) + 16;
  const keyHeight = keyHeightFor(height - reserved, 6, 34, isWide ? 72 : 60);

  const onDart = (v: number, m: Multiplier) => onEvent({ t: 'dart', v, m });

  const confirmEnd = () =>
    Alert.alert('End game?', 'This game will be discarded and not saved to history.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'End game', style: 'destructive', onPress: onAbandon },
    ]);

  const scoreboard = (
    <View style={twoPane ? styles.paneLeft : undefined} onLayout={(e) => setScoreboardH(e.nativeEvent.layout.height)}>
      <Chalkboard>
        <View style={styles.cards}>
          {cardRowsList.map((row, r) => (
            <View key={r} style={styles.cardRow}>
              {row.map((i) => {
                const pl = setup.players[i];
                const active = i === p && !state.finished;
                const thisRound = active ? state.turnScore : state.roundScores[i][state.round];
                return (
                  <View key={pl.id} style={[styles.card, active && styles.cardActive, compact && styles.cardCompact]}>
                    <Text style={[styles.name, compact && styles.nameCompact, active && { color: chalk.yellow }]} numberOfLines={1}>
                      {pl.name}
                    </Text>
                    <Text style={[styles.score, compact && styles.scoreCompact, big && styles.scoreBig]}>{state.scores[i]}</Text>
                    {isTeam(pl) ? (
                      <View style={styles.members}>
                        {pl.members!.map((m, mi) => {
                          const up = active && mi === state.sideTurns[i] % pl.members!.length;
                          return (
                            <Text key={mi} style={[styles.member, up && styles.memberUp]} numberOfLines={1}>
                              {up ? '▶ ' : ''}
                              {m}
                            </Text>
                          );
                        })}
                      </View>
                    ) : null}
                    <Text style={styles.sub}>{thisRound === undefined ? ' ' : `this round ${thisRound}`}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.numbers}>
          {setup.numbers.map((num, r) => {
            const done = r < state.round || state.finished;
            const now = r === state.round && !state.finished;
            return (
              <View key={num} style={[styles.numberChip, now && styles.numberChipNow]}>
                <Text style={[styles.numberText, done && styles.numberDone, now && styles.numberNow]}>{shanghaiLabel(num)}</Text>
              </View>
            );
          })}
        </ScrollView>
      </Chalkboard>

      <View style={styles.turn}>
        <View style={styles.turnDarts}>
          {[0, 1, 2].map((i) => {
            const d = state.turnDarts[i];
            return (
              <View key={i} style={[styles.dartSlot, d && styles.dartSlotFilled]}>
                <Text style={styles.dartText}>{d ? dartLabel(d) : '·'}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const keypad = (
    <View style={twoPane ? [styles.paneRight, { width: keypadPaneWidth }] : styles.keypad}>
      <DartKeypad
        numbers={NUMBERS}
        onDart={onDart}
        onUndo={onUndo}
        canUndo={game.events.length > 0}
        keyHeight={keyHeight}
        onEndTurn={() => onEvent({ t: 'endTurn' })}
        highlight={state.finished ? undefined : target}
      />
    </View>
  );

  const winnerName = state.winner !== null ? setup.players[state.winner].name : '';
  const title = state.tied.length
    ? `Tie: ${state.tied.map((i) => setup.players[i].name).join(' & ')}`
    : state.shanghai
      ? `🎉 Shanghai on ${shanghaiLabel(state.shanghai.target)}s! ${winnerName} wins!`
      : `🏆 ${winnerName} wins!`;

  return (
    <Screen title="Shanghai" onBack={onBack} right={<Button title="End" variant="ghost" small onPress={confirmEnd} />} fullWidth={twoPane}>
      {twoPane ? (
        <View style={styles.panes}>
          {scoreboard}
          {keypad}
        </View>
      ) : (
        <>
          {scoreboard}
          {keypad}
        </>
      )}

      <Modal visible={state.finished} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <ShanghaiStatsTable state={state} />
            <View style={{ height: 12 }} />
            <Button title="Rematch" onPress={onRematch} />
            <View style={{ height: 8 }} />
            <Button title="Done" variant="secondary" onPress={onDone} />
            <Button title="Undo last entry" variant="ghost" onPress={onUndo} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panes: { flex: 1, flexDirection: 'row', gap: spacing },
  paneLeft: { flex: 1 },
  paneRight: { justifyContent: 'flex-end' },
  keypad: { flex: 1, justifyContent: 'flex-end' },
  cards: { gap: 8, padding: 8, paddingBottom: 4 },
  cardRow: { flexDirection: 'row', gap: 8 },
  card: { flex: 1, borderRadius: 6, padding: 10, borderWidth: 1.5, borderColor: chalk.line },
  cardActive: { backgroundColor: chalk.highlight, borderColor: chalk.yellow },
  cardCompact: { padding: 8 },
  name: { color: chalk.white, fontSize: 18, fontFamily: fonts.chalkHand },
  nameCompact: { fontSize: 15 },
  score: { color: chalk.white, fontSize: 50, fontFamily: fonts.chalk, lineHeight: 58 },
  scoreCompact: { fontSize: 36, lineHeight: 42 },
  scoreBig: { fontSize: 76, lineHeight: 84 },
  sub: { color: chalk.dim, fontSize: 14, fontFamily: fonts.chalkHand },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 2 },
  member: { color: chalk.dim, fontSize: 14, fontFamily: fonts.chalkHand },
  memberUp: { color: chalk.yellow },
  numbers: { flexDirection: 'row', gap: 6, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
  numberChip: { minWidth: 36, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignItems: 'center' },
  numberChipNow: { backgroundColor: chalk.highlight, borderWidth: 1.5, borderColor: chalk.yellow },
  numberText: { color: chalk.white, fontSize: 20, fontFamily: fonts.chalk },
  numberDone: { color: chalk.dim, textDecorationLine: 'line-through' },
  numberNow: { color: chalk.yellow },
  turn: { marginTop: 10, marginBottom: 6 },
  turnDarts: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dartSlot: { width: 64, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dartSlotFilled: { backgroundColor: colors.card, borderColor: colors.accent },
  dartText: { color: colors.text, fontSize: 18, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 8 },
  sheetTitle: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
});
