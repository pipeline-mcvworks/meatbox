import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme';

interface InputMeterProps {
  /** Normalised level 0–1 */
  level: number;
  height?: number;
  width?: number;
}

export default function InputMeter({
  level,
  height = 200,
  width = 24,
}: InputMeterProps): React.JSX.Element {
  const animatedLevel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedLevel, {
      toValue: level,
      duration: 80,
      useNativeDriver: false,
    }).start();
  }, [level, animatedLevel]);

  const barHeight = animatedLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
    extrapolate: 'clamp',
  });

  const barColor = animatedLevel.interpolate({
    inputRange: [0, 0.6, 0.85, 1],
    outputRange: [
      colors.neonCyan ?? '#00f5ff',
      colors.neonCyan ?? '#00f5ff',
      colors.neonYellow ?? '#f5e642',
      colors.neonPink ?? '#ff2d78',
    ],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.track, { height, width }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            height: barHeight,
            width,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
  },
});
