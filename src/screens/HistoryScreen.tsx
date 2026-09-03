import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Game } from '../types';
import { gameWinner } from '../game/replay';
import { Button, Screen } from '../components/ui';
import { colors, radius } from '../theme';

export function winnerName(game: Game): string | null {
  const w = gameWinner(game);
  return w === null ? null : game.setup.players[w].name;
}

export function HistoryScreen({
  history,
  onBack,
  onOpen,
  onDelete,
  onClear,
}: {
  history: Game[];
  onBack: () => void;
  onOpen: (game: Game) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const confirmClear = () =>
    Alert.alert('Clear history?', 'All saved games will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: onClear },
    ]);

  return (
    <Screen
      title="History"
      onBack={onBack}
      right={history.length ? <Button title="Clear" variant="ghost" small onPress={confirmClear} /> : null}
    >
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No finished games yet.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(g) => g.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const winner = winnerName(item);
            const type = item.setup.kind === 'x01' ? `${item.setup.startScore}${item.setup.legsToWin > 1 ? ` · first to ${item.setup.legsToWin}` : ''}` : 'Cricket';
            return (
              <Pressable
                onPress={() => onOpen(item)}
                onLongPress={() =>
                  Alert.alert('Delete game?', undefined, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
                  ])
                }
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{type}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    {item.setup.players.map((p) => p.name).join(' · ')}
                  </Text>
                  <Text style={styles.itemDate}>{new Date(item.finishedAt ?? item.startedAt).toLocaleString()}</Text>
                </View>
                <Text style={styles.winner}>🏆 {winner ?? '–'}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.muted, fontSize: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    gap: 10,
  },
  itemTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  itemSub: { color: colors.muted, marginTop: 2 },
  itemDate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  winner: { color: colors.accent, fontWeight: '700', fontSize: 15 },
});
