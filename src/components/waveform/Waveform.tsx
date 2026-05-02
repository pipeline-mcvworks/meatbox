import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Text,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import { colors, spacing } from '../../theme';

interface WaveformProps {
  peaks: number[];
  durationSeconds: number;
  width: number;
  height?: number;
  /** Position of the scrub marker as a fraction 0–1 */
  scrubPosition?: number;
}

const DEFAULT_HEIGHT = 200;
const HIT_MARKER_AREA_HEIGHT = 30;
const WAVEFORM_COLOR = colors.neonGreen;
const SCRUB_COLOR = colors.white;
const HIT_MARKER_COLOR = colors.accent;

/**
 * Renders a waveform visualization using Skia.
 * Shows the waveform, a scrub marker, duration text, and a placeholder hit markers area.
 */
export default function Waveform({
  peaks,
  durationSeconds,
  width,
  height = DEFAULT_HEIGHT,
  scrubPosition = 0,
}: WaveformProps): React.JSX.Element {
  const waveformHeight = height - HIT_MARKER_AREA_HEIGHT;
  const path = Skia.Path.Make();

  if (peaks.length === 0) {
    // No peaks: draw a flat line
    path.moveTo(0, waveformHeight / 2);
    path.lineTo(width, waveformHeight / 2);
  } else {
    const stepX = width / peaks.length;
    const midY = waveformHeight / 2;

    // Move to first point
    path.moveTo(0, midY - peaks[0] * midY);

    for (let i = 1; i < peaks.length; i++) {
      const x = i * stepX;
      const y = midY - peaks[i] * midY;
      path.lineTo(x, y);
    }
  }

  // Scrub marker line
  const scrubX = scrubPosition * width;
  const scrubPath = Skia.Path.Make();
  scrubPath.moveTo(scrubX, 0);
  scrubPath.lineTo(scrubX, waveformHeight);

  // Duration text
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Placeholder hit markers area (bottom strip)
  const hitMarkersPath = Skia.Path.Make();
  // Draw a dashed line to indicate the hit markers area
  hitMarkersPath.moveTo(0, waveformHeight + HIT_MARKER_AREA_HEIGHT / 2);
  hitMarkersPath.lineTo(width, waveformHeight + HIT_MARKER_AREA_HEIGHT / 2);

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        {/* Waveform path */}
        <Path
          path={path}
          color={WAVEFORM_COLOR}
          style="stroke"
          strokeWidth={2}
        />
        {/* Scrub marker */}
        <Path
          path={scrubPath}
          color={SCRUB_COLOR}
          style="stroke"
          strokeWidth={1}
        />
        {/* Hit markers area placeholder */}
        <Path
          path={hitMarkersPath}
          color={HIT_MARKER_COLOR}
          style="stroke"
          strokeWidth={1}
          strokeDash={[4, 4]}
        />
        {/* Duration text */}
        <Text
          x={8}
          y={waveformHeight - 8}
          text={durationStr}
          color={colors.white}
          size={12}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[2],
  },
});
