import React, { useRef } from 'react';
import { Pressable, Animated, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface PadProps {
  id: string;
  name: string;
  color: string;
  onPress: (velocity: number) => void;
}

export default function Pad({ id, name, color, onPress }: PadProps): React.JSX.Element {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (event: any) => {
    const velocity = event.nativeEvent?.force ?? 0.8;
    onPress(velocity);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={styles.wrapper}
    >
      <Animated.View
        style={[
          styles.pad,
          { backgroundColor: color, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.label}>{name}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: spacing[1],
  },
  pad: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  label: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
