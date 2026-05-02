/**
 * Serialize / deserialize a MouthBeatProject to and from a JSON-safe object.
 *
 * The on-disk shape is `{ version, project }`. The `version` field lets us
 * migrate older saved files (see migrations.ts).
 */

import { migrateToCurrent } from './migrations';

export const PROJECT_SCHEMA_VERSION = 1;

// We intentionally type the project loosely here. The project store owns the
// authoritative shape; this module just round-trips JSON. Keeping the type
// loose avoids cross-module coupling and lets persistence work for any
// project shape the store currently uses.
export interface SerializedProjectFile {
  version: number;
  savedAt: string; // ISO timestamp
  project: Record<string, unknown>;
}

export interface MouthBeatProjectLike {
  id?: string;
  name?: string;
  bpm?: number;
  bars?: number;
  lanes?: unknown[];
  events?: unknown[];
  [key: string]: unknown;
}

export function serializeProject(
  project: MouthBeatProjectLike,
): SerializedProjectFile {
  return {
    version: PROJECT_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    project: JSON.parse(JSON.stringify(project)) as Record<string, unknown>,
  };
}

export function serializeProjectToJson(project: MouthBeatProjectLike): string {
  return JSON.stringify(serializeProject(project), null, 2);
}

export function deserializeProject(input: unknown): MouthBeatProjectLike {
  if (typeof input === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      throw new Error(
        `Failed to parse project JSON: ${(err as Error).message}`,
      );
    }
    return deserializeProject(parsed);
  }
  if (typeof input !== 'object' || input === null) {
    throw new Error('Project file is not an object');
  }

  const migrated = migrateToCurrent(input) as Record<string, unknown>;

  if (
    typeof migrated !== 'object' ||
    migrated === null ||
    typeof migrated.version !== 'number' ||
    typeof migrated.project !== 'object' ||
    migrated.project === null
  ) {
    throw new Error('Project file is missing required fields');
  }

  if (migrated.version !== PROJECT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported project schema version: ${String(migrated.version)}`,
    );
  }

  return migrated.project as MouthBeatProjectLike;
}
