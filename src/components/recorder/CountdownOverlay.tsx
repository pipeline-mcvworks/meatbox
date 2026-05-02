import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography } from '../../theme';

interface CountdownOverlayProps {
  count: number | null;
}

export default function CountdownOverlay({
  count,
}: CountdownOverlayProps): React.JSX.Element | null {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1.4)).current;

  useEffect(() => {
    if (count === null) return;
    opacity.setValue(1);
    scale.setValue(1.4);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0.2,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [count, opacity, scale]);

  if (count === null) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.Text
        style={[
          styles.countText,
          { opacity, transform: [{ scale }] },
        ]}
      >
        {count}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,15,0.75)',
    zIndex: 100,
  },
  countText: {
    fontSize: 120,
    fontWeight: typography.weights.bold,
    color: colors.neonCyan ?? '#00f5ff',
    textAlign: 'center',
  },
});
