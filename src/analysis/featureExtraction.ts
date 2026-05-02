import { preprocessAudio, AudioSampleInput } from './preprocess';
import { DetectedHit, HitFeatures } from './types';

export interface FeatureExtractionOptions {
  sampleRate: number;
  preWindowMs?: number;
  postWindowMs?: number;
}

const DEFAULT_PRE_WINDOW_MS = 20;
const DEFAULT_POST_WINDOW_MS = 180;
const MAX_SPECTRAL_SAMPLES = 1024;
const MAX_SPECTRAL_BINS = 128;

export function extractFeaturesForHits(
  input: AudioSampleInput,
  hits: DetectedHit[],
  options: FeatureExtractionOptions,
): HitFeatures[] {
  const sampleRate = Math.max(1, options.sampleRate);
  const { samples } = preprocessAudio(input, {
    sampleRate,
    noiseGateThreshold: 0,
  });

  return hits.map((hit) =>
    extractFeaturesForHit(samples, hit.timeSeconds, {
      sampleRate,
      preWindowMs: options.preWindowMs,
      postWindowMs: options.postWindowMs,
    }),
  );
}

export function extractFeaturesForHit(
  samples: number[],
  hitTimeSeconds: number,
  options: FeatureExtractionOptions,
): HitFeatures {
  const sampleRate = Math.max(1, options.sampleRate);
  const preSamples = Math.floor(((options.preWindowMs ?? DEFAULT_PRE_WINDOW_MS) / 1000) * sampleRate);
  const postSamples = Math.floor(((options.postWindowMs ?? DEFAULT_POST_WINDOW_MS) / 1000) * sampleRate);
  const centerSample = Math.floor(hitTimeSeconds * sampleRate);
  const startSample = clamp(centerSample - preSamples, 0, samples.length);
  const endSample = clamp(centerSample + postSamples, startSample + 1, samples.length);
  const windowSamples = samples.slice(startSample, endSample);
  const energyFeatures = getEnergyFeatures(windowSamples, sampleRate);
  const spectralFeatures = getSpectralFeatures(windowSamples, sampleRate);

  return {
    startTimeSeconds: startSample / sampleRate,
    endTimeSeconds: endSample / sampleRate,
    durationSeconds: (endSample - startSample) / sampleRate,
    ...energyFeatures,
    ...spectralFeatures,
  };
}

function getEnergyFeatures(samples: number[], sampleRate: number) {
  let sumSquares = 0;
  let peakAmplitude = 0;
  let zeroCrossings = 0;
  let previousSign = Math.sign(samples[0] ?? 0);

  for (const sample of samples) {
    const magnitude = Math.abs(sample);
    const sign = Math.sign(sample);

    sumSquares += sample * sample;
    peakAmplitude = Math.max(peakAmplitude, magnitude);

    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) {
      zeroCrossings += 1;
    }

    if (sign !== 0) {
      previousSign = sign;
    }
  }

  const rmsEnergy = samples.length > 0 ? Math.sqrt(sumSquares / samples.length) : 0;
  const durationSeconds = samples.length / sampleRate;

  return {
    rmsEnergy,
    peakAmplitude,
    zeroCrossingRate: durationSeconds > 0 ? zeroCrossings / durationSeconds : 0,
  };
}

function getSpectralFeatures(samples: number[], sampleRate: number) {
  const spectralSamples = downsampleForSpectrum(samples, MAX_SPECTRAL_SAMPLES);
  const binCount = Math.min(MAX_SPECTRAL_BINS, Math.floor(spectralSamples.length / 2));

  if (spectralSamples.length === 0 || binCount <= 0) {
    return {
      spectralCentroid: 0,
      lowEnergyRatio: 0,
      midEnergyRatio: 0,
      highEnergyRatio: 0,
    };
  }

  let totalMagnitude = 0;
  let weightedFrequency = 0;
  let lowEnergy = 0;
  let midEnergy = 0;
  let highEnergy = 0;

  for (let bin = 1; bin <= binCount; bin += 1) {
    const frequency = (bin * sampleRate) / spectralSamples.length;
    const magnitude = getBinMagnitude(spectralSamples, bin);

    totalMagnitude += magnitude;
    weightedFrequency += frequency * magnitude;

    if (frequency < 250) {
      lowEnergy += magnitude;
    } else if (frequency < 2500) {
      midEnergy += magnitude;
    } else {
      highEnergy += magnitude;
    }
  }

  if (totalMagnitude <= 0) {
    return {
      spectralCentroid: 0,
      lowEnergyRatio: 0,
      midEnergyRatio: 0,
      highEnergyRatio: 0,
    };
  }

  return {
    spectralCentroid: weightedFrequency / totalMagnitude,
    lowEnergyRatio: lowEnergy / totalMagnitude,
    midEnergyRatio: midEnergy / totalMagnitude,
    highEnergyRatio: highEnergy / totalMagnitude,
  };
}

function downsampleForSpectrum(samples: number[], maxSamples: number): number[] {
  if (samples.length <= maxSamples) {
    return samples.slice();
  }

  const result: number[] = [];
  const step = samples.length / maxSamples;

  for (let i = 0; i < maxSamples; i += 1) {
    result.push(samples[Math.floor(i * step)]);
  }

  return result;
}

function getBinMagnitude(samples: number[], bin: number): number {
  let real = 0;
  let imaginary = 0;
  const angularStep = (2 * Math.PI * bin) / samples.length;

  for (let i = 0; i < samples.length; i += 1) {
    const angle = angularStep * i;

    real += samples[i] * Math.cos(angle);
    imaginary -= samples[i] * Math.sin(angle);
  }

  return Math.sqrt(real * real + imaginary * imaginary) / samples.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
