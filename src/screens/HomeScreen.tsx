import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import ControlsButton from '../components/controls/ControlsButton';
import { EmptyState } from '../components/visualizer';

// Project store loader is optional (different phases expose different APIs).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let useProjectStore: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  useProjectStore = require('../store/projectStore').useProjectStore;
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    useProjectStore = require('../state/projectStore').useProjectStore;
  } catch {
    useProjectStore = null;
  }
}

interface RecentProject {
  id: string;
  name: string;
  date: string;
}

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  const recentProjects: RecentProject[] = useMemo(() => {
    if (!useProjectStore) return [];
    try {
      // Try to read a list of saved projects from store if available.
      const state = useProjectStore.getState?.();
      const list = state?.recentProjects ?? state?.projects ?? null;
      if (Array.isArray(list)) {
        return list.map((p: any) => ({
          id: String(p.id ?? p.title ?? Math.random()),
          name: String(p.name ?? p.title ?? 'Untitled'),
          date: String(p.updatedAt ?? p.createdAt ?? ''),
        }));
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  const handleDemoProject = () => {
    let loaded = false;
    try {
      const state = useProjectStore?.getState?.();
      if (state?.loadDefaultProject) {
        state.loadDefaultProject();
        loaded = true;
      }
    } catch {
      // ignore
    }
    if (!loaded) {
      try {
        const loadDefaultProject = useProjectStore?.((s: any) => s.loadDefaultProject);
        if (typeof loadDefaultProject === 'function') {
          loadDefaultProject();
        }
      } catch {
        // ignore
      }
    }
    navigation.navigate('Timeline');
  };

  const handleVisualizer = () => {
    try {
      navigation.navigate('Visualizer');
    } catch {
      // ignore
    }
  };

  const renderProjectItem = ({ item }: { item: RecentProject }) => (
    <TouchableOpacity
      style={styles.projectItem}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open project ${item.name}`}
    >
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
          title="Try Demo Beat"
          onPress={handleDemoProject}
          variant="secondary"
        />
        <ControlsButton
          title="Visualizer"
          onPress={handleVisualizer}
          variant="secondary"
        />
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        {recentProjects.length === 0 ? (
          <EmptyState
            icon="🥁"
            title="No projects yet"
            body="Tap Start Recording to capture a beat, or try the demo to see how it works."
            ctaLabel="Try Demo Beat"
            onCta={handleDemoProject}
          />
        ) : (
          <FlatList
            data={recentProjects}
            keyExtractor={(item) => item.id}
            renderItem={renderProjectItem}
            style={styles.projectList}
          />
        )}
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
    textShadowColor: 'rgba(0, 245, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
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
    alignItems: 'center',
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
