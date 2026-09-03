import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Multiplier } from '../types';
import { colors } from '../theme';

/**
 * Per-dart entry. Tap a multiplier (Double/Treble) then a number; the multiplier
 * resets to Single after each dart. "25" is the outer bull, "Bull" the inner (50).
 */
export function DartKeypad({
  numbers,
  onDart,
  onUndo,
  canUndo,
}: {
  numbers: number[];
  onDart: (v: number, m: Multiplier) => void;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const [mult, setMult] = useState<Multiplier>(1);

  const hit = (v: number, m: Multiplier = mult) => {
    onDart(v, m);
    setMult(1);
  };

  const columns = 5;
  const rows: number[][] = [];
  for (let i = 0; i < numbers.length; i += columns) rows.push(numbers.slice(i, i + columns));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {([1, 2, 3] as Multiplier[]).map((m) => (
          <Key
            key={m}
            label={m === 1 ? 'Single' : m === 2 ? 'Double' : 'Treble'}
            onPress={() => setMult(m)}
            active={mult === m}
            activeColor={m === 2 ? colors.double : m === 3 ? colors.treble : colors.accent}
          />
        ))}
      </View>
      {rows.map((row, i) => (
        <View style={styles.row} key={i}>
          {row.map((n) => (
            <Key
              key={n}
              label={mult === 1 ? String(n) : mult === 2 ? `D${n}` : `T${n}`}
              onPress={() => hit(n)}
            />
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, j) => <View key={`s${j}`} style={styles.spacer} />)
            : null}
        </View>
      ))}
      <View style={styles.row}>
        <Key label="25" onPress={() => hit(25, 1)} />
        <Key label="Bull" onPress={() => hit(25, 2)} color={colors.double} />
        <Key label="Miss" onPress={() => hit(0, 1)} dim />
        <Key label="Undo" onPress={onUndo} dim disabled={!canUndo} />
      </View>
    </View>
  );
}

export function Key({
  label,
  onPress,
  active,
  activeColor,
  color,
  dim,
  disabled,
  flex = 1,
  big,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
  color?: string;
  dim?: boolean;
  disabled?: boolean;
  flex?: number;
  big?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.key,
        { flex },
        big && { paddingVertical: 18 },
        color ? { backgroundColor: color } : null,
        dim && { backgroundColor: '#111827' },
        active && { backgroundColor: activeColor ?? colors.accent },
        pressed && { backgroundColor: colors.keyPressed },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Text style={[styles.keyText, active && { color: colors.accentText }, dim && { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  spacer: { flex: 1 },
  key: {
    flex: 1,
    backgroundColor: colors.key,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { color: colors.text, fontSize: 19, fontWeight: '700' },
});
