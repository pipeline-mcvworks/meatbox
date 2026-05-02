import { Audio } from 'expo-av';
import type { RecordingStatus } from 'expo-av/build/Audio';

export interface RecordingResult {
  uri: string;
  durationMs: number;
  sampleRate: number;
}

export type MeteringCallback = (level: number) => void;

const RECORDING_OPTIONS: Audio.RecordingOptions = {
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

/** Normalise a dB metering value (-160..0) to a 0–1 range. */
function normalisedLevel(db: number): number {
  // Clamp to a useful range: -60 dB (silence) to 0 dB (full)
  const MIN_DB = -60;
  const clamped = Math.max(MIN_DB, Math.min(0, db));
  return (clamped - MIN_DB) / (0 - MIN_DB);
}

export class AudioRecorderService {
  private recording: Audio.Recording | null = null;
  private meteringInterval: ReturnType<typeof setInterval> | null = null;

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
   * Start recording. Calls `onMetering` with a normalised 0–1 level
   * approximately every 100 ms.
   */
  async startRecording(onMetering?: MeteringCallback): Promise<void> {
    if (this.recording) {
      await this.stopRecording();
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      {
        ...RECORDING_OPTIONS,
        isMeteringEnabled: true,
      },
      undefined,
      100
    );

    this.recording = recording;

    if (onMetering) {
      this.meteringInterval = setInterval(async () => {
        if (!this.recording) return;
        try {
          const status: RecordingStatus = await this.recording.getStatusAsync();
          if (status.isRecording && status.metering !== undefined) {
            onMetering(normalisedLevel(status.metering));
          }
        } catch {
          // Recording may have been stopped; ignore
        }
      }, 100);
    }
  }

  /**
   * Stop the current recording and return the result.
   * Returns null if no recording was active.
   */
  async stopRecording(): Promise<RecordingResult | null> {
    if (!this.recording) return null;

    this._clearMeteringInterval();

    try {
      await this.recording.stopAndUnloadAsync();
    } catch {
      // Already stopped
    }

    const status = await this.recording.getStatusAsync();
    const uri = this.recording.getURI();
    this.recording = null;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    if (!uri) return null;

    return {
      uri,
      durationMs: status.durationMillis ?? 0,
      sampleRate: 44100,
    };
  }

  /** Cancel and discard the current recording without returning a result. */
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
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
  }

  private _clearMeteringInterval(): void {
    if (this.meteringInterval !== null) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
  }
}

export const audioRecorderService = new AudioRecorderService();
