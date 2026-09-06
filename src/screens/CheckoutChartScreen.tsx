import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { CHART_MAX, CHECKOUT_CHART } from '../game/checkoutChart';
import { Button, Screen } from '../components/ui';
import { colors, radius } from '../theme';

/** The standard double-out chart, 170 down to 2, with the current score highlighted. */
export function CheckoutChartScreen({ highlight, onClose }: { highlight: number | null; onClose: () => void }) {
  const rows = useMemo(() => {
    const out: { score: number; route: string | null }[] = [];
    for (let n = CHART_MAX; n >= 2; n--) out.push({ score: n, route: CHECKOUT_CHART[n] ?? null });
    return out;
  }, []);

  const yours = highlight !== null && highlight >= 2 && highlight <= CHART_MAX ? CHECKOUT_CHART[highlight] ?? null : null;

  return (
    <Screen title="Double out chart" right={<Button title="Close" variant="ghost" small onPress={onClose} />}>
      {highlight !== null && highlight > 1 ? (
        <View style={styles.yours}>
          <Text style={styles.yoursLabel}>You need {highlight}</Text>
          <Text style={styles.yoursRoute}>{yours ?? (highlight > CHART_MAX ? 'Not on the chart yet' : 'No three-dart finish')}</Text>
        </View>
      ) : null}
      <FlatList
        data={rows}
        numColumns={2}
        keyExtractor={(r) => String(r.score)}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const isYours = item.score === highlight;
          return (
            <View style={[styles.row, isYours && styles.rowYours, !item.route && styles.rowBogey]}>
              <Text style={[styles.score, isYours && { color: colors.accentText }]}>{item.score}</Text>
              <Text style={[styles.route, isYours && { color: colors.accentText }, !item.route && { color: colors.muted }]} numberOfLines={1}>
                {item.route ?? 'no out'}
              </Text>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  yours: {
    backgroundColor: colors.cardActive,
    borderRadius: radius,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yoursLabel: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  yoursRoute: { color: colors.text, fontSize: 20, fontWeight: '800' },
  columns: { gap: 8, marginBottom: 6 },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 8,
  },
  rowYours: { backgroundColor: colors.accent },
  rowBogey: { opacity: 0.5 },
  score: { color: colors.muted, fontWeight: '800', width: 34, fontSize: 15, fontVariant: ['tabular-nums'] },
  route: { color: colors.text, fontWeight: '600', fontSize: 15, flex: 1 },
});
