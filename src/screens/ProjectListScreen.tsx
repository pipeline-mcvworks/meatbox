import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import {
  listProjects,
  loadProject,
  deleteProject,
  ProjectListing,
} from '../persistence';
import { useProjectStore } from '../store/projectStore';

export default function ProjectListScreen(): React.JSX.Element {
  const navigation = useNavigation<{ navigate: (name: string) => void }>();
  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await listProjects();
      setProjects(items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLoad = useCallback(
    async (id: string) => {
      try {
        const proj = await loadProject(id);
        const store = useProjectStore.getState() as unknown as {
          loadProject?: (p: unknown) => void;
          setProject?: (p: unknown) => void;
          hydrate?: (p: unknown) => void;
        };
        if (typeof store.loadProject === 'function') {
          store.loadProject(proj);
        } else if (typeof store.setProject === 'function') {
          store.setProject(proj);
        } else if (typeof store.hydrate === 'function') {
          store.hydrate(proj);
        } else {
          // Fallback: shallow-merge known fields onto the store.
          (useProjectStore as unknown as {
            setState: (partial: Record<string, unknown>) => void;
          }).setState({
            id: proj.id,
            name: proj.name,
            bpm: proj.bpm,
            bars: proj.bars,
            lanes: proj.lanes,
            events: proj.events,
          });
        }
        try {
          navigation.navigate('Timeline');
        } catch {
          // Navigation target may differ; ignore if not registered.
        }
      } catch (e) {
        Alert.alert('Load failed', (e as Error).message);
      }
    },
    [navigation],
  );

  const handleDelete = useCallback(
    (item: ProjectListing) => {
      Alert.alert(
        'Delete project?',
        `"${item.name}" will be permanently deleted.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteProject(item.id);
                await refresh();
              } catch (e) {
                Alert.alert('Delete failed', (e as Error).message);
              }
            },
          },
        ],
      );
    },
    [refresh],
  );

  const renderItem = ({ item }: { item: ProjectListing }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowMain}
        onPress={() => handleLoad(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Load project ${item.name}`}
      >
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowMeta}>
          {item.bpm ? `${item.bpm} BPM` : ''}
          {item.bars ? ` • ${item.bars} bars` : ''}
          {item.savedAt ? ` • ${new Date(item.savedAt).toLocaleString()}` : ''}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        accessibilityRole="button"
        accessibilityLabel={`Delete project ${item.name}`}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projects</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          projects.length === 0 ? styles.emptyContent : styles.listContent
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No saved projects yet. Save one from the Timeline screen.
          </Text>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing[8],
    paddingHorizontal: spacing[4],
  },
  title: {
    color: colors.neonPink,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    marginBottom: spacing[4],
  },
  listContent: {
    paddingBottom: spacing[8],
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  rowMain: {
    flex: 1,
  },
  rowName: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  rowMeta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  deleteButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.neonPink,
    marginLeft: spacing[2],
  },
  deleteText: {
    color: colors.neonPink,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  error: {
    color: colors.neonPink,
    marginBottom: spacing[2],
  },
});
