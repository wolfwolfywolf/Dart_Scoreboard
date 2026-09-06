import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Key } from './DartKeypad';

const QUICK = [26, 41, 45, 60, 81, 85, 100, 140, 180];

/** Whole-turn entry: type the three-dart total (or tap a common score) and press Enter. */
export function TotalKeypad({
  onTotal,
  onUndo,
  canUndo,
  error,
  keyHeight,
}: {
  onTotal: (total: number) => boolean;
  onUndo: () => void;
  canUndo: boolean;
  error: string | null;
  keyHeight?: number;
}) {
  const [entry, setEntry] = useState('');

  const submit = (value: number) => {
    if (onTotal(value)) setEntry('');
  };

  const type = (digit: string) => {
    const next = (entry + digit).replace(/^0+(?=\d)/, '');
    if (Number(next) <= 180) setEntry(next);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.display}>
        <Text style={styles.entry}>{entry === '' ? ' ' : entry}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.row}>
        {QUICK.map((q) => (
          <Key key={q} label={String(q)} onPress={() => submit(q)} dim height={keyHeight} />
        ))}
      </View>
      {[
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
      ].map((row) => (
        <View style={styles.row} key={row[0]}>
          {row.map((k) => (
            <Key key={k} label={k} onPress={() => type(k)} big height={keyHeight} />
          ))}
        </View>
      ))}
      <View style={styles.row}>
        <Key label="⌫" onPress={() => setEntry(entry.slice(0, -1))} big dim height={keyHeight} />
        <Key label="0" onPress={() => type('0')} big height={keyHeight} />
        <Key label="Enter" onPress={() => submit(entry === '' ? 0 : Number(entry))} big color={colors.accent} height={keyHeight} />
      </View>
      <View style={styles.row}>
        <Key label="Bust (0)" onPress={() => submit(0)} dim height={keyHeight} />
        <Key label="Undo" onPress={onUndo} dim disabled={!canUndo} height={keyHeight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  display: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
  },
  entry: { color: colors.text, fontSize: 30, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 13, marginTop: 2 },
});
