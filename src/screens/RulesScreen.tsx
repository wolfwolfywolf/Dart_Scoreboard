import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GameSetup } from '../types';
import { Button, Screen, Segmented } from '../components/ui';
import { colors, radius } from '../theme';

export type RulesTopic = 'basics' | GameSetup['kind'];

/** A block of rules text: a heading, a paragraph, or a list of short points (optionally [bold label, text]). */
type Block = { h: string } | { p: string } | { list: (string | [string, string])[] };

/**
 * The rules as this app scores them. Keep in step with src/game/*.ts and
 * docs/DEVELOPMENT_LOG.md §3 when a rule changes.
 */
const RULES: Record<RulesTopic, Block[]> = {
  basics: [
    { h: 'Turns' },
    {
      p: 'Each turn is three darts. Players take turns in the order they were added. The name under the scoreboard shows whose turn it is.',
    },
    { h: 'The board' },
    {
      list: [
        'The thin outer ring is a double (2 × the number). The thin inner ring is a triple (3 ×).',
        'The outer bull is 25. The bullseye is 50 and counts as a double.',
        'A dart outside the numbers, or one that bounces out, is a miss.',
      ],
    },
    { h: 'Entering darts' },
    {
      list: [
        'For a double or triple, tap Double or Triple first, then the number. It goes back to Single after each dart.',
        'Bull follows the same keys: Single is 25, Double is 50.',
        'Tap Miss for a dart that scored nothing.',
        'Undo takes back the last entry, even after the game has been won.',
      ],
    },
    { h: 'Ending a turn early' },
    {
      p: 'Tap the side of the scoreboard belonging to whoever throws next, or the ✓ key in Cricket and Shanghai. Darts already entered still count and the rest are misses. Tapping your own side does nothing.',
    },
    { h: 'Doubles' },
    {
      p: 'Players are paired in the order added: 1 and 2 are Team 1, 3 and 4 are Team 2. A team shares one score and teammates take turns throwing for it. The arrow shows which teammate is up.',
    },
  ],
  x01: [
    { h: 'Goal' },
    {
      p: 'Everyone starts on 301, 501 or 701. Each dart is taken off your score. First to reach exactly 0 wins the leg.',
    },
    { h: 'Starting' },
    { p: 'Any dart counts from the start. You do not need a double to begin scoring.' },
    { h: 'Finishing' },
    {
      list: [
        ['Double out', 'your last dart must be a double. The bullseye (50) counts as a double.'],
        ['Straight out', 'any dart that takes you to exactly 0 wins.'],
      ],
    },
    { h: 'Bust' },
    {
      p: 'You bust if a dart takes you below 0. With double out you also bust if you are left on 1, or reach 0 without a double. Your turn ends at once and your score goes back to what it was at the start of the turn.',
    },
    { h: 'Legs' },
    {
      p: 'Pick first to 1, 2, 3 or 5 legs. Every new leg starts from the full score, and the next player along throws first.',
    },
    { h: 'Turn total' },
    {
      p: 'Switch to Turn total to type a whole turn as one number. If it finishes the leg and could have taken more than one dart, the app asks how many you used. A total that reaches 0 but cannot be thrown as a finish is a bust.',
    },
    { h: 'Checkout help' },
    {
      p: 'When you can finish, the scoreboard suggests a way out, and the chart button shows the full double out chart.',
    },
  ],
  cricket: [
    { h: 'Numbers' },
    { p: 'Only 20, 19, 18, 17, 16, 15 and Bull count. Every other number is a miss.' },
    { h: 'Marks' },
    {
      list: [
        'A single is 1 mark, a double 2 and a triple 3.',
        'The outer bull is 1 mark and the bullseye 2.',
        'Three marks closes a number: / is one, X is two, Ⓧ is closed.',
      ],
    },
    { h: 'Scoring' },
    { p: 'Pick one of three ways to play when you set up the game.' },
    {
      list: [
        ['Points', 'once you have closed a number, more hits on it score its value (Bull 25 a mark) while any opponent still has it open. When everyone has closed it, it scores nothing. Win by closing all seven with at least as many points as everyone else.'],
        ['No points', 'hits on a closed number do nothing. The first to close all seven wins.'],
        ['Cut-throat', 'hits on a number you have closed give its value to every opponent who still has it open. Win by closing all seven with the lowest score (or a tie for lowest).'],
      ],
    },
    { h: 'Winning' },
    {
      p: 'The game ends the moment someone meets the win rule, even in the middle of a turn. If you have closed everything but are behind on points, keep throwing to score.',
    },
  ],
  shanghai: [
    { h: 'Rounds' },
    {
      p: 'Pick the numbers to play when you set up the game, from 1 to 20 and Bull. There is one round for each, lowest first, with Bull last. Everyone throws one turn per round.',
    },
    { h: 'Scoring' },
    {
      p: 'Only the round’s number scores. A single scores the number, a double twice it and a triple three times it. On Bull, the outer bull is 25 and the bullseye 50. Every other dart scores nothing.',
    },
    { h: 'Shanghai' },
    {
      p: 'Hit a single, a double and a triple of the round’s number in one turn, in any order, and you win on the spot. On Bull, a Shanghai is two outer bulls and one bullseye.',
    },
    { h: 'Winning' },
    {
      p: 'If nobody hits a Shanghai, the highest total after the last round wins. Equal top scores are a tie.',
    },
  ],
};

const TOPICS: { label: string; value: RulesTopic }[] = [
  { label: 'Basics', value: 'basics' },
  { label: 'x01', value: 'x01' },
  { label: 'Cricket', value: 'cricket' },
  { label: 'Shanghai', value: 'shanghai' },
];

/** How each game is played and scored in this app, one tab per game. */
export function RulesScreen({ initial = 'basics', onClose }: { initial?: RulesTopic; onClose: () => void }) {
  const [topic, setTopic] = useState<RulesTopic>(initial);
  const scroll = useRef<ScrollView>(null);

  // Android back closes the rules rather than leaving the screen underneath.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const pick = (t: RulesTopic) => {
    setTopic(t);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <Screen title="Rules" right={<Button title="Close" variant="ghost" small onPress={onClose} />}>
      <Segmented options={TOPICS} value={topic} onChange={pick} />
      <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.content}>
        {RULES[topic].map((b, i) =>
          'h' in b ? (
            <Text key={i} style={[styles.heading, i === 0 && { marginTop: 0 }]}>
              {b.h}
            </Text>
          ) : 'p' in b ? (
            <Text key={i} style={styles.para}>
              {b.p}
            </Text>
          ) : (
            <View key={i} style={[styles.list, i > 0 && 'p' in RULES[topic][i - 1] && { marginTop: 8 }]}>
              {b.list.map((item, j) => (
                <View key={j} style={styles.item}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.itemText}>
                    {typeof item === 'string' ? (
                      item
                    ) : (
                      <>
                        <Text style={styles.itemLabel}>{item[0]}: </Text>
                        {item[1]}
                      </>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          ),
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, marginTop: 12 },
  content: {
    backgroundColor: colors.card,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    paddingBottom: 20,
  },
  heading: { color: colors.accent, fontSize: 17, fontWeight: '800', marginTop: 18, marginBottom: 6 },
  para: { color: colors.text, fontSize: 16, lineHeight: 23 },
  list: { gap: 6 },
  item: { flexDirection: 'row', gap: 8 },
  itemLabel: { fontWeight: '800' },
  bullet: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  itemText: { color: colors.text, fontSize: 16, lineHeight: 23, flexShrink: 1 },
});
