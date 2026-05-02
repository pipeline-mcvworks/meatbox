import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DrumEvent, Kit, Lane } from './types';

// ---------------------------------------------------------------------------
// Default project (mirrors the shape from T-002 defaultProject)
// ---------------------------------------------------------------------------

const DEFAULT_LANES: Lane[] = [
  { id: 'lane-kick',  name: 'Kick',   instrument: 'kick',   muted: false, solo: false, volume: 1, pan: 0, color: '#E57373' },
  { id: 'lane-snare', name: 'Snare',  instrument: 'snare',  muted: false, solo: false, volume: 1, pan: 0, color: '#81C784' },
  { id: 'lane-hihat', name: 'Hi-Hat', instrument: 'hihat',  muted: false, solo: false, volume: 1, pan: 0, color: '#64B5F6' },
  { id: 'lane-clap',  name: 'Clap',   instrument: 'clap',   muted: false, solo: false, volume: 1, pan: 0, color: '#FFD54F' },
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
    { id: 'pad-kick',  name: 'Kick',   color: '#E57373' },
    { id: 'pad-snare', name: 'Snare',  color: '#81C784' },
    { id: 'pad-hihat', name: 'Hi-Hat', color: '#64B5F6' },
    { id: 'pad-clap',  name: 'Clap',   color: '#FFD54F' },
  ],
};

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
}

export interface ProjectActions {
  setProject: (project: Partial<ProjectState>) => void;
  setProjectName: (name: string) => void;
  setBpm: (bpm: number) => void;
  // Lane actions
  addLane: (lane: Lane) => void;
  updateLane: (id: string, patch: Partial<Lane>) => void;
  deleteLane: (id: string) => void;
  // Event actions
  addEvent: (event: DrumEvent) => void;
  updateEvent: (id: string, patch: Partial<DrumEvent>) => void;
  deleteEvent: (id: string) => void;
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
};

export const useProjectStore = create<ProjectStore>()(
  immer((set) => ({
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

    addEvent: (event) =>
      set((state) => {
        state.events.push(event);
        state.updatedAt = new Date().toISOString();
      }),

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

    setKit: (kit) =>
      set((state) => {
        state.kit = kit;
        state.updatedAt = new Date().toISOString();
      }),
  }))
);

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
