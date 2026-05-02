/**
 * Project schema migrations.
 *
 * This file is intentionally a stub for v1. As the on-disk schema evolves,
 * add entries to MIGRATIONS keyed by source version. Each migration takes
 * the parsed JSON for that version and returns the JSON shape for the
 * next version. `migrateToCurrent` walks them in order until the version
 * matches PROJECT_SCHEMA_VERSION.
 */

import { PROJECT_SCHEMA_VERSION } from './projectSerialization';

export type MigrationFn = (input: unknown) => unknown;

/**
 * Map from source version -> migration that produces the next version's shape.
 * Empty for now; v1 is the initial format.
 */
export const MIGRATIONS: Record<number, MigrationFn> = {};

export function migrateToCurrent(input: unknown): unknown {
  let current = input;
  let safety = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (safety++ > 32) {
      throw new Error('Migration loop exceeded safety limit');
    }
    const version =
      typeof current === 'object' && current !== null && 'version' in current
        ? (current as { version: unknown }).version
        : undefined;
    if (typeof version !== 'number') {
      // No version field — assume it is current and let the deserializer
      // validate the rest. (Pre-v1 documents are not supported.)
      return current;
    }
    if (version === PROJECT_SCHEMA_VERSION) return current;
    const fn = MIGRATIONS[version];
    if (!fn) {
      throw new Error(
        `No migration registered from project schema v${version} to v${PROJECT_SCHEMA_VERSION}`,
      );
    }
    current = fn(current);
  }
}
