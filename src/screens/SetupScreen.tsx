import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CricketScoring, GameSetup, Player } from '../types';
import { isTeam, newId } from '../game/darts';
import { Button, Chip, Label, Screen, Segmented } from '../components/ui';
import { colors, radius } from '../theme';

type GameType = 301 | 501 | 701 | 'cricket';

type Editing = { name: string; where: 'game' | 'recent' };

export function SetupScreen({
  recentPlayers,
  onRecentPlayersChange,
  onBack,
  onStart,
  initial,
}: {
  recentPlayers: string[];
  onRecentPlayersChange: (names: string[]) => void;
  onBack: () => void;
  onStart: (setup: GameSetup) => void;
  initial?: GameSetup;
}) {
  const [type, setType] = useState<GameType>(
    initial?.kind === 'cricket' ? 'cricket' : ((initial?.startScore as GameType | undefined) ?? 501),
  );
  const [doubleOut, setDoubleOut] = useState(initial?.kind === 'x01' ? initial.doubleOut : true);
  const [legsToWin, setLegsToWin] = useState(initial?.kind === 'x01' ? initial.legsToWin : 1);
  const [cricketScoring, setCricketScoring] = useState<CricketScoring>(
    initial?.kind === 'cricket' ? (initial.scoring ?? 'points') : 'points',
  );
  const [doubles, setDoubles] = useState(initial?.players.some(isTeam) ?? false);
  // Individual people, in order. In doubles they are paired up: 1 & 2, 3 & 4, ...
  const [people, setPeople] = useState<string[]>(
    initial?.players.flatMap((p) => (p.members?.length ? p.members : [p.name])) ?? [],
  );
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Editing | null>(null);
  const [editName, setEditName] = useState('');

  const openEditor = (target: Editing) => {
    setEditing(target);
    setEditName(target.name);
  };

  /** Rename everywhere the name appears: fixing a spelling in the game fixes the remembered name too. */
  const applyRename = () => {
    if (!editing) return;
    const next = editName.trim();
    if (!next || next === editing.name) {
      setEditing(null);
      return;
    }
    setPeople(people.map((n) => (n === editing.name ? next : n)));
    if (recentPlayers.includes(editing.name)) {
      onRecentPlayersChange(recentPlayers.map((n) => (n === editing.name ? next : n)));
    }
    setEditing(null);
  };

  const applyDelete = () => {
    if (!editing) return;
    if (editing.where === 'game') setPeople(people.filter((n) => n !== editing.name));
    else onRecentPlayersChange(recentPlayers.filter((n) => n !== editing.name));
    setEditing(null);
  };

  const players: Player[] = doubles
    ? Array.from({ length: Math.floor(people.length / 2) }, (_, i) => {
        const members = people.slice(i * 2, i * 2 + 2);
        return { id: `team${i}`, name: members.join(' & '), members };
      })
    : people.map((n, i) => ({ id: `p${i}`, name: n }));
  const unpaired = doubles && people.length % 2 === 1 ? people[people.length - 1] : null;

  const addPlayer = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!people.some((n) => n.toLowerCase() === trimmed.toLowerCase())) setPeople([...people, trimmed]);
    setName('');
  };

  const canStart = players.length > 0 && unpaired === null;

  const start = () => {
    if (!canStart) return;
    const withIds = players.map((p) => ({ ...p, id: newId() }));
    if (type === 'cricket') onStart({ kind: 'cricket', players: withIds, scoring: cricketScoring });
    else onStart({ kind: 'x01', startScore: type, doubleOut, legsToWin, players: withIds });
  };

  const suggestions = recentPlayers.filter((n) => !people.includes(n));

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
        {type === 'cricket' ? (
          <>
            <Label>Scoring</Label>
            <Segmented
              options={[
                { label: 'Points', value: 'points' as CricketScoring },
                { label: 'No points', value: 'closeOnly' as CricketScoring },
                { label: 'Cut-throat', value: 'cutThroat' as CricketScoring },
              ]}
              value={cricketScoring}
              onChange={setCricketScoring}
            />
            <Text style={styles.hint}>
              {cricketScoring === 'points'
                ? 'Once you have closed a number, further hits on it score points while an opponent still has it open. Close everything with the most points to win.'
                : cricketScoring === 'closeOnly'
                  ? 'First to close every number wins. Extra hits on a closed number do nothing.'
                  : 'Hits on a number you have closed give points to every opponent who still has it open. Close everything with the lowest score to win.'}
            </Text>
          </>
        ) : (
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
        )}

        <Label>Format</Label>
        <Segmented
          options={[
            { label: 'Singles', value: 'singles' },
            { label: 'Doubles (teams of 2)', value: 'doubles' },
          ]}
          value={doubles ? 'doubles' : 'singles'}
          onChange={(v) => setDoubles(v === 'doubles')}
        />

        <Label>Players</Label>
        {doubles ? <Text style={styles.hint}>Players are paired in the order added: 1 & 2 form Team 1, 3 & 4 form Team 2, and so on. Teammates alternate throws.</Text> : null}
        {people.map((n, i) => (
          <View key={`${n}-${i}`}>
            {doubles && i % 2 === 0 ? <Text style={styles.teamHeading}>Team {i / 2 + 1}</Text> : null}
            <Pressable
              onLongPress={() => openEditor({ name: n, where: 'game' })}
              style={({ pressed }) => [styles.playerRow, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.playerIndex}>{i + 1}</Text>
              <Text style={styles.playerName}>{n}</Text>
              <Pressable onPress={() => setPeople(people.filter((_, j) => j !== i))} hitSlop={10}>
                <Text style={styles.remove}>✕</Text>
              </Pressable>
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
              <Chip key={n} label={`+ ${n}`} onPress={() => addPlayer(n)} onLongPress={() => openEditor({ name: n, where: 'recent' })} />
            ))}
          </View>
        ) : null}
        {people.length === 0 ? <Text style={styles.hint}>Add at least one player to start.</Text> : null}
        {people.length || suggestions.length ? <Text style={styles.hint}>Long-press a name to fix its spelling or delete it.</Text> : null}
        {unpaired ? <Text style={styles.hint}>{unpaired} needs a teammate. Add one more player or remove them.</Text> : null}
        <View style={{ height: 24 }} />
        <Button title="Start game" onPress={start} disabled={!canStart} />
      </ScrollView>

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Edit player</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.input}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={applyRename}
              placeholder="Name"
              placeholderTextColor={colors.muted}
            />
            <Button title="Save" onPress={applyRename} disabled={!editName.trim()} />
            <Button
              title={editing?.where === 'game' ? 'Remove from this game' : 'Forget this name'}
              variant="danger"
              onPress={applyDelete}
            />
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(null)} />
          </View>
        </View>
      </Modal>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: colors.card, borderRadius: radius, padding: 16, gap: 10 },
  sheetTitle: { color: colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  hint: { color: colors.muted, marginTop: 12, marginBottom: 8, lineHeight: 20 },
  teamHeading: { color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 6, marginBottom: 4 },
});
