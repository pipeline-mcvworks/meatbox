/**
 * Expo-AV-based implementation of IAudioPlaybackService.
 *
 * The scheduler runs on a setInterval tick (~10 ms) entirely outside
 * React render. It maintains a "look-ahead" window so that events are
 * triggered slightly before their exact beat time, compensating for
 * timer jitter.
 *
 * NOTE: Real WAV files must be placed at src/assets/samples/
 * (kick.wav, snare.wav, hat.wav, perc.wav) before this will produce
 * audible output. See src/assets/samples/README.md.
 */

import { Audio, AVPlaybackSource } from 'expo-av';
import type {
  IAudioPlaybackService,
  PlaybackState,
  SchedulerEvent,
  SampleKey,
} from './types';

// ---------------------------------------------------------------------------
// Sample asset map
// ---------------------------------------------------------------------------
// Update these require() calls once real WAV files are in place.
const SAMPLE_SOURCES: Record<SampleKey, AVPlaybackSource> = {
  kick: require('../assets/samples/kick.wav'),
  snare: require('../assets/samples/snare.wav'),
  hat: require('../assets/samples/hat.wav'),
  perc: require('../assets/samples/perc.wav'),
};

// How many milliseconds ahead we schedule events.
const LOOK_AHEAD_MS = 50;
// Scheduler tick interval in milliseconds.
const TICK_INTERVAL_MS = 10;

type Listener = (state: PlaybackState) => void;

export class AudioPlaybackService implements IAudioPlaybackService {
  private sounds: Partial<Record<SampleKey, Audio.Sound>> = {};
  private samplesLoaded = false;

  // Scheduler state
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  private events: SchedulerEvent[] = [];
  private totalBeats = 0;
  private bpm = 120;
  private loop = false;

  // Timing
  private startTimeMs = 0;
  private nextEventIndex = 0;

  // Playback state
  private state: PlaybackState = {
    isPlaying: false,
    isLooping: false,
    currentBeat: 0,
    bpm: 120,
  };

  private listeners: Set<Listener> = new Set();

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async loadSamples(): Promise<void> {
    if (this.samplesLoaded) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const keys = Object.keys(SAMPLE_SOURCES) as SampleKey[];
    await Promise.all(
      keys.map(async (key) => {
        try {
          const { sound } = await Audio.Sound.createAsync(SAMPLE_SOURCES[key], {
            shouldPlay: false,
            volume: 1,
          });
          this.sounds[key] = sound;
        } catch (err) {
          // Gracefully degrade if asset is missing (placeholder phase).
          console.warn(`[AudioPlaybackService] Could not load sample "${key}":`, err);
        }
      }),
    );

    this.samplesLoaded = true;
  }

  play(
    events: SchedulerEvent[],
    totalBeats: number,
    bpm: number,
    loop: boolean,
  ): void {
    this.stop();

    // Sort events by beat so we can walk them linearly.
    this.events = [...events].sort((a, b) => a.beat - b.beat);
    this.totalBeats = totalBeats;
    this.bpm = bpm;
    this.loop = loop;
    this.nextEventIndex = 0;
    this.startTimeMs = performance.now();

    this._updateState({ isPlaying: true, isLooping: loop, bpm, currentBeat: 0 });
    this._startScheduler();
  }

  stop(): void {
    this._stopScheduler();
    this._updateState({
      isPlaying: false,
      currentBeat: 0,
    });
  }

  setBpm(bpm: number): void {
    if (bpm <= 0) return;
    // Recalculate startTimeMs so the current beat position is preserved.
    if (this.state.isPlaying) {
      const currentBeat = this.state.currentBeat;
      const msPerBeat = 60_000 / bpm;
      this.startTimeMs = performance.now() - currentBeat * msPerBeat;
    }
    this.bpm = bpm;
    this._updateState({ bpm });
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
    this._updateState({ isLooping: loop });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state.
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    this.stop();
    const keys = Object.keys(this.sounds) as SampleKey[];
    keys.forEach((key) => {
      this.sounds[key]?.unloadAsync().catch(() => {});
    });
    this.sounds = {};
    this.samplesLoaded = false;
    this.listeners.clear();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _startScheduler(): void {
    this.schedulerTimer = setInterval(() => this._tick(), TICK_INTERVAL_MS);
  }

  private _stopScheduler(): void {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private _tick(): void {
    const nowMs = performance.now();
    const elapsedMs = nowMs - this.startTimeMs;
    const msPerBeat = 60_000 / this.bpm;
    const currentBeat = elapsedMs / msPerBeat;
    const lookAheadBeat = (elapsedMs + LOOK_AHEAD_MS) / msPerBeat;

    // Emit position update.
    this._updateState({ currentBeat: Math.min(currentBeat, this.totalBeats) });

    // Check for end of sequence.
    if (currentBeat >= this.totalBeats) {
      if (this.loop) {
        // Wrap around.
        this.startTimeMs = nowMs;
        this.nextEventIndex = 0;
      } else {
        this.stop();
        return;
      }
    }

    // Trigger any events within the look-ahead window.
    while (
      this.nextEventIndex < this.events.length &&
      this.events[this.nextEventIndex].beat <= lookAheadBeat
    ) {
      const evt = this.events[this.nextEventIndex];
      this.nextEventIndex++;

      // Skip events that are behind the current position (can happen after loop wrap).
      if (evt.beat < currentBeat - 0.01) continue;

      // Calculate delay so the sound fires at the right moment.
      const eventMs = evt.beat * msPerBeat;
      const delayMs = Math.max(0, eventMs - elapsedMs);

      this._triggerSample(evt.sample, evt.volume, delayMs);
    }
  }

  private _triggerSample(key: SampleKey, volume: number, delayMs: number): void {
    const sound = this.sounds[key];
    if (!sound) return;

    const fire = async () => {
      try {
        await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
        await sound.stopAsync();
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (err) {
        // Non-fatal: sample may not be loaded yet.
        console.warn(`[AudioPlaybackService] Error playing sample "${key}":`, err);
      }
    };

    if (delayMs <= 0) {
      fire();
    } else {
      setTimeout(fire, delayMs);
    }
  }

  private _updateState(partial: Partial<PlaybackState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l({ ...this.state }));
  }
}

// Singleton instance shared across the app.
export const audioPlaybackService = new AudioPlaybackService();
