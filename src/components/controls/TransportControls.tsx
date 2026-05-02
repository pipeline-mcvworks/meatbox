/**
 * TransportControls
 * Quantize-strength, swing, and humanize sliders. Each writes to projectStore
 * AND triggers applyQuantizeToSelection (acts on selected event if one is
 * selected, else on all unlocked events).
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { useProjectStore } from '../../state/projectStore';
import { useUiStore } from '../../state/uiStore';

interface SliderProps {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  steps?: number;
}

function Slider({ label, value, onCommit, steps = 10 }: SliderProps): React.JSX.Element {
  const cells = Array.from({ length: steps }, (_, i) => i + 1);
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>
        {label} {Math.round(value * 100)}%
      </Text>
      <View style={styles.cells}>
        {cells.map((cellIdx) => {
          const cellValue = cellIdx / steps;
          const filled = value >= cellValue - 1e-6;
          return (
            <TouchableOpacity
              key={cellIdx}
              style={[
                styles.cell,
                { backgroundColor: filled ? colors.neonGreen : colors.border },
              ]}
              onPress={() => onCommit(cellValue)}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TransportControls(): React.JSX.Element {
  const quantize = useProjectStore((s) => s.quantizeStrength);
  const swing = useProjectStore((s) => s.swing);
  const humanize = useProjectStore((s) => s.humanize);
  const setQuantize = useProjectStore((s) => s.setQuantizeStrength);
  const setSwing = useProjectStore((s) => s.setSwing);
  const setHumanize = useProjectStore((s) => s.setHumanize);
  const apply = useProjectStore((s) => s.applyQuantizeToSelection);
  const selectedEventId = useUiStore((s) => s.selectedEventId);

  const targetIds = selectedEventId ? [selectedEventId] : [];

  const handleQuantize = (v: number) => {
    setQuantize(v);
    apply(targetIds);
  };
  const handleSwing = (v: number) => {
    setSwing(v);
    apply(targetIds);
  };
  const handleHumanize = (v: number) => {
    setHumanize(v);
    apply(targetIds);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Timing {selectedEventId ? '(selected)' : '(all unlocked)'}
      </Text>
      <Slider label="Quantize" value={quantize} onCommit={handleQuantize} />
      <Slider label="Swing" value={swing} onCommit={handleSwing} />
      <Slider label="Humanize" value={humanize} onCommit={handleHumanize} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heading: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacings.wide,
  },
  sliderRow: {
    marginBottom: spacing[2],
  },
  sliderLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  cells: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    height: 18,
    borderRadius: 3,
    marginRight: 3,
  },
});
