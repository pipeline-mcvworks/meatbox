/**
 * TimelineScreen
 * Displays the project timeline with manual editing (drag, lane change,
 * tap-to-edit, long-press menu, tap-to-add) and wires up audio playback
 * transport.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors, spacing, typography } from '../theme';
import { useProjectStore } from '../store/projectStore';
import { useUiStore } from '../state/uiStore';
import TimelineGrid from '../components/timeline/TimelineGrid';
import TimelineLaneRow from '../components/timeline/TimelineLaneRow';
import EventEditSheet from '../components/timeline/EventEditSheet';
import EventContextMenu from '../components/timeline/EventContextMenu';
import TransportControls from '../components/controls/TransportControls';
import { TransportBar } from '../components/transport';
import { audioPlaybackService } from '../audio';
import type { PlaybackState, SchedulerEvent, SampleKey } from '../audio/types';
import type { DrumEvent, Lane } from '../state/types';

// Optional BottomSheetModalProvider — use it if installed, otherwise no-op.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BottomSheetModalProvider: any = ({ children }: { children: React.ReactNode }) => <>{children}</>;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const mod = require('@gorhom/bottom-sheet');
  if (mod?.BottomSheetModalProvider) {
    BottomSheetModalProvider = mod.BottomSheetModalProvider;
  }
} catch {
  // not installed — fallback already in place
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function instrumentToSampleKey(instrument: string): SampleKey {
  const lower = instrument.toLowerCase();
  if (lower.includes('kick') || lower.includes('bass drum')) return 'kick';
  if (lower.includes('snare') || lower.includes('clap')) return 'snare';
  if (lower.includes('hat') || lower.includes('cymbal') || lower.includes('hi')) return 'hat';
  return 'perc';
}

function resolveVolume(lane: Lane, allLanes: Lane[]): number {
  if (lane.muted) return 0;
  const anySolo = allLanes.some((l) => l.solo);
  if (anySolo && !lane.solo) return 0;
  return lane.volume ?? 1;
}

function buildSchedulerEvents(
  events: DrumEvent[],
  lanes: Lane[],
  bpm: number,
): SchedulerEvent[] {
  const laneMap = new Map<string, Lane>();
  lanes.forEach((l) => laneMap.set(l.id, l));

  const out: SchedulerEvent[] = [];
  events.forEach((evt) => {
    const lane = laneMap.get(evt.laneId);
    if (!lane) return;
    const volume = resolveVolume(lane, lanes) * (evt.velocity ?? 1);
    const sample = instrumentToSampleKey(lane.instrument ?? lane.name ?? '');
    const beat = (evt.startTime * bpm) / 60;
    out.push({ beat, sample, volume });
  });
  return out;
}

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
  // Note: project lives under useProjectStore (re-exported from ../store).
  // We read via subscriptions so edits trigger re-render.
  const project = useProjectStore((s) => ({
    id: s.id,
    name: s.name,
    bpm: s.bpm,
    bars: s.bars,
    lanes: s.lanes,
    events: s.events,
  }));
  const beatsPerBar = 4;
  const totalBeats = Math.max(1, project.bars * beatsPerBar);

  const pxPerBeat = useUiStore((s) => s.pxPerBeat);
  const laneHeight = useUiStore((s) => s.laneHeight);

  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    DEFAULT_PLAYBACK_STATE,
  );
  const samplesLoadedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = audioPlaybackService.subscribe(setPlaybackState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!samplesLoadedRef.current) {
      samplesLoadedRef.current = true;
      audioPlaybackService.loadSamples().catch((err) =>
        console.warn('[TimelineScreen] loadSamples error:', err),
      );
    }
    return () => {
      audioPlaybackService.stop();
    };
  }, []);

  useEffect(() => {
    if (project && !playbackState.isPlaying) {
      audioPlaybackService.setBpm(project.bpm);
    }
  }, [project.bpm, playbackState.isPlaying]);

  const handlePlay = useCallback(() => {
    const schedulerEvents = buildSchedulerEvents(
      project.events ?? [],
      project.lanes ?? [],
      project.bpm,
    );
    audioPlaybackService.play(
      schedulerEvents,
      totalBeats,
      project.bpm,
      playbackState.isLooping,
    );
  }, [project.events, project.lanes, project.bpm, totalBeats, playbackState.isLooping]);

  const handleStop = useCallback(() => {
    audioPlaybackService.stop();
  }, []);

  const handleToggleLoop = useCallback(() => {
    audioPlaybackService.setLoop(!playbackState.isLooping);
  }, [playbackState.isLooping]);

  const handleBpmChange = useCallback((bpm: number) => {
    audioPlaybackService.setBpm(bpm);
    const setBpm = useProjectStore.getState().setBpm;
    if (setBpm) setBpm(bpm);
  }, []);

  // Group events by lane for fast rendering.
  const eventsByLane = useMemo(() => {
    const map = new Map<string, DrumEvent[]>();
    (project.events ?? []).forEach((evt) => {
      const arr = map.get(evt.laneId) ?? [];
      arr.push(evt);
      map.set(evt.laneId, arr);
    });
    return map;
  }, [project.events]);

  if (!project.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Project Loaded</Text>
        <Text style={styles.subtitle}>Load a project from the Home screen.</Text>
      </View>
    );
  }

  const totalWidth = totalBeats * pxPerBeat;
  const totalHeight = project.lanes.length * laneHeight;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
          <Text style={styles.title}>{project.name}</Text>

          <View style={styles.timelineContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <ScrollView showsVerticalScrollIndicator>
                <View style={{ width: totalWidth, height: totalHeight }}>
                  <TimelineGrid
                    totalBeats={totalBeats}
                    beatsPerBar={beatsPerBar}
                    pxPerBeat={pxPerBeat}
                    laneCount={project.lanes.length}
                    laneHeight={laneHeight}
                  />
                  {project.lanes.map((lane, idx) => (
                    <View
                      key={lane.id}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: idx * laneHeight,
                        width: totalWidth,
                        height: laneHeight,
                      }}
                    >
                      <TimelineLaneRow
                        lane={lane}
                        laneIndex={idx}
                        lanes={project.lanes}
                        events={eventsByLane.get(lane.id) ?? []}
                        pxPerBeat={pxPerBeat}
                        laneHeight={laneHeight}
                        totalBeats={totalBeats}
                        bpm={project.bpm}
                      />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </ScrollView>
          </View>

          <TransportControls />

          <TransportBar
            playbackState={playbackState}
            onPlay={handlePlay}
            onStop={handleStop}
            onToggleLoop={handleToggleLoop}
            onBpmChange={handleBpmChange}
          />

          <EventEditSheet />
          <EventContextMenu />
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
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
    backgroundColor: colors.surface,
    marginHorizontal: spacing[2],
    borderRadius: 8,
    overflow: 'hidden',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
  },
});
