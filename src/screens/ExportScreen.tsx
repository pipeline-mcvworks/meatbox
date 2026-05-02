import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useProjectStore } from '../store/projectStore';
import { saveProject } from '../persistence';
import { exportProjectJson } from '../export';

export default function ExportScreen(): React.JSX.Element {
  const project = useProjectStore((s) => ({
    id: s.id,
    name: s.name,
    bpm: s.bpm,
    bars: s.bars,
    lanes: s.lanes,
    events: s.events,
  }));

  const [busy, setBusy] = useState<null | 'save' | 'json'>(null);
  const [status, setStatus] = useState<string | null>(null);

  const hasProject = !!project.id;

  const handleSaveLocally = useCallback(async () => {
    if (!hasProject) {
      Alert.alert('No project', 'Load or create a project first.');
      return;
    }
    setBusy('save');
    setStatus(null);
    try {
      const listing = await saveProject(project);
      setStatus(`Saved "${listing.name}".`);
    } catch (e) {
      Alert.alert('Save failed', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [project, hasProject]);

  const handleExportJson = useCallback(async () => {
    if (!hasProject) {
      Alert.alert('No project', 'Load or create a project first.');
      return;
    }
    setBusy('json');
    setStatus(null);
    try {
      const ok = await exportProjectJson(project);
      if (!ok) {
        Alert.alert(
          'Sharing unavailable',
          'The system share sheet is not available on this device.',
        );
      } else {
        setStatus('Shared project JSON.');
      }
    } catch (e) {
      Alert.alert('Export failed', (e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [project, hasProject]);

  const handleComingSoon = useCallback((label: string) => {
    Alert.alert(label, 'Coming soon.');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export</Text>
      {hasProject ? (
        <Text style={styles.subtitle}>{project.name}</Text>
      ) : (
        <Text style={styles.subtitle}>No project loaded</Text>
      )}

      <TouchableOpacity
        style={[styles.button, !hasProject && styles.buttonDisabled]}
        onPress={handleSaveLocally}
        disabled={!hasProject || busy !== null}
        accessibilityRole="button"
        accessibilityLabel="Save Locally"
      >
        {busy === 'save' ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>Save Locally</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !hasProject && styles.buttonDisabled]}
        onPress={handleExportJson}
        disabled={!hasProject || busy !== null}
        accessibilityRole="button"
        accessibilityLabel="Export JSON"
      >
        {busy === 'json' ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.buttonText}>Export JSON</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonStub]}
        onPress={() => handleComingSoon('Export MIDI')}
        accessibilityRole="button"
        accessibilityLabel="Export MIDI (coming soon)"
      >
        <Text style={styles.buttonStubText}>Export MIDI (coming soon)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonStub]}
        onPress={() => handleComingSoon('Export WAV')}
        accessibilityRole="button"
        accessibilityLabel="Export WAV (coming soon)"
      >
        <Text style={styles.buttonStubText}>Export WAV (coming soon)</Text>
      </TouchableOpacity>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing[8],
    paddingHorizontal: spacing[4],
    alignItems: 'stretch',
  },
  title: {
    color: colors.neonGreen,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  button: {
    backgroundColor: colors.neonGreen,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    marginBottom: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
  },
  buttonStub: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  buttonStubText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  status: {
    color: colors.neonGreen,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
