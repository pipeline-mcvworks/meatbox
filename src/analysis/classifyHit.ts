import { extractFeaturesForHits } from './featureExtraction';
import { AudioSampleInput } from './preprocess';
import { ClassifiedHit, DetectedHit, HitFeatures, HitLabel } from './types';

export interface ClassifyHitOptions {
  sampleRate: number;
}

interface ClassificationResult {
  label: HitLabel;
  confidence: number;
}

export function classifyHits(
  input: AudioSampleInput,
  hits: DetectedHit[],
  options: ClassifyHitOptions,
): ClassifiedHit[] {
  const features = extractFeaturesForHits(input, hits, {
    sampleRate: options.sampleRate,
  });

  return hits.map((hit, index) => {
    const classification = classifyHit(features[index]);

    return {
      ...hit,
      label: classification.label,
      classificationConfidence: classification.confidence,
      confidence: clamp((hit.confidence + classification.confidence) / 2, 0, 1),
      features: features[index],
    };
  });
}

export function classifyHit(features: HitFeatures): ClassificationResult {
  const low = features.lowEnergyRatio;
  const mid = features.midEnergyRatio;
  const high = features.highEnergyRatio;
  const duration = features.durationSeconds;
  const brightness = features.spectralCentroid;
  const zcr = features.zeroCrossingRate;

  if (features.peakAmplitude < 0.04 || features.rmsEnergy < 0.01) {
    return { label: 'unknown', confidence: 0.2 };
  }

  if (low >= 0.45 && low > mid && low > high && duration <= 0.28) {
    return {
      label: 'kick',
      confidence: clamp(0.45 + (low - Math.max(mid, high)) * 0.9 + features.peakAmplitude * 0.15, 0.35, 0.95),
    };
  }

  if (high >= 0.42 && high >= low && (brightness >= 2500 || zcr >= 1200)) {
    return {
      label: 'hat',
      confidence: clamp(0.42 + (high - low) * 0.75 + Math.min(zcr / 9000, 0.2), 0.35, 0.93),
    };
  }

  if (mid >= 0.34 && mid >= low * 0.75 && high >= 0.12) {
    return {
      label: 'snare',
      confidence: clamp(0.42 + mid * 0.45 + high * 0.25, 0.35, 0.9),
    };
  }

  if (features.peakAmplitude >= 0.08) {
    return {
      label: 'perc',
      confidence: clamp(0.35 + Math.max(low, mid, high) * 0.35 + features.rmsEnergy * 0.2, 0.3, 0.82),
    };
  }

  return { label: 'unknown', confidence: 0.25 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
