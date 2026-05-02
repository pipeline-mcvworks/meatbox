import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';

interface RecordOverlayProps {
  onPress: () => void;
  label?: string;
}

export default function RecordOverlay({
  onPress,
  label = 'Quick Record',
}: RecordOverlayProps): React.JSX.Element {
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          haptics.medium();
          onPress();
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.dot} />
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: spacing[6] ?? 24,
    right: spacing[4] ?? 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: spacing[4] ?? 16,
    paddingVertical: spacing[2] ?? 10,
    borderWidth: 1,
    borderColor: colors.neonPink ?? '#ff2d78',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neonPink ?? '#ff2d78',
    marginRight: spacing[2] ?? 8,
  },
  label: {
    color: '#fff',
    fontSize: typography.sizes.sm ?? 14,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
  },
});
