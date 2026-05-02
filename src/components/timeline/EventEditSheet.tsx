/**
 * EventEditSheet
 * Bottom sheet for editing a single timeline event. Opens when
 * uiStore.editingEventId is set.
 *
 * If @gorhom/bottom-sheet is not installed yet, we fall back to a Modal so
 * the screen still functions. The fallback is detected at module load time.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useProjectStore } from '../../state/projectStore';
import { useUiStore } from '../../state/uiStore';
import type { DrumEvent } from '../../state/types';
import { colors, spacing, typography } from '../../theme';

// Try to import @gorhom/bottom-sheet. If unavailable, use Modal fallback.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BottomSheetModal: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let BottomSheetView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const mod = require('@gorhom/bottom-sheet');
  BottomSheetModal = mod.BottomSheetModal;
  BottomSheetView = mod.BottomSheetView;
} catch {
  BottomSheetModal = null;
  BottomSheetView = null;
}

// ---------------------------------------------------------------------------
// Simple slider built from Touchable taps — avoids extra deps.
// ---------------------------------------------------------------------------
function MiniSlider({
  value,
  onChange,
  steps = 10,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  steps?: number;
  label: string;
}): React.JSX.Element {
  const cells = Array.from({ length: steps }, (_, i) => i + 1);
  return (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>
        {label}: {Math.round(value * 100)}%
      </Text>
      <View style={styles.sliderCells}>
        {cells.map((cellIdx) => {
          const cellValue = cellIdx / steps;
          const filled = value >= cellValue - 1e-6;
          return (
            <TouchableOpacity
              key={cellIdx}
              style={[
                styles.sliderCell,
                { backgroundColor: filled ? colors.neonCyan : colors.border },
              ]}
              onPress={() => onChange(cellValue)}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function EventEditSheet(): React.JSX.Element | null {
  const editingEventId = useUiStore((s) => s.editingEventId);
  const setEditingEvent = useUiStore((s) => s.setEditingEvent);
  const event = useProjectStore((s) =>
    editingEventId ? s.events.find((e) => e.id === editingEventId) ?? null : null,
  );
  const lanes = useProjectStore((s) => s.lanes);
  const kit = useProjectStore((s) => s.kit);
  const updateEvent = useProjectStore((s) => s.updateEvent);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheetRef = useRef<any>(null);
  const snapPoints = useMemo(() => ['55%'], []);

  useEffect(() => {
    if (!BottomSheetModal) return;
    if (editingEventId) {
      sheetRef.current?.present?.();
    } else {
      sheetRef.current?.dismiss?.();
    }
  }, [editingEventId]);

  const onClose = () => setEditingEvent(null);

  if (!event) return null;

  const body = (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.heading}>Edit Event</Text>

      {/* Lane picker */}
      <Text style={styles.sectionLabel}>Lane</Text>
      <View style={styles.lanePicker}>
        {lanes.map((lane) => {
          const selected = lane.id === event.laneId;
          return (
            <TouchableOpacity
              key={lane.id}
              style={[
                styles.laneChip,
                {
                  backgroundColor: selected ? lane.color : 'transparent',
                  borderColor: lane.color,
                },
              ]}
              onPress={() => updateEvent(event.id, { laneId: lane.id })}
            >
              <Text
                style={[
                  styles.laneChipText,
                  { color: selected ? colors.background : colors.textPrimary },
                ]}
              >
                {lane.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Velocity */}
      <MiniSlider
        label="Velocity"
        value={event.velocity ?? 1}
        onChange={(v) => updateEvent(event.id, { velocity: v })}
      />

      {/* Sample picker */}
      <Text style={styles.sectionLabel}>Sample</Text>
      <View style={styles.lanePicker}>
        {kit.pads.map((pad) => {
          const eventWithSample = event as DrumEvent & { selectedSampleId?: string };
          const selected = eventWithSample.selectedSampleId === pad.sampleId;
          return (
            <TouchableOpacity
              key={pad.id}
              style={[
                styles.laneChip,
                {
                  backgroundColor: selected ? pad.color : 'transparent',
                  borderColor: pad.color,
                },
              ]}
              onPress={() =>
                updateEvent(event.id, {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  selectedSampleId: pad.sampleId,
                } as any)
              }
            >
              <Text
                style={[
                  styles.laneChipText,
                  { color: selected ? colors.background : colors.textPrimary },
                ]}
              >
                {pad.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lock toggle */}
      <View style={styles.lockRow}>
        <Text style={styles.sectionLabel}>Lock event (immune to drag/quantize)</Text>
        <Switch
          value={(event as DrumEvent & { locked?: boolean }).locked === true}
          onValueChange={(v) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateEvent(event.id, { locked: v } as any)
          }
        />
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (BottomSheetModal && BottomSheetView) {
    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        onDismiss={onClose}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
      >
        <BottomSheetView style={{ flex: 1 }}>{body}</BottomSheetView>
      </BottomSheetModal>
    );
  }

  // Fallback: plain Modal
  return (
    <Modal
      visible={!!editingEventId}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>{body}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  heading: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing[3],
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  lanePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  laneChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
    borderWidth: 2,
    marginRight: spacing[2],
    marginBottom: spacing[2],
  },
  laneChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  sliderRow: {
    marginTop: spacing[3],
  },
  sliderLabel: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
  },
  sliderCells: {
    flexDirection: 'row',
    gap: 4,
  },
  sliderCell: {
    flex: 1,
    height: 24,
    borderRadius: 3,
    marginRight: 3,
  },
  lockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  closeButton: {
    marginTop: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.neonCyan,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.background,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
});
