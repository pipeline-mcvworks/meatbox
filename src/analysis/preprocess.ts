export interface PreprocessOptions {
  sampleRate: number;
  normalize?: boolean;
  noiseGateThreshold?: number;
}

export interface PreprocessedAudio {
  samples: number[];
  sampleRate: number;
}

export type AudioSampleInput = number[] | number[][];

const DEFAULT_NOISE_GATE_THRESHOLD = 0.015;
const SILENCE_THRESHOLD = 0.000001;

export function preprocessAudio(
  input: AudioSampleInput,
  options: PreprocessOptions,
): PreprocessedAudio {
  const monoSamples = convertToMono(input);
  const normalizedSamples = options.normalize === false ? monoSamples : normalizeAudio(monoSamples);
  const gatedSamples = applyNoiseGate(
    normalizedSamples,
    options.noiseGateThreshold ?? DEFAULT_NOISE_GATE_THRESHOLD,
  );

  return {
    samples: gatedSamples,
    sampleRate: Math.max(1, options.sampleRate),
  };
}

export function convertToMono(input: AudioSampleInput): number[] {
  if (input.length === 0) {
    return [];
  }

  if (typeof input[0] === 'number') {
    return (input as number[]).map(sanitizeSample);
  }

  const channels = input as number[][];
  const frameCount = channels.reduce((max, channel) => Math.max(max, channel.length), 0);
  const monoSamples: number[] = [];

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
    let sum = 0;
    let channelCount = 0;

    for (const channel of channels) {
      const sample = channel[frameIndex];

      if (Number.isFinite(sample)) {
        sum += sanitizeSample(sample);
        channelCount += 1;
      }
    }

    monoSamples.push(channelCount > 0 ? sum / channelCount : 0);
  }

  return monoSamples;
}

export function normalizeAudio(samples: number[]): number[] {
  const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);

  if (peak <= SILENCE_THRESHOLD) {
    return samples.map(() => 0);
  }

  return samples.map((sample) => clamp(sample / peak, -1, 1));
}

export function applyNoiseGate(samples: number[], threshold: number): number[] {
  const safeThreshold = clamp(threshold, 0, 1);

  if (safeThreshold <= 0) {
    return samples.slice();
  }

  return samples.map((sample) => {
    const magnitude = Math.abs(sample);

    if (magnitude < safeThreshold) {
      return 0;
    }

    return sample;
  });
}

function sanitizeSample(sample: number): number {
  if (!Number.isFinite(sample)) {
    return 0;
  }

  return clamp(sample, -1, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
