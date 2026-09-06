import { useWindowDimensions } from 'react-native';

/** Breakpoint above which we treat the display as a tablet (or a phone held sideways). */
export const WIDE_BREAKPOINT = 700;

/** Sensible maximum width for reading/forms on big screens. */
export const CONTENT_MAX_WIDTH = 720;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const isLandscape = width > height;
  return {
    width,
    height,
    isWide,
    isLandscape,
    /** Scoreboard beside the keypad: only when there's room sideways (tablet or phone in landscape). */
    twoPane: isWide && isLandscape,
    /** Width the stacked layout actually uses once centred and capped on big screens. */
    contentWidth: Math.min(width, CONTENT_MAX_WIDTH),
  };
}

/**
 * Pick a keypad key height so a keypad of `rows` rows fits in `available` points,
 * without the keys becoming silly-small or silly-tall.
 */
export function keyHeightFor(available: number, rows: number, min = 38, max = 64): number {
  const gap = 6;
  const h = (available - gap * (rows - 1)) / rows;
  return Math.max(min, Math.min(max, Math.floor(h)));
}
