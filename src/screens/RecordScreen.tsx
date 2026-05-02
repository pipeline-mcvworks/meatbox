import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { audioRecorderService } from '../audio/AudioRecorderService';
import { useAudioStore } from '../state/audioStore';
import InputMeter from '../components/recorder/InputMeter';
import CountdownOverlay from '../components/recorder/CountdownOverlay';
import MetronomeControl from '../components/recorder/MetronomeControl';

// Try to import projectStore — gracefully degrade if not yet implemented
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
  duration: number;
  sampleRate: number;
  recordedAt: string;
}

const MAX_DURATION_S = 30;
const COUNTDOWN_FROM = 3;

type ScreenPhase =
  | 'permission'
  | 'idle'
  | 'countdown'
  | 'recording'
  | 'stopping'
  | 'done';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function RecordScreen(): React.JSX.Element {
  const navigation = useNavigation();

  const setMicPermission = useAudioStore((s) => s.setMicPermission);
  const micPermission = useAudioStore((s) => s.micPermission);
  const setRecordingState = useAudioStore((s) => s.setRecordingState);
  const setRecordingUri = useAudioStore((s) => s.setRecordingUri);
  const setRecordingDuration = useAudioStore((s) => s.setRecordingDuration);
  const setMeterLevel = useAudioStore((s) => s.setMeterLevel);
  const meterLevel = useAudioStore((s) => s.meterLevel);

  const projectStore = useProjectStore?.();

  const [phase, setPhase] = useState<ScreenPhase>(
    micPermission === 'granted' ? 'idle' : 'permission'
  );
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [bpm, setBpm] = useState('120');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef(0);

  // ── Permission ────────────────────────────────────────────────────────────

  const handleRequestPermission = useCallback(async () => {
    const granted = await audioRecorderService.requestPermission();
    const status = granted ? 'granted' : 'denied';
    setMicPermission(status);
    if (granted) {
      setPhase('idle');
    } else {
      Alert.alert(
        'Microphone Required',
        'Please enable microphone access in your device settings to record.',
        [{ text: 'OK' }]
      );
    }
  }, [setMicPermission]);

  // Check permission on mount
  useEffect(() => {
    audioRecorderService.checkPermission().then((status) => {
      setMicPermission(status);
      if (status === 'granted') setPhase('idle');
    });
  }, [setMicPermission]);

  // ── Countdown ─────────────────────────────────────────────────────────────

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    let count = COUNTDOWN_FROM;
    setCountdownValue(count);

    const tick = () => {
      count -= 1;
      if (count > 0) {
        setCountdownValue(count);
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        setCountdownValue(null);
        beginRecording();
      }
    };
    countdownRef.current = setTimeout(tick, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Recording ─────────────────────────────────────────────────────────────

  const beginRecording = useCallback(async () => {
    elapsedRef.current = 0;
    setElapsed(0);
    setPhase('recording');
    setRecordingState('recording');
    setMeterLevel(0);

    await audioRecorderService.startRecording((level) => {
      setMeterLevel(level);
    });

    // Start timer
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= MAX_DURATION_S) {
        handleStop();
      }
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setRecordingState, setMeterLevel]);

  const handleStop = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase('stopping');
    setRecordingState('idle');
    setMeterLevel(0);

    const result = await audioRecorderService.stopRecording();

    if (!result) {
      Alert.alert('Recording Error', 'Could not save the recording. Please try again.');
      setPhase('idle');
      return;
    }

    const rawRef: RawRecordingRef = {
      uri: result.uri,
      duration: result.duration,
      sampleRate: result.sampleRate,
      recordedAt: new Date().toISOString(),
    };

    setRecordingUri(result.uri);
    setRecordingDuration(result.duration);

    // Persist to projectStore if available
    if (projectStore?.setRawRecording) {
      projectStore.setRawRecording(rawRef);
    }

    setPhase('done');

    // Navigate to Analyze
    try {
      (navigation as any).navigate('Analyze', { recording: rawRef });
    } catch {
      // Navigator may not have Analyze yet; stay on done phase
    }
  }, [setRecordingState, setMeterLevel, setRecordingUri, setRecordingDuration, projectStore, navigation]);

  const handleRetry = useCallback(async () => {
    await audioRecorderService.cancelRecording();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    setElapsed(0);
    elapsedRef.current = 0;
    setCountdownValue(null);
    setMeterLevel(0);
    setRecordingState('idle');
    setPhase('idle');
  }, [setMeterLevel, setRecordingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearTimeout(countdownRef.current);
      audioRecorderService.cancelRecording();
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const isRecording = phase === 'recording';
  const isBusy = phase === 'countdown' || phase === 'stopping';
  const progressPct = Math.min(elapsed / MAX_DURATION_S, 1);

  return (
    <View style={styles.root}>
      <CountdownOverlay count={countdownValue} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Record</Text>

        {/* ── Permission gate ── */}
        {phase === 'permission' && (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>
              Mouthbeat Machine needs access to your microphone to record.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={handleRequestPermission}>
              <Text style={styles.primaryBtnText}>Grant Microphone Access</Text>
            </Pressable>
          </View>
        )}

        {/* ── Main recorder UI ── */}
        {phase !== 'permission' && (
          <>
            {/* Timer */}
            <Text style={styles.timer}>{formatTime(elapsed)}</Text>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPct * 100}%`,
                    backgroundColor:
                      progressPct > 0.85
                        ? '#ff3333'
                        : colors.neonCyan ?? '#00f5ff',
                  },
                ]}
              />
            </View>
            <Text style={styles.maxLabel}>Max {MAX_DURATION_S}s</Text>

            {/* Meter + Record button row */}
            <View style={styles.meterRow}>
              <InputMeter level={meterLevel} height={140} width={24} />

              {/* Record / Stop button */}
              <Pressable
                style={[
                  styles.recordBtn,
                  isRecording && styles.recordBtnActive,
                  isBusy && styles.recordBtnDisabled,
                ]}
                onPress={() => {
                  if (isRecording) {
                    handleStop();
                  } else if (phase === 'idle' || phase === 'done') {
                    startCountdown();
                  }
                }}
                disabled={isBusy}
                accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.recordBtnInner,
                    isRecording && styles.recordBtnInnerActive,
                  ]}
                />
              </Pressable>

              <InputMeter level={meterLevel} height={140} width={24} />
            </View>

            <Text style={styles.recordHint}>
              {phase === 'idle' && 'Tap to start recording'}
              {phase === 'countdown' && 'Get ready…'}
              {phase === 'recording' && 'Recording — tap to stop'}
              {phase === 'stopping' && 'Saving…'}
              {phase === 'done' && 'Recording saved!'}
            </Text>

            {/* Retry button */}
            {(isRecording || phase === 'done' || phase === 'countdown') && (
              <Pressable style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>↺  Retry</Text>
              </Pressable>
            )}

            {/* Metronome */}
            {(phase === 'idle' || phase === 'done') && (
              <View style={styles.metronomeWrapper}>
                <MetronomeControl
                  enabled={metronomeEnabled}
                  bpm={bpm}
                  onToggle={setMetronomeEnabled}
                  onBpmChange={setBpm}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    gap: spacing[4],
  },
  title: {
    color: colors.neonPink,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    marginBottom: spacing[2],
  },
  // Permission
  permissionBox: {
    alignItems: 'center',
    gap: spacing[4],
    maxWidth: 320,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  primaryBtn: {
    backgroundColor: colors.neonPink,
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
  },
  primaryBtnText: {
    color: '#0a0a0f',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  // Timer
  timer: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  // Progress
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  maxLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: typography.sizes.xs,
    alignSelf: 'flex-end',
  },
  // Meter + button row
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    marginVertical: spacing[2],
  },
  // Record button
  recordBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.neonPink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  recordBtnActive: {
    borderColor: '#ff3333',
    backgroundColor: 'rgba(255,51,51,0.12)',
  },
  recordBtnDisabled: {
    opacity: 0.4,
  },
  recordBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.neonPink,
  },
  recordBtnInnerActive: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ff3333',
  },
  // Hint
  recordHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  // Retry
  retryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  retryBtnText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  // Metronome
  metronomeWrapper: {
    marginTop: spacing[2],
    width: '100%',
    paddingHorizontal: spacing[2],
  },
});
