import type { RawRow } from "./model";

/**
 * Minimal structural interfaces for the parts of the Bases API this plugin
 * consumes. The real `BasesEntry` and `Value` classes satisfy these shapes,
 * so no Obsidian runtime import is needed for unit-testable code.
 */
export interface ValueLike {
  toString(): string;
  isTruthy(): boolean;
}

export interface FileLike {
  path: string;
  basename: string;
  name: string;
}

export interface EntryLike {
  file: FileLike;
  getValue(propertyId: string): ValueLike | null;
}

const TIMELINE_PROPERTIES = [
  "type",
  "status",
  "attention",
  "schedule_state",
  "priority",
  "start",
  "target",
  "hard_deadline",
  "progress",
  "phase",
  "outcome",
  "next_action",
  "next_review",
  "parent_project",
] as const;

/**
 * Converts a Bases `Value` into a plain scalar. Numbers, booleans, and strings
 * are detected from the value's string form, which is the documented shape of
 * the Bases value API (`Value.toString()`).
 */
export function valueToRaw(value: ValueLike): unknown {
  let text: string;
  try {
    text = value.toString();
  } catch {
    return undefined;
  }
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  // Bases returns NullValue for empty properties; its string form is "null".
  if (trimmed === "null" || trimmed === "undefined") return undefined;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

export function entryToRawRow(entry: EntryLike): RawRow {
  const values: Record<string, unknown> = {};
  for (const property of TIMELINE_PROPERTIES) {
    const value = entry.getValue(`note.${property}`);
    if (value === null) continue;
    const raw = valueToRaw(value);
    if (raw !== undefined) values[property] = raw;
  }
  return {
    path: entry.file.path,
    name: entry.file.basename || entry.file.name,
    values,
  };
}
