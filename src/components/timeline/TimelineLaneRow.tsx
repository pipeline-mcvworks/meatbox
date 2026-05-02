/**
 * TimelineLaneRow
 * One horizontal lane: label + a tappable empty area for adding events,
 * with the lane's events rendered on top via TimelineEventView.
 *
 * The background tap fires only when no event swallowed the touch first;
 * this is achieved by Gesture.Exclusive ordering inside TimelineEventView
 * combined with the events rendering above the row's tap target.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { colors, typography } from '../../theme';
import type { DrumEvent, Lane } from '../../state/types';
import { useProjectStore } from '../../state/projectStore';
import TimelineEventView from './TimelineEventView';

interface TimelineLaneRowProps {
  lane: Lane;
  laneIndex: number;
  lanes: Lane[];
  events: DrumEvent[];
  pxPerBeat: number;
  laneHeight: number;
  totalBeats: number;
  bpm: number;
}

function snapBeatJS(beat: number, strength: number, step = 0.25): number {
  const q = Math.round(beat / step) * step;
  const s = Math.max(0, Math.min(1, strength));
  return beat + (q - beat) * s;
}

export default function TimelineLaneRow({
  lane,
  laneIndex,
  lanes,
  events,
  pxPerBeat,
  laneHeight,
  totalBeats,
  bpm,
}: TimelineLaneRowProps): React.JSX.Element {
  const totalWidth = totalBeats * pxPerBeat;

  const addEventAtX = (x: number) => {
    const strength = useProjectStore.getState().quantizeStrength;
    const beat = Math.max(0, snapBeatJS(x / pxPerBeat, Math.max(strength, 0.5)));
    useProjectStore.getState().addEventAt(lane.id, beat, 0.9);
  };

  const bgTap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onEnd((e, success) => {
          if (!success) return;
          runOnJS(addEventAtX)(e.x);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lane.id, pxPerBeat],
  );

  return (
    <View style={[styles.row, { height: laneHeight, width: totalWidth + 0 }]}>
      {/* Background tap target — events sit on top and consume touches first. */}
      <GestureDetector gesture={bgTap}>
        <Animated.View
          style={[
            styles.bg,
            {
              width: totalWidth,
              height: laneHeight,
              backgroundColor:
                laneIndex % 2 === 0 ? colors.surface : 'rgba(255,255,255,0.02)',
            },
          ]}
        />
      </GestureDetector>

      {/* Events */}
      {events.map((event) => (
        <TimelineEventView
          key={event.id}
          event={event}
          lanes={lanes}
          laneIndex={laneIndex}
          pxPerBeat={pxPerBeat}
          laneHeight={laneHeight}
          bpm={bpm}
        />
      ))}

      {/* Lane label overlay (left edge, sticky-ish) */}
      <View style={styles.labelOverlay} pointerEvents="none">
        <Text style={styles.labelText} numberOfLines={1}>
          {lane.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
  },
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelOverlay: {
    position: 'absolute',
    left: 4,
    top: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  labelText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: typography.weights.semibold,
  },
});
