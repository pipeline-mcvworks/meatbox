import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { colors, spacing, typography } from '../../theme';

interface WaveformHitMarker {
  timeSeconds?: number;
  originalTimeSeconds?: number;
  quantizedTimeSeconds?: number;
  confidence?: number;
  label?: string;
}

interface WaveformProps {
  peaks: number[];
  durationSeconds: number;
  width: number;
  height?: number;
  /** Position of the scrub marker as a fraction 0–1 */
  scrubPosition?: number;
  hits?: WaveformHitMarker[];
}

const DEFAULT_HEIGHT = 200;
const HIT_MARKER_AREA_HEIGHT = 34;
const WAVEFORM_COLOR = colors.neonGreen;
const SCRUB_COLOR = colors.white;
const HIT_MARKER_COLOR = colors.accent;
const CENTER_LINE_COLOR = 'rgba(255, 255, 255, 0.25)';
const LOW_CONFIDENCE_MARKER_COLOR = 'rgba(255, 255, 255, 0.55)';

/**
 * Renders a waveform visualization using Skia.
 * Shows centered waveform bars, a scrub marker, duration text, and confidence-scaled hit markers.
 */
export default function Waveform({
  peaks,
  durationSeconds,
  width,
  height = DEFAULT_HEIGHT,
  scrubPosition = 0,
  hits = [],
}: WaveformProps): React.JSX.Element {
  const waveformHeight = Math.max(0, height - HIT_MARKER_AREA_HEIGHT);
  const midY = waveformHeight / 2;
  const maxAmplitude = Math.max(0, midY - 4);
  const scrubX = clamp(scrubPosition, 0, 1) * width;
  const strokeWidth = Math.max(1, Math.min(3, width / Math.max(1, peaks.length) * 0.8));

  const waveformPath = Skia.Path.Make();
  const centerLinePath = Skia.Path.Make();
  const scrubPath = Skia.Path.Make();
  const hitMarkersBaselinePath = Skia.Path.Make();

  centerLinePath.moveTo(0, midY);
  centerLinePath.lineTo(width, midY);

  if (peaks.length === 0) {
    waveformPath.moveTo(0, midY);
    waveformPath.lineTo(width, midY);
  } else {
    const stepX = peaks.length > 1 ? width / (peaks.length - 1) : 0;

    for (let i = 0; i < peaks.length; i += 1) {
      const x = peaks.length > 1 ? i * stepX : width / 2;
      const amplitude = clamp(peaks[i], 0, 1) * maxAmplitude;

      waveformPath.moveTo(x, midY - amplitude);
      waveformPath.lineTo(x, midY + amplitude);
    }
  }

  scrubPath.moveTo(scrubX, 0);
  scrubPath.lineTo(scrubX, waveformHeight);

  const hitMarkerY = waveformHeight + HIT_MARKER_AREA_HEIGHT / 2;
  hitMarkersBaselinePath.moveTo(0, hitMarkerY);
  hitMarkersBaselinePath.lineTo(width, hitMarkerY);

  const visibleHits = hits
    .map((hit, index) => {
      const markerTime = hit.quantizedTimeSeconds ?? hit.timeSeconds ?? hit.originalTimeSeconds ?? 0;
      const confidence = clamp(hit.confidence ?? 0.5, 0, 1);

      return {
        id: `${index}-${markerTime}`,
        x: durationSeconds > 0 ? clamp(markerTime / durationSeconds, 0, 1) * width : 0,
        confidence,
      };
    })
    .filter((hit) => Number.isFinite(hit.x));

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Path
          path={centerLinePath}
          color={CENTER_LINE_COLOR}
          style="stroke"
          strokeWidth={1}
        />
        <Path
          path={waveformPath}
          color={WAVEFORM_COLOR}
          style="stroke"
          strokeWidth={strokeWidth}
        />
        <Path
          path={scrubPath}
          color={SCRUB_COLOR}
          style="stroke"
          strokeWidth={1}
        />
        <Path
          path={hitMarkersBaselinePath}
          color={HIT_MARKER_COLOR}
          style="stroke"
          strokeWidth={1}
        />
        {visibleHits.map((hit) => (
          <Circle
            key={hit.id}
            cx={hit.x}
            cy={hitMarkerY}
            r={4 + hit.confidence * 5}
            color={hit.confidence >= 0.45 ? HIT_MARKER_COLOR : LOW_CONFIDENCE_MARKER_COLOR}
            opacity={0.45 + hit.confidence * 0.55}
          />
        ))}
      </Canvas>
      <View style={[styles.footer, { width }]}> 
        <Text style={styles.durationText}>{formatDuration(durationSeconds)}</Text>
        <Text style={styles.hitMarkerText}>{hits.length} hit markers</Text>
      </View>
    </View>
  );
}

function formatDuration(durationSeconds: number): string {
  const safeDuration = Math.max(0, Math.floor(durationSeconds));
  const minutes = Math.floor(safeDuration / 60);
  const seconds = safeDuration % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[2],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[1],
  },
  durationText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  hitMarkerText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
  },
});
