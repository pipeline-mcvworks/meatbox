import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface Event {
  id: string;
  lane: 'kick' | 'snare' | 'hat' | 'perc' | 'unknown';
  beat: number;
  duration?: number;
}

interface TimelineCanvasProps {
  events: Event[];
  beatsPerBar: number;
  totalBeats: number;
}

const LANE_LABELS: Record<string, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hat: 'Hat',
  perc: 'Perc',
  unknown: 'Unknown',
};

const LANE_ORDER = ['kick', 'snare', 'hat', 'perc', 'unknown'];

const LANE_COLORS: Record<string, string> = {
  kick: colors.neonRed,
  snare: colors.neonCyan,
  hat: colors.neonGreen,
  perc: colors.neonYellow,
  unknown: colors.neonPurple,
};

const BEAT_WIDTH = 40;
const LANE_HEIGHT = 48;
const LABEL_WIDTH = 64;

export default function TimelineCanvas({ events, beatsPerBar, totalBeats }: TimelineCanvasProps): React.JSX.Element {
  const totalWidth = totalBeats * BEAT_WIDTH;

  const getEventsForLane = (lane: string) =>
    events.filter((e) => e.lane === lane);

  return (
    <View style={styles.container}>
      {/* Header row with beat/bar markers */}
      <View style={styles.headerRow}>
        <View style={styles.labelPlaceholder} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.beatMarkersRow, { width: totalWidth }]}>
            {Array.from({ length: totalBeats }, (_, i) => {
              const isBarStart = i % beatsPerBar === 0;
              return (
                <View
                  key={i}
                  style={[
                    styles.beatMarker,
                    { width: BEAT_WIDTH },
                    isBarStart && styles.barStartMarker,
                  ]}
                >
                  <Text style={[styles.beatText, isBarStart && styles.barText]}>
                    {isBarStart ? `${i / beatsPerBar + 1}` : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Lane rows */}
      <ScrollView>
        {LANE_ORDER.map((lane) => (
          <View key={lane} style={styles.laneRow}>
            <View style={styles.labelContainer}>
              <Text style={styles.laneLabel}>{LANE_LABELS[lane]}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.laneContent, { width: totalWidth, height: LANE_HEIGHT }]}>
                {/* Grid lines */}
                {Array.from({ length: totalBeats }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.gridLine,
                      { left: i * BEAT_WIDTH },
                      i % beatsPerBar === 0 && styles.barLine,
                    ]}
                  />
                ))}
                {/* Event blocks */}
                {getEventsForLane(lane).map((event) => (
                  <View
                    key={event.id}
                    style={[
                      styles.eventBlock,
                      {
                        left: event.beat * BEAT_WIDTH,
                        width: (event.duration || 1) * BEAT_WIDTH - 2,
                        backgroundColor: LANE_COLORS[lane],
                      },
                    ]}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelPlaceholder: {
    width: LABEL_WIDTH,
    height: 24,
  },
  beatMarkersRow: {
    flexDirection: 'row',
    height: 24,
  },
  beatMarker: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  barStartMarker: {
    borderRightWidth: 2,
    borderRightColor: colors.neonCyan,
  },
  beatText: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  barText: {
    color: colors.neonCyan,
    fontWeight: typography.weights.bold,
    fontSize: 11,
  },
  laneRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelContainer: {
    width: LABEL_WIDTH,
    height: LANE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  laneLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  laneContent: {
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
  },
  barLine: {
    backgroundColor: colors.neonCyan,
    opacity: 0.3,
    width: 2,
  },
  eventBlock: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 4,
    opacity: 0.8,
  },
});
