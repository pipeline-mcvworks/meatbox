/**
 * TimelineEventView
 * One draggable/tappable/long-pressable event block on the timeline.
 *
 * Drag horizontally  -> change start beat (snapped per quantizeStrength)
 * Drag vertically    -> change lane
 * Tap                -> open EventEditSheet
 * Long-press         -> open EventContextMenu (delete / duplicate / lock)
 *
 * All store mutations are wrapped in runOnJS — gesture callbacks run on the
 * UI thread and cannot call JS-thread Zustand setters directly.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { useProjectStore } from '../../state/projectStore';
import { useUiStore } from '../../state/uiStore';
import type { DrumEvent, Lane } from '../../state/types';
import { colors, typography } from '../../theme';

interface TimelineEventViewProps {
  event: DrumEvent;
  lanes: Lane[];
  laneIndex: number;
  pxPerBeat: number;
  laneHeight: number;
  bpm: number;
}

function snapBeatJS(beat: number, strength: number, step = 0.25): number {
  const q = Math.round(beat / step) * step;
  const s = Math.max(0, Math.min(1, strength));
  return beat + (q - beat) * s;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export default function TimelineEventView({
  event,
  lanes,
  laneIndex,
  pxPerBeat,
  laneHeight,
  bpm,
}: TimelineEventViewProps): React.JSX.Element {
  const startBeat = (event.startTime * bpm) / 60;
  const widthBeats = Math.max(0.25, (event.duration ?? 0.25) * bpm / 60);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const lane = lanes[laneIndex];
  const color = lane?.color ?? colors.neonYellow;

  // ----- JS-thread callbacks invoked via runOnJS -------------------------
  const commitMove = (newBeat: number, newLaneId: string) => {
    useProjectStore.getState().moveEvent(event.id, newBeat, newLaneId);
  };

  const openEditor = () => {
    useUiStore.getState().setSelectedEvent(event.id);
    useUiStore.getState().setEditingEvent(event.id);
  };

  const openContextMenu = () => {
    useUiStore.getState().setSelectedEvent(event.id);
    useUiStore.getState().setContextMenuEvent(event.id);
  };

  // ----- Gestures -------------------------------------------------------
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .onStart(() => {
          scale.value = 1.05;
        })
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY;
        })
        .onEnd(() => {
          const dx = translateX.value;
          const dy = translateY.value;
          translateX.value = 0;
          translateY.value = 0;
          scale.value = 1;

          const strength = useProjectStore.getState().quantizeStrength;
          const newBeatRaw = startBeat + dx / pxPerBeat;
          const newBeat = Math.max(0, snapBeatJS(newBeatRaw, strength));

          const newLaneIdx = clamp(
            Math.round(laneIndex + dy / laneHeight),
            0,
            lanes.length - 1,
          );
          const newLaneId = lanes[newLaneIdx]?.id ?? lane?.id ?? event.laneId;

          runOnJS(commitMove)(newBeat, newLaneId);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startBeat, pxPerBeat, laneIndex, laneHeight, lanes.length, event.id, event.laneId],
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onEnd((_e, success) => {
          if (success) {
            runOnJS(openEditor)();
          }
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event.id],
  );

  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(400)
        .onStart(() => {
          runOnJS(openContextMenu)();
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event.id],
  );

  const composed = useMemo(
    () => Gesture.Exclusive(longPress, pan, tap),
    [longPress, pan, tap],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const left = startBeat * pxPerBeat;
  const top = laneIndex * laneHeight + 6;
  const width = Math.max(8, widthBeats * pxPerBeat - 2);
  const height = laneHeight - 12;
  const opacity = Math.max(0.35, Math.min(1, event.velocity ?? 1));
  const locked = (event as DrumEvent & { locked?: boolean }).locked === true;

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[
          styles.event,
          {
            left,
            top,
            width,
            height,
            backgroundColor: color,
            opacity,
            borderColor: locked ? colors.neonRed : 'transparent',
            borderWidth: locked ? 2 : 0,
          },
          animatedStyle,
        ]}
      >
        {locked ? (
          <View style={styles.lockBadge} pointerEvents="none">
            <Text style={styles.lockText}>L</Text>
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  event: {
    position: 'absolute',
    borderRadius: 4,
  },
  lockBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  lockText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
});
