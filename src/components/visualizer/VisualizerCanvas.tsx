/**
 * VisualizerCanvas
 *
 * Full-screen reactive visualizer. Reacts to:
 *   - useAudioStore.liveInputLevel (mic input)
 *   - useAudioStore.playbackLevel (if present) — falls back to liveInputLevel
 *
 * Two presets:
 *   - 'pulse' : radial pulsing rings + bars centered
 *   - 'wave'  : horizontal waveform driven by level history
 *
 * Implementation note: we attempt to use react-native-svg (commonly present
 * in React Native projects) for crisper rendering. If unavailable, we fall
 * back to plain Animated.Views composed into a similar visual.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../../theme';
import { useAudioStore } from '../../state/audioStore';

export type VisualizerPreset = 'pulse' | 'wave';

interface VisualizerCanvasProps {
  preset: VisualizerPreset;
  /** Override level source. Defaults to audioStore.liveInputLevel. */
  level?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Svg: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Circle: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Rect: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Polyline: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Defs: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LinearGradient: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Stop: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const svgMod = require('react-native-svg');
  Svg = svgMod.default ?? svgMod.Svg;
  Circle = svgMod.Circle;
  Rect = svgMod.Rect;
  Polyline = svgMod.Polyline;
  Defs = svgMod.Defs;
  LinearGradient = svgMod.LinearGradient;
  Stop = svgMod.Stop;
} catch {
  Svg = null;
}

const HISTORY_SIZE = 64;

function useAudioLevel(override?: number): number {
  const liveInput = useAudioStore((s) => s.liveInputLevel ?? 0);
  // Some stores expose playback level under different names; try a few.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playback = useAudioStore((s: any) =>
    typeof s.playbackLevel === 'number'
      ? s.playbackLevel
      : typeof s.outputLevel === 'number'
        ? s.outputLevel
        : 0,
  );
  if (typeof override === 'number') return Math.max(0, Math.min(1, override));
  return Math.max(liveInput ?? 0, playback ?? 0);
}

export default function VisualizerCanvas({
  preset,
  level: levelOverride,
}: VisualizerCanvasProps): React.JSX.Element {
  const level = useAudioLevel(levelOverride);
  const { width, height } = Dimensions.get('window');

  // Smoothed animated level
  const animLevel = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animLevel, {
      toValue: level,
      duration: 90,
      useNativeDriver: false,
    }).start();
  }, [level, animLevel]);

  // History buffer for wave preset
  const [history, setHistory] = useState<number[]>(() =>
    Array.from({ length: HISTORY_SIZE }, () => 0),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setHistory((prev) => {
        const next = prev.slice(1);
        next.push(level);
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [level]);

  if (preset === 'wave') {
    return (
      <WavePreset
        width={width}
        height={height}
        history={history}
        animLevel={animLevel}
      />
    );
  }
  return (
    <PulsePreset width={width} height={height} animLevel={animLevel} level={level} />
  );
}

// ---------------------------------------------------------------------------
// Pulse preset
// ---------------------------------------------------------------------------
function PulsePreset({
  width,
  height,
  animLevel,
  level,
}: {
  width: number;
  height: number;
  animLevel: Animated.Value;
  level: number;
}): React.JSX.Element {
  const cx = width / 2;
  const cy = height / 2;
  const baseR = Math.min(width, height) * 0.18;

  const ring1 = animLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [baseR, baseR + 90],
  });
  const ring2 = animLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [baseR + 30, baseR + 160],
  });
  const ring3 = animLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [baseR + 60, baseR + 230],
  });
  const opacity1 = animLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });
  const opacity2 = animLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.6],
  });
  const opacity3 = animLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.35],
  });

  // Always-on RN-Animated fallback rendering. Looks clean even without SVG.
  const Ring = ({
    size,
    color,
    op,
  }: {
    size: Animated.AnimatedInterpolation<number>;
    color: string;
    op: Animated.AnimatedInterpolation<number>;
  }) => (
    <Animated.View
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        width: size,
        height: size,
        marginLeft: Animated.multiply(size, -0.5),
        marginTop: Animated.multiply(size, -0.5),
        borderRadius: 9999,
        borderWidth: 2,
        borderColor: color,
        opacity: op,
      }}
    />
  );

  // Center bars
  const bars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <View style={[styles.canvas, { backgroundColor: colors.background }]}>
      <Ring size={ring3} color={colors.neonPurple ?? '#a855f7'} op={opacity3} />
      <Ring size={ring2} color={colors.neonGreen ?? '#39ff14'} op={opacity2} />
      <Ring size={ring1} color={colors.neonCyan ?? '#00f5ff'} op={opacity1} />

      {/* Center radial bars */}
      <View
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          width: 0,
          height: 0,
        }}
      >
        {bars.map((i) => {
          const angle = (i / bars.length) * Math.PI * 2;
          const len = 16 + level * 80 + (i % 3) * 4;
          const x = Math.cos(angle) * (baseR * 0.6);
          const y = Math.sin(angle) * (baseR * 0.6);
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: x - 2,
                top: y - len / 2,
                width: 4,
                height: len,
                borderRadius: 2,
                backgroundColor:
                  i % 2 === 0
                    ? colors.neonCyan ?? '#00f5ff'
                    : colors.neonPink ?? '#ff2d78',
                transform: [{ rotate: `${(angle * 180) / Math.PI}deg` }],
                opacity: 0.85,
              }}
            />
          );
        })}
      </View>

      {/* Inner core */}
      <Animated.View
        style={{
          position: 'absolute',
          left: cx - baseR / 2,
          top: cy - baseR / 2,
          width: baseR,
          height: baseR,
          borderRadius: baseR,
          backgroundColor: colors.neonCyan ?? '#00f5ff',
          opacity: animLevel.interpolate({
            inputRange: [0, 1],
            outputRange: [0.25, 0.85],
          }),
          transform: [
            {
              scale: animLevel.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1.3],
              }),
            },
          ],
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Wave preset
// ---------------------------------------------------------------------------
function WavePreset({
  width,
  height,
  history,
  animLevel,
}: {
  width: number;
  height: number;
  history: number[];
  animLevel: Animated.Value;
}): React.JSX.Element {
  const midY = height / 2;
  const stepX = width / Math.max(1, history.length - 1);

  // Build polyline points string when SVG is available.
  const pointsStr = useMemo(() => {
    return history
      .map((v, i) => {
        const x = i * stepX;
        const y = midY - (v - 0.5) * 2 * (height * 0.35);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [history, stepX, midY, height]);

  if (Svg && Polyline && Defs && LinearGradient && Stop) {
    return (
      <View style={[styles.canvas, { backgroundColor: colors.background }]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.neonCyan ?? '#00f5ff'} stopOpacity="0.9" />
              <Stop offset="0.5" stopColor={colors.neonGreen ?? '#39ff14'} stopOpacity="0.9" />
              <Stop offset="1" stopColor={colors.neonPink ?? '#ff2d78'} stopOpacity="0.9" />
            </LinearGradient>
          </Defs>
          <Polyline
            points={pointsStr}
            fill="none"
            stroke="url(#grad)"
            strokeWidth={3}
          />
          <Polyline
            points={pointsStr}
            fill="none"
            stroke={colors.neonCyan ?? '#00f5ff'}
            strokeOpacity={0.4}
            strokeWidth={8}
          />
        </Svg>
        {/* Reactive ground bar */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: animLevel.interpolate({
              inputRange: [0, 1],
              outputRange: [4, 60],
            }),
            backgroundColor: colors.neonPink ?? '#ff2d78',
            opacity: 0.35,
          }}
        />
      </View>
    );
  }

  // Fallback: bar-graph style using Animated views.
  return (
    <View style={[styles.canvas, { backgroundColor: colors.background }]}>
      <View style={styles.barRow}>
        {history.map((v, i) => (
          <View
            key={i}
            style={{
              width: stepX,
              height: Math.max(2, v * height * 0.7),
              backgroundColor:
                i % 3 === 0
                  ? colors.neonCyan ?? '#00f5ff'
                  : i % 3 === 1
                    ? colors.neonGreen ?? '#39ff14'
                    : colors.neonPink ?? '#ff2d78',
              opacity: 0.8,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  barRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
