import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Game } from '../types';
import { Button, Screen } from '../components/ui';
import { colors, fonts } from '../theme';

export function describeGame(game: Game): string {
  const names = game.setup.players.map((p) => p.name).join(' · ');
  const type = game.setup.kind === 'x01' ? String(game.setup.startScore) : game.setup.kind === 'shanghai' ? 'Shanghai' : 'Cricket';
  return `${type}  —  ${names}`;
}

export function HomeScreen({
  current,
  onResume,
  onNewGame,
  onHistory,
}: {
  current: Game | null;
  onResume: () => void;
  onNewGame: () => void;
  onHistory: () => void;
}) {
  return (
    <Screen title="">
      <View style={styles.hero}>
        <Text style={styles.logo}>🎯</Text>
        <Text style={styles.title}>Dart Scoreboard</Text>
        <Text style={styles.credit}>Created by WolfysPub.com</Text>
        <Text style={styles.subtitle}>501 · 301 · 701 · Cricket · Shanghai</Text>
      </View>
      <View style={styles.actions}>
        {current ? (
          <View>
            <Button title="Resume game" onPress={onResume} />
            <Text style={styles.resumeHint}>{describeGame(current)}</Text>
          </View>
        ) : null}
        <Button title="New game" onPress={onNewGame} variant={current ? 'secondary' : 'primary'} />
        <Button title="History & stats" onPress={onHistory} variant="secondary" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 72 },
  title: { color: colors.text, fontSize: 40, fontFamily: fonts.chalk, marginTop: 12 },
  credit: { color: colors.muted, fontSize: 16, marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 16, marginTop: 6 },
  actions: { gap: 12, paddingBottom: 12 },
  resumeHint: { color: colors.muted, textAlign: 'center', marginTop: 6, fontSize: 14 },
});
