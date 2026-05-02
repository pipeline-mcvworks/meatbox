import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import {
  VisualizerCanvas,
  PresetSelector,
  RecordOverlay,
  MicDeniedState,
  type VisualizerPreset,
} from '../components/visualizer';
import { useAudioStore } from '../state/audioStore';

export default function VisualizerScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [preset, setPreset] = useState<VisualizerPreset>('pulse');
  const micPermission = useAudioStore((s) => s.micPermission);

  const handleQuickRecord = () => {
    try {
      navigation.navigate('Record');
    } catch {
      // navigation may not be ready in some test contexts
    }
  };

  // Mic-denied: show recovery state but still let users see a static visualizer
  // by providing override level 0. We render the canvas behind the message.
  if (micPermission === 'denied') {
    return (
      <View style={styles.container}>
        <VisualizerCanvas preset={preset} level={0} />
        <View style={styles.overlayCenter} pointerEvents="box-none">
          <MicDeniedState />
        </View>
        <View style={styles.headerOverlay} pointerEvents="box-none">
          <Text style={styles.title}>Visualizer</Text>
          <PresetSelector preset={preset} onChange={setPreset} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VisualizerCanvas preset={preset} />

      {/* Header overlay (title + preset selector) */}
      <View style={styles.headerOverlay} pointerEvents="box-none">
        <Text style={styles.title}>Visualizer</Text>
        <PresetSelector preset={preset} onChange={setPreset} />
      </View>

      {/* Quick record overlay */}
      <RecordOverlay onPress={handleQuickRecord} />

      {/* Back affordance for non-tab navigators */}
      {navigation.canGoBack?.() ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerOverlay: {
    position: 'absolute',
    top: spacing[12] ?? 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing[3] ?? 12,
  },
  title: {
    color: colors.neonCyan,
    fontSize: typography.sizes['2xl'] ?? 24,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    textShadowColor: 'rgba(0, 245, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    marginBottom: spacing[2] ?? 8,
  },
  overlayCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backButton: {
    position: 'absolute',
    top: spacing[12] ?? 48,
    left: spacing[4] ?? 16,
    paddingHorizontal: spacing[3] ?? 12,
    paddingVertical: spacing[2] ?? 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
  },
  backText: {
    color: '#fff',
    fontSize: typography.sizes.sm ?? 13,
    fontWeight: typography.weights.semibold,
  },
});
