import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { type CricketState, marksPerRound } from '../game/cricket';
import { type X01State, threeDartAverage } from '../game/x01';
import { type ShanghaiState, shanghaiLabel } from '../game/shanghai';
import { colors } from '../theme';

type Row = { cells: (string | number)[]; sub?: boolean };

function Table({ headers, rows }: { headers: string[]; rows: Row[] }) {
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
          <View key={ri} style={[styles.row, r.sub && styles.subRow]}>
            {r.cells.map((c, i) => (
              <Text key={i} style={[styles.cell, i === 0 && styles.first, r.sub && styles.subCell]} numberOfLines={1}>
                {i === 0 && r.sub ? `   ${c}` : c}
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
  const rows: Row[] = [];
  state.setup.players.forEach((p, i) => {
    const s = state.stats[i];
    const cells: (string | number)[] = [
      p.name + (state.winner === i ? ' 🏆' : ''),
      threeDartAverage(s).toFixed(1),
      s.tons,
      s.ton40s,
      s.oneEighties,
      s.highestCheckout || '–',
      s.bestLeg ?? '–',
    ];
    if (state.setup.legsToWin > 1) cells.splice(1, 0, state.legsWon[i]);
    rows.push({ cells });
    if (p.members && p.members.length > 1) {
      p.members.forEach((m, mi) => {
        const cells: (string | number)[] = [m, threeDartAverage(state.memberStats[i][mi]).toFixed(1), '', '', '', '', ''];
        if (state.setup.legsToWin > 1) cells.splice(1, 0, '');
        rows.push({ cells, sub: true });
      });
    }
  });
  return <Table headers={headers} rows={rows} />;
}

export function CricketStatsTable({ state }: { state: CricketState }) {
  const withPoints = (state.setup.scoring ?? 'points') !== 'closeOnly';
  const rows: Row[] = [];
  state.setup.players.forEach((p, i) => {
    const cells: (string | number)[] = [p.name + (state.winner === i ? ' 🏆' : ''), marksPerRound(state.stats[i]).toFixed(2), state.stats[i].dartsThrown];
    if (withPoints) cells.splice(1, 0, state.points[i]);
    rows.push({ cells });
    if (p.members && p.members.length > 1) {
      p.members.forEach((m, mi) => {
        const ms = state.memberStats[i][mi];
        const sub: (string | number)[] = [m, marksPerRound(ms).toFixed(2), ms.dartsThrown];
        if (withPoints) sub.splice(1, 0, '');
        rows.push({ cells: sub, sub: true });
      });
    }
  });
  const headers = withPoints ? ['Player', 'Points', 'MPR', 'Darts'] : ['Player', 'MPR', 'Darts'];
  return <Table headers={headers} rows={rows} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8 },
  subRow: { paddingVertical: 4 },
  subCell: { color: colors.muted, fontWeight: '400', fontSize: 13 },
  cell: { color: colors.text, width: 64, textAlign: 'right', fontSize: 15, fontVariant: ['tabular-nums'] },
  first: { width: 110, textAlign: 'left', fontWeight: '700' },
  head: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});

export function ShanghaiStatsTable({ state }: { state: ShanghaiState }) {
  const headers = ['Player', 'Total', ...state.setup.numbers.map(shanghaiLabel)];
  const rows: Row[] = state.setup.players.map((p, i) => ({
    cells: [
      p.name + (state.winner === i ? ' 🏆' : ''),
      state.scores[i],
      ...state.setup.numbers.map((_, r) => (state.roundScores[i][r] === undefined ? '–' : state.roundScores[i][r])),
    ],
  }));
  return <Table headers={headers} rows={rows} />;
}
