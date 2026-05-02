/**
 * TimelineEventDrag
 *
 * A draggable wrapper for timeline events that fires haptics.dragSnap()
 * whenever the drag position crosses a quantize-grid boundary.
 *
 * Usage:
 *   <TimelineEventDrag
 *     eventId={event.id}
 *     initialOffsetX={event.timeSeconds * pixelsPerSecond}
 *     snapIntervalPx={sixteenthWidthPx}
 *     onSnap={(newOffsetX) => updateEventTime(event.id, newOffsetX / pixelsPerSecond)}
 *   >
 *     <YourEventView />
 *   </TimelineEventDrag>
 *
 * Snap behaviour:
 *   - While dragging, the component tracks which snap cell the finger is in.
 *   - Each time the cell index changes, haptics.dragSnap() fires once.
 *   - On release, onSnap is called with the snapped pixel offset.
 */

import React, { useRef, useCallback } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { haptics } from '../../utils/haptics';

interface TimelineEventDragProps {
  /** Stable event identifier (used for accessibility label). */
  eventId: string;
  /** Starting X offset in pixels (timeSeconds × pixelsPerSecond). */
  initialOffsetX: number;
  /** Width of one snap cell in pixels (e.g. one 16th-note width). */
  snapIntervalPx: number;
  /** Minimum allowed X offset (default 0). */
  minOffsetX?: number;
  /** Maximum allowed X offset (default Infinity). */
  maxOffsetX?: number;
  /** Called when the drag ends, with the snapped X offset. */
  onSnap?: (snappedOffsetX: number) => void;
  /** Called on every frame during drag with the raw (unsnapped) X offset. */
  onDragMove?: (rawOffsetX: number) => void;
  children: React.ReactNode;
}

export default function TimelineEventDrag({
  eventId,
  initialOffsetX,
  snapIntervalPx,
  minOffsetX = 0,
  maxOffsetX = Infinity,
  onSnap,
  onDragMove,
  children,
}: TimelineEventDragProps): React.JSX.Element {
  // Animated X position (visual feedback during drag).
  const animX = useRef(new Animated.Value(initialOffsetX)).current;

  // Track the last snap-cell index so we only fire haptic on cell change.
  const lastSnapCell = useRef<number>(Math.round(initialOffsetX / Math.max(1, snapIntervalPx)));

  // Track the drag start offset so we can compute absolute position.
  const dragStartX = useRef(initialOffsetX);

  const clamp = useCallback(
    (value: number) => Math.max(minOffsetX, Math.min(maxOffsetX, value)),
    [minOffsetX, maxOffsetX],
  );

  const snapTo = useCallback(
    (rawX: number): number => {
      const interval = Math.max(1, snapIntervalPx);
      return Math.round(rawX / interval) * interval;
    },
    [snapIntervalPx],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 2,

      onPanResponderGrant: (_evt: GestureResponderEvent, _gestureState: PanResponderGestureState) => {
        // Capture current animated value as the drag start.
        // @ts-ignore — _value is internal but stable across RN versions.
        dragStartX.current = (animX as any)._value ?? initialOffsetX;
        lastSnapCell.current = Math.round(
          dragStartX.current / Math.max(1, snapIntervalPx),
        );
      },

      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const rawX = clamp(dragStartX.current + gestureState.dx);
        animX.setValue(rawX);
        onDragMove?.(rawX);

        // Detect snap-cell crossing and fire haptic.
        const interval = Math.max(1, snapIntervalPx);
        const currentCell = Math.round(rawX / interval);
        if (currentCell !== lastSnapCell.current) {
          lastSnapCell.current = currentCell;
          haptics.dragSnap();
        }
      },

      onPanResponderRelease: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const rawX = clamp(dragStartX.current + gestureState.dx);
        const snapped = snapTo(rawX);
        // Animate to snapped position.
        Animated.spring(animX, {
          toValue: snapped,
          useNativeDriver: false,
          friction: 8,
          tension: 120,
        }).start();
        onSnap?.(snapped);
      },

      onPanResponderTerminate: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Snap back to last known good position on gesture cancel.
        const rawX = clamp(dragStartX.current + gestureState.dx);
        const snapped = snapTo(rawX);
        Animated.spring(animX, {
          toValue: snapped,
          useNativeDriver: false,
          friction: 8,
          tension: 120,
        }).start();
        onSnap?.(snapped);
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: animX }] }]}
      {...panResponder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={`Timeline event ${eventId}`}
      accessibilityHint="Drag left or right to move this event. Snaps to grid."
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
