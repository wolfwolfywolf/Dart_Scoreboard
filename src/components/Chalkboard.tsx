import React from 'react';
import { ImageBackground, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { chalk } from '../theme';

/**
 * A framed chalkboard panel: slate texture inside a wooden frame.
 * By default it is as tall as its contents. Pass `fill` when the frame itself is
 * flexed to a fixed height and the slate should stretch to fill it. (Never give the
 * slate `flex: 1` inside an auto-height frame: native layout collapses it to zero.)
 */
export function Chalkboard({ style, fill, children }: { style?: StyleProp<ViewStyle>; fill?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.frame, fill && styles.frameFill, style]}>
      <ImageBackground
        source={require('../../assets/chalkboard.png')}
        resizeMode="repeat"
        style={[styles.slate, fill && styles.slateFill]}
        imageStyle={styles.slateImage}
      >
        {children}
      </ImageBackground>
    </View>
  );
}

/**
 * Bold gold outline marking the side that's throwing. Drawn over the card (absolute,
 * so it never shifts the card's contents) just inside the card's own border.
 */
export function ActiveOutline() {
  return <View style={styles.activeOutline} />;
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: chalk.frame,
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: chalk.frameEdge,
  },
  frameFill: { flex: 1 },
  slate: { alignSelf: 'stretch', borderRadius: 6, overflow: 'hidden', backgroundColor: chalk.slate },
  slateFill: { flex: 1 },
  slateImage: { borderRadius: 6 },
  activeOutline: {
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2.5,
    borderColor: chalk.gold,
    borderRadius: 5,
  },
});
