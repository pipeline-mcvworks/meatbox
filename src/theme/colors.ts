/**
 * mouthbeat-machine color palette
 * Dark/neon music-machine aesthetic
 */
export const colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background: '#0a0a0f',
  surface: '#12121a',
  surfaceElevated: '#1c1c28',
  overlay: 'rgba(0,0,0,0.72)',

  // ── Neon accents ─────────────────────────────────────────────────────────
  neonCyan: '#00f5ff',
  neonPink: '#ff2d78',
  neonGreen: '#39ff14',
  neonYellow: '#ffe600',
  neonPurple: '#bf5fff',
  neonOrange: '#ff6b00',

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary: '#f0f0f5',
  textSecondary: '#a0a0b8',
  textMuted: '#505068',

  // ── UI chrome ────────────────────────────────────────────────────────────
  border: '#2a2a3c',
  borderHighlight: '#00f5ff44',
  divider: '#1e1e2e',

  // ── Semantic ─────────────────────────────────────────────────────────────
  success: '#39ff14',
  warning: '#ffe600',
  error: '#ff2d78',
  info: '#00f5ff',

  // ── Waveform / visualizer ────────────────────────────────────────────────
  waveformPrimary: '#00f5ff',
  waveformSecondary: '#bf5fff',
  waveformBackground: '#0d0d18',

  // ── Pad grid ─────────────────────────────────────────────────────────────
  padDefault: '#1c1c28',
  padActive: '#00f5ff',
  padTriggered: '#ff2d78',
  padBorder: '#2a2a3c',
} as const;

export type ColorKey = keyof typeof colors;
