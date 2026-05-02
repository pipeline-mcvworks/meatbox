/**
 * defaultProject – a hardcoded MouthBeatProject fixture.
 *
 * bpm = 90  →  one beat = 60/90 ≈ 0.6667 s
 *              one 16th  = 60/90/4 ≈ 0.1667 s
 *
 * Two bars of 4/4 at 90 bpm = 8 beats = 32 sixteenth-note slots.
 * We place events on musically sensible 16th-note grid positions.
 *
 * Round-trip test (run in any JS console):
 *   import { defaultProject } from './defaultProject';
 *   const rt = JSON.parse(JSON.stringify(defaultProject));
 *   console.assert(JSON.stringify(rt) === JSON.stringify(defaultProject));
 */

import type { MouthBeatProject } from '../types/project';

const BEAT = 60 / 90;          // ≈ 0.6667 s
const SIXTEENTH = BEAT / 4;    // ≈ 0.1667 s

/** Round to 4 decimal places to avoid floating-point noise in JSON. */
const t = (sixteenths: number): number =>
  Math.round(sixteenths * SIXTEENTH * 10000) / 10000;

export const defaultProject: MouthBeatProject = {
  id: 'fixture-default-project',
  title: 'Default Beat',
  bpm: 90,
  beatsPerBar: 4,
  beatUnit: 4,
  lengthBars: 2,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',

  kit: {
    id: 'kit-default',
    name: 'Default Kit',
    samples: [
      {
        id: 'sample-kick',
        label: 'Kick',
        uri: 'assets/samples/kick.wav',
        gain: 1.0,
      },
      {
        id: 'sample-snare',
        label: 'Snare',
        uri: 'assets/samples/snare.wav',
        gain: 1.0,
      },
      {
        id: 'sample-hat-closed',
        label: 'Hi-Hat Closed',
        uri: 'assets/samples/hat_closed.wav',
        gain: 0.8,
      },
      {
        id: 'sample-perc',
        label: 'Perc',
        uri: 'assets/samples/perc.wav',
        gain: 0.9,
      },
    ],
  },

  recordings: [],

  lanes: [
    // ── KICK ──────────────────────────────────────────────────────────────
    // Hits on beats 1 and 3 of each bar (16th positions 0, 8, 16, 24)
    {
      id: 'lane-kick',
      name: 'Kick',
      type: 'kick',
      sampleId: 'sample-kick',
      muted: false,
      soloed: false,
      events: [
        { id: 'kick-0',  timeSeconds: t(0),  durationSeconds: 0.05, sampleId: 'sample-kick', velocity: 1.0 },
        { id: 'kick-8',  timeSeconds: t(8),  durationSeconds: 0.05, sampleId: 'sample-kick', velocity: 0.9 },
        { id: 'kick-16', timeSeconds: t(16), durationSeconds: 0.05, sampleId: 'sample-kick', velocity: 1.0 },
        { id: 'kick-24', timeSeconds: t(24), durationSeconds: 0.05, sampleId: 'sample-kick', velocity: 0.9 },
      ],
    },

    // ── SNARE ─────────────────────────────────────────────────────────────
    // Backbeats on beats 2 and 4 of each bar (16th positions 4, 12, 20, 28)
    {
      id: 'lane-snare',
      name: 'Snare',
      type: 'snare',
      sampleId: 'sample-snare',
      muted: false,
      soloed: false,
      events: [
        { id: 'snare-4',  timeSeconds: t(4),  durationSeconds: 0.05, sampleId: 'sample-snare', velocity: 0.95 },
        { id: 'snare-12', timeSeconds: t(12), durationSeconds: 0.05, sampleId: 'sample-snare', velocity: 0.95 },
        { id: 'snare-20', timeSeconds: t(20), durationSeconds: 0.05, sampleId: 'sample-snare', velocity: 0.95 },
        { id: 'snare-28', timeSeconds: t(28), durationSeconds: 0.05, sampleId: 'sample-snare', velocity: 0.95 },
      ],
    },

    // ── HI-HAT ────────────────────────────────────────────────────────────
    // Eighth-note pattern (every 2 sixteenths): positions 0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30
    {
      id: 'lane-hat',
      name: 'Hi-Hat',
      type: 'hat',
      sampleId: 'sample-hat-closed',
      muted: false,
      soloed: false,
      events: [
        { id: 'hat-0',  timeSeconds: t(0),  durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-2',  timeSeconds: t(2),  durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
        { id: 'hat-4',  timeSeconds: t(4),  durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-6',  timeSeconds: t(6),  durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
        { id: 'hat-8',  timeSeconds: t(8),  durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-10', timeSeconds: t(10), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
        { id: 'hat-12', timeSeconds: t(12), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-14', timeSeconds: t(14), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
        { id: 'hat-16', timeSeconds: t(16), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-18', timeSeconds: t(18), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
        { id: 'hat-20', timeSeconds: t(20), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-22', timeSeconds: t(22), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
        { id: 'hat-24', timeSeconds: t(24), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-26', timeSeconds: t(26), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
        { id: 'hat-28', timeSeconds: t(28), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.7 },
        { id: 'hat-30', timeSeconds: t(30), durationSeconds: 0.03, sampleId: 'sample-hat-closed', velocity: 0.6 },
      ],
    },

    // ── PERC ──────────────────────────────────────────────────────────────
    // Syncopated hits at 16th positions 2, 10, 18, 26
    {
      id: 'lane-perc',
      name: 'Perc',
      type: 'perc',
      sampleId: 'sample-perc',
      muted: false,
      soloed: false,
      events: [
        { id: 'perc-2',  timeSeconds: t(2),  durationSeconds: 0.04, sampleId: 'sample-perc', velocity: 0.75 },
        { id: 'perc-10', timeSeconds: t(10), durationSeconds: 0.04, sampleId: 'sample-perc', velocity: 0.75 },
        { id: 'perc-18', timeSeconds: t(18), durationSeconds: 0.04, sampleId: 'sample-perc', velocity: 0.75 },
        { id: 'perc-26', timeSeconds: t(26), durationSeconds: 0.04, sampleId: 'sample-perc', velocity: 0.75 },
      ],
    },
  ],
};
