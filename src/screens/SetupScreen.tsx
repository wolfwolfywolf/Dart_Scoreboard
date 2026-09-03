import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { GameSetup, Player } from '../types';
import { newId } from '../game/darts';
import { Button, Chip, Label, Screen, Segmented } from '../components/ui';
import { colors, radius } from '../theme';

type GameType = 301 | 501 | 701 | 'cricket';

export function SetupScreen({
  recentPlayers,
  onBack,
  onStart,
  initial,
}: {
  recentPlayers: string[];
  onBack: () => void;
  onStart: (setup: GameSetup) => void;
  initial?: GameSetup;
}) {
  const [type, setType] = useState<GameType>(
    initial?.kind === 'cricket' ? 'cricket' : ((initial?.startScore as GameType | undefined) ?? 501),
  );
  const [doubleOut, setDoubleOut] = useState(initial?.kind === 'x01' ? initial.doubleOut : true);
  const [legsToWin, setLegsToWin] = useState(initial?.kind === 'x01' ? initial.legsToWin : 1);
  const [players, setPlayers] = useState<Player[]>(initial?.players ?? []);
  const [name, setName] = useState('');

  const addPlayer = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setName('');
      return;
    }
    setPlayers([...players, { id: newId(), name: trimmed }]);
    setName('');
  };

  const start = () => {
    if (players.length === 0) return;
    if (type === 'cricket') onStart({ kind: 'cricket', players });
    else onStart({ kind: 'x01', startScore: type, doubleOut, legsToWin, players });
  };

  const suggestions = recentPlayers.filter((n) => !players.some((p) => p.name === n));

  return (
    <Screen title="New game" onBack={onBack} scroll>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Label>Game</Label>
        <Segmented
          options={[
            { label: '301', value: 301 as GameType },
            { label: '501', value: 501 as GameType },
            { label: '701', value: 701 as GameType },
            { label: 'Cricket', value: 'cricket' as GameType },
          ]}
          value={type}
          onChange={setType}
        />
        {type !== 'cricket' ? (
          <>
            <Label>Finish</Label>
            <Segmented
              options={[
                { label: 'Double out', value: 'double' },
                { label: 'Straight out', value: 'straight' },
              ]}
              value={doubleOut ? 'double' : 'straight'}
              onChange={(v) => setDoubleOut(v === 'double')}
            />
            <Label>First to</Label>
            <Segmented
              options={[1, 2, 3, 5].map((n) => ({ label: n === 1 ? '1 leg' : `${n} legs`, value: n }))}
              value={legsToWin}
              onChange={setLegsToWin}
            />
          </>
        ) : null}

        <Label>Players</Label>
        {players.map((p, i) => (
          <View key={p.id} style={styles.playerRow}>
            <Text style={styles.playerIndex}>{i + 1}</Text>
            <Text style={styles.playerName}>{p.name}</Text>
            <Pressable onPress={() => setPlayers(players.filter((x) => x.id !== p.id))} hitSlop={10}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Player name"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={() => addPlayer(name)}
            submitBehavior="submit"
            autoCapitalize="words"
          />
          <Button title="Add" onPress={() => addPlayer(name)} small disabled={!name.trim()} />
        </View>
        {suggestions.length ? (
          <View style={styles.chips}>
            {suggestions.map((n) => (
              <Chip key={n} label={`+ ${n}`} onPress={() => addPlayer(n)} />
            ))}
          </View>
        ) : null}
        {players.length === 0 ? <Text style={styles.hint}>Add at least one player to start.</Text> : null}
        <View style={{ height: 24 }} />
        <Button title="Start game" onPress={start} disabled={players.length === 0} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, paddingBottom: 40 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 12,
  },
  playerIndex: { color: colors.muted, width: 20, fontWeight: '700' },
  playerName: { color: colors.text, flex: 1, fontSize: 17, fontWeight: '600' },
  remove: { color: colors.danger, fontSize: 18, fontWeight: '700' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  hint: { color: colors.muted, marginTop: 12 },
});
