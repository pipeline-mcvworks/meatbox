import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { useProjectStore, selectKit, BUILT_IN_KITS } from '../../state/projectStore';
import { AudioPlaybackService } from '../../audio/AudioPlaybackService';

export default function KitList(): React.JSX.Element {
  const currentKit = useProjectStore(selectKit);
  const setKit = useProjectStore((s) => s.setKit);

  const handleKitSelect = (kit: typeof BUILT_IN_KITS[0]) => {
    setKit(kit);
    // Preview first sample
    if (kit.pads.length > 0) {
      AudioPlaybackService.playSample(kit.pads[0].sampleId || `sample-${kit.pads[0].id}`, 0.8);
    }
  };

  const renderItem = ({ item }: { item: typeof BUILT_IN_KITS[0] }) => (
    <TouchableOpacity
      style={[
        styles.kitItem,
        currentKit.id === item.id && styles.selectedKit,
      ]}
      onPress={() => handleKitSelect(item)}
    >
      <Text style={styles.kitName}>{item.name}</Text>
      <Text style={styles.kitDesc}>{item.pads.length} pads</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drum Kits</Text>
      <FlatList
        data={BUILT_IN_KITS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  title: {
    color: colors.neonOrange,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[4],
  },
  list: {
    paddingHorizontal: spacing[4],
  },
  kitItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing[3],
    marginRight: spacing[2],
    minWidth: 120,
    alignItems: 'center',
  },
  selectedKit: {
    borderColor: colors.neonOrange,
    borderWidth: 2,
  },
  kitName: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  kitDesc: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
});
