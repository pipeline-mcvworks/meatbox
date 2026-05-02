import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { LoopRegion } from './types';

export interface PlaybackState {
  isPlaying: boolean;
  /** Current playhead position in seconds */
  playheadPosition: number;
  loopRegion: LoopRegion;
  /** BPM used by the playback engine (may differ from project BPM during live edit) */
  playbackBpm: number;
}

export interface PlaybackActions {
  play: () => void;
  stop: () => void;
  togglePlay: () => void;
  setPlayhead: (positionSeconds: number) => void;
  setLoopRegion: (region: Partial<LoopRegion>) => void;
  setPlaybackBpm: (bpm: number) => void;
}

export type PlaybackStore = PlaybackState & PlaybackActions;

const initialState: PlaybackState = {
  isPlaying: false,
  playheadPosition: 0,
  loopRegion: {
    startTime: 0,
    endTime: 2,
    enabled: false,
  },
  playbackBpm: 120,
};

export const usePlaybackStore = create<PlaybackStore>()(
  immer((set) => ({
    ...initialState,

    play: () =>
      set((state) => {
        state.isPlaying = true;
      }),

    stop: () =>
      set((state) => {
        state.isPlaying = false;
        state.playheadPosition = 0;
      }),

    togglePlay: () =>
      set((state) => {
        state.isPlaying = !state.isPlaying;
        if (!state.isPlaying) {
          state.playheadPosition = 0;
        }
      }),

    setPlayhead: (positionSeconds) =>
      set((state) => {
        state.playheadPosition = positionSeconds;
      }),

    setLoopRegion: (region) =>
      set((state) => {
        Object.assign(state.loopRegion, region);
      }),

    setPlaybackBpm: (bpm) =>
      set((state) => {
        state.playbackBpm = bpm;
      }),
  }))
);

// ---------------------------------------------------------------------------
// Typed selectors
// ---------------------------------------------------------------------------

export const selectIsPlaying = (s: PlaybackStore) => s.isPlaying;
export const selectPlayheadPosition = (s: PlaybackStore) => s.playheadPosition;
export const selectLoopRegion = (s: PlaybackStore) => s.loopRegion;
export const selectPlaybackBpm = (s: PlaybackStore) => s.playbackBpm;
