/**
 * HomeScreen
 *
 * Entry point. Shows app title, primary actions, and recent projects.
 * The "Try Demo Beat" button loads the defaultProject fixture into the
 * project store (if available) and navigates to the Timeline screen.
 *
 * Store import is guarded so the screen compiles even when projectStore
 * has not been wired up yet — it falls back to passing the fixture as a
 * navigation param.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import ControlsButton from '../components/controls/ControlsButton';
import { EmptyState } from '../components/visualizer';
import { defaultProject } from '../fixtures/defaultProject';

// ---------------------------------------------------------------------------
// Optional project store — may not exist in all build phases.
// We import it statically but wrap in a try/catch at module level so that
// a missing module does not crash the bundle.
// ---------------------------------------------------------------------------
type ProjectStoreHook = {
  getState: () => {
    recentProjects?: unknown[];
    projects?: unknown[];
    loadDefaultProject?: () => void;
    loadProject?: (p: unknown) => void;
    setProject?: (p: unknown) => void;
  };
  subscribe?: (cb: () => void) => () => void;
};

let projectStoreModule: ProjectStoreHook | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const mod = require('../state/projectStore');
  if (mod && typeof mod.useProjectStore?.getState === 'function') {
    projectStoreModule = mod.useProjectStore as ProjectStoreHook;
  }
} catch {
  projectStoreModule = null;
}

// ---------------------------------------------------------------------------

interface RecentProject {
  id: string;
  name: string;
  date: string;
}

function readRecentProjects(): RecentProject[] {
  if (!projectStoreModule) return [];
  try {
    const state = projectStoreModule.getState();
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
}

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(
    () => readRecentProjects(),
  );

  // Subscribe to store changes so the list stays fresh.
  useEffect(() => {
    if (!projectStoreModule?.subscribe) return;
    const unsub = projectStoreModule.subscribe(() => {
      setRecentProjects(readRecentProjects());
    });
    return unsub;
  }, []);

  const handleDemoProject = useCallback(() => {
    let loadedViaStore = false;
    if (projectStoreModule) {
      try {
        const state = projectStoreModule.getState();
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
        // ignore — fall through to nav-param path
      }
    }

    if (loadedViaStore) {
      navigation.navigate('Timeline');
    } else {
      // Store unavailable: pass fixture as nav param so Timeline can render it.
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
