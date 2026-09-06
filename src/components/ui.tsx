import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH } from '../layout';
import { colors, radius, spacing } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'secondary' && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          small && { fontSize: 15 },
          variant === 'primary' && { color: colors.accentText },
          variant === 'ghost' && { color: colors.muted },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Screen({
  title,
  onBack,
  right,
  children,
  scroll,
  fullWidth,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  /** Use the whole width on tablets instead of centring a phone-width column. */
  fullWidth?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <Text style={styles.back}>‹ Back</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
      <View style={[styles.body, scroll && { padding: 0 }, !fullWidth && styles.bodyCapped]}>{children}</View>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  onLongPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.chipText, selected && { color: colors.accentText, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => (
        <Pressable
          key={String(o.value)}
          onPress={() => onChange(o.value)}
          style={[styles.segment, o.value === value && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, o.value === value && { color: colors.accentText }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing,
    height: 52,
  },
  headerSide: { width: 72 },
  back: { color: colors.accent, fontSize: 18, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 20, fontWeight: '700' },
  body: { flex: 1, padding: spacing },
  bodyCapped: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  buttonText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 15 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius - 4 },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
});
