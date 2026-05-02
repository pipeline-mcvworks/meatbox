/**
 * TimelineGrid
 * Renders bar/beat lines and lane row dividers behind the events.
 * Plain RN <View>s — kept simple so we don't need to hit-test inside Skia.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

interface TimelineGridProps {
  totalBeats: number;
  beatsPerBar: number;
  pxPerBeat: number;
  laneCount: number;
  laneHeight: number;
}

export default function TimelineGrid({
  totalBeats,
  beatsPerBar,
  pxPerBeat,
  laneCount,
  laneHeight,
}: TimelineGridProps): React.JSX.Element {
  const totalWidth = totalBeats * pxPerBeat;
  const totalHeight = laneCount * laneHeight;

  const beatLines: React.JSX.Element[] = [];
  for (let i = 0; i <= totalBeats; i++) {
    const isBar = i % beatsPerBar === 0;
    beatLines.push(
      <View
        key={`b-${i}`}
        style={[
          styles.beatLine,
          { left: i * pxPerBeat, height: totalHeight },
          isBar && styles.barLine,
        ]}
      />,
    );
  }

  const laneDividers: React.JSX.Element[] = [];
  for (let i = 1; i < laneCount; i++) {
    laneDividers.push(
      <View
        key={`l-${i}`}
        style={[
          styles.laneDivider,
          { top: i * laneHeight, width: totalWidth },
        ]}
      />,
    );
  }

  // Bar number labels along the top.
  const barLabels: React.JSX.Element[] = [];
  for (let i = 0; i < totalBeats; i += beatsPerBar) {
    barLabels.push(
      <Text
        key={`bl-${i}`}
        style={[styles.barLabel, { left: i * pxPerBeat + 4 }]}
      >
        {i / beatsPerBar + 1}
      </Text>,
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: totalWidth, height: totalHeight },
      ]}
      pointerEvents="none"
    >
      {beatLines}
      {laneDividers}
      {barLabels}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  beatLine: {
    position: 'absolute',
    top: 0,
    width: 1,
    backgroundColor: colors.border,
  },
  barLine: {
    width: 2,
    backgroundColor: colors.neonCyan,
    opacity: 0.3,
  },
  laneDivider: {
    position: 'absolute',
    left: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  barLabel: {
    position: 'absolute',
    top: 2,
    color: colors.neonCyan,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
});
