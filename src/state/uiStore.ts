import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ActiveTool, VisualizerPreset } from './types';

export interface UiState {
  /** ID of the currently selected drum event, or null */
  selectedEventId: string | null;
  /** Pixels per second on the timeline */
  timelineZoom: number;
  /** Horizontal scroll offset in pixels */
  timelineScrollX: number;
  activeTool: ActiveTool;
  visualizerPreset: VisualizerPreset;
  /** Whether the kit pad panel is expanded */
  kitPanelExpanded: boolean;
}

export interface UiActions {
  setSelectedEvent: (id: string | null) => void;
  setTimelineZoom: (zoom: number) => void;
  setTimelineScroll: (scrollX: number) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setVisualizerPreset: (preset: VisualizerPreset) => void;
  setKitPanelExpanded: (expanded: boolean) => void;
  resetUi: () => void;
}

export type UiStore = UiState & UiActions;

const initialState: UiState = {
  selectedEventId: null,
  timelineZoom: 100,
  timelineScrollX: 0,
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

    setTimelineZoom: (zoom) =>
      set((state) => {
        state.timelineZoom = Math.max(10, Math.min(zoom, 1000));
      }),

    setTimelineScroll: (scrollX) =>
      set((state) => {
        state.timelineScrollX = Math.max(0, scrollX);
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
export const selectTimelineZoom = (s: UiStore) => s.timelineZoom;
export const selectTimelineScrollX = (s: UiStore) => s.timelineScrollX;
export const selectActiveTool = (s: UiStore) => s.activeTool;
export const selectVisualizerPreset = (s: UiStore) => s.visualizerPreset;
export const selectKitPanelExpanded = (s: UiStore) => s.kitPanelExpanded;
