/**
 * TimelineScreen
 * Displays the project timeline and wires up audio playback transport.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useProjectStore } from '../store/projectStore';
import TimelineCanvas from '../components/timeline/TimelineCanvas';
import { TransportBar } from '../components/transport';
import { audioPlaybackService } from '../audio';
import type { PlaybackState, SchedulerEvent, SampleKey } from '../audio/types';
import type { TimelineEvent, Lane } from '../store/projectStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a lane instrument name to a SampleKey.
 * Falls back to 'perc' for unknown instruments.
 */
function instrumentToSampleKey(instrument: string): SampleKey {
  const lower = instrument.toLowerCase();
  if (lower.includes('kick') || lower.includes('bass drum')) return 'kick';
  if (lower.includes('snare') || lower.includes('clap')) return 'snare';
  if (lower.includes('hat') || lower.includes('cymbal') || lower.includes('hi')) return 'hat';
  return 'perc';
}

/**
 * Resolve effective volume for a lane given mute/solo state across all lanes.
 */
function resolveVolume(
  lane: Lane,
  allLanes: Lane[],
): number {
  if (lane.muted) return 0;
  const anySolo = allLanes.some((l) => l.solo);
  if (anySolo && !lane.solo) return 0;
  return lane.volume ?? 1;
}

/**
 * Convert project events + lanes into SchedulerEvents.
 */
function buildSchedulerEvents(
  events: TimelineEvent[],
  lanes: Lane[],
): SchedulerEvent[] {
  const laneMap = new Map<string, Lane>();
  lanes.forEach((l) => laneMap.set(l.id, l));

  const schedulerEvents: SchedulerEvent[] = [];

  events.forEach((evt) => {
    const lane = laneMap.get(evt.laneId);
    if (!lane) return;

    const volume = resolveVolume(lane, lanes);
    const sample = instrumentToSampleKey(lane.instrument ?? lane.name ?? '');

    // Each event occupies one beat; trigger at its start beat.
    schedulerEvents.push({
      beat: evt.beat,
      sample,
      volume,
    });
  });

  return schedulerEvents;
}

// ---------------------------------------------------------------------------
// Default playback state
// ---------------------------------------------------------------------------
const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  isLooping: false,
  currentBeat: 0,
  bpm: 120,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TimelineScreen(): React.JSX.Element {
  const project = useProjectStore((state) => state.currentProject);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    DEFAULT_PLAYBACK_STATE,
  );
  const samplesLoadedRef = useRef(false);

  // Subscribe to playback state changes from the service.
  useEffect(() => {
    const unsubscribe = audioPlaybackService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  // Load samples once on mount.
  useEffect(() => {
    if (!samplesLoadedRef.current) {
      samplesLoadedRef.current = true;
      audioPlaybackService.loadSamples().catch((err) =>
        console.warn('[TimelineScreen] loadSamples error:', err),
      );
    }
    return () => {
      // Stop playback when leaving the screen.
      audioPlaybackService.stop();
    };
  }, []);

  // Sync BPM from project when project changes.
  useEffect(() => {
    if (project && !playbackState.isPlaying) {
      audioPlaybackService.setBpm(project.bpm);
    }
  }, [project?.bpm]);

  const handlePlay = useCallback(() => {
    if (!project) return;
    const schedulerEvents = buildSchedulerEvents(
      project.events ?? [],
      project.lanes ?? [],
    );
    audioPlaybackService.play(
      schedulerEvents,
      project.totalBeats,
      project.bpm,
      playbackState.isLooping,
    );
  }, [project, playbackState.isLooping]);

  const handleStop = useCallback(() => {
    audioPlaybackService.stop();
  }, []);

  const handleToggleLoop = useCallback(() => {
    audioPlaybackService.setLoop(!playbackState.isLooping);
  }, [playbackState.isLooping]);

  const handleBpmChange = useCallback(
    (bpm: number) => {
      audioPlaybackService.setBpm(bpm);
      // Also update the project store so the BPM persists.
      useProjectStore.getState().updateProjectBpm?.(bpm);
    },
    [],
  );

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Project Loaded</Text>
        <Text style={styles.subtitle}>Load a project from the Home screen.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{project.name}</Text>
      <View style={styles.timelineContainer}>
        <TimelineCanvas
          events={project.events}
          beatsPerBar={project.beatsPerBar}
          totalBeats={project.totalBeats}
        />
      </View>
      <TransportBar
        playbackState={playbackState}
        onPlay={handlePlay}
        onStop={handleStop}
        onToggleLoop={handleToggleLoop}
        onBpmChange={handleBpmChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing[8],
  },
  title: {
    color: colors.neonYellow,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    textAlign: 'center',
    marginBottom: spacing[1],
    paddingHorizontal: spacing[4],
  },
  timelineContainer: {
    flex: 1,
    marginBottom: spacing[2],
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
  },
});
