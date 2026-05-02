import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, spacing, typography } from '../../theme';
import { useProjectStore, selectLanes } from '../../state/projectStore';

export default function LaneControls(): React.JSX.Element {
  const lanes = useProjectStore(selectLanes);
  const updateLane = useProjectStore((s) => s.updateLane);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lane Controls</Text>
      {lanes.map((lane) => (
        <View key={lane.id} style={styles.laneRow}>
          <Text style={styles.laneName}>{lane.name}</Text>
          <View style={styles.controls}>
            <Text style={styles.label}>Vol</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={lane.volume}
              onValueChange={(value) => updateLane(lane.id, { volume: value })}
              minimumTrackTintColor={colors.neonPurple}
              maximumTrackTintColor={colors.surface}
              thumbTintColor={colors.white}
            />
            <Text style={styles.value}>{Math.round(lane.volume * 100)}%</Text>
          </View>
          <View style={styles.toggles}>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>M</Text>
              <Switch
                value={lane.muted}
                onValueChange={(value) => updateLane(lane.id, { muted: value })}
                trackColor={{ false: colors.surface, true: colors.neonRed }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>S</Text>
              <Switch
                value={lane.solo}
                onValueChange={(value) => updateLane(lane.id, { solo: value })}
                trackColor={{ false: colors.surface, true: colors.neonOrange }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
  },
  title: {
    color: colors.neonOrange,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
  },
  laneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing[2],
  },
  laneName: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    width: 60,
  },
  controls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
  value: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    width: 35,
    textAlign: 'right',
  },
  toggles: {
    flexDirection: 'row',
    marginLeft: spacing[2],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[1],
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginRight: 2,
  },
});
