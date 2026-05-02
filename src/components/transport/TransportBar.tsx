/**
 * TransportBar
 * Renders play, stop, loop toggle, and BPM display/edit controls.
 * Communicates with AudioPlaybackService via props callbacks so it
 * remains decoupled from the singleton.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import type { PlaybackState } from '../../audio/types';

interface TransportBarProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onBpmChange: (bpm: number) => void;
}

export default function TransportBar({
  playbackState,
  onPlay,
  onStop,
  onToggleLoop,
  onBpmChange,
}: TransportBarProps): React.JSX.Element {
  const [bpmText, setBpmText] = useState(String(playbackState.bpm));
  const [editingBpm, setEditingBpm] = useState(false);

  const handleBpmSubmit = () => {
    const parsed = parseInt(bpmText, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
      onBpmChange(parsed);
    } else {
      // Reset to current bpm if invalid.
      setBpmText(String(playbackState.bpm));
    }
    setEditingBpm(false);
  };

  // Keep bpmText in sync when external bpm changes (e.g. project load).
  React.useEffect(() => {
    if (!editingBpm) {
      setBpmText(String(playbackState.bpm));
    }
  }, [playbackState.bpm, editingBpm]);

  return (
    <View style={styles.container}>
      {/* BPM control */}
      <View style={styles.bpmContainer}>
        <Text style={styles.label}>BPM</Text>
        {editingBpm ? (
          <TextInput
            style={styles.bpmInput}
            value={bpmText}
            onChangeText={setBpmText}
            onBlur={handleBpmSubmit}
            onSubmitEditing={handleBpmSubmit}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity
            onPress={() => setEditingBpm(true)}
            accessibilityLabel={`BPM ${playbackState.bpm}, tap to edit`}
          >
            <Text style={styles.bpmValue}>{playbackState.bpm}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Playback position */}
      <Text style={styles.position}>
        {playbackState.currentBeat.toFixed(1)}
      </Text>

      {/* Transport buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.button,
            playbackState.isLooping && styles.buttonActive,
          ]}
          onPress={onToggleLoop}
          accessibilityLabel={`Loop ${playbackState.isLooping ? 'on' : 'off'}`}
        >
          <Text style={styles.buttonText}>⟳</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            playbackState.isPlaying && styles.buttonPlaying,
          ]}
          onPress={onPlay}
          disabled={playbackState.isPlaying}
          accessibilityLabel="Play"
        >
          <Text style={styles.buttonText}>▶</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onStop}
          accessibilityLabel="Stop"
        >
          <Text style={styles.buttonText}>■</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface ?? '#1a1a2e',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border ?? '#333',
  },
  bpmContainer: {
    alignItems: 'center',
    minWidth: 64,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs ?? 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  bpmValue: {
    color: colors.neonYellow,
    fontSize: typography.sizes.xl ?? 20,
    fontWeight: typography.weights.bold,
    fontVariant: Platform.OS === 'ios' ? ['tabular-nums'] : undefined,
  },
  bpmInput: {
    color: colors.neonYellow,
    fontSize: typography.sizes.xl ?? 20,
    fontWeight: typography.weights.bold,
    borderBottomWidth: 1,
    borderBottomColor: colors.neonYellow,
    minWidth: 48,
    textAlign: 'center',
    padding: 0,
  },
  position: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm ?? 12,
    fontVariant: Platform.OS === 'ios' ? ['tabular-nums'] : undefined,
    minWidth: 48,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface ?? '#1a1a2e',
    borderWidth: 1,
    borderColor: colors.border ?? '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    borderColor: colors.neonYellow,
    backgroundColor: colors.neonYellow + '22',
  },
  buttonPrimary: {
    borderColor: colors.neonGreen ?? '#39ff14',
    backgroundColor: colors.neonGreen ? colors.neonGreen + '22' : '#39ff1422',
  },
  buttonPlaying: {
    opacity: 0.5,
  },
  buttonSecondary: {
    borderColor: colors.neonPink ?? '#ff2d78',
    backgroundColor: colors.neonPink ? colors.neonPink + '22' : '#ff2d7822',
  },
  buttonText: {
    color: colors.text ?? '#ffffff',
    fontSize: 18,
  },
});
