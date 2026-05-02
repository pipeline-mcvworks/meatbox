/**
 * Export the current project as JSON via the system share sheet.
 *
 * Writes the serialized JSON to a temp file under cacheDirectory, then
 * invokes expo-sharing. Returns true if sharing was attempted, false if
 * sharing is not available on the platform.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  MouthBeatProjectLike,
  serializeProjectToJson,
} from '../persistence/projectSerialization';

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.length > 0 ? cleaned : 'project';
}

export async function exportProjectJson(
  project: MouthBeatProjectLike,
): Promise<boolean> {
  const json = serializeProjectToJson(project);
  const baseName = safeFilename(
    typeof project.name === 'string' && project.name.length > 0
      ? project.name
      : typeof project.id === 'string' && project.id.length > 0
        ? project.id
        : 'project',
  );
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('expo-file-system cacheDirectory is unavailable');
  }
  const path = `${cacheDir}${baseName}-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(path, json);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return false;
  }
  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: 'Export MouthBeat Project',
    UTI: 'public.json',
  });
  return true;
}
