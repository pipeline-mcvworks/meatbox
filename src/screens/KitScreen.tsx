import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import KitList from '../components/kit/KitList';
import LaneControls from '../components/kit/LaneControls';

export default function KitScreen(): React.JSX.Element {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Kit</Text>
      <KitList />
      <LaneControls />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing[4],
  },
  title: {
    color: colors.neonOrange,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacings.wide,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
});
