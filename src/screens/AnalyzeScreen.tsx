import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import {
  useAudioStore,
  selectRecordingUri,
  selectWaveformPeaks,
  selectRecordingDuration,
} from '../state/audioStore';
import { useProjectStore, selectBpm, selectLanes } from '../state/projectStore';
import { generateWaveformPeaks } from '../analysis/waveform';
import { detectOnsets } from '../analysis/onsetDetection';
import { classifyHits } from '../analysis/classifyHit';
import { quantizeHits } from '../analysis/quantize';
import { createTimelineEvents } from '../analysis/createTimelineEvents';
import type { ClassifiedHit } from '../analysis/types';
import { Waveform } from '../components/waveform';

const DEFAULT_SENSITIVITY = 55;

export default function AnalyzeScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const recordingUri = useAudioStore(selectRecordingUri);
  const waveformPeaks = useAudioStore(selectWaveformPeaks);
  const recordingDuration = useAudioStore(selectRecordingDuration);
  const setWaveformPeaks = useAudioStore((s) => s.setWaveformPeaks);
  const bpm = useProjectStore(selectBpm);
  const lanes = useProjectStore(selectLanes);
  const setTimelineEvents = useProjectStore((s) => s.setTimelineEvents);
  const [loading, setLoading] = useState(true);
  const [sensitivity, setSensitivity] = useState(DEFAULT_SENSITIVITY);

  const waveformWidth = Math.max(0, width - spacing[4] * 2);

  useEffect(() => {
    let cancelled = false;

    async function loadWaveform() {
      setLoading(true);

      if (!recordingUri || recordingDuration <= 0) {
        setWaveformPeaks([]);
        setLoading(false);
        return;
      }

      try {
        const peaks = await generateWaveformPeaks(recordingUri, recordingDuration);

        if (!cancelled) {
          setWaveformPeaks(peaks);
        }
      } catch {
        if (!cancelled) {
          setWaveformPeaks([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWaveform();

    return () => {
      cancelled = true;
    };
  }, [recordingUri, recordingDuration, setWaveformPeaks]);

  const detectedHits = useMemo(() => {
    if (loading || waveformPeaks.length === 0 || recordingDuration <= 0) {
      return [];
    }

    const analysisSampleRate = waveformPeaks.length / recordingDuration;
    const hits = detectOnsets(waveformPeaks, {
      sampleRate: analysisSampleRate,
      sensitivity,
    });
    const classifiedHits = classifyHits(waveformPeaks, hits, {
      sampleRate: analysisSampleRate,
    });

    return quantizeHits<ClassifiedHit>(classifiedHits, {
      bpm,
      division: 16,
      strength: 100,
    });
  }, [loading, waveformPeaks, recordingDuration, sensitivity, bpm]);

  const labelSummary = useMemo(() => {
    if (detectedHits.length === 0) {
      return 'No hits detected yet';
    }

    const counts = detectedHits.reduce<Record<string, number>>((acc, hit) => {
      acc[hit.label] = (acc[hit.label] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([label, count]) => `${count} ${label}`)
      .join(' • ');
  }, [detectedHits]);

  const autoCleanDisabled = loading || detectedHits.length === 0;

  const handleAutoClean = () => {
    const timelineEvents = createTimelineEvents(detectedHits, detectedHits, detectedHits, {
      bpm,
      lanes,
    });

    setTimelineEvents(timelineEvents, 'replace');
    navigation.navigate('Timeline' as never);
  };

  const handleTryAgain = () => {
    navigation.navigate('Record' as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze</Text>
      <View style={styles.waveformContainer}>
        {loading ? (
          <Text style={styles.loadingText}>Generating waveform...</Text>
        ) : (
          <Waveform
            peaks={waveformPeaks}
            durationSeconds={recordingDuration}
            width={waveformWidth}
            height={220}
            scrubPosition={0}
            hits={detectedHits}
          />
        )}
      </View>
      <View style={styles.analysisPanel}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>Sensitivity</Text>
          <Text style={styles.analysisValue}>{Math.round(sensitivity)}%</Text>
        </View>
        <SensitivitySlider value={sensitivity} onChange={setSensitivity} width={waveformWidth} />
        <Text style={styles.hitCountText}>
          {detectedHits.length} {detectedHits.length === 1 ? 'hit' : 'hits'} detected
        </Text>
        <Text style={styles.labelSummaryText}>{labelSummary}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, autoCleanDisabled && styles.buttonDisabled]}
          onPress={handleAutoClean}
          disabled={autoCleanDisabled}
        >
          <Text style={[styles.buttonText, autoCleanDisabled && styles.buttonTextDisabled]}>Auto Clean</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleTryAgain}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface SensitivitySliderProps {
  value: number;
  onChange: (value: number) => void;
  width: number;
}

function SensitivitySlider({ value, onChange, width }: SensitivitySliderProps): React.JSX.Element {
  const [sliderWidth, setSliderWidth] = useState(Math.max(1, width));
  const fillPercent = `${clamp(value, 0, 100)}%`;

  const updateValueFromLocation = (locationX: number) => {
    const nextValue = clamp((locationX / Math.max(1, sliderWidth)) * 100, 0, 100);
    onChange(nextValue);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      updateValueFromLocation(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      updateValueFromLocation(event.nativeEvent.locationX);
    },
  });

  return (
    <View
      style={[styles.sliderTrack, { width }]}
      onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={[styles.sliderFill, { width: fillPercent }]} />
      <View style={[styles.sliderThumb, { left: fillPercent }]} />
    </View>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  waveformContainer: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    marginBottom: spacing[4],
  },
  analysisPanel: {
    width: '100%',
    marginTop: spacing[3],
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  analysisTitle: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  analysisValue: {
    color: colors.neonGreen,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  sliderTrack: {
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(57, 255, 20, 0.32)',
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    marginLeft: -9,
    borderRadius: 9,
    backgroundColor: colors.neonGreen,
    borderColor: colors.white,
    borderWidth: 1,
  },
  hitCountText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginTop: spacing[2],
  },
  labelSummaryText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
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
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  buttonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
