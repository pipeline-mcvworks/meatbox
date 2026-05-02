import type { ClassifiedHit, DetectedHit } from './types';
import type { DrumEvent, Lane } from '../state/types';

const UNKNOWN_LANE_ID = 'lane-unknown';
const LOW_CONFIDENCE_THRESHOLD = 0.4;
const DEFAULT_BPM = 120;
const DEFAULT_VELOCITY = 0.8;

export type QuantizedHitLike = Partial<DetectedHit> &
  Partial<ClassifiedHit> & {
    beat?: number;
    beatIndex?: number;
    gridBeat?: number;
    quantizedBeat?: number;
    quantizedTime?: number;
    quantizedTimeSeconds?: number;
    snappedTime?: number;
    startTime?: number;
    time?: number;
    timestamp?: number;
    seconds?: number;
  };

export type TimelineEvent = DrumEvent & {
  confidence: number;
  classification: string;
  quantizedBeat: number;
  isLowConfidence: boolean;
  sourceHitId?: string;
};

export interface CreateTimelineEventsOptions {
  bpm?: number;
  lanes?: readonly Lane[];
}

/**
 * Converts the analysis pipeline output into project timeline events.
 *
 * The analysis steps have evolved over the app phases, so this function accepts
 * the raw detected hits, optional classified hits, and optional quantized hits by
 * index. Later arrays win when the same field exists, which lets quantization
 * override the original onset time while preserving detected energy and
 * classification confidence.
 */
export function createTimelineEvents(
  detectedHits: readonly DetectedHit[],
  classifications: readonly ClassifiedHit[] = [],
  quantizationOutput: readonly QuantizedHitLike[] = [],
  options: CreateTimelineEventsOptions = {},
): TimelineEvent[] {
  const bpm = options.bpm && options.bpm > 0 ? options.bpm : DEFAULT_BPM;
  const secondsPerBeat = 60 / bpm;
  const duration = Math.max(0.05, secondsPerBeat / 4);
  const hitCount = Math.max(detectedHits.length, classifications.length, quantizationOutput.length);

  if (hitCount === 0) {
    return [];
  }

  const records = Array.from({ length: hitCount }, (_, index) =>
    mergeHitData(detectedHits[index], classifications[index], quantizationOutput[index]),
  );
  const maxEnergy = records.reduce((max, record) => Math.max(max, extractEnergy(record) ?? 0), 0);
  const eventsByGrid = new Map<string, TimelineEvent>();

  records.forEach((record, index) => {
    const startTime = getQuantizedStartTime(record, secondsPerBeat);

    if (startTime == null || !Number.isFinite(startTime)) {
      return;
    }

    const rawLabel = getHitLabel(record);
    const laneId = resolveLaneId(rawLabel, options.lanes);
    const classification = laneId === UNKNOWN_LANE_ID ? 'unknown' : normalizeLabel(rawLabel) || 'unknown';
    const confidence = getConfidence(record, laneId);
    const velocity = getVelocity(record, maxEnergy);
    const quantizedBeat = getQuantizedBeat(record) ?? Math.max(0, startTime / secondsPerBeat);
    const sourceHitId = getString(record, ['id', 'hitId']);

    const event: TimelineEvent = {
      id: createEventId(index, startTime, laneId),
      laneId,
      startTime: Math.max(0, startTime),
      duration,
      velocity,
      confidence,
      classification,
      quantizedBeat,
      isLowConfidence: confidence < LOW_CONFIDENCE_THRESHOLD,
    };

    if (sourceHitId) {
      event.sourceHitId = sourceHitId;
    }

    const gridKey = `${event.laneId}:${event.startTime.toFixed(4)}`;
    const existing = eventsByGrid.get(gridKey);

    if (!existing || event.velocity > existing.velocity || event.confidence > existing.confidence) {
      eventsByGrid.set(gridKey, event);
    }
  });

  return Array.from(eventsByGrid.values()).sort((a, b) => {
    if (a.startTime !== b.startTime) {
      return a.startTime - b.startTime;
    }

    return a.laneId.localeCompare(b.laneId);
  });
}

function mergeHitData(...values: readonly unknown[]): Record<string, unknown> {
  return values.reduce<Record<string, unknown>>((acc, value) => {
    if (value && typeof value === 'object') {
      Object.assign(acc, value);
    }

    return acc;
  }, {});
}

function getQuantizedStartTime(record: Record<string, unknown>, secondsPerBeat: number): number | undefined {
  const quantizedTime = getNumber(record, ['quantizedTimeSeconds', 'quantizedTime', 'snappedTime']);

  if (quantizedTime != null) {
    return quantizedTime;
  }

  const quantizedBeat = getQuantizedBeat(record);

  if (quantizedBeat != null) {
    return quantizedBeat * secondsPerBeat;
  }

  return getNumber(record, ['startTime', 'time', 'timestamp', 'seconds']);
}

function getQuantizedBeat(record: Record<string, unknown>): number | undefined {
  return getNumber(record, ['quantizedBeat', 'beat', 'beatIndex', 'gridBeat']);
}

function getHitLabel(record: Record<string, unknown>): string {
  const directLabel = getString(record, ['label', 'classification', 'class', 'instrument', 'type']);

  if (directLabel) {
    return directLabel;
  }

  const nestedClassification = record.classification;

  if (nestedClassification && typeof nestedClassification === 'object') {
    return getString(nestedClassification as Record<string, unknown>, ['label', 'class', 'instrument', 'type']) ?? 'unknown';
  }

  return 'unknown';
}

function resolveLaneId(label: string, lanes: readonly Lane[] | undefined): string {
  const normalizedLabel = normalizeLabel(label);

  if (!normalizedLabel || normalizedLabel === 'unknown') {
    return UNKNOWN_LANE_ID;
  }

  const exactLane = lanes?.find((lane) => {
    const instrument = normalizeLabel(String(lane.instrument));
    const name = normalizeLabel(lane.name);
    const id = normalizeLabel(lane.id.replace(/^lane-/, ''));

    return instrument === normalizedLabel || name === normalizedLabel || id === normalizedLabel;
  });

  if (exactLane) {
    return exactLane.id;
  }

  const canonicalLabel = canonicalizeInstrument(normalizedLabel);
  const canonicalLane = lanes?.find((lane) => {
    const instrument = canonicalizeInstrument(normalizeLabel(String(lane.instrument)));
    const name = canonicalizeInstrument(normalizeLabel(lane.name));
    const id = canonicalizeInstrument(normalizeLabel(lane.id.replace(/^lane-/, '')));

    return instrument === canonicalLabel || name === canonicalLabel || id === canonicalLabel;
  });

  if (canonicalLane) {
    return canonicalLane.id;
  }

  switch (canonicalLabel) {
    case 'kick':
      return 'lane-kick';
    case 'snare':
      return 'lane-snare';
    case 'hihat':
      return 'lane-hihat';
    case 'clap':
      return 'lane-clap';
    default:
      return UNKNOWN_LANE_ID;
  }
}

function getConfidence(record: Record<string, unknown>, laneId: string): number {
  const rawConfidence = getNumber(record, ['confidence', 'classificationConfidence', 'probability', 'score']);
  const defaultConfidence = laneId === UNKNOWN_LANE_ID ? 0.25 : 0.75;
  const confidence = clamp(rawConfidence ?? defaultConfidence, 0, 1);

  if (laneId === UNKNOWN_LANE_ID) {
    return Math.min(confidence, LOW_CONFIDENCE_THRESHOLD - 0.01);
  }

  return confidence;
}

function getVelocity(record: Record<string, unknown>, maxEnergy: number): number {
  const explicitVelocity = getNumber(record, ['velocity']);

  if (explicitVelocity != null) {
    return clamp(explicitVelocity, 0.05, 1);
  }

  const energy = extractEnergy(record);

  if (energy == null) {
    return DEFAULT_VELOCITY;
  }

  if (maxEnergy > 1) {
    return clamp(energy / maxEnergy, 0.05, 1);
  }

  return clamp(energy, 0.05, 1);
}

function extractEnergy(record: Record<string, unknown>): number | undefined {
  return getNumber(record, ['energy', 'amplitude', 'strength', 'peak', 'magnitude', 'level']);
}

function createEventId(index: number, startTime: number, laneId: string): string {
  return `evt-auto-${index + 1}-${Math.round(startTime * 1000)}-${laneId}`;
}

function getNumber(record: Record<string, unknown>, keys: readonly string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function getString(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function canonicalizeInstrument(label: string): string {
  switch (label) {
    case 'kik':
    case 'bass':
    case 'bassdrum':
      return 'kick';
    case 'rim':
    case 'rimshot':
      return 'snare';
    case 'hat':
    case 'hh':
    case 'closedhat':
    case 'closedhh':
    case 'openhat':
    case 'openhh':
    case 'hihat':
      return 'hihat';
    default:
      return label;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
