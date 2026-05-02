import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, typography } from '../../theme';

interface CountdownOverlayProps {
  count: number | null; // null = not showing
}

export default function CountdownOverlay({
  count,
}: CountdownOverlayProps): React.JSX.Element | null {
  const scale = useRef(new Animated.Value(1.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count === null) return;
    scale.setValue(1.4);
    opacity.setValue(1);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [count, scale, opacity]);

  if (count === null) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.Text
        style={[
          styles.countText,
          { transform: [{ scale }], opacity },
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
    zIndex: 10,
  },
  countText: {
    color: colors.neonPink,
    fontSize: 120,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
});
