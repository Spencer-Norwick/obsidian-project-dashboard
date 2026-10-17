import type { EntryLike, ValueLike } from "../../src/adapter";

/**
 * Integration fixture that mimics the parts of the Bases API the plugin uses:
 * a file and `getValue(propertyId)` returning value objects with `toString()`
 * and `isTruthy()`. All content is fictional.
 */
export class FakeValue implements ValueLike {
  private readonly raw: string;

  constructor(raw: string) {
    this.raw = raw;
  }

  toString(): string {
    return this.raw;
  }

  isTruthy(): boolean {
    return this.raw !== "" && this.raw !== "false";
  }
}

export function entry(
  path: string,
  props: Record<string, string | number | boolean | string[] | undefined>,
): EntryLike {
  const basename = path.split("/").pop()?.replace(/\.md$/, "") ?? path;
  return {
    file: { path, basename, name: `${basename}.md` },
    getValue: (propertyId: string) => {
      const key = propertyId.startsWith("note.") ? propertyId.slice("note.".length) : propertyId;
      const raw = props[key];
      if (raw === undefined) return null;
      return new FakeValue(Array.isArray(raw) ? raw.join(", ") : String(raw));
    },
  };
}

export const TODAY = { year: 2026, month: 10, day: 16 };

const PROJECT = "Boathouse/Projects/";
const MILESTONES = "Boathouse/Milestones/";

/**
 * The full fictional fixture, including the deliberate edge cases the
 * failure-behavior tests rely on.
 */
export function demoEntries(): EntryLike[] {
  return [
    entry(`${PROJECT}Refit the training singles.md`, {
      type: "project",
      status: "active",
      attention: "finish-first",
      schedule_state: "committed",
      priority: "high",
      start: "2026-10-05",
      target: "2026-11-13",
      hard_deadline: false,
      progress: 55,
      phase: "Hull repair",
      outcome: "A safe, watertight training single ready for the spring season.",
      next_action: "Bolt the keel plate and refill the buoyancy tanks.",
      domain: "[[Harborline Boathouse]]",
      focus: "[[Fleet upkeep]]",
      done_when: ["Hull passes the leak check", "Rigging re-tensioned", "Sea trial logged"],
    }),
    entry(`${MILESTONES}Dry fit.md`, {
      type: "milestone",
      parent_project: "[[Refit the training singles]]",
      target: "2026-10-24",
      status: "scheduled",
      hard_deadline: false,
    }),
    entry(`${MILESTONES}Sea trial.md`, {
      type: "milestone",
      parent_project: "[[Refit the training singles]]",
      target: "2026-10-24",
      status: "scheduled",
      hard_deadline: false,
    }),
    entry(`${MILESTONES}Refit complete.md`, {
      type: "milestone",
      parent_project: "[[Refit the training singles]]",
      target: "2026-11-13",
      status: "scheduled",
      hard_deadline: true,
    }),
    entry(`${PROJECT}Autumn regatta logistics.md`, {
      type: "project",
      status: "active",
      attention: "finish-first",
      schedule_state: "committed",
      priority: "high",
      start: "2026-10-12",
      target: "2026-10-30",
      hard_deadline: true,
      progress: 60,
      phase: "Volunteers",
      outcome: "A smoothly run autumn regatta with every station staffed.",
      next_action: "Confirm the safety boat roster.",
    }),
    entry(`${MILESTONES}Regatta day.md`, {
      type: "milestone",
      parent_project: "[[Autumn regatta logistics]]",
      target: "2026-10-30",
      status: "scheduled",
      hard_deadline: true,
    }),
    entry(`${MILESTONES}Book the speaker.md`, {
      type: "milestone",
      parent_project: "[[Old committee plan]]",
      target: "2026-11-05",
      status: "scheduled",
      hard_deadline: false,
    }),
    entry(`${PROJECT}Dock float replacement.md`, {
      type: "project",
      status: "scheduled",
      schedule_state: "committed",
      priority: "medium",
      start: "2026-11-02",
      target: "2026-11-20",
      progress: 10,
      phase: "Permits",
    }),
    entry(`${MILESTONES}Order float bolts.md`, {
      type: "milestone",
      parent_project: "[[Dock float replacement]]",
      status: "scheduled",
      hard_deadline: false,
    }),
    entry(`${PROJECT}Learn-to-row fall session.md`, {
      type: "project",
      status: "active",
      schedule_state: "proposed",
      priority: "medium",
      start: "2026-10-01",
      target: "2026-12-04",
      progress: 30,
      next_action: "Print the session handouts.",
    }),
    entry(`${PROJECT}Winter storage plan.md`, {
      type: "project",
      status: "waiting",
      schedule_state: "committed",
      priority: "medium",
      start: "2026-09-14",
      target: "2026-10-26",
      progress: 70,
      phase: "Tagging",
    }),
    entry(`${PROJECT}Recatalog the map cabinet.md`, {
      type: "project",
      status: "defining",
      priority: "low",
    }),
    entry(`${PROJECT}Paint the west stair.md`, {
      type: "project",
      status: "scheduled",
      schedule_state: "committed",
      priority: "low",
      start: "2026-11-02",
      target: "2026-10-15",
      progress: 5,
    }),
    entry(`${PROJECT}Solar bench retrofit.md`, {
      type: "project",
      status: "in-review",
      schedule_state: "proposed",
      priority: "medium",
      start: "2026-10-08",
      target: "2026-11-21",
      progress: 140,
    }),
    entry(`${PROJECT}Summer open house.md`, {
      type: "project",
      status: "complete",
      schedule_state: "committed",
      priority: "medium",
      start: "2026-07-06",
      target: "2026-08-21",
      progress: 100,
    }),
    entry(`${PROJECT}Second launch ramp.md`, {
      type: "project",
      status: "cancelled",
      schedule_state: "proposed",
      priority: "low",
      start: "2026-09-01",
      target: "2026-10-01",
      progress: 15,
    }),
  ];
}

/** A clean subset for screenshots: no intentional warnings, weeks-scale span. */
export function coreEntries(): EntryLike[] {
  const keep = new Set([
    "Refit the training singles.md",
    "Dry fit.md",
    "Sea trial.md",
    "Refit complete.md",
    "Autumn regatta logistics.md",
    "Regatta day.md",
    "Dock float replacement.md",
    "Learn-to-row fall session.md",
    "Winter storage plan.md",
  ]);
  return demoEntries().filter((item) => keep.has(item.file.name));
}

/** Frontmatter values for the fictional `Refit the training singles` note. */
export function noteSummaryValues(): Record<string, unknown> {
  return {
    type: "project",
    status: "active",
    attention: "finish-first",
    schedule_state: "committed",
    priority: "high",
    start: "2026-10-05",
    target: "2026-11-13",
    progress: 55,
    phase: "Hull repair",
    outcome: "A safe, watertight training single ready for the spring season.",
    next_action: "Bolt the keel plate and refill the buoyancy tanks.",
    domain: "[[Harborline Boathouse]]",
    focus: "[[Fleet upkeep]]",
    next_review: "2026-10-20",
    done_when: ["Hull passes the leak check", "Rigging re-tensioned", "Sea trial logged"],
  };
}
