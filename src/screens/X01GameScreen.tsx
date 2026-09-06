import React, { useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Multiplier, X01Event, X01Game } from '../types';
import { continuedRoute, findCheckout, findCheckouts, formatRoute } from '../game/checkout';
import { dartLabel, isTeam } from '../game/darts';
import { possibleFinishDartCounts, replayX01, threeDartAverage } from '../game/x01';
import { DartKeypad } from '../components/DartKeypad';
import { TotalKeypad } from '../components/TotalKeypad';
import { X01StatsTable } from '../components/Stats';
import { Button, Screen, Segmented } from '../components/ui';
import { CheckoutChartScreen } from './CheckoutChartScreen';
import { keyHeightFor, useLayout } from '../layout';
import { chalk, colors, fonts, radius, spacing } from '../theme';
import { Chalkboard } from '../components/Chalkboard';

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

export function X01GameScreen({
  game,
  onEvent,
  onUndo,
  onBack,
  onAbandon,
  onRematch,
  onDone,
}: {
  game: X01Game;
  onEvent: (ev: X01Event) => void;
  onUndo: () => void;
  onBack: () => void;
  onAbandon: () => void;
  onRematch: () => void;
  onDone: () => void;
}) {
  const { setup } = game;
  const state = useMemo(() => replayX01(setup, game.events), [setup, game.events]);
  const [mode, setMode] = useState<'dart' | 'total'>('dart');
  const [error, setError] = useState<string | null>(null);
  const [pendingFinish, setPendingFinish] = useState<{ total: number; counts: number[] } | null>(null);
  const [showChart, setShowChart] = useState(false);
  // Measured heights of the parts above the keypad, so key size is worked out from real space.
  const [scoreboardH, setScoreboardH] = useState<number | null>(null);
  const [modeRowH, setModeRowH] = useState(90);

  const p = state.currentPlayer;
  const remaining = state.scores[p];
  const dartsLeft = 3 - state.turnDarts.length;
  // Keep following the route suggested at the start of the turn while the darts match it;
  // otherwise suggest afresh for the new score with the darts that are left.
  const plan = continuedRoute(state.turnStartScore, state.turnDarts, setup.doubleOut);
  const options = findCheckouts(remaining, dartsLeft, setup.doubleOut, 3);
  const checkout = plan ?? options[0] ?? null;
  const alternatives = options.filter((r) => formatRoute(r) !== (checkout ? formatRoute(checkout) : '')).slice(0, 2);
  const lastTurn = state.turns.length ? state.turns[state.turns.length - 1] : null;
  const canUndo = game.events.length > 0;

  // On tablets (or a phone held sideways) the scoreboard sits beside the keypad
  // instead of above it. The keypad pane keeps a comfortable fixed width.
  const { width, height, isWide, twoPane } = useLayout();
  const keypadPaneWidth = Math.min(460, Math.max(360, width * 0.45));

  // Scoreboard: 1–2 players side by side, 3 squeezed into one row, 4+ in rows of two.
  // Cards are laid out as explicit rows that share their width by flex, so no
  // width arithmetic (and no chance of a card wrapping onto its own row).
  const n = setup.players.length;
  const columns = n <= 3 ? n : 2;
  const compact = n >= 3 && !twoPane;
  const big = isWide && n <= 2;
  const cardRowsList: number[][] = [];
  for (let i = 0; i < n; i += columns) cardRowsList.push(setup.players.map((_, idx) => idx).slice(i, i + columns));

  // Keypad keys grow on big screens and shrink so everything still fits on small ones.
  // Everything that isn't keypad: safe areas, header, padding, the scoreboard (measured,
  // with an estimate until the first layout), the mode row and gaps.
  const insets = useSafeAreaInsets();
  const keypadRows = mode === 'dart' ? 6 : 7;
  const cardRows = n >= 4 ? Math.ceil(n / 2) : 1;
  const estimatedScoreboard = 40 + cardRows * (compact ? 100 : big ? 160 : 130) + 76;
  const scoreboardSpace = twoPane ? 0 : (scoreboardH ?? estimatedScoreboard);
  const reserved = insets.top + insets.bottom + 52 + spacing * 2 + scoreboardSpace + modeRowH + 16;
  const keyHeight = keyHeightFor(height - reserved, keypadRows, 34, isWide ? 72 : 60);

  const onDart = (v: number, m: Multiplier) => onEvent({ t: 'dart', v, m });

  const onTotal = (total: number): boolean => {
    setError(null);
    if (total > remaining) {
      setError(`Only ${remaining} left — that's a bust. Use Bust (0).`);
      return false;
    }
    if (total === remaining) {
      const counts = possibleFinishDartCounts(total, dartsLeft, setup.doubleOut);
      if (counts.length === 0) {
        setError(`${total} isn't a possible checkout.`);
        return false;
      }
      if (counts.length === 1) {
        onEvent({ t: 'total', total, darts: counts[0] });
      } else {
        setPendingFinish({ total, counts });
      }
      return true;
    }
    onEvent({ t: 'total', total });
    return true;
  };

  const confirmEnd = () =>
    Alert.alert('End game?', 'This game will be discarded and not saved to history.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'End game', style: 'destructive', onPress: onAbandon },
    ]);

  const title = `${setup.startScore}${setup.legsToWin > 1 ? ` · Leg ${state.leg + 1}` : ''}`;

  if (showChart) {
    return (
      <CheckoutChartScreen
        highlight={state.finished ? null : remaining}
        dartsLeft={dartsLeft}
        plan={checkout ? formatRoute(checkout) : null}
        onClose={() => setShowChart(false)}
      />
    );
  }

  const scoreboard = (
    <View style={twoPane ? styles.paneLeft : undefined} onLayout={(e) => setScoreboardH(e.nativeEvent.layout.height)}>
      <Chalkboard>
      <View style={styles.cards}>
        {cardRowsList.map((row, r) => (
        <View key={r} style={styles.cardRow}>
        {row.map((i) => {
          const pl = setup.players[i];
          const active = i === p && !state.finished;
          return (
            <View
              key={pl.id}
              style={[styles.card, active && styles.cardActive, compact && styles.cardCompact]}
            >
              <View style={styles.cardHead}>
                <Text style={[styles.name, compact && styles.nameCompact, active && { color: chalk.yellow }]} numberOfLines={1}>
                  {pl.name}
                </Text>
                {setup.legsToWin > 1 ? <Text style={styles.legs}>{state.legsWon[i]} legs</Text> : null}
              </View>
              <Text style={[styles.score, compact && styles.scoreCompact, big && styles.scoreBig]}>{state.scores[i]}</Text>
              {isTeam(pl) ? (
                <View style={styles.members}>
                  {pl.members!.map((m, mi) => {
                    const up = active && mi === state.sideTurns[i] % pl.members!.length;
                    return (
                      <Text key={mi} style={[styles.member, up && styles.memberUp]} numberOfLines={1}>
                        {up ? '▶ ' : ''}{m}
                      </Text>
                    );
                  })}
                </View>
              ) : null}
              <Text style={styles.avg}>avg {threeDartAverage(state.stats[i]).toFixed(1)}</Text>
            </View>
          );
        })}
        </View>
        ))}
      </View>
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
          <Text style={styles.turnSum}>{state.turnStartScore - remaining}</Text>
        </View>
        <Text style={styles.info} numberOfLines={1}>
          {lastTurn ? describeTurn(lastTurn.scored, lastTurn.bust, lastTurn.thrower) : `${state.thrower} to throw`}
        </Text>
      </View>
    </View>
  );

  const entry = (
    <View style={twoPane ? [styles.paneRight, { width: keypadPaneWidth }] : styles.entryStacked}>
      <View style={styles.modeRow} onLayout={(e) => setModeRowH(e.nativeEvent.layout.height)}>
        <View style={twoPane ? styles.modeRowInline : styles.modeRowStacked}>
          <View style={twoPane ? { flex: 1 } : undefined}>
            <Segmented
              options={[
                { label: 'Per dart', value: 'dart' },
                { label: 'Turn total', value: 'total' },
              ]}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setError(null);
              }}
            />
          </View>
          {setup.doubleOut ? (
            <Button
              title={twoPane ? 'Outs chart' : 'Double out chart'}
              variant="secondary"
              small
              onPress={() => setShowChart(true)}
              style={[styles.chartButton, twoPane && styles.chartButtonInline]}
            />
          ) : null}
        </View>
        {!state.finished && remaining <= 170 ? (
          <View>
            <Text style={[styles.checkoutLine, !checkout && styles.checkoutNone]} numberOfLines={1}>
              {checkout
                ? `${remaining} out: ${formatRoute(checkout)}`
                : dartsLeft < 3 && findCheckout(remaining, 3, setup.doubleOut)
                  ? `No out for ${remaining} with ${dartsLeft} dart${dartsLeft === 1 ? '' : 's'} left`
                  : `No out for ${remaining}`}
            </Text>
            {alternatives.length ? (
              <Text style={styles.checkoutAlt} numberOfLines={1}>
                or {alternatives.map(formatRoute).join('   ·   ')}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.keypad}>
        {mode === 'dart' ? (
          <DartKeypad numbers={NUMBERS} onDart={onDart} onUndo={onUndo} canUndo={canUndo} keyHeight={keyHeight} />
        ) : (
          <TotalKeypad onTotal={onTotal} onUndo={onUndo} canUndo={canUndo} error={error} keyHeight={keyHeight} />
        )}
      </View>
    </View>
  );

  return (
    <Screen title={title} onBack={onBack} right={<Button title="End" variant="ghost" small onPress={confirmEnd} />} fullWidth={twoPane}>
      {twoPane ? (
        <View style={styles.panes}>
          {scoreboard}
          {entry}
        </View>
      ) : (
        <>
          {scoreboard}
          {entry}
        </>
      )}

      <Modal visible={pendingFinish !== null} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Checkout {pendingFinish?.total}!</Text>
            <Text style={styles.sheetText}>How many darts did it take?</Text>
            <View style={styles.sheetButtons}>
              {pendingFinish?.counts.map((c) => (
                <Button
                  key={c}
                  title={`${c} dart${c > 1 ? 's' : ''}`}
                  style={{ flex: 1 }}
                  onPress={() => {
                    onEvent({ t: 'total', total: pendingFinish.total, darts: c });
                    setPendingFinish(null);
                  }}
                />
              ))}
            </View>
            <Button title="Cancel" variant="ghost" onPress={() => setPendingFinish(null)} />
          </View>
        </View>
      </Modal>

      <Modal visible={state.finished} transparent animationType="slide">
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>🏆 {state.winner !== null ? setup.players[state.winner].name : ''} wins!</Text>
            <X01StatsTable state={state} />
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

function describeTurn(scored: number, bust: boolean, name: string): string {
  if (bust) return `${name}: bust`;
  return `${name} scored ${scored}`;
}

const styles = StyleSheet.create({
  panes: { flex: 1, flexDirection: 'row', gap: spacing },
  paneLeft: { flex: 1 },
  paneRight: { justifyContent: 'flex-end' },
  entryStacked: { flex: 1 },
  cards: { gap: 8, padding: 8 },
  cardRow: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1.5,
    borderColor: chalk.line,
  },
  cardActive: { backgroundColor: chalk.highlight, borderColor: chalk.yellow },
  cardCompact: { padding: 8 },
  nameCompact: { fontSize: 15 },
  scoreCompact: { fontSize: 36, lineHeight: 42 },
  scoreBig: { fontSize: 76, lineHeight: 84 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: chalk.white, fontSize: 18, fontFamily: fonts.chalkHand, flex: 1 },
  legs: { color: chalk.dim, fontSize: 13, fontFamily: fonts.chalkHand, marginLeft: 6 },
  score: { color: chalk.white, fontSize: 50, fontFamily: fonts.chalk, lineHeight: 58 },
  avg: { color: chalk.dim, fontSize: 14, fontFamily: fonts.chalkHand },
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 2 },
  member: { color: chalk.dim, fontSize: 14, fontFamily: fonts.chalkHand },
  memberUp: { color: chalk.yellow },
  turn: { marginTop: 10, gap: 6 },
  turnDarts: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  turnSum: { color: colors.muted, fontSize: 22, fontWeight: '800', marginLeft: 'auto', fontVariant: ['tabular-nums'] },
  info: { color: colors.accent, fontSize: 16, fontWeight: '600', minHeight: 20 },
  modeRow: { marginVertical: 8, gap: 6 },
  modeRowStacked: { gap: 8 },
  modeRowInline: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  chartButton: { paddingVertical: 8 },
  chartButtonInline: { paddingVertical: 0, justifyContent: 'center' },
  checkoutLine: { color: colors.accent, fontSize: 17, fontWeight: '700', textAlign: 'center', paddingVertical: 2 },
  checkoutNone: { color: colors.muted, fontWeight: '500' },
  checkoutAlt: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingBottom: 2 },
  keypad: { flex: 1, justifyContent: 'flex-end', flexGrow: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 8 },
  sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  sheetText: { color: colors.muted, textAlign: 'center', fontSize: 15 },
  sheetButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
