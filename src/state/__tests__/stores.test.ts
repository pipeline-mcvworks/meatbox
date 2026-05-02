/**
 * Basic unit tests for all four Zustand stores.
 * These tests run in a Node/Jest environment (no React renderer needed).
 */

import { useProjectStore } from '../projectStore';
import { useAudioStore } from '../audioStore';
import { usePlaybackStore } from '../playbackStore';
import { useUiStore } from '../uiStore';

// ---------------------------------------------------------------------------
// Helper: reset all stores between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset each store to its initial state by calling its internal setState
  useProjectStore.setState(useProjectStore.getInitialState());
  useAudioStore.setState(useAudioStore.getInitialState());
  usePlaybackStore.setState(usePlaybackStore.getInitialState());
  useUiStore.setState(useUiStore.getInitialState());
});

// ---------------------------------------------------------------------------
// projectStore
// ---------------------------------------------------------------------------

describe('projectStore', () => {
  it('initializes with defaultProject values', () => {
    const state = useProjectStore.getState();
    expect(state.bpm).toBe(120);
    expect(state.name).toBe('My First Beat');
    expect(state.lanes.length).toBeGreaterThan(0);
    expect(state.events.length).toBeGreaterThan(0);
    expect(state.kit.id).toBe('kit-default');
  });

  it('setBpm updates bpm', () => {
    useProjectStore.getState().setBpm(140);
    expect(useProjectStore.getState().bpm).toBe(140);
  });

  it('setProjectName updates name', () => {
    useProjectStore.getState().setProjectName('New Beat');
    expect(useProjectStore.getState().name).toBe('New Beat');
  });

  it('addEvent adds an event', () => {
    const before = useProjectStore.getState().events.length;
    useProjectStore.getState().addEvent({
      id: 'test-evt',
      laneId: 'lane-kick',
      startTime: 0,
      duration: 0.25,
      velocity: 1,
    });
    expect(useProjectStore.getState().events.length).toBe(before + 1);
  });

  it('updateEvent patches an event', () => {
    const { events } = useProjectStore.getState();
    const firstId = events[0].id;
    useProjectStore.getState().updateEvent(firstId, { velocity: 0.5 });
    const updated = useProjectStore.getState().events.find((e) => e.id === firstId);
    expect(updated?.velocity).toBe(0.5);
  });

  it('deleteEvent removes an event', () => {
    const { events } = useProjectStore.getState();
    const firstId = events[0].id;
    useProjectStore.getState().deleteEvent(firstId);
    const remaining = useProjectStore.getState().events.find((e) => e.id === firstId);
    expect(remaining).toBeUndefined();
  });

  it('addLane adds a lane', () => {
    const before = useProjectStore.getState().lanes.length;
    useProjectStore.getState().addLane({
      id: 'lane-new',
      name: 'Cowbell',
      instrument: 'cowbell',
      muted: false,
      solo: false,
      volume: 1,
      pan: 0,
      color: '#fff',
    });
    expect(useProjectStore.getState().lanes.length).toBe(before + 1);
  });

  it('deleteLane removes the lane and its events', () => {
    // Add a lane and an event for it
    useProjectStore.getState().addLane({
      id: 'lane-temp',
      name: 'Temp',
      instrument: 'temp',
      muted: false,
      solo: false,
      volume: 1,
      pan: 0,
      color: '#000',
    });
    useProjectStore.getState().addEvent({
      id: 'evt-temp',
      laneId: 'lane-temp',
      startTime: 0,
      duration: 0.1,
      velocity: 1,
    });
    useProjectStore.getState().deleteLane('lane-temp');
    const lane = useProjectStore.getState().lanes.find((l) => l.id === 'lane-temp');
    const event = useProjectStore.getState().events.find((e) => e.laneId === 'lane-temp');
    expect(lane).toBeUndefined();
    expect(event).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// audioStore
// ---------------------------------------------------------------------------

describe('audioStore', () => {
  it('initializes with idle state', () => {
    const state = useAudioStore.getState();
    expect(state.micPermission).toBe('undetermined');
    expect(state.recordingState).toBe('idle');
    expect(state.recordingUri).toBeNull();
    expect(state.waveformPeaks).toEqual([]);
    expect(state.analysisStatus).toBe('idle');
  });

  it('setMicPermission updates permission', () => {
    useAudioStore.getState().setMicPermission('granted');
    expect(useAudioStore.getState().micPermission).toBe('granted');
  });

  it('setRecordingState updates state', () => {
    useAudioStore.getState().setRecordingState('recording');
    expect(useAudioStore.getState().recordingState).toBe('recording');
  });

  it('setRecordingUri updates uri', () => {
    useAudioStore.getState().setRecordingUri('file:///tmp/rec.m4a');
    expect(useAudioStore.getState().recordingUri).toBe('file:///tmp/rec.m4a');
  });

  it('setWaveformPeaks updates peaks', () => {
    useAudioStore.getState().setWaveformPeaks([0.1, 0.5, 0.9]);
    expect(useAudioStore.getState().waveformPeaks).toEqual([0.1, 0.5, 0.9]);
  });

  it('setAnalysisStatus updates status', () => {
    useAudioStore.getState().setAnalysisStatus('analyzing');
    expect(useAudioStore.getState().analysisStatus).toBe('analyzing');
  });

  it('resetAudio resets to initial state', () => {
    useAudioStore.getState().setRecordingState('recording');
    useAudioStore.getState().setRecordingUri('file:///tmp/rec.m4a');
    useAudioStore.getState().resetAudio();
    const state = useAudioStore.getState();
    expect(state.recordingState).toBe('idle');
    expect(state.recordingUri).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// playbackStore
// ---------------------------------------------------------------------------

describe('playbackStore', () => {
  it('initializes with stopped state', () => {
    const state = usePlaybackStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.playheadPosition).toBe(0);
    expect(state.loopRegion.enabled).toBe(false);
    expect(state.playbackBpm).toBe(120);
  });

  it('play sets isPlaying to true', () => {
    usePlaybackStore.getState().play();
    expect(usePlaybackStore.getState().isPlaying).toBe(true);
  });

  it('stop sets isPlaying to false and resets playhead', () => {
    usePlaybackStore.getState().play();
    usePlaybackStore.getState().setPlayhead(1.5);
    usePlaybackStore.getState().stop();
    expect(usePlaybackStore.getState().isPlaying).toBe(false);
    expect(usePlaybackStore.getState().playheadPosition).toBe(0);
  });

  it('togglePlay toggles isPlaying', () => {
    usePlaybackStore.getState().togglePlay();
    expect(usePlaybackStore.getState().isPlaying).toBe(true);
    usePlaybackStore.getState().togglePlay();
    expect(usePlaybackStore.getState().isPlaying).toBe(false);
  });

  it('setPlayhead updates position', () => {
    usePlaybackStore.getState().setPlayhead(2.5);
    expect(usePlaybackStore.getState().playheadPosition).toBe(2.5);
  });

  it('setLoopRegion patches loop region', () => {
    usePlaybackStore.getState().setLoopRegion({ enabled: true, startTime: 0.5 });
    const { loopRegion } = usePlaybackStore.getState();
    expect(loopRegion.enabled).toBe(true);
    expect(loopRegion.startTime).toBe(0.5);
    expect(loopRegion.endTime).toBe(2); // unchanged
  });

  it('setPlaybackBpm updates bpm', () => {
    usePlaybackStore.getState().setPlaybackBpm(90);
    expect(usePlaybackStore.getState().playbackBpm).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// uiStore
// ---------------------------------------------------------------------------

describe('uiStore', () => {
  it('initializes with default ui state', () => {
    const state = useUiStore.getState();
    expect(state.selectedEventId).toBeNull();
    expect(state.timelineZoom).toBe(100);
    expect(state.timelineScrollX).toBe(0);
    expect(state.activeTool).toBe('select');
    expect(state.visualizerPreset).toBe('waveform');
    expect(state.kitPanelExpanded).toBe(true);
  });

  it('setSelectedEvent updates selectedEventId', () => {
    useUiStore.getState().setSelectedEvent('evt-1');
    expect(useUiStore.getState().selectedEventId).toBe('evt-1');
  });

  it('setSelectedEvent can clear selection', () => {
    useUiStore.getState().setSelectedEvent('evt-1');
    useUiStore.getState().setSelectedEvent(null);
    expect(useUiStore.getState().selectedEventId).toBeNull();
  });

  it('setTimelineZoom clamps to [10, 1000]', () => {
    useUiStore.getState().setTimelineZoom(5);
    expect(useUiStore.getState().timelineZoom).toBe(10);
    useUiStore.getState().setTimelineZoom(9999);
    expect(useUiStore.getState().timelineZoom).toBe(1000);
    useUiStore.getState().setTimelineZoom(200);
    expect(useUiStore.getState().timelineZoom).toBe(200);
  });

  it('setTimelineScroll clamps to >= 0', () => {
    useUiStore.getState().setTimelineScroll(-50);
    expect(useUiStore.getState().timelineScrollX).toBe(0);
    useUiStore.getState().setTimelineScroll(300);
    expect(useUiStore.getState().timelineScrollX).toBe(300);
  });

  it('setActiveTool updates tool', () => {
    useUiStore.getState().setActiveTool('draw');
    expect(useUiStore.getState().activeTool).toBe('draw');
  });

  it('setVisualizerPreset updates preset', () => {
    useUiStore.getState().setVisualizerPreset('spectrum');
    expect(useUiStore.getState().visualizerPreset).toBe('spectrum');
  });

  it('resetUi restores initial state', () => {
    useUiStore.getState().setActiveTool('erase');
    useUiStore.getState().setTimelineZoom(500);
    useUiStore.getState().resetUi();
    expect(useUiStore.getState().activeTool).toBe('select');
    expect(useUiStore.getState().timelineZoom).toBe(100);
  });
});
