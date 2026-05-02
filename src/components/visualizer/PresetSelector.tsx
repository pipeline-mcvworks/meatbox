import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import type { VisualizerPreset } from './VisualizerCanvas';
import { haptics } from '../../utils/haptics';

interface PresetSelectorProps {
  preset: VisualizerPreset;
  onChange: (p: VisualizerPreset) => void;
}

const OPTIONS: { id: VisualizerPreset; label: string }[] = [
  { id: 'pulse', label: 'Pulse' },
  { id: 'wave', label: 'Wave' },
];

export default function PresetSelector({
  preset,
  onChange,
}: PresetSelectorProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = opt.id === preset;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => {
              haptics.transport();
              onChange(opt.id);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Preset ${opt.label}`}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing[2] ?? 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    padding: 4,
  },
  chip: {
    paddingHorizontal: spacing[4] ?? 16,
    paddingVertical: spacing[2] ?? 8,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: colors.neonCyan ?? '#00f5ff',
  },
  chipText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.sizes.sm ?? 13,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacings.wide,
  },
  chipTextActive: {
    color: colors.background,
  },
});
