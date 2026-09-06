import React from 'react';
import { ImageBackground, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { chalk } from '../theme';

/** A framed chalkboard panel: slate texture inside a wooden frame. */
export function Chalkboard({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <View style={[styles.frame, style]}>
      <ImageBackground source={require('../../assets/chalkboard.png')} resizeMode="repeat" style={styles.slate} imageStyle={styles.slateImage}>
        {children}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: chalk.frame,
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: chalk.frameEdge,
  },
  slate: { flex: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: chalk.slate },
  slateImage: { borderRadius: 6 },
});
