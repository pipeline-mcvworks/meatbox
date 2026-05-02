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
  bpm: string;
  onToggle: (value: boolean) => void;
  onBpmChange: (value: string) => void;
}

export default function MetronomeControl({
  enabled,
  bpm,
  onToggle,
  onBpmChange,
}: MetronomeControlProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Metronome</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: colors.neonCyan ?? '#00f5ff' }}
        thumbColor={enabled ? '#ffffff' : 'rgba(255,255,255,0.5)'}
      />
      {enabled && (
        <View style={styles.bpmRow}>
          <TextInput
            style={styles.bpmInput}
            value={bpm}
            onChangeText={onBpmChange}
            keyboardType="number-pad"
            maxLength={3}
            placeholderTextColor="rgba(255,255,255,0.3)"
            placeholder="120"
            selectTextOnFocus
          />
          <Text style={styles.bpmUnit}>BPM</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    minWidth: 80,
  },
  bpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  bpmInput: {
    color: '#ffffff',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    width: 56,
    textAlign: 'center',
  },
  bpmUnit: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: typography.sizes.sm,
  },
});
