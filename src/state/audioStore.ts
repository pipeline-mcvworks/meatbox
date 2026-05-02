import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AnalysisStatus, RecordingState } from './types';

export interface AudioState {
  /** Whether the user has granted microphone permission */
  micPermission: 'undetermined' | 'granted' | 'denied';
  recordingState: RecordingState;
  /** URI of the most recent recording */
  recordingUri: string | null;
  /** Normalised waveform peak data (0–1) */
  waveformPeaks: number[];
  analysisStatus: AnalysisStatus;
  /** Duration of the current recording in seconds */
  recordingDuration: number;
  /** Live normalised input level from the microphone (0–1) */
  liveInputLevel: number;
}

export interface AudioActions {
  setMicPermission: (permission: AudioState['micPermission']) => void;
  setRecordingState: (state: RecordingState) => void;
  setRecordingUri: (uri: string | null) => void;
  setWaveformPeaks: (peaks: number[]) => void;
  setAnalysisStatus: (status: AnalysisStatus) => void;
  setRecordingDuration: (duration: number) => void;
  setLiveInputLevel: (level: number) => void;
  resetAudio: () => void;
}

export type AudioStore = AudioState & AudioActions;

const initialState: AudioState = {
  micPermission: 'undetermined',
  recordingState: 'idle',
  recordingUri: null,
  waveformPeaks: [],
  analysisStatus: 'idle',
  recordingDuration: 0,
  liveInputLevel: 0,
};

export const useAudioStore = create<AudioStore>()(
  immer((set) => ({
    ...initialState,

    setMicPermission: (permission) =>
      set((state) => {
        state.micPermission = permission;
      }),

    setRecordingState: (recordingState) =>
      set((state) => {
        state.recordingState = recordingState;
      }),

    setRecordingUri: (uri) =>
      set((state) => {
        state.recordingUri = uri;
      }),

    setWaveformPeaks: (peaks) =>
      set((state) => {
        state.waveformPeaks = peaks;
      }),

    setAnalysisStatus: (status) =>
      set((state) => {
        state.analysisStatus = status;
      }),

    setRecordingDuration: (duration) =>
      set((state) => {
        state.recordingDuration = duration;
      }),

    setLiveInputLevel: (level) =>
      set((state) => {
        state.liveInputLevel = level;
      }),

    resetAudio: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

// ---------------------------------------------------------------------------
// Typed selectors
// ---------------------------------------------------------------------------

export const selectMicPermission = (s: AudioStore) => s.micPermission;
export const selectRecordingState = (s: AudioStore) => s.recordingState;
export const selectRecordingUri = (s: AudioStore) => s.recordingUri;
export const selectWaveformPeaks = (s: AudioStore) => s.waveformPeaks;
export const selectAnalysisStatus = (s: AudioStore) => s.analysisStatus;
export const selectIsRecording = (s: AudioStore) => s.recordingState === 'recording';
export const selectLiveInputLevel = (s: AudioStore) => s.liveInputLevel;
export const selectRecordingDuration = (s: AudioStore) => s.recordingDuration;
