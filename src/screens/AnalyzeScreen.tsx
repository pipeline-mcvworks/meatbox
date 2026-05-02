import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useAudioStore, selectRecordingUri, selectWaveformPeaks, selectRecordingDuration } from '../state/audioStore';
import { generateWaveformPeaks } from '../analysis/waveform';
import { Waveform } from '../components/waveform';

export default function AnalyzeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const recordingUri = useAudioStore(selectRecordingUri);
  const waveformPeaks = useAudioStore(selectWaveformPeaks);
  const recordingDuration = useAudioStore(selectRecordingDuration);
  const setWaveformPeaks = useAudioStore((s) => s.setWaveformPeaks);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get('window').width - spacing[4] * 2;

  useEffect(() => {
    async function loadWaveform() {
      if (recordingUri && recordingDuration > 0) {
        try {
          const peaks = await generateWaveformPeaks(recordingUri, recordingDuration);
          setWaveformPeaks(peaks);
        } catch (error) {
          console.error('Failed to generate waveform peaks:', error);
        }
      }
      setLoading(false);
    }
    loadWaveform();
  }, [recordingUri, recordingDuration, setWaveformPeaks]);

  const handleEditTimeline = () => {
    // No-op for now beyond navigation (placeholder)
  };

  const handleTryAgain = () => {
    navigation.navigate('Record' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze</Text>
      {loading ? (
        <Text style={styles.loadingText}>Generating waveform...</Text>
      ) : (
        <Waveform
          peaks={waveformPeaks}
          durationSeconds={recordingDuration}
          width={screenWidth}
          height={200}
          scrubPosition={0}
        />
      )}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleEditTimeline}>
          <Text style={styles.buttonText}>Edit Timeline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleTryAgain}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  title: {
    color: colors.neonGreen,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    marginBottom: spacing[4],
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    marginBottom: spacing[4],
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: spacing[6],
  },
  button: {
    backgroundColor: colors.neonGreen,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: 8,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
