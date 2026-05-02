import React from 'react';
import {
  View,
  Text,
  Switch,
  TextInput,
  StyleSheet,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface MetronomeControlProps {
  enabled: boolean;
  bpm: number;
  onToggle: (value: boolean) => void;
  onBpmChange: (bpm: number) => void;
}

export default function MetronomeControl({
  enabled,
  bpm,
  onToggle,
  onBpmChange,
}: MetronomeControlProps): React.JSX.Element {
  const handleBpmText = (text: string) => {
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 20 && parsed <= 300) {
      onBpmChange(parsed);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Metronome</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.neonCyan ?? '#00f5ff' }}
        thumbColor={enabled ? '#fff' : 'rgba(255,255,255,0.5)'}
      />
      {enabled && (
        <View style={styles.bpmRow}>
          <TextInput
            style={styles.bpmInput}
            keyboardType="number-pad"
            value={String(bpm)}
            onChangeText={handleBpmText}
            maxLength={3}
            selectTextOnFocus
          />
          <Text style={styles.bpmLabel}>BPM</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3] ?? 12,
    paddingVertical: spacing[2] ?? 8,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.sm ?? 14,
    fontWeight: typography.weights.medium,
    minWidth: 90,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] ?? 4,
    marginLeft: spacing[2] ?? 8,
  },
  bpmInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: typography.sizes.base ?? 16,
    fontWeight: typography.weights.bold,
    borderRadius: 6,
    paddingHorizontal: spacing[2] ?? 8,
    paddingVertical: spacing[1] ?? 4,
    width: 60,
    textAlign: 'center',
  },
  bpmLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: typography.sizes.sm ?? 14,
  },
});
