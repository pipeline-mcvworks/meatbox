export type HitLabel = 'kick' | 'snare' | 'hat' | 'perc' | 'unknown';

export interface DetectedHit {
  id: string;
  timeSeconds: number;
  originalTimeSeconds: number;
  quantizedTimeSeconds?: number;
  confidence: number;
  amplitude: number;
}

export interface HitFeatures {
  startTimeSeconds: number;
  endTimeSeconds: number;
  durationSeconds: number;
  rmsEnergy: number;
  peakAmplitude: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  lowEnergyRatio: number;
  midEnergyRatio: number;
  highEnergyRatio: number;
}

export interface ClassifiedHit extends DetectedHit {
  label: HitLabel;
  classificationConfidence: number;
  features: HitFeatures;
}
