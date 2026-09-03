import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { type CricketState, marksPerRound } from '../game/cricket';
import { type X01State, threeDartAverage } from '../game/x01';
import { colors } from '../theme';

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.row}>
          {headers.map((h, i) => (
            <Text key={i} style={[styles.cell, styles.head, i === 0 && styles.first]}>
              {h}
            </Text>
          ))}
        </View>
        {rows.map((r, ri) => (
          <View key={ri} style={[styles.row, ri % 2 === 1 && styles.alt]}>
            {r.map((c, i) => (
              <Text key={i} style={[styles.cell, i === 0 && styles.first]} numberOfLines={1}>
                {c}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export function X01StatsTable({ state }: { state: X01State }) {
  const headers = ['Player', 'Avg', '100+', '140+', '180', 'High out', 'Best leg'];
  if (state.setup.legsToWin > 1) headers.splice(1, 0, 'Legs');
  const rows = state.setup.players.map((p, i) => {
    const s = state.stats[i];
    const r: (string | number)[] = [
      p.name + (state.winner === i ? ' 🏆' : ''),
      threeDartAverage(s).toFixed(1),
      s.tons,
      s.ton40s,
      s.oneEighties,
      s.highestCheckout || '–',
      s.bestLeg ?? '–',
    ];
    if (state.setup.legsToWin > 1) r.splice(1, 0, state.legsWon[i]);
    return r;
  });
  return <Table headers={headers} rows={rows} />;
}

export function CricketStatsTable({ state }: { state: CricketState }) {
  const rows = state.setup.players.map((p, i) => [
    p.name + (state.winner === i ? ' 🏆' : ''),
    state.points[i],
    marksPerRound(state.stats[i]).toFixed(2),
    state.stats[i].dartsThrown,
  ]);
  return <Table headers={['Player', 'Points', 'MPR', 'Darts']} rows={rows} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8 },
  alt: { backgroundColor: 'rgba(255,255,255,0.03)' },
  cell: { color: colors.text, width: 64, textAlign: 'right', fontSize: 15, fontVariant: ['tabular-nums'] },
  first: { width: 110, textAlign: 'left', fontWeight: '700' },
  head: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});
