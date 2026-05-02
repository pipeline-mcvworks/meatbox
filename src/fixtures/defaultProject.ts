/**
 * defaultProject – DEMO BEAT FIXTURE
 *
 * This is the canonical demo project loaded when the user taps "Try Demo Beat"
 * on the Home screen. It is a complete, cleaned, self-contained beat — no
 * recording required.
 *
 * Spec:
 *   bpm = 95  →  one beat  = 60/95 ≈ 0.6316 s
 *               one 16th   = 60/95/4 ≈ 0.1579 s
 *
 *   4 bars of 4/4 at 95 bpm = 16 beats = 64 sixteenth-note slots.
 *
 * Pattern (per bar, repeated × 4):
 *   Kick      : 1 . . . 3 . . .   (beats 1 & 3)
 *   Snare     : . . 2 . . . 4 .   (beats 2 & 4)
 *   Hi-Hat    : every 8th note     (slots 0,2,4,6,8,10,12,14 per bar)
 *   Open HH   : slot 6 per bar     ("and" of beat 3 — adds groove)
 *   Perc      : slots 2, 10        (syncopated 16th accents)
 *
 * Round-trip test (any JS console):
 *   const rt = JSON.parse(JSON.stringify(defaultProject));
 *   console.assert(JSON.stringify(rt) === JSON.stringify(defaultProject));
 */

export interface DemoSample {
  id: string;
  label: string;
  uri: string;
  gain: number;
}

export interface DemoEvent {
  id: string;
  timeSeconds: number;
  durationSeconds: number;
  sampleId: string;
  velocity: number;
}

export interface DemoLane {
  id: string;
  name: string;
  type: string;
  sampleId: string;
  muted: boolean;
  soloed: boolean;
  events: DemoEvent[];
}

export interface DemoKit {
  id: string;
  name: string;
  samples: DemoSample[];
}

export interface DemoProject {
  id: string;
  title: string;
  bpm: number;
  beatsPerBar: number;
  beatUnit: number;
  lengthBars: number;
  createdAt: string;
  updatedAt: string;
  kit: DemoKit;
  recordings: unknown[];
  lanes: DemoLane[];
}

const BPM = 95;
const BEAT = 60 / BPM;        // ≈ 0.6316 s
const SIXTEENTH = BEAT / 4;   // ≈ 0.1579 s
const BARS = 4;
const SLOTS_PER_BAR = 16;     // 16 sixteenth-note slots per bar

/** Round to 4 decimal places to avoid floating-point noise in JSON. */
const t = (sixteenths: number): number =>
  Math.round(sixteenths * SIXTEENTH * 10000) / 10000;

// ---------------------------------------------------------------------------
// Pattern builder helpers
// ---------------------------------------------------------------------------

/** Repeat a per-bar slot pattern across all bars. */
function repeatPattern(
  sampleId: string,
  prefix: string,
  slotsPerBar: number[],
  durationSeconds: number,
  velocityFn: (barIdx: number, slotIdx: number) => number,
): DemoEvent[] {
  const events: DemoEvent[] = [];
  for (let bar = 0; bar < BARS; bar++) {
    for (const slot of slotsPerBar) {
      const absoluteSlot = bar * SLOTS_PER_BAR + slot;
      events.push({
        id: `${prefix}-b${bar}-s${slot}`,
        timeSeconds: t(absoluteSlot),
        durationSeconds,
        sampleId,
        velocity: velocityFn(bar, slot),
      });
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Kick: beats 1 & 3 → slots 0, 8
// ---------------------------------------------------------------------------
const kickEvents = repeatPattern(
  'demo-sample-kick',
  'kick',
  [0, 8],
  0.05,
  (_bar, slot) => (slot === 0 ? 1.0 : 0.88),
);

// ---------------------------------------------------------------------------
// Snare: beats 2 & 4 → slots 4, 12
// ---------------------------------------------------------------------------
const snareEvents = repeatPattern(
  'demo-sample-snare',
  'snare',
  [4, 12],
  0.05,
  () => 0.95,
);

// ---------------------------------------------------------------------------
// Closed Hi-Hat: every 8th note → slots 0,2,4,6,8,10,12,14
// (slot 6 will be overridden by open HH, so hat-6 is quieter)
// ---------------------------------------------------------------------------
const hatEvents = repeatPattern(
  'demo-sample-hat-closed',
  'hat',
  [0, 2, 4, 6, 8, 10, 12, 14],
  0.03,
  (_bar, slot) => {
    if (slot === 0 || slot === 8) return 0.75;  // on-beat accent
    if (slot === 6) return 0.45;                // ghost under open HH
    return 0.60;
  },
);

// ---------------------------------------------------------------------------
// Open Hi-Hat: slot 6 per bar ("and" of beat 3)
// ---------------------------------------------------------------------------
const openHatEvents = repeatPattern(
  'demo-sample-hat-open',
  'openhat',
  [6],
  0.18,
  () => 0.70,
);

// ---------------------------------------------------------------------------
// Perc: syncopated 16th accents at slots 2 & 10
// ---------------------------------------------------------------------------
const percEvents = repeatPattern(
  'demo-sample-perc',
  'perc',
  [2, 10],
  0.04,
  (_bar, slot) => (slot === 2 ? 0.80 : 0.72),
);

// ---------------------------------------------------------------------------
// Assembled fixture
// ---------------------------------------------------------------------------
export const defaultProject: DemoProject = {
  id: 'fixture-demo-beat-v2',
  title: 'Demo Beat — Groove 95',
  bpm: BPM,
  beatsPerBar: 4,
  beatUnit: 4,
  lengthBars: BARS,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',

  kit: {
    id: 'kit-demo',
    name: 'Demo Kit',
    samples: [
      { id: 'demo-sample-kick',       label: 'Kick',          uri: 'assets/samples/kick.wav',       gain: 1.0 },
      { id: 'demo-sample-snare',      label: 'Snare',         uri: 'assets/samples/snare.wav',      gain: 1.0 },
      { id: 'demo-sample-hat-closed', label: 'Hi-Hat Closed', uri: 'assets/samples/hat_closed.wav', gain: 0.8 },
      { id: 'demo-sample-hat-open',   label: 'Hi-Hat Open',   uri: 'assets/samples/hat_open.wav',   gain: 0.75 },
      { id: 'demo-sample-perc',       label: 'Perc',          uri: 'assets/samples/perc.wav',       gain: 0.9 },
    ],
  },

  recordings: [],

  lanes: [
    {
      id: 'lane-kick',
      name: 'Kick',
      type: 'kick',
      sampleId: 'demo-sample-kick',
      muted: false,
      soloed: false,
      events: kickEvents,
    },
    {
      id: 'lane-snare',
      name: 'Snare',
      type: 'snare',
      sampleId: 'demo-sample-snare',
      muted: false,
      soloed: false,
      events: snareEvents,
    },
    {
      id: 'lane-hat',
      name: 'Hi-Hat',
      type: 'hat',
      sampleId: 'demo-sample-hat-closed',
      muted: false,
      soloed: false,
      events: hatEvents,
    },
    {
      id: 'lane-openhat',
      name: 'Open HH',
      type: 'hat-open',
      sampleId: 'demo-sample-hat-open',
      muted: false,
      soloed: false,
      events: openHatEvents,
    },
    {
      id: 'lane-perc',
      name: 'Perc',
      type: 'perc',
      sampleId: 'demo-sample-perc',
      muted: false,
      soloed: false,
      events: percEvents,
    },
  ],
};

/** Convenience: total duration of the demo project in seconds. */
export const demoDurationSeconds: number =
  Math.round(BARS * 4 * BEAT * 10000) / 10000;

export default defaultProject;
