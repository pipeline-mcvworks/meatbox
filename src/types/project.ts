/**
 * MouthBeat project data model types.
 * All types compile under strict TypeScript.
 */

/** The category of a timeline lane. */
export type LaneType = 'kick' | 'snare' | 'hat' | 'perc' | 'bass' | 'melody';

/** A single sample entry within a drum kit. */
export interface DrumSample {
  /** Unique identifier for this sample. */
  id: string;
  /** Human-readable label (e.g. "Kick 808"). */
  label: string;
  /** URI or asset path to the audio file. */
  uri: string;
  /** Gain multiplier, 0.0–2.0 (1.0 = unity). */
  gain: number;
}

/** A drum kit configuration bundling multiple samples. */
export interface DrumKitConfig {
  /** Unique identifier for this kit. */
  id: string;
  /** Human-readable kit name. */
  name: string;
  /** Ordered list of samples in this kit. */
  samples: DrumSample[];
}

/**
 * A single onset detected during audio analysis.
 * Stored as part of a RawRecordingRef for later re-analysis.
 */
export interface DetectedHit {
  /** Time offset in seconds from the start of the recording. */
  timeSeconds: number;
  /** Normalised confidence score from the onset detector, 0.0–1.0. */
  confidence: number;
  /** Optional classifier label (e.g. "kick", "snare"). */
  label?: string;
}

/**
 * A reference to a raw mouth-percussion recording and its
 * associated onset-detection results.
 */
export interface RawRecordingRef {
  /** Unique identifier for this recording. */
  id: string;
  /** URI or asset path to the raw audio file. */
  uri: string;
  /** Duration of the recording in seconds. */
  durationSeconds: number;
  /** ISO-8601 timestamp of when the recording was captured. */
  capturedAt: string;
  /** Detected hits extracted from this recording. */
  hits: DetectedHit[];
}

/**
 * A single event placed on a timeline lane.
 * Represents one drum hit at a specific time.
 */
export interface TimelineEvent {
  /** Unique identifier for this event. */
  id: string;
  /** Time offset in seconds from the start of the project. */
  timeSeconds: number;
  /** Duration of the event in seconds (for pitched/sustained sounds). */
  durationSeconds: number;
  /** ID of the DrumSample to trigger. */
  sampleId: string;
  /** Velocity / volume, 0.0–1.0. */
  velocity: number;
  /** Optional reference to the raw recording this event was derived from. */
  sourceRecordingId?: string;
}

/**
 * A single horizontal lane in the timeline, corresponding to
 * one instrument voice (e.g. kick, snare, hi-hat).
 */
export interface TimelineLane {
  /** Unique identifier for this lane. */
  id: string;
  /** Human-readable lane name. */
  name: string;
  /** Instrument category for this lane. */
  type: LaneType;
  /** ID of the DrumSample assigned to this lane. */
  sampleId: string;
  /** Whether this lane is muted during playback. */
  muted: boolean;
  /** Whether this lane is soloed during playback. */
  soloed: boolean;
  /** Ordered list of events on this lane. */
  events: TimelineEvent[];
}

/**
 * The top-level project document for a MouthBeat session.
 */
export interface MouthBeatProject {
  /** Unique identifier for this project. */
  id: string;
  /** Human-readable project title. */
  title: string;
  /** Beats per minute. */
  bpm: number;
  /** Number of beats per bar (time signature numerator). */
  beatsPerBar: number;
  /** Note value that gets one beat (time signature denominator). */
  beatUnit: number;
  /** Total length of the project in bars. */
  lengthBars: number;
  /** The drum kit used by this project. */
  kit: DrumKitConfig;
  /** Ordered list of timeline lanes. */
  lanes: TimelineLane[];
  /** Raw recordings attached to this project. */
  recordings: RawRecordingRef[];
  /** ISO-8601 timestamp of project creation. */
  createdAt: string;
  /** ISO-8601 timestamp of last modification. */
  updatedAt: string;
}
