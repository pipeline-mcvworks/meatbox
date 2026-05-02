// Shared types used across Zustand stores

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export type AnalysisStatus = 'idle' | 'analyzing' | 'done' | 'error';

export type ActiveTool = 'select' | 'draw' | 'erase' | 'slice';

export type VisualizerPreset = 'waveform' | 'spectrum' | 'circular' | 'bars';

export interface DrumEvent {
  id: string;
  laneId: string;
  /** Start time in seconds */
  startTime: number;
  /** Duration in seconds */
  duration: number;
  /** Velocity 0–1 */
  velocity: number;
  /** Optional recorded audio URI */
  audioUri?: string;
}

export interface Lane {
  id: string;
  name: string;
  /** Instrument / sample name */
  instrument: string;
  /** Muted state */
  muted: boolean;
  /** Solo state */
  solo: boolean;
  /** Volume 0–1 */
  volume: number;
  /** Pan -1 to 1 */
  pan: number;
  color: string;
}

export interface KitPad {
  id: string;
  name: string;
  audioUri?: string;
  color: string;
}

export interface Kit {
  id: string;
  name: string;
  pads: KitPad[];
}

export interface LoopRegion {
  startTime: number;
  endTime: number;
  enabled: boolean;
}
