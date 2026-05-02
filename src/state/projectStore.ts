import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { TimelineEvent } from '../analysis/createTimelineEvents';
import type { DrumEvent, Kit, Lane } from './types';

// ---------------------------------------------------------------------------
// Default project (mirrors the shape from T-002 defaultProject)
// ---------------------------------------------------------------------------

export type TimelineEventMergeMode = 'replace' | 'merge';

const UNKNOWN_LANE: Lane = { id: 'lane-unknown', name: 'Unknown', instrument: 'unknown', muted: false, solo: false, volume: 0.75, pan: 0, color: '#9E9E9E', sampleId: 'sample-clap' };

const DEFAULT_LANES: Lane[] = [
  { id: 'lane-kick',  name: 'Kick',   instrument: 'kick',   muted: false, solo: false, volume: 1, pan: 0, color: '#E57373', sampleId: 'sample-kick' },
  { id: 'lane-snare', name: 'Snare',  instrument: 'snare',  muted: false, solo: false, volume: 1, pan: 0, color: '#81C784', sampleId: 'sample-snare' },
  { id: 'lane-hihat', name: 'Hi-Hat', instrument: 'hihat',  muted: false, solo: false, volume: 1, pan: 0, color: '#64B5F6', sampleId: 'sample-hihat' },
  { id: 'lane-clap',  name: 'Clap',   instrument: 'clap',   muted: false, solo: false, volume: 1, pan: 0, color: '#FFD54F', sampleId: 'sample-clap' },
  UNKNOWN_LANE,
];

const DEFAULT_EVENTS: DrumEvent[] = [
  // Kick on beats 1 & 3 (at 120 bpm, beat = 0.5 s)
  { id: 'evt-1', laneId: 'lane-kick',  startTime: 0.0, duration: 0.25, velocity: 1.0 },
  { id: 'evt-2', laneId: 'lane-kick',  startTime: 1.0, duration: 0.25, velocity: 0.9 },
  // Snare on beats 2 & 4
  { id: 'evt-3', laneId: 'lane-snare', startTime: 0.5, duration: 0.25, velocity: 1.0 },
  { id: 'evt-4', laneId: 'lane-snare', startTime: 1.5, duration: 0.25, velocity: 0.9 },
  // Hi-hat every 8th note
  { id: 'evt-5', laneId: 'lane-hihat', startTime: 0.0,  duration: 0.1, velocity: 0.7 },
  { id: 'evt-6', laneId: 'lane-hihat', startTime: 0.25, duration: 0.1, velocity: 0.6 },
  { id: 'evt-7', laneId: 'lane-hihat', startTime: 0.5,  duration: 0.1, velocity: 0.7 },
  { id: 'evt-8', laneId: 'lane-hihat', startTime: 0.75, duration: 0.1, velocity: 0.6 },
  { id: 'evt-9', laneId: 'lane-hihat', startTime: 1.0,  duration: 0.1, velocity: 0.7 },
  { id: 'evt-10', laneId: 'lane-hihat', startTime: 1.25, duration: 0.1, velocity: 0.6 },
  { id: 'evt-11', laneId: 'lane-hihat', startTime: 1.5,  duration: 0.1, velocity: 0.7 },
  { id: 'evt-12', laneId: 'lane-hihat', startTime: 1.75, duration: 0.1, velocity: 0.6 },
];

const DEFAULT_KIT: Kit = {
  id: 'kit-default',
  name: 'Default Kit',
  pads: [
    { id: 'pad-kick',  name: 'Kick',   color: '#E57373', sampleId: 'sample-kick' },
    { id: 'pad-snare', name: 'Snare',  color: '#81C784', sampleId: 'sample-snare' },
    { id: 'pad-hihat', name: 'Hi-Hat', color: '#64B5F6', sampleId: 'sample-hihat' },
    { id: 'pad-clap',  name: 'Clap',   color: '#FFD54F', sampleId: 'sample-clap' },
  ],
};

export const BUILT_IN_KITS = [
  {
    id: 'kit-default',
    name: 'Default',
    pads: [
      { id: 'pad-kick',  name: 'Kick',   color: '#E57373', sampleId: 'sample-kick' },
      { id: 'pad-snare', name: 'Snare',  color: '#81C784', sampleId: 'sample-snare' },
      { id: 'pad-hihat', name: 'Hi-Hat', color: '#64B5F6', sampleId: 'sample-hihat' },
      { id: 'pad-clap',  name: 'Clap',   color: '#FFD54F', sampleId: 'sample-clap' },
    ],
  },
  {
    id: 'kit-electronic',
    name: 'Electronic',
    pads: [
      { id: 'pad-kick',  name: 'Kick',   color: '#CE93D8', sampleId: 'sample-kick' },
      { id: 'pad-snare', name: 'Snare',  color: '#80CBC4', sampleId: 'sample-snare' },
      { id: 'pad-hihat', name: 'Hi-Hat', color: '#90CAF9', sampleId: 'sample-hihat' },
      { id: 'pad-clap',  name: 'Clap',   color: '#FFE082', sampleId: 'sample-clap' },
      { id: 'pad-tom1',  name: 'Tom 1',  color: '#F48FB1', sampleId: 'sample-tom1' },
      { id: 'pad-tom2',  name: 'Tom 2',  color: '#A5D6A7', sampleId: 'sample-tom2' },
      { id: 'pad-ride',  name: 'Ride',   color: '#B0BEC5', sampleId: 'sample-ride' },
      { id: 'pad-crash', name: 'Crash',  color: '#FFAB91', sampleId: 'sample-crash' },
    ],
  },
  {
    id: 'kit-acoustic',
    name: 'Acoustic',
    pads: [
      { id: 'pad-kick',  name: 'Kick',   color: '#EF9A9A', sampleId: 'sample-kick' },
      { id: 'pad-snare', name: 'Snare',  color: '#C8E6C9', sampleId: 'sample-snare' },
      { id: 'pad-hihat', name: 'Hi-Hat', color: '#BBDEFB', sampleId: 'sample-hihat' },
      { id: 'pad-clap',  name: 'Clap',   color: '#FFF9C4', sampleId: 'sample-clap' },
      { id: 'pad-tom1',  name: 'Tom 1',  color: '#F8BBD0', sampleId: 'sample-tom1' },
      { id: 'pad-tom2',  name: 'Tom 2',  color: '#C8E6C9', sampleId: 'sample-tom2' },
      { id: 'pad-ride',  name: 'Ride',   color: '#D7CCC8', sampleId: 'sample-ride' },
      { id: 'pad-crash', name: 'Crash',  color: '#FFCCBC', sampleId: 'sample-crash' },
    ],
  },
  {
    id: 'kit-hiphop',
    name: 'Hip Hop',
    pads: [
      { id: 'pad-kick',  name: 'Kick',   color: '#F06292', sampleId: 'sample-kick' },
      { id: 'pad-snare', name: 'Snare',  color: '#AED581', sampleId: 'sample-snare' },
      { id: 'pad-hihat', name: 'Hi-Hat', color: '#4FC3F7', sampleId: 'sample-hihat' },
      { id: 'pad-clap',  name: 'Clap',   color: '#FFB74D', sampleId: 'sample-clap' },
      { id: 'pad-openhh', name: 'Open HH', color: '#9575CD', sampleId: 'sample-openhh' },
      { id: 'pad-closedhh', name: 'Closed HH', color: '#4DB6AC', sampleId: 'sample-closedhh' },
      { id: 'pad-cowbell', name: 'Cowbell', color: '#FF8A65', sampleId: 'sample-cowbell' },
      { id: 'pad-tambourine', name: 'Tambourine', color: '#90A4AE', sampleId: 'sample-tambourine' },
    ],
  },
];

export interface ProjectState {
  id: string;
  name: string;
  bpm: number;
  /** Total length in bars */
  bars: number;
  lanes: Lane[];
  events: DrumEvent[];
  kit: Kit;
  createdAt: string;
  updatedAt: string;
  /** 0..1 — how strongly to pull beats to the grid */
  quantizeStrength: number;
  /** 0..1 — swing amount applied to off-beat 16ths */
  swing: number;
  /** 0..1 — random timing jitter applied on quantize */
  humanize: number;
}

export interface ProjectActions {
  setProject: (project: Partial<ProjectState>) => void;
  setProjectName: (name: string) => void;
  setBpm: (bpm: number) => void;
  // Lane actions
  addLane: (lane: Lane) => void;
  updateLane: (id: string, patch: Partial<Lane>) => void;
  deleteLane: (id: string) => void;
  setLaneSample: (laneId: string, sampleId: string) => void;
  // Event actions
  addEvent: (event: DrumEvent) => void;
  /** Add a new event at a given beat in a given lane. Returns new event id. */
  addEventAt: (laneId: string, beat: number, velocity?: number) => string;
  updateEvent: (id: string, patch: Partial<DrumEvent>) => void;
  deleteEvent: (id: string) => void;
  /** Move an event to a new start beat and (optionally) lane. */
  moveEvent: (id: string, startBeat: number, laneId?: string) => void;
  /** Duplicate an event; returns new event id. */
  duplicateEvent: (id: string) => string | null;
  setTimelineEvents: (events: TimelineEvent[], mode?: TimelineEventMergeMode) => void;
  // Quantize controls
  setQuantizeStrength: (v: number) => void;
  setSwing: (v: number) => void;
  setHumanize: (v: number) => void;
  /** Apply quantize/swing/humanize. If ids is empty, applies to all unlocked events. */
  applyQuantizeToSelection: (ids: string[]) => void;
  // Kit actions
  setKit: (kit: Kit) => void;
}

export type ProjectStore = ProjectState & ProjectActions;

const initialState: ProjectState = {
  id: 'project-default',
  name: 'My First Beat',
  bpm: 120,
  bars: 2,
  lanes: DEFAULT_LANES,
  events: DEFAULT_EVENTS,
  kit: DEFAULT_KIT,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  quantizeStrength: 0,
  swing: 0,
  humanize: 0,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function beatToSeconds(beat: number, bpm: number): number {
  return (beat * 60) / Math.max(1, bpm);
}

function secondsToBeat(seconds: number, bpm: number): number {
  return (seconds * Math.max(1, bpm)) / 60;
}

function snapBeat(beat: number, strength: number, step = 0.25): number {
  const q = Math.round(beat / step) * step;
  const s = Math.max(0, Math.min(1, strength));
  return beat + (q - beat) * s;
}

function applySwing(beat: number, swing: number, step = 0.25): number {
  // Push every odd 16th note later by `swing * step * 0.5`.
  if (swing <= 0) return beat;
  const idx = Math.round(beat / step);
  if (idx % 2 === 1) {
    return beat + Math.max(0, Math.min(1, swing)) * step * 0.5;
  }
  return beat;
}

function applyHumanize(beat: number, humanize: number, step = 0.25): number {
  if (humanize <= 0) return beat;
  const jitter = (Math.random() - 0.5) * 2 * humanize * step * 0.5;
  return Math.max(0, beat + jitter);
}

function makeEventId(): string {
  return `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export const useProjectStore = create<ProjectStore>()(
  immer((set, get) => ({
    ...initialState,

    setProject: (project) =>
      set((state) => {
        Object.assign(state, project);
        state.updatedAt = new Date().toISOString();
      }),

    setProjectName: (name) =>
      set((state) => {
        state.name = name;
        state.updatedAt = new Date().toISOString();
      }),

    setBpm: (bpm) =>
      set((state) => {
        state.bpm = bpm;
        state.updatedAt = new Date().toISOString();
      }),

    addLane: (lane) =>
      set((state) => {
        state.lanes.push(lane);
        state.updatedAt = new Date().toISOString();
      }),

    updateLane: (id, patch) =>
      set((state) => {
        const lane = state.lanes.find((l) => l.id === id);
        if (lane) {
          Object.assign(lane, patch);
          state.updatedAt = new Date().toISOString();
        }
      }),

    deleteLane: (id) =>
      set((state) => {
        state.lanes = state.lanes.filter((l) => l.id !== id);
        state.events = state.events.filter((e) => e.laneId !== id);
        state.updatedAt = new Date().toISOString();
      }),

    setLaneSample: (laneId, sampleId) =>
      set((state) => {
        const lane = state.lanes.find((l) => l.id === laneId);
        if (lane) {
          lane.sampleId = sampleId;
          state.updatedAt = new Date().toISOString();
        }
      }),

    addEvent: (event) =>
      set((state) => {
        state.events.push(event);
        state.updatedAt = new Date().toISOString();
      }),

    addEventAt: (laneId, beat, velocity = 0.9) => {
      const id = makeEventId();
      set((state) => {
        const startTime = beatToSeconds(Math.max(0, beat), state.bpm);
        const newEvent: DrumEvent = {
          id,
          laneId,
          startTime,
          duration: 0.25,
          velocity,
        };
        state.events.push(newEvent);
        state.updatedAt = new Date().toISOString();
      });
      return id;
    },

    updateEvent: (id, patch) =>
      set((state) => {
        const event = state.events.find((e) => e.id === id);
        if (event) {
          Object.assign(event, patch);
          state.updatedAt = new Date().toISOString();
        }
      }),

    deleteEvent: (id) =>
      set((state) => {
        state.events = state.events.filter((e) => e.id !== id);
        state.updatedAt = new Date().toISOString();
      }),

    moveEvent: (id, startBeat, laneId) =>
      set((state) => {
        const event = state.events.find((e) => e.id === id);
        if (!event) return;
        // Respect locked flag if present.
        if ((event as DrumEvent & { locked?: boolean }).locked) return;
        event.startTime = beatToSeconds(Math.max(0, startBeat), state.bpm);
        if (laneId && state.lanes.some((l) => l.id === laneId)) {
          event.laneId = laneId;
        }
        state.updatedAt = new Date().toISOString();
      }),

    duplicateEvent: (id) => {
      const original = get().events.find((e) => e.id === id);
      if (!original) return null;
      const newId = makeEventId();
      set((state) => {
        const dup: DrumEvent = {
          ...original,
          id: newId,
          startTime: original.startTime + (original.duration || 0.25),
        };
        state.events.push(dup);
        state.updatedAt = new Date().toISOString();
      });
      return newId;
    },

    setTimelineEvents: (events, mode = 'replace') =>
      set((state) => {
        ensureUnknownLane(state.lanes);

        const nextEvents: DrumEvent[] = events.map((event) => ({ ...event }));

        if (mode === 'merge') {
          state.events.push(...nextEvents);
        } else {
          state.events = nextEvents;
        }

        const endTime = state.events.reduce(
          (max, event) => Math.max(max, event.startTime + event.duration),
          0,
        );
        const secondsPerBar = Math.max(0.001, (60 / Math.max(1, state.bpm)) * 4);
        const neededBars = Math.max(1, Math.ceil(endTime / secondsPerBar));

        state.bars = mode === 'merge' ? Math.max(state.bars, neededBars) : neededBars;
        state.updatedAt = new Date().toISOString();
      }),

    setQuantizeStrength: (v) =>
      set((state) => {
        state.quantizeStrength = Math.max(0, Math.min(1, v));
        state.updatedAt = new Date().toISOString();
      }),

    setSwing: (v) =>
      set((state) => {
        state.swing = Math.max(0, Math.min(1, v));
        state.updatedAt = new Date().toISOString();
      }),

    setHumanize: (v) =>
      set((state) => {
        state.humanize = Math.max(0, Math.min(1, v));
        state.updatedAt = new Date().toISOString();
      }),

    applyQuantizeToSelection: (ids) =>
      set((state) => {
        const targetSet = new Set(ids);
        const applyToAll = ids.length === 0;
        state.events.forEach((event) => {
          if (!applyToAll && !targetSet.has(event.id)) return;
          if ((event as DrumEvent & { locked?: boolean }).locked) return;
          const beat = secondsToBeat(event.startTime, state.bpm);
          let next = snapBeat(beat, state.quantizeStrength);
          next = applySwing(next, state.swing);
          next = applyHumanize(next, state.humanize);
          event.startTime = beatToSeconds(Math.max(0, next), state.bpm);
        });
        state.updatedAt = new Date().toISOString();
      }),

    setKit: (kit) =>
      set((state) => {
        state.kit = kit;
        // Update lanes to match kit pads
        kit.pads.forEach((pad) => {
          const lane = state.lanes.find((l) => l.instrument === pad.id.replace('pad-', ''));
          if (lane && pad.sampleId) {
            lane.sampleId = pad.sampleId;
          }
        });
        state.updatedAt = new Date().toISOString();
      }),
  }))
);

function ensureUnknownLane(lanes: Lane[]): void {
  if (!lanes.some((lane) => lane.id === UNKNOWN_LANE.id)) {
    lanes.push({ ...UNKNOWN_LANE });
  }
}

// ---------------------------------------------------------------------------
// Typed selectors
// ---------------------------------------------------------------------------

export const selectBpm = (s: ProjectStore) => s.bpm;
export const selectLanes = (s: ProjectStore) => s.lanes;
export const selectEvents = (s: ProjectStore) => s.events;
export const selectKit = (s: ProjectStore) => s.kit;
export const selectProjectName = (s: ProjectStore) => s.name;
export const selectEventsByLane = (laneId: string) => (s: ProjectStore) =>
  s.events.filter((e) => e.laneId === laneId);
export const selectQuantizeStrength = (s: ProjectStore) => s.quantizeStrength;
export const selectSwing = (s: ProjectStore) => s.swing;
export const selectHumanize = (s: ProjectStore) => s.humanize;
