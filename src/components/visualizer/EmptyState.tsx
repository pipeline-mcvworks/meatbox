import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface EmptyStateProps {
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
  icon?: string;
  tone?: 'info' | 'warn';
}

export default function EmptyState({
  title,
  body,
  ctaLabel,
  onCta,
  icon = '✨',
  tone = 'info',
}: EmptyStateProps): React.JSX.Element {
  const accent =
    tone === 'warn'
      ? colors.neonPink ?? '#ff2d78'
      : colors.neonCyan ?? '#00f5ff';
  return (
    <View style={styles.wrapper}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: accent }]}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaLabel && onCta ? (
        <TouchableOpacity
          style={[styles.cta, { borderColor: accent }]}
          onPress={onCta}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaText, { color: accent }]}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6] ?? 24,
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing[3] ?? 12,
  },
  title: {
    fontSize: typography.sizes.xl ?? 20,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    marginBottom: spacing[2] ?? 8,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.base ?? 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: spacing[4] ?? 16,
  },
  cta: {
    paddingHorizontal: spacing[5] ?? 20,
    paddingVertical: spacing[3] ?? 12,
    borderRadius: 999,
    borderWidth: 2,
  },
  ctaText: {
    fontSize: typography.sizes.base ?? 15,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
  },
});
