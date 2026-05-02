import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useProjectStore } from '../store/projectStore';
import ControlsButton from '../components/controls/ControlsButton';

const RECENT_PROJECTS = [
  { id: '1', name: 'My First Beat', date: '2025-01-15' },
  { id: '2', name: 'Late Night Jam', date: '2025-01-12' },
  { id: '3', name: 'Demo Project', date: '2025-01-10' },
];

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const loadDefaultProject = useProjectStore((state) => state.loadDefaultProject);

  const handleDemoProject = () => {
    loadDefaultProject();
    navigation.navigate('Timeline');
  };

  const renderProjectItem = ({ item }: { item: { id: string; name: string; date: string } }) => (
    <TouchableOpacity style={styles.projectItem}>
      <Text style={styles.projectName}>{item.name}</Text>
      <Text style={styles.projectDate}>{item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>BeatForge</Text>
      <Text style={styles.tagline}>Build beats, one layer at a time</Text>

      <View style={styles.buttonGroup}>
        <ControlsButton
          title="Start Recording"
          onPress={() => navigation.navigate('Record')}
          variant="primary"
        />
        <ControlsButton
          title="Demo Project"
          onPress={handleDemoProject}
          variant="secondary"
        />
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        <FlatList
          data={RECENT_PROJECTS}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          style={styles.projectList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing[4],
    paddingTop: spacing[12],
  },
  appName: {
    color: colors.neonCyan,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  tagline: {
    color: colors.neonGreen,
    fontSize: typography.sizes.lg,
    textAlign: 'center',
    marginBottom: spacing[8],
    fontStyle: 'italic',
  },
  buttonGroup: {
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  recentSection: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.neonYellow,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing[3],
  },
  projectList: {
    flex: 1,
  },
  projectItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  projectDate: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
