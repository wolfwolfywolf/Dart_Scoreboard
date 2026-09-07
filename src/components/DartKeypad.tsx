import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Multiplier } from '../types';
import { colors } from '../theme';

/**
 * Per-dart entry. Tap a multiplier (Double/Triple) then a number; the multiplier
 * resets to Single after each dart. Bull follows the multiplier too: Single is
 * the outer bull (25), Double is the bullseye (50). Key labels never change with
 * the multiplier: the lit multiplier button is the only indicator, so the eye can
 * always find "15" where it expects it.
 */
export function DartKeypad({
  numbers,
  onDart,
  onUndo,
  canUndo,
  keyHeight,
  onEndTurn,
}: {
  numbers: number[];
  onDart: (v: number, m: Multiplier) => void;
  onUndo: () => void;
  canUndo: boolean;
  keyHeight?: number;
  /** When given, a green ✓ key ends the turn early (remaining darts count as misses). */
  onEndTurn?: () => void;
}) {
  const [mult, setMult] = useState<Multiplier>(1);

  const hit = (v: number, m: Multiplier = mult) => {
    onDart(v, m);
    setMult(1);
  };

  // Numbers, then Bull / Miss / Undo, flowing through one grid so there is no
  // separate row of odd-looking controls.
  const columns = 5;
  const keys: React.ReactNode[] = numbers.map((n) => (
    <Key key={n} label={String(n)} onPress={() => hit(n)} height={keyHeight} />
  ));
  keys.push(
    <Key
      key="bull"
      label="Bull"
      onPress={() => hit(25, mult === 3 ? 2 : mult)}
      disabled={mult === 3}
      height={keyHeight}
    />,
    <Key key="miss" label="Miss" onPress={() => hit(0, 1)} height={keyHeight} />,
    <Key key="undo" label="Undo" onPress={onUndo} disabled={!canUndo} height={keyHeight} />,
  );
  if (onEndTurn) {
    keys.push(<Key key="done" label="✓" onPress={onEndTurn} height={keyHeight} color={colors.accent} textColor={colors.onActive} />);
  }
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < keys.length; i += columns) rows.push(keys.slice(i, i + columns));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {([1, 2, 3] as Multiplier[]).map((m) => (
          <Key
            key={m}
            label={m === 1 ? 'Single' : m === 2 ? 'Double' : 'Triple'}
            onPress={() => setMult(m)}
            active={mult === m}
            activeColor={m === 2 ? colors.double : m === 3 ? colors.triple : colors.accent}
            height={keyHeight}
          />
        ))}
      </View>
      {rows.map((row, i) => (
        <View style={styles.row} key={i}>
          {row}
          {row.length < columns
            ? Array.from({ length: columns - row.length }).map((_, j) => <View key={`s${j}`} style={styles.spacer} />)
            : null}
        </View>
      ))}
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
  height,
  textColor,
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
  /** Fixed key height; when set it replaces the default padding-based height. */
  height?: number;
  textColor?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.key,
        { flex },
        big && { paddingVertical: 18 },
        height !== undefined && { height: big ? Math.round(height * 1.15) : height, paddingVertical: 0 },
        color ? { backgroundColor: color } : null,
        dim && { backgroundColor: '#111827' },
        active && { backgroundColor: activeColor ?? colors.accent },
        pressed && { backgroundColor: colors.keyPressed },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Text style={[styles.keyText, active && { color: colors.onActive }, dim && { color: colors.muted }, textColor ? { color: textColor } : null]}>
        {label}
      </Text>
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
