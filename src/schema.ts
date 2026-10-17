/**
 * Canonical schema for the Project Dashboard plugin.
 *
 * These names and values are the contract between notes, the `.base` file,
 * and the plugin. They are documented in `docs/schema.md`; the tests under
 * `tests/schema.test.ts` keep the documentation and this module in sync.
 */

export const PROJECT_TYPE = "project";
export const MILESTONE_TYPE = "milestone";

export const STATUS_VALUES = [
  "defining",
  "scheduled",
  "active",
  "waiting",
  "paused",
  "complete",
  "cancelled",
] as const;
export type Status = (typeof STATUS_VALUES)[number];

export const ATTENTION_VALUES = ["finish-first", "normal"] as const;
export type Attention = (typeof ATTENTION_VALUES)[number];

export const SCHEDULE_STATE_VALUES = ["proposed", "committed"] as const;
export type ScheduleState = (typeof SCHEDULE_STATE_VALUES)[number];

export const PRIORITY_VALUES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITY_VALUES)[number];

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Open statuses are everything that is neither `complete` nor `cancelled`. */
export const CLOSED_STATUS_VALUES: readonly Status[] = ["complete", "cancelled"];

export const PROJECT_PROPERTY_NAMES = [
  "type",
  "domain",
  "focus",
  "goals",
  "capabilities",
  "interests",
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
  "done_when",
  "next_action",
  "next_review",
] as const;

export const MILESTONE_PROPERTY_NAMES = [
  "type",
  "parent_project",
  "target",
  "status",
  "hard_deadline",
] as const;

export const TEMPLATE_ENTITY_TYPES = [
  "domain",
  "focus",
  "goal",
  "capability",
  "practice",
  "project",
  "deliverable",
  "milestone",
  "task",
  "interest",
] as const;
export type TemplateEntityType = (typeof TEMPLATE_ENTITY_TYPES)[number];

export function isStatus(value: string): value is Status {
  return (STATUS_VALUES as readonly string[]).includes(value);
}

export function isAttention(value: string): value is Attention {
  return (ATTENTION_VALUES as readonly string[]).includes(value);
}

export function isScheduleState(value: string): value is ScheduleState {
  return (SCHEDULE_STATE_VALUES as readonly string[]).includes(value);
}

export function isPriority(value: string): value is Priority {
  return (PRIORITY_VALUES as readonly string[]).includes(value);
}

export function isClosedStatus(status: Status | null): boolean {
  return status !== null && CLOSED_STATUS_VALUES.includes(status);
}
