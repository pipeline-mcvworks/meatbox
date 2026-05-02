import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { AudioPlaybackService } from '../../audio/AudioPlaybackService';

interface SamplePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sampleId: string) => void;
  currentSampleId?: string;
}

const AVAILABLE_SAMPLES = [
  { id: 'sample-kick', name: 'Kick' },
  { id: 'sample-snare', name: 'Snare' },
  { id: 'sample-hihat', name: 'Hi-Hat' },
  { id: 'sample-clap', name: 'Clap' },
  { id: 'sample-tom1', name: 'Tom 1' },
  { id: 'sample-tom2', name: 'Tom 2' },
  { id: 'sample-ride', name: 'Ride' },
  { id: 'sample-crash', name: 'Crash' },
  { id: 'sample-openhh', name: 'Open HH' },
  { id: 'sample-closedhh', name: 'Closed HH' },
  { id: 'sample-cowbell', name: 'Cowbell' },
  { id: 'sample-tambourine', name: 'Tambourine' },
  { id: 'sample-shaker', name: 'Shaker' },
  { id: 'sample-claves', name: 'Claves' },
  { id: 'sample-maracas', name: 'Maracas' },
  { id: 'sample-whistle', name: 'Whistle' },
];

export default function SamplePicker({ visible, onClose, onSelect, currentSampleId }: SamplePickerProps): React.JSX.Element {
  const handlePreview = (sampleId: string) => {
    AudioPlaybackService.playSample(sampleId, 0.8);
  };

  const handleSelect = (sampleId: string) => {
    onSelect(sampleId);
    onClose();
  };

  const renderItem = ({ item }: { item: typeof AVAILABLE_SAMPLES[0] }) => (
    <TouchableOpacity
      style={[
        styles.sampleItem,
        currentSampleId === item.id && styles.selectedSample,
      ]}
      onPress={() => handleSelect(item.id)}
      onLongPress={() => handlePreview(item.id)}
    >
      <Text style={styles.sampleName}>{item.name}</Text>
      <Text style={styles.hint}>Long press to preview</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Sample</Text>
          <FlatList
            data={AVAILABLE_SAMPLES}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing[4],
    maxHeight: '70%',
  },
  title: {
    color: colors.neonOrange,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  sampleItem: {
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedSample: {
    backgroundColor: colors.surface,
  },
  sampleName: {
    color: colors.white,
    fontSize: typography.sizes.md,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  closeButton: {
    marginTop: spacing[3],
    padding: spacing[3],
    alignItems: 'center',
  },
  closeText: {
    color: colors.neonPurple,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
