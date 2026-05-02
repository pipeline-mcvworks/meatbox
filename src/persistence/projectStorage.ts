/**
 * Local project storage backed by expo-file-system.
 *
 * Files live under <documentDirectory>/projects/ as `<id>.json`.
 * Each file is the JSON produced by serializeProject().
 */

import * as FileSystem from 'expo-file-system';
import {
  MouthBeatProjectLike,
  serializeProjectToJson,
  deserializeProject,
} from './projectSerialization';

const PROJECTS_DIR = `${FileSystem.documentDirectory ?? ''}projects/`;

export interface ProjectListing {
  id: string;
  name: string;
  bpm?: number;
  bars?: number;
  savedAt?: string;
  path: string;
}

async function ensureDir(): Promise<void> {
  if (!FileSystem.documentDirectory) {
    throw new Error('expo-file-system documentDirectory is unavailable');
  }
  const info = await FileSystem.getInfoAsync(PROJECTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PROJECTS_DIR, { intermediates: true });
  }
}

function sanitizeId(raw: string): string {
  // Keep only chars that are filesystem-safe.
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.length > 0 ? cleaned : `project_${Date.now()}`;
}

function projectPath(id: string): string {
  return `${PROJECTS_DIR}${sanitizeId(id)}.json`;
}

export async function saveProject(
  project: MouthBeatProjectLike,
): Promise<ProjectListing> {
  await ensureDir();
  const id =
    typeof project.id === 'string' && project.id.length > 0
      ? project.id
      : `project_${Date.now()}`;
  const withId: MouthBeatProjectLike = { ...project, id };
  const json = serializeProjectToJson(withId);
  const path = projectPath(id);
  await FileSystem.writeAsStringAsync(path, json);
  return {
    id,
    name: typeof project.name === 'string' ? project.name : id,
    bpm: typeof project.bpm === 'number' ? project.bpm : undefined,
    bars: typeof project.bars === 'number' ? project.bars : undefined,
    savedAt: new Date().toISOString(),
    path,
  };
}

export async function loadProject(
  id: string,
): Promise<MouthBeatProjectLike> {
  const path = projectPath(id);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    throw new Error(`Project not found: ${id}`);
  }
  const raw = await FileSystem.readAsStringAsync(path);
  return deserializeProject(raw);
}

export async function listProjects(): Promise<ProjectListing[]> {
  await ensureDir();
  const entries = await FileSystem.readDirectoryAsync(PROJECTS_DIR);
  const out: ProjectListing[] = [];
  for (const filename of entries) {
    if (!filename.endsWith('.json')) continue;
    const path = `${PROJECTS_DIR}${filename}`;
    try {
      const raw = await FileSystem.readAsStringAsync(path);
      const parsed = JSON.parse(raw) as {
        version?: number;
        savedAt?: string;
        project?: MouthBeatProjectLike;
      };
      const proj = parsed.project ?? {};
      const id =
        typeof proj.id === 'string' && proj.id.length > 0
          ? proj.id
          : filename.replace(/\.json$/, '');
      out.push({
        id,
        name: typeof proj.name === 'string' ? proj.name : id,
        bpm: typeof proj.bpm === 'number' ? proj.bpm : undefined,
        bars: typeof proj.bars === 'number' ? proj.bars : undefined,
        savedAt: parsed.savedAt,
        path,
      });
    } catch (err) {
      console.warn('[projectStorage] failed to read', filename, err);
    }
  }
  // Newest first.
  out.sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''));
  return out;
}

export async function deleteProject(id: string): Promise<void> {
  const path = projectPath(id);
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return;
  await FileSystem.deleteAsync(path, { idempotent: true });
}

export function getProjectFilePath(id: string): string {
  return projectPath(id);
}
