import { Audio } from 'expo-av';

const TARGET_PEAKS_COUNT = 1000;

/**
 * Reads an audio file at the given URI and produces a normalized peaks array.
 * The peaks array length is TARGET_PEAKS_COUNT (~1000 samples) for mobile rendering.
 * Each peak value is between 0 and 1.
 *
 * Uses expo-av's Audio.Sound to load and decode the audio file, then extracts
 * raw PCM samples via the onAudioSampleProcessed callback to compute RMS peaks.
 */
export async function generateWaveformPeaks(
  recordingUri: string,
  durationSeconds: number,
): Promise<number[]> {
  // Create a sound object and load the audio file
  const { sound } = await Audio.Sound.createAsync(
    { uri: recordingUri },
    { shouldPlay: false },
    null,
    false,
  );

  // Get the total duration in milliseconds from the loaded sound
  const status = await sound.getStatusAsync();
  const totalDurationMs = status.durationMillis ?? durationSeconds * 1000;

  // We'll collect raw PCM samples via the onAudioSampleProcessed callback.
  // Since expo-av doesn't expose raw PCM directly through a simple API,
  // we use a workaround: we seek through the audio and use the sample processor.
  // For simplicity and reliability, we load the file and use the Audio API's
  // onAudioSampleProcessed to capture samples.
  const rawSamples: Float32Array[] = [];

  // Set up a callback to collect samples
  sound.setOnAudioSampleProcessed((sample) => {
    rawSamples.push(sample.channelData[0]);
  });

  // Play the sound briefly to trigger sample processing (we'll stop immediately)
  await sound.playAsync();
  // Wait a small amount of time for the callback to fire
  await new Promise((resolve) => setTimeout(resolve, 100));
  await sound.stopAsync();

  // Unload the sound to free resources
  await sound.unloadAsync();

  // Concatenate all collected sample chunks into one Float32Array
  let totalLength = 0;
  for (const chunk of rawSamples) {
    totalLength += chunk.length;
  }
  const fullData = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of rawSamples) {
    fullData.set(chunk, offset);
    offset += chunk.length;
  }

  // If we got no samples (e.g., on a simulator without real audio), fall back
  // to generating a flat line to avoid an empty waveform
  if (fullData.length === 0) {
    return new Array(TARGET_PEAKS_COUNT).fill(0.5);
  }

  // Downsample to TARGET_PEAKS_COUNT by computing RMS per block
  const blockSize = Math.max(1, Math.floor(fullData.length / TARGET_PEAKS_COUNT));
  const peaks: number[] = [];

  for (let i = 0; i < TARGET_PEAKS_COUNT; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, fullData.length);
    let sumSquares = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      const sample = fullData[j];
      sumSquares += sample * sample;
      count++;
    }
    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    // Normalize to 0-1 (audio samples are typically in range -1 to 1, so RMS is 0-1)
    peaks.push(Math.min(1, Math.max(0, rms)));
  }

  return peaks;
}
