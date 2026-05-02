import { Audio } from 'expo-av';

const TARGET_PEAKS_COUNT = 1000;

/**
 * Reads an audio file at the given URI and produces a normalized peaks array.
 * The peaks array length is TARGET_PEAKS_COUNT (~1000 samples) for mobile rendering.
 * Each peak value is between 0 and 1.
 */
export async function generateWaveformPeaks(
  recordingUri: string,
  durationSeconds: number,
): Promise<number[]> {
  // For now, we generate synthetic peaks based on duration.
  // In a production app, we would decode the audio file and compute actual RMS/peak values.
  // This placeholder simulates a realistic waveform pattern.
  const sampleCount = TARGET_PEAKS_COUNT;
  const peaks: number[] = [];

  // Simulate a waveform with some variation
  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleCount;
    // Create a pattern: attack, sustain, decay
    let value: number;
    if (t < 0.1) {
      // Attack phase: ramp up
      value = (t / 0.1) * 0.8 + Math.random() * 0.2;
    } else if (t < 0.7) {
      // Sustain phase: moderate variation
      value = 0.6 + Math.sin(t * 20) * 0.2 + Math.random() * 0.2;
    } else {
      // Decay phase: fade out
      value = (1 - (t - 0.7) / 0.3) * 0.5 + Math.random() * 0.1;
    }
    peaks.push(Math.min(1, Math.max(0, value)));
  }

  return peaks;
}

/**
 * Decodes an audio file and extracts raw PCM data.
 * This is a placeholder that returns a Float32Array of zeros.
 * In production, use expo-av's Audio.Sound or a native module to decode.
 */
async function decodeAudioFile(uri: string): Promise<Float32Array> {
  // Placeholder: return empty buffer
  return new Float32Array(0);
}

/**
 * Downsample raw PCM data to a target number of peaks.
 */
function downsamplePeaks(
  data: Float32Array,
  targetCount: number,
): number[] {
  const blockSize = Math.max(1, Math.floor(data.length / targetCount));
  const peaks: number[] = [];

  for (let i = 0; i < targetCount; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, data.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const abs = Math.abs(data[j]);
      if (abs > max) max = abs;
    }
    peaks.push(max);
  }

  return peaks;
}
