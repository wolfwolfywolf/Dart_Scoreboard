import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Game } from '../types';
import { replayCricket } from '../game/cricket';
import { dartLabel } from '../game/darts';
import { isX01Game } from '../game/replay';
import { replayX01 } from '../game/x01';
import { CricketStatsTable, X01StatsTable } from '../components/Stats';
import { Label, Screen } from '../components/ui';
import { colors, radius } from '../theme';

export function HistoryDetailScreen({ game, onBack }: { game: Game; onBack: () => void }) {
  const content = useMemo(() => {
    if (isX01Game(game)) {
      const st = replayX01(game.setup, game.events);
      const legs = game.setup.legsToWin;
      return {
        title: `${game.setup.startScore}`,
        table: <X01StatsTable state={st} />,
        turns: st.turns.map((t, i) => ({
          key: String(i),
          left: `${legs > 1 ? `L${t.leg + 1} · ` : ''}${game.setup.players[t.player].name}`,
          middle: t.darts.length ? t.darts.map(dartLabel).join('  ') : 'total',
          right: t.bust ? 'BUST' : t.finished ? `${t.scored} ✓` : String(t.scored),
          highlight: t.finished,
          bad: t.bust,
        })),
      };
    }
    const st = replayCricket(game.setup, game.events);
    return {
      title: 'Cricket',
      table: <CricketStatsTable state={st} />,
      turns: st.turns.map((t, i) => ({
        key: String(i),
        left: game.setup.players[t.player].name,
        middle: t.darts.map(dartLabel).join('  '),
        right: `${t.marksScored} marks${t.pointsScored ? ` · +${t.pointsScored}` : ''}`,
        highlight: false,
        bad: false,
      })),
    };
  }, [game]);

  return (
    <Screen title={content.title} onBack={onBack} scroll>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{new Date(game.finishedAt ?? game.startedAt).toLocaleString()}</Text>
        <View style={styles.card}>{content.table}</View>
        <Label>Turns</Label>
        {content.turns.map((t) => (
          <View key={t.key} style={styles.turn}>
            <Text style={styles.turnLeft} numberOfLines={1}>
              {t.left}
            </Text>
            <Text style={styles.turnMiddle} numberOfLines={1}>
              {t.middle}
            </Text>
            <Text style={[styles.turnRight, t.highlight && { color: colors.accent }, t.bad && { color: colors.danger }]}>{t.right}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, paddingBottom: 40 },
  date: { color: colors.muted, marginBottom: 10 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 8 },
  turn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
  turnLeft: { color: colors.text, fontWeight: '700', width: 110 },
  turnMiddle: { color: colors.muted, flex: 1 },
  turnRight: { color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
