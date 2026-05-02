/**
 * EventContextMenu
 * Long-press action sheet: Delete / Duplicate / Lock-toggle.
 * Fires haptics on each destructive/important action.
 */

import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProjectStore } from '../../state/projectStore';
import { useUiStore } from '../../state/uiStore';
import type { DrumEvent } from '../../state/types';
import { colors, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';

export default function EventContextMenu(): React.JSX.Element | null {
  const contextMenuEventId = useUiStore((s) => s.contextMenuEventId);
  const setContextMenuEvent = useUiStore((s) => s.setContextMenuEvent);
  const event = useProjectStore((s) =>
    contextMenuEventId
      ? s.events.find((e) => e.id === contextMenuEventId) ?? null
      : null,
  );
  const deleteEvent = useProjectStore((s) => s.deleteEvent);
  const duplicateEvent = useProjectStore((s) => s.duplicateEvent);
  const updateEvent = useProjectStore((s) => s.updateEvent);

  if (!event) return null;

  const close = () => setContextMenuEvent(null);
  const locked = (event as DrumEvent & { locked?: boolean }).locked === true;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={close}
      >
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              haptics.medium();
              duplicateEvent(event.id);
              close();
            }}
          >
            <Text style={styles.itemText}>Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              haptics.transport();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              updateEvent(event.id, { locked: !locked } as any);
              close();
            }}
          >
            <Text style={styles.itemText}>{locked ? 'Unlock' : 'Lock'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.item, styles.danger]}
            onPress={() => {
              haptics.warning();
              deleteEvent(event.id);
              close();
            }}
          >
            <Text style={[styles.itemText, styles.dangerText]}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.item, styles.cancel]} onPress={close}>
            <Text style={styles.itemText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: '70%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  danger: {
    backgroundColor: 'rgba(229, 115, 115, 0.1)',
  },
  dangerText: {
    color: colors.neonRed,
  },
  cancel: {
    borderBottomWidth: 0,
  },
});
