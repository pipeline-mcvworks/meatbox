/**
 * Core audio types for AudioPlaybackService.
 */

export type SampleKey = 'kick' | 'snare' | 'hat' | 'perc';

/** A single scheduled playback event derived from a project TimelineEvent. */
export interface SchedulerEvent {
  /** Beat position (0-based) at which to trigger the sample. */
  beat: number;
  /** Which sample to play. */
  sample: SampleKey;
  /** Lane volume 0–1 (after mute/solo resolution). */
  volume: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  isLooping: boolean;
  /** Current playback position in beats. */
  currentBeat: number;
  bpm: number;
}

/**
 * Contract for the audio playback service.
 * Implementations must not depend on React render timing.
 */
export interface IAudioPlaybackService {
  /** Load all samples into memory. Must be called before play(). */
  loadSamples(): Promise<void>;

  /**
   * Start playback of the provided events.
   * @param events Scheduler events to play.
   * @param totalBeats Total length of the sequence in beats.
   * @param bpm Beats per minute.
   * @param loop Whether to loop.
   */
  play(
    events: SchedulerEvent[],
    totalBeats: number,
    bpm: number,
    loop: boolean,
  ): void;

  /** Stop playback immediately. */
  stop(): void;

  /** Update BPM during playback. */
  setBpm(bpm: number): void;

  /** Toggle loop mode. */
  setLoop(loop: boolean): void;

  /** Subscribe to playback state changes. Returns unsubscribe function. */
  subscribe(listener: (state: PlaybackState) => void): () => void;

  /** Release all audio resources. */
  dispose(): void;
}
