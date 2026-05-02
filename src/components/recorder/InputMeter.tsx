import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

interface InputMeterProps {
  level: number; // 0–1
  height?: number;
  width?: number;
}

export default function InputMeter({
  level,
  height = 160,
  width = 28,
}: InputMeterProps): React.JSX.Element {
  const animatedLevel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedLevel, {
      toValue: level,
      duration: 60,
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
      '#ffdd00',
      '#ff3333',
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
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
  },
});
