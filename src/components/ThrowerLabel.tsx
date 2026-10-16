import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';

/**
 * "Name to throw", with the name large enough to read from the oche. `large` is the
 * side-by-side layout, where it sits centred above the keypad.
 */
export function ThrowerLabel({ name, large, style }: { name: string; large?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, large && styles.rowLarge, style]}>
      <Text style={[styles.name, large && styles.nameLarge]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.rest, large && styles.restLarge]}>to throw</Text>
    </View>
  );
}

/** Height the large label takes above the keypad, including its margin, for key sizing. */
export const THROWER_LABEL_LARGE_HEIGHT = 56;

const styles = StyleSheet.create({
  // Name and "to throw" share a baseline; a long name is cut short rather than pushing "to throw" off.
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexShrink: 1 },
  rowLarge: { justifyContent: 'center', marginBottom: 12 },
  name: { color: colors.accent, fontSize: 26, fontWeight: '800', flexShrink: 1 },
  nameLarge: { fontSize: 36 },
  rest: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  restLarge: { fontSize: 20 },
});
