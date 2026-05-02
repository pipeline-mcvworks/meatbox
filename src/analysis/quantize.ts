import { DetectedHit } from './types';

export interface QuantizeOptions {
  bpm: number;
  strength?: number;
  division?: number;
  swing?: number;
}

export type QuantizedHit<T extends DetectedHit = DetectedHit> = T & {
  originalTimeSeconds: number;
  quantizedTimeSeconds: number;
};

const DEFAULT_STRENGTH = 100;
const DEFAULT_DIVISION = 16;
const DEFAULT_SWING = 0;

export function quantizeHits<T extends DetectedHit>(
  hits: T[],
  options: QuantizeOptions,
): QuantizedHit<T>[] {
  const bpm = Math.max(1, options.bpm);
  const strength = clamp(options.strength ?? DEFAULT_STRENGTH, 0, 100) / 100;
  const division = Math.max(1, options.division ?? DEFAULT_DIVISION);
  const swing = clamp(options.swing ?? DEFAULT_SWING, 0, 100) / 100;
  const gridSeconds = getGridSeconds(bpm, division);

  return hits.map((hit) => {
    const originalTimeSeconds = hit.originalTimeSeconds ?? hit.timeSeconds;
    const snappedTimeSeconds = getNearestGridTime(originalTimeSeconds, gridSeconds, swing);
    const quantizedTimeSeconds = lerp(originalTimeSeconds, snappedTimeSeconds, strength);

    return {
      ...hit,
      originalTimeSeconds,
      quantizedTimeSeconds: Math.max(0, quantizedTimeSeconds),
    };
  });
}

export function quantizeTimeSeconds(
  timeSeconds: number,
  options: QuantizeOptions,
): number {
  const bpm = Math.max(1, options.bpm);
  const strength = clamp(options.strength ?? DEFAULT_STRENGTH, 0, 100) / 100;
  const division = Math.max(1, options.division ?? DEFAULT_DIVISION);
  const swing = clamp(options.swing ?? DEFAULT_SWING, 0, 100) / 100;
  const gridSeconds = getGridSeconds(bpm, division);
  const snappedTimeSeconds = getNearestGridTime(timeSeconds, gridSeconds, swing);

  return Math.max(0, lerp(timeSeconds, snappedTimeSeconds, strength));
}

function getGridSeconds(bpm: number, division: number): number {
  const quarterNoteSeconds = 60 / bpm;

  return quarterNoteSeconds * (4 / division);
}

function getNearestGridTime(timeSeconds: number, gridSeconds: number, swing: number): number {
  const estimatedIndex = Math.round(timeSeconds / gridSeconds);
  let nearestTime = getSwingGridTime(Math.max(0, estimatedIndex), gridSeconds, swing);
  let nearestDistance = Math.abs(timeSeconds - nearestTime);

  for (let index = Math.max(0, estimatedIndex - 2); index <= estimatedIndex + 2; index += 1) {
    const candidateTime = getSwingGridTime(index, gridSeconds, swing);
    const distance = Math.abs(timeSeconds - candidateTime);

    if (distance < nearestDistance) {
      nearestTime = candidateTime;
      nearestDistance = distance;
    }
  }

  return nearestTime;
}

function getSwingGridTime(index: number, gridSeconds: number, swing: number): number {
  const swingOffset = index % 2 === 1 ? gridSeconds * 0.5 * swing : 0;

  return index * gridSeconds + swingOffset;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
