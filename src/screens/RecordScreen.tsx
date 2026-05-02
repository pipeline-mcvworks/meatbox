import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { audioRecorderService } from '../audio/AudioRecorderService';
import { useAudioStore } from '../state/audioStore';
import { InputMeter, CountdownOverlay, MetronomeControl } from '../components/recorder';

// Attempt to import projectStore — it may not exist yet in this phase
let useProjectStore: (() => { setRawRecording?: (r: RawRecordingRef) => void }) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../state/projectStore');
  useProjectStore = mod.useProjectStore ?? null;
} catch {
  useProjectStore = null;
}

interface RawRecordingRef {
  uri: string;
  durationMs: number;
  sampleRate: number;
  capturedAt: string;
  bpm?: number;
}

const MAX_DURATION_S = 30;
const COUNTDOWN_FROM = 3;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RecordScreen(): React.JSX.Element {
  const navigation = useNavigation();

  // Store
  const micPermission = useAudioStore((s) => s.micPermission);
  const recordingState = useAudioStore((s) => s.recordingState);
  const liveInputLevel = useAudioStore((s) => s.liveInputLevel);
  const setMicPermission = useAudioStore((s) => s.setMicPermission);
  const setRecordingState = useAudioStore((s) => s.setRecordingState);
  const setRecordingUri = useAudioStore((s) => s.setRecordingUri);
  const setRecordingDuration = useAudioStore((s) => s.setRecordingDuration);
  const setLiveInputLevel = useAudioStore((s) => s.setLiveInputLevel);
  const resetAudio = useAudioStore((s) => s.resetAudio);

  const projectStore = useProjectStore ? useProjectStore() : null;

  // Local state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [bpm, setBpm] = useState(120);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecording = recordingState === 'recording';

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      _clearTimer();
      _clearCountdown();
      audioRecorderService.cancelRecording().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Permission check on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (micPermission === 'undetermined') {
      audioRecorderService.checkPermission().then((status) => {
        setMicPermission(status);
      });
    }
  }, [micPermission, setMicPermission]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const _clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const _clearCountdown = () => {
    if (countdownRef.current !== null) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startTimer = () => {
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= MAX_DURATION_S) {
          // Auto-stop at max duration
          handleStop();
        }
        return next;
      });
    }, 1000);
  };

  // -------------------------------------------------------------------------
  // Permission request
  // -------------------------------------------------------------------------
  const handleRequestPermission = useCallback(async () => {
    const granted = await audioRecorderService.requestPermission();
    setMicPermission(granted ? 'granted' : 'denied');
    if (!granted) {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in Settings to record.',
        [{ text: 'OK' }]
      );
    }
  }, [setMicPermission]);

  // -------------------------------------------------------------------------
  // Start recording (with countdown)
  // -------------------------------------------------------------------------
  const handleRecord = useCallback(() => {
    if (micPermission !== 'granted') {
      handleRequestPermission();
      return;
    }
    if (isRecording) return;

    setRecordingState('idle');
    setElapsedSeconds(0);
    setLiveInputLevel(0);

    let count = COUNTDOWN_FROM;
    setCountdown(count);

    const tick = () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        setCountdown(null);
        _beginRecording();
      }
    };

    countdownRef.current = setTimeout(tick, 1000);
  }, [micPermission, isRecording, handleRequestPermission, setRecordingState, setLiveInputLevel]);

  const _beginRecording = async () => {
    try {
      await audioRecorderService.startRecording((level) => {
        setLiveInputLevel(level);
      });
      setRecordingState('recording');
      startTimer();
    } catch (err) {
      setRecordingState('idle');
      Alert.alert('Recording Error', String(err));
    }
  };

  // -------------------------------------------------------------------------
  // Stop recording
  // -------------------------------------------------------------------------
  const handleStop = useCallback(async () => {
    if (!isRecording) return;
    _clearTimer();
    setRecordingState('idle');
    setLiveInputLevel(0);

    try {
      const result = await audioRecorderService.stopRecording();
      if (!result) {
        Alert.alert('Recording Error', 'No recording data was captured.');
        return;
      }

      const rawRef: RawRecordingRef = {
        uri: result.uri,
        durationMs: result.durationMs,
        sampleRate: result.sampleRate,
        capturedAt: new Date().toISOString(),
        bpm: metronomeEnabled ? bpm : undefined,
      };

      setRecordingUri(result.uri);
      setRecordingDuration(Math.round(result.durationMs / 1000));

      if (projectStore?.setRawRecording) {
        projectStore.setRawRecording(rawRef);
      }

      // Navigate to Analyze screen
      (navigation as any).navigate('Analyze', { rawRecording: rawRef });
    } catch (err) {
      Alert.alert('Stop Error', String(err));
    }
  }, [isRecording, metronomeEnabled, bpm, setRecordingState, setLiveInputLevel, setRecordingUri, setRecordingDuration, projectStore, navigation]);

  // -------------------------------------------------------------------------
  // Retry
  // -------------------------------------------------------------------------
  const handleRetry = useCallback(async () => {
    _clearTimer();
    _clearCountdown();
    await audioRecorderService.cancelRecording();
    resetAudio();
    setElapsedSeconds(0);
    setCountdown(null);
  }, [resetAudio]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const renderPermissionGate = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionIcon}>🎤</Text>
      <Text style={styles.permissionTitle}>Microphone Access Needed</Text>
      <Text style={styles.permissionBody}>
        MouthBeat Machine needs access to your microphone to record beatbox
        performances.
      </Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleRequestPermission}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDenied = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionIcon}>🚫</Text>
      <Text style={styles.permissionTitle}>Microphone Denied</Text>
      <Text style={styles.permissionBody}>
        Please enable microphone access in your device Settings to use this
        feature.
      </Text>
    </View>
  );

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  if (micPermission === 'undetermined') return renderPermissionGate();
  if (micPermission === 'denied') return renderDenied();

  const progressPercent = Math.min((elapsedSeconds / MAX_DURATION_S) * 100, 100);
  const nearLimit = elapsedSeconds >= MAX_DURATION_S - 5;

  return (
    <View style={styles.container}>
      {/* Countdown overlay */}
      <CountdownOverlay count={countdown} />

      {/* Header */}
      <Text style={styles.title}>Record</Text>

      {/* Timer */}
      <View style={styles.timerRow}>
        <Text style={[styles.timer, nearLimit && isRecording && styles.timerWarning]}>
          {formatTime(elapsedSeconds)}
        </Text>
        <Text style={styles.timerMax}> / {formatTime(MAX_DURATION_S)}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressPercent}%` as any },
            nearLimit && styles.progressBarWarning,
          ]}
        />
      </View>

      {/* Meter + Record button row */}
      <View style={styles.recordRow}>
        <InputMeter level={liveInputLevel} height={160} width={20} />

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            countdown !== null && styles.recordButtonDisabled,
          ]}
          onPress={isRecording ? handleStop : handleRecord}
          disabled={countdown !== null}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerStop,
            ]}
          />
        </TouchableOpacity>

        {/* Spacer to balance the meter */}
        <View style={{ width: 20 }} />
      </View>

      {/* Label */}
      <Text style={styles.recordLabel}>
        {countdown !== null
          ? 'Get ready…'
          : isRecording
          ? 'Tap to stop'
          : 'Tap to record'}
      </Text>

      {/* Metronome */}
      <View style={styles.metronomeWrapper}>
        <MetronomeControl
          enabled={metronomeEnabled}
          bpm={bpm}
          onToggle={setMetronomeEnabled}
          onBpmChange={setBpm}
        />
      </View>

      {/* Retry */}
      {!isRecording && countdown === null && elapsedSeconds > 0 && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>↺  Retry</Text>
        </TouchableOpacity>
      )}
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
    color: colors.neonPink,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    marginBottom: spacing[4] ?? 16,
  },
  // Timer
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing[2] ?? 8,
  },
  timer: {
    color: '#fff',
    fontSize: typography.sizes['4xl'] ?? 40,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  timerWarning: {
    color: colors.neonPink ?? '#ff2d78',
  },
  timerMax: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: typography.sizes.lg ?? 18,
  },
  // Progress
  progressTrack: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginBottom: spacing[6] ?? 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.neonCyan ?? '#00f5ff',
    borderRadius: 2,
  },
  progressBarWarning: {
    backgroundColor: colors.neonPink ?? '#ff2d78',
  },
  // Record row
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6] ?? 24,
    marginBottom: spacing[3] ?? 12,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 3,
    borderColor: colors.neonPink ?? '#ff2d78',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    borderColor: colors.neonCyan ?? '#00f5ff',
    backgroundColor: 'rgba(0,245,255,0.08)',
  },
  recordButtonDisabled: {
    opacity: 0.4,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.neonPink ?? '#ff2d78',
  },
  recordButtonInnerStop: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.neonCyan ?? '#00f5ff',
  },
  recordLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: typography.sizes.sm ?? 14,
    marginBottom: spacing[6] ?? 24,
    letterSpacing: 1,
  },
  // Metronome
  metronomeWrapper: {
    marginBottom: spacing[4] ?? 16,
  },
  // Retry
  retryButton: {
    paddingHorizontal: spacing[5] ?? 20,
    paddingVertical: spacing[2] ?? 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retryButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: typography.sizes.base ?? 16,
  },
  // Permission gate
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6] ?? 24,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: spacing[4] ?? 16,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: typography.sizes['2xl'] ?? 24,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing[3] ?? 12,
  },
  permissionBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: typography.sizes.base ?? 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6] ?? 24,
  },
  primaryButton: {
    backgroundColor: colors.neonPink ?? '#ff2d78',
    paddingHorizontal: spacing[6] ?? 24,
    paddingVertical: spacing[3] ?? 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: typography.sizes.base ?? 16,
    fontWeight: typography.weights.bold,
  },
});
