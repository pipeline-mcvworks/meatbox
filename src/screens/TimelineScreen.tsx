import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useProjectStore } from '../store/projectStore';
import TimelineCanvas from '../components/timeline/TimelineCanvas';
import ControlsButton from '../components/controls/ControlsButton';

export default function TimelineScreen(): React.JSX.Element {
  const project = useProjectStore((state) => state.currentProject);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Project Loaded</Text>
        <Text style={styles.subtitle}>Load a project from the Home screen.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{project.name}</Text>
      <Text style={styles.bpm}>BPM: {project.bpm}</Text>
      <View style={styles.timelineContainer}>
        <TimelineCanvas
          events={project.events}
          beatsPerBar={project.beatsPerBar}
          totalBeats={project.totalBeats}
        />
      </View>
      <View style={styles.controlsRow}>
        <ControlsButton title="Play" onPress={() => {}} variant="primary" />
        <ControlsButton title="Stop" onPress={() => {}} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing[4],
    paddingTop: spacing[8],
  },
  title: {
    color: colors.neonYellow,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  bpm: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  timelineContainer: {
    flex: 1,
    marginBottom: spacing[4],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
