import { preprocessAudio, AudioSampleInput } from './preprocess';
import { DetectedHit } from './types';

export interface OnsetDetectionOptions {
  sampleRate: number;
  sensitivity?: number;
  windowSize?: number;
  hopSize?: number;
  minDebounceMs?: number;
  noiseGateThreshold?: number;
}

interface EnvelopeFrame {
  timeSeconds: number;
  rms: number;
  peak: number;
}

const DEFAULT_WINDOW_SIZE = 512;
const DEFAULT_HOP_SIZE = 128;
const DEFAULT_SENSITIVITY = 55;
const MIN_CONFIDENCE = 0.05;

export function detectOnsets(
  input: AudioSampleInput,
  options: OnsetDetectionOptions,
): DetectedHit[] {
  const sensitivity = clamp(options.sensitivity ?? DEFAULT_SENSITIVITY, 0, 100);
  const sampleRate = Math.max(1, options.sampleRate);
  const windowSize = Math.max(16, options.windowSize ?? getDefaultWindowSize(sampleRate));
  const hopSize = Math.max(1, options.hopSize ?? Math.floor(windowSize / 4));
  const minDebounceMs = options.minDebounceMs ?? getDebounceMsForSensitivity(sensitivity);
  const { samples } = preprocessAudio(input, {
    sampleRate,
    noiseGateThreshold: options.noiseGateThreshold ?? getNoiseGateForSensitivity(sensitivity),
  });

  if (samples.length === 0) {
    return [];
  }

  const envelope = buildEnvelope(samples, sampleRate, windowSize, hopSize);

  if (envelope.length < 3) {
    return [];
  }

  const novelty = buildNoveltyCurve(envelope);
  const threshold = getAdaptiveThreshold(novelty, sensitivity);
  const minEnvelope = getMinEnvelopeForSensitivity(sensitivity);
  const minDebounceSeconds = minDebounceMs / 1000;
  const candidates: DetectedHit[] = [];

  for (let i = 1; i < novelty.length - 1; i += 1) {
    const isLocalPeak = novelty[i] >= novelty[i - 1] && novelty[i] > novelty[i + 1];
    const isLoudEnough = envelope[i].rms >= minEnvelope || envelope[i].peak >= minEnvelope * 1.4;

    if (!isLocalPeak || novelty[i] < threshold || !isLoudEnough) {
      continue;
    }

    const confidence = clamp((novelty[i] - threshold) / Math.max(threshold, 0.0001), 0, 1);

    candidates.push({
      id: `hit-${i}-${envelope[i].timeSeconds.toFixed(4)}`,
      timeSeconds: envelope[i].timeSeconds,
      originalTimeSeconds: envelope[i].timeSeconds,
      confidence: Math.max(MIN_CONFIDENCE, confidence),
      amplitude: clamp(envelope[i].peak, 0, 1),
    });
  }

  return debounceHits(candidates, minDebounceSeconds);
}

function getDefaultWindowSize(sampleRate: number): number {
  if (sampleRate < 1000) {
    return 8;
  }

  if (sampleRate < 8000) {
    return 128;
  }

  return DEFAULT_WINDOW_SIZE;
}

function buildEnvelope(
  samples: number[],
  sampleRate: number,
  windowSize: number,
  hopSize: number,
): EnvelopeFrame[] {
  const envelope: EnvelopeFrame[] = [];

  for (let start = 0; start < samples.length; start += hopSize) {
    const end = Math.min(samples.length, start + windowSize);
    let sumSquares = 0;
    let peak = 0;
    let frameCount = 0;

    for (let i = start; i < end; i += 1) {
      const magnitude = Math.abs(samples[i]);
      sumSquares += magnitude * magnitude;
      peak = Math.max(peak, magnitude);
      frameCount += 1;
    }

    const rms = frameCount > 0 ? Math.sqrt(sumSquares / frameCount) : 0;

    envelope.push({
      timeSeconds: (start + (end - start) / 2) / sampleRate,
      rms,
      peak,
    });

    if (end >= samples.length) {
      break;
    }
  }

  return smoothEnvelope(envelope);
}

function smoothEnvelope(envelope: EnvelopeFrame[]): EnvelopeFrame[] {
  return envelope.map((frame, index) => {
    const previous = envelope[Math.max(0, index - 1)];
    const next = envelope[Math.min(envelope.length - 1, index + 1)];

    return {
      ...frame,
      rms: previous.rms * 0.2 + frame.rms * 0.6 + next.rms * 0.2,
      peak: Math.max(previous.peak * 0.7, frame.peak, next.peak * 0.7),
    };
  });
}

function buildNoveltyCurve(envelope: EnvelopeFrame[]): number[] {
  const novelty: number[] = [0];

  for (let i = 1; i < envelope.length; i += 1) {
    const rmsIncrease = Math.max(0, envelope[i].rms - envelope[i - 1].rms);
    const peakIncrease = Math.max(0, envelope[i].peak - envelope[i - 1].peak);

    novelty.push(rmsIncrease * 0.75 + peakIncrease * 0.25);
  }

  return novelty;
}

function getAdaptiveThreshold(novelty: number[], sensitivity: number): number {
  const nonZeroNovelty = novelty.filter((value) => value > 0);

  if (nonZeroNovelty.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const mean = nonZeroNovelty.reduce((sum, value) => sum + value, 0) / nonZeroNovelty.length;
  const variance =
    nonZeroNovelty.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) /
    nonZeroNovelty.length;
  const standardDeviation = Math.sqrt(variance);
  const sensitivityFactor = sensitivity / 100;
  const thresholdMultiplier = 2.2 - sensitivityFactor * 1.65;

  return Math.max(0.003, mean + standardDeviation * thresholdMultiplier);
}

function debounceHits(hits: DetectedHit[], minDebounceSeconds: number): DetectedHit[] {
  const debounced: DetectedHit[] = [];

  for (const hit of hits) {
    const previous = debounced[debounced.length - 1];

    if (!previous || hit.timeSeconds - previous.timeSeconds >= minDebounceSeconds) {
      debounced.push(hit);
      continue;
    }

    const previousScore = previous.confidence * 0.65 + previous.amplitude * 0.35;
    const hitScore = hit.confidence * 0.65 + hit.amplitude * 0.35;

    if (hitScore > previousScore) {
      debounced[debounced.length - 1] = hit;
    }
  }

  return debounced.map((hit, index) => ({
    ...hit,
    id: `hit-${index}-${hit.timeSeconds.toFixed(3)}`,
  }));
}

function getDebounceMsForSensitivity(sensitivity: number): number {
  return 185 - (sensitivity / 100) * 95;
}

function getNoiseGateForSensitivity(sensitivity: number): number {
  return 0.045 - (sensitivity / 100) * 0.035;
}

function getMinEnvelopeForSensitivity(sensitivity: number): number {
  return 0.09 - (sensitivity / 100) * 0.065;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
