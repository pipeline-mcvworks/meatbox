import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ActiveTool, VisualizerPreset } from './types';

export interface UiState {
  /** ID of the currently selected drum event, or null */
  selectedEventId: string | null;
  /** ID of the event currently being edited via the bottom sheet */
  editingEventId: string | null;
  /** ID of the event whose long-press context menu is open */
  contextMenuEventId: string | null;
  /** Pixels per second on the timeline (legacy zoom unit) */
  timelineZoom: number;
  /** Horizontal scroll offset in pixels */
  timelineScrollX: number;
  /** Pixels per beat — used by the gesture-driven timeline editor */
  pxPerBeat: number;
  /** Lane row height in pixels — used for vertical lane-change drag math */
  laneHeight: number;
  activeTool: ActiveTool;
  visualizerPreset: VisualizerPreset;
  /** Whether the kit pad panel is expanded */
  kitPanelExpanded: boolean;
}

export interface UiActions {
  setSelectedEvent: (id: string | null) => void;
  setEditingEvent: (id: string | null) => void;
  setContextMenuEvent: (id: string | null) => void;
  setTimelineZoom: (zoom: number) => void;
  setTimelineScroll: (scrollX: number) => void;
  setPxPerBeat: (px: number) => void;
  setLaneHeight: (h: number) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setVisualizerPreset: (preset: VisualizerPreset) => void;
  setKitPanelExpanded: (expanded: boolean) => void;
  resetUi: () => void;
}

export type UiStore = UiState & UiActions;

const initialState: UiState = {
  selectedEventId: null,
  editingEventId: null,
  contextMenuEventId: null,
  timelineZoom: 100,
  timelineScrollX: 0,
  pxPerBeat: 60,
  laneHeight: 56,
  activeTool: 'select',
  visualizerPreset: 'waveform',
  kitPanelExpanded: true,
};

export const useUiStore = create<UiStore>()(
  immer((set) => ({
    ...initialState,

    setSelectedEvent: (id) =>
      set((state) => {
        state.selectedEventId = id;
      }),

    setEditingEvent: (id) =>
      set((state) => {
        state.editingEventId = id;
      }),

    setContextMenuEvent: (id) =>
      set((state) => {
        state.contextMenuEventId = id;
      }),

    setTimelineZoom: (zoom) =>
      set((state) => {
        state.timelineZoom = Math.max(10, Math.min(zoom, 1000));
      }),

    setTimelineScroll: (scrollX) =>
      set((state) => {
        state.timelineScrollX = Math.max(0, scrollX);
      }),

    setPxPerBeat: (px) =>
      set((state) => {
        state.pxPerBeat = Math.max(20, Math.min(px, 400));
      }),

    setLaneHeight: (h) =>
      set((state) => {
        state.laneHeight = Math.max(32, Math.min(h, 200));
      }),

    setActiveTool: (tool) =>
      set((state) => {
        state.activeTool = tool;
      }),

    setVisualizerPreset: (preset) =>
      set((state) => {
        state.visualizerPreset = preset;
      }),

    setKitPanelExpanded: (expanded) =>
      set((state) => {
        state.kitPanelExpanded = expanded;
      }),

    resetUi: () =>
      set((state) => {
        Object.assign(state, initialState);
      }),
  }))
);

// ---------------------------------------------------------------------------
// Typed selectors
// ---------------------------------------------------------------------------

export const selectSelectedEventId = (s: UiStore) => s.selectedEventId;
export const selectEditingEventId = (s: UiStore) => s.editingEventId;
export const selectContextMenuEventId = (s: UiStore) => s.contextMenuEventId;
export const selectTimelineZoom = (s: UiStore) => s.timelineZoom;
export const selectTimelineScrollX = (s: UiStore) => s.timelineScrollX;
export const selectPxPerBeat = (s: UiStore) => s.pxPerBeat;
export const selectLaneHeight = (s: UiStore) => s.laneHeight;
export const selectActiveTool = (s: UiStore) => s.activeTool;
export const selectVisualizerPreset = (s: UiStore) => s.visualizerPreset;
export const selectKitPanelExpanded = (s: UiStore) => s.kitPanelExpanded;
