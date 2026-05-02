import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import ControlsButton from '../components/controls/ControlsButton';
import { EmptyState } from '../components/visualizer';
import { defaultProject } from '../fixtures/defaultProject';

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

  // Reactive recent-projects list from store (if available).
  // We use a useState + useEffect pattern so the store subscription is
  // reactive rather than a one-shot getState() snapshot inside useMemo.
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    if (!useProjectStore) return;
    const readProjects = () => {
      try {
        const state = useProjectStore.getState?.();
        const list = state?.recentProjects ?? state?.projects ?? null;
        if (Array.isArray(list)) {
          setRecentProjects(
            list.map((p: any) => ({
              id: String(p.id ?? p.title ?? Math.random()),
              name: String(p.name ?? p.title ?? 'Untitled'),
              date: String(p.updatedAt ?? p.createdAt ?? ''),
            }))
          );
          return;
        }
      } catch {
        // ignore
      }
      setRecentProjects([]);
    };

    readProjects();

    // Subscribe to store changes if the store exposes subscribe().
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = useProjectStore.subscribe?.(readProjects);
    } catch {
      // ignore
    }
    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleDemoProject = useCallback(() => {
    // 1. Try to load via store action (preferred — keeps store in sync).
    let loadedViaStore = false;
    try {
      const state = useProjectStore?.getState?.();
      if (typeof state?.loadDefaultProject === 'function') {
        state.loadDefaultProject();
        loadedViaStore = true;
      } else if (typeof state?.loadProject === 'function') {
        state.loadProject(defaultProject);
        loadedViaStore = true;
      } else if (typeof state?.setProject === 'function') {
        state.setProject(defaultProject);
        loadedViaStore = true;
      }
    } catch {
      // ignore
    }

    // 2. If store action unavailable, pass the fixture directly as a nav param
    //    so the Timeline screen can render it without a store.
    if (loadedViaStore) {
      navigation.navigate('Timeline');
    } else {
      navigation.navigate('Timeline', { demoProject: defaultProject });
    }
  }, [navigation]);

  const handleVisualizer = useCallback(() => {
    try {
      navigation.navigate('Visualizer');
    } catch {
      // ignore
    }
  }, [navigation]);

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
