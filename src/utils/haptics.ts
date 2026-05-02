/**
 * haptics – thin, dependency-tolerant wrapper.
 *
 * Tries to use react-native-haptic-feedback if installed. Otherwise falls
 * back to React Native's built-in Vibration API. All calls are best-effort
 * and never throw.
 */

import { Vibration, Platform } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RNHaptic: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  RNHaptic = require('react-native-haptic-feedback').default ?? require('react-native-haptic-feedback');
} catch {
  RNHaptic = null;
}

export type HapticKind =
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'selection'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

const FALLBACK_MS: Record<HapticKind, number> = {
  impactLight: 10,
  impactMedium: 18,
  impactHeavy: 30,
  selection: 8,
  notificationSuccess: 20,
  notificationWarning: 30,
  notificationError: 40,
};

function safeFallback(kind: HapticKind): void {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(FALLBACK_MS[kind]);
    }
  } catch {
    // swallow
  }
}

export function trigger(kind: HapticKind = 'selection'): void {
  if (RNHaptic && typeof RNHaptic.trigger === 'function') {
    try {
      RNHaptic.trigger(kind, {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      return;
    } catch {
      // fall through to vibration
    }
  }
  safeFallback(kind);
}

export const haptics = {
  padHit: () => trigger('impactLight'),
  transport: () => trigger('selection'),
  dragSnap: () => trigger('selection'),
  success: () => trigger('notificationSuccess'),
  warning: () => trigger('notificationWarning'),
  error: () => trigger('notificationError'),
  heavy: () => trigger('impactHeavy'),
  medium: () => trigger('impactMedium'),
  light: () => trigger('impactLight'),
};

export default haptics;
