import { Audio } from 'expo-av';
import type { RecordingOptions } from 'expo-av/build/Audio';

export interface RecordingResult {
  uri: string;
  duration: number; // seconds
  sampleRate: number;
}

const HIGH_QUALITY_OPTIONS: RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const METERING_INTERVAL_MS = 80;
const SAMPLE_RATE = 44100;

type MeteringCallback = (level: number) => void;

class AudioRecorderService {
  private recording: Audio.Recording | null = null;
  private meteringInterval: ReturnType<typeof setInterval> | null = null;
  private meteringCallback: MeteringCallback | null = null;
  private _currentLevel = 0;

  /** Request microphone permission. Returns true if granted. */
  async requestPermission(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  /** Check current permission without prompting. */
  async checkPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
    const { status } = await Audio.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }

  /**
   * Start recording. Calls onMeteringUpdate with a normalised 0–1 level
   * at ~80ms intervals.
   */
  async startRecording(onMeteringUpdate?: MeteringCallback): Promise<void> {
    if (this.recording) {
      await this.stopRecording();
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    this.meteringCallback = onMeteringUpdate ?? null;

    const { recording } = await Audio.Recording.createAsync(
      {
        ...HIGH_QUALITY_OPTIONS,
        isMeteringEnabled: true,
      },
      undefined,
      METERING_INTERVAL_MS
    );

    this.recording = recording;

    // Poll metering status
    this.meteringInterval = setInterval(async () => {
      if (!this.recording) return;
      try {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          // metering is in dBFS: typically -160 to 0
          // Normalise to 0–1
          const db = status.metering;
          const normalised = Math.max(0, Math.min(1, (db + 60) / 60));
          this._currentLevel = normalised;
          this.meteringCallback?.(normalised);
        }
      } catch {
        // ignore transient errors
      }
    }, METERING_INTERVAL_MS);
  }

  /** Stop recording and return the result. */
  async stopRecording(): Promise<RecordingResult | null> {
    if (!this.recording) return null;

    this._clearMeteringInterval();

    try {
      await this.recording.stopAndUnloadAsync();
    } catch {
      // already stopped
    }

    const status = await this.recording.getStatusAsync();
    const uri = this.recording.getURI();

    this.recording = null;
    this._currentLevel = 0;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    if (!uri) return null;

    const durationMs =
      'durationMillis' in status && typeof status.durationMillis === 'number'
        ? status.durationMillis
        : 0;

    return {
      uri,
      duration: durationMs / 1000,
      sampleRate: SAMPLE_RATE,
    };
  }

  /** Cancel an in-progress recording without saving. */
  async cancelRecording(): Promise<void> {
    this._clearMeteringInterval();
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {
        // ignore
      }
      this.recording = null;
    }
    this._currentLevel = 0;
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  }

  /** Returns the most recent normalised metering level (0–1). */
  getMeteringLevel(): number {
    return this._currentLevel;
  }

  private _clearMeteringInterval(): void {
    if (this.meteringInterval !== null) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
  }
}

export const audioRecorderService = new AudioRecorderService();
