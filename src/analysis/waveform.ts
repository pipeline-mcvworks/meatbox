import { Audio } from 'expo-av';

const TARGET_PEAKS_COUNT = 1000;
const PROCESSING_PLAYBACK_RATE = 4;
const MIN_PROCESSING_TIMEOUT_MS = 3000;
const PROCESSING_TIMEOUT_PADDING_MS = 1500;
const SILENCE_THRESHOLD = 0.0001;

type AudioSampleCallback = NonNullable<Parameters<Audio.Sound['setOnAudioSampleReceived']>[0]>;
type AudioSample = Parameters<AudioSampleCallback>[0];

/**
 * Reads an audio file at the given URI and produces a normalized peaks array.
 * The generated peaks are computed from real PCM frames emitted by expo-av while
 * the recording is played back muted, then downsampled to a mobile-friendly size.
 * Each peak value is between 0 and 1.
 */
export async function generateWaveformPeaks(
  recordingUri: string,
  durationSeconds: number,
): Promise<number[]> {
  if (!recordingUri) {
    return createSilentPeaks(TARGET_PEAKS_COUNT);
  }

  let sound: Audio.Sound | null = null;

  try {
    const result = await Audio.Sound.createAsync(
      { uri: recordingUri },
      {
        shouldPlay: false,
        isMuted: true,
        volume: 0,
        progressUpdateIntervalMillis: 100,
      },
      undefined,
      false,
    );

    sound = result.sound;

    const status = await sound.getStatusAsync();
    const durationMillis =
      status.isLoaded && typeof status.durationMillis === 'number'
        ? status.durationMillis
        : Math.max(0, durationSeconds * 1000);

    const chunkLevels: number[] = [];

    sound.setOnAudioSampleReceived((sample) => {
      const level = getAudioSampleRms(sample);

      if (Number.isFinite(level)) {
        chunkLevels.push(level);
      }
    });

    await sound.setPositionAsync(0);
    const playbackRate = await trySetProcessingPlaybackRate(sound);

    await sound.playAsync();
    await waitForPlaybackToFinish(sound, durationMillis, playbackRate);

    return downsampleAndNormalizePeaks(chunkLevels, TARGET_PEAKS_COUNT);
  } finally {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch {
        // Ignore cleanup failures; callers only need the generated peak data.
      }
    }
  }
}

function getAudioSampleRms(sample: AudioSample): number {
  let sumSquares = 0;
  let frameCount = 0;

  for (const channel of sample.channels) {
    for (const frame of channel.frames) {
      if (Number.isFinite(frame)) {
        const clampedFrame = clamp(frame, -1, 1);
        sumSquares += clampedFrame * clampedFrame;
        frameCount += 1;
      }
    }
  }

  return frameCount > 0 ? Math.sqrt(sumSquares / frameCount) : 0;
}

async function trySetProcessingPlaybackRate(sound: Audio.Sound): Promise<number> {
  try {
    await sound.setRateAsync(PROCESSING_PLAYBACK_RATE, false);
    return PROCESSING_PLAYBACK_RATE;
  } catch {
    return 1;
  }
}

async function waitForPlaybackToFinish(
  sound: Audio.Sound,
  durationMillis: number,
  playbackRate: number,
): Promise<void> {
  const timeoutMillis = Math.max(
    MIN_PROCESSING_TIMEOUT_MS,
    Math.ceil(durationMillis / playbackRate) + PROCESSING_TIMEOUT_PADDING_MS,
  );
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMillis) {
    const status = await sound.getStatusAsync();

    if (!status.isLoaded || status.didJustFinish) {
      return;
    }

    if (
      typeof status.durationMillis === 'number' &&
      typeof status.positionMillis === 'number' &&
      status.durationMillis > 0 &&
      status.positionMillis >= status.durationMillis - 50
    ) {
      return;
    }

    await delay(100);
  }

  try {
    await sound.stopAsync();
  } catch {
    // The sound may already be stopped or unloaded by the platform.
  }
}

function downsampleAndNormalizePeaks(levels: number[], targetCount: number): number[] {
  if (targetCount <= 0) {
    return [];
  }

  if (levels.length === 0) {
    return createSilentPeaks(targetCount);
  }

  const peaks =
    levels.length <= targetCount
      ? interpolatePeaks(levels, targetCount)
      : reducePeaksByWindow(levels, targetCount);

  return normalizePeaks(peaks);
}

function interpolatePeaks(levels: number[], targetCount: number): number[] {
  if (levels.length === 1) {
    return new Array(targetCount).fill(levels[0]);
  }

  const peaks: number[] = [];
  const maxSourceIndex = levels.length - 1;

  for (let i = 0; i < targetCount; i += 1) {
    const sourceIndex = (i / Math.max(1, targetCount - 1)) * maxSourceIndex;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(maxSourceIndex, lowerIndex + 1);
    const blend = sourceIndex - lowerIndex;
    const interpolated = levels[lowerIndex] * (1 - blend) + levels[upperIndex] * blend;

    peaks.push(interpolated);
  }

  return peaks;
}

function reducePeaksByWindow(levels: number[], targetCount: number): number[] {
  const peaks: number[] = [];
  const windowSize = levels.length / targetCount;

  for (let i = 0; i < targetCount; i += 1) {
    const start = Math.floor(i * windowSize);
    const end = Math.max(start + 1, Math.floor((i + 1) * windowSize));
    let peak = 0;

    for (let j = start; j < Math.min(end, levels.length); j += 1) {
      peak = Math.max(peak, levels[j]);
    }

    peaks.push(peak);
  }

  return peaks;
}

function normalizePeaks(peaks: number[]): number[] {
  const maxPeak = peaks.reduce((max, peak) => Math.max(max, peak), 0);

  if (maxPeak <= SILENCE_THRESHOLD) {
    return createSilentPeaks(peaks.length);
  }

  return peaks.map((peak) => clamp(peak / maxPeak, 0, 1));
}

function createSilentPeaks(count: number): number[] {
  return new Array(count).fill(0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
