// Barrel export for all Zustand stores

export * from './types';

export {
  useProjectStore,
  selectBpm,
  selectLanes,
  selectEvents,
  selectKit,
  selectProjectName,
  selectEventsByLane,
} from './projectStore';
export type { ProjectState, ProjectActions, ProjectStore } from './projectStore';

export {
  useAudioStore,
  selectMicPermission,
  selectRecordingState,
  selectRecordingUri,
  selectWaveformPeaks,
  selectAnalysisStatus,
  selectIsRecording,
} from './audioStore';
export type { AudioState, AudioActions, AudioStore } from './audioStore';

export {
  usePlaybackStore,
  selectIsPlaying,
  selectPlayheadPosition,
  selectLoopRegion,
  selectPlaybackBpm,
} from './playbackStore';
export type { PlaybackState, PlaybackActions, PlaybackStore } from './playbackStore';

export {
  useUiStore,
  selectSelectedEventId,
  selectTimelineZoom,
  selectTimelineScrollX,
  selectActiveTool,
  selectVisualizerPreset,
  selectKitPanelExpanded,
} from './uiStore';
export type { UiState, UiActions, UiStore } from './uiStore';
