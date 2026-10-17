import {
  type Attention,
  type Priority,
  type ScheduleState,
  type Status,
  isAttention,
  isClosedStatus,
  isPriority,
  isScheduleState,
  isStatus,
} from "./schema";
import {
  type CalendarDate,
  compareDates,
  formatISO,
  formatShort,
  parseCalendarDate,
  dayIndex,
  formatLong,
} from "./dates";

export type WarningKind = "invalid-date" | "invalid-progress" | "unknown-enum" | "missing-parent";

export interface Warning {
  path: string;
  name: string;
  kind: WarningKind;
  message: string;
}

export interface RawRow {
  path: string;
  name: string;
  values: Record<string, unknown>;
}

export interface ProjectRecord {
  kind: "project";
  path: string;
  name: string;
  status: Status | null;
  statusRaw: string | null;
  attention: Attention | null;
  attentionRaw: string | null;
  scheduleState: ScheduleState | null;
  scheduleStateRaw: string | null;
  priority: Priority | null;
  priorityRaw: string | null;
  hardDeadline: boolean;
  progress: number;
  progressRaw: string | null;
  progressIssue: Warning | null;
  start: CalendarDate | null;
  startInvalid: string | null;
  target: CalendarDate | null;
  targetInvalid: string | null;
  nextReview: CalendarDate | null;
  phase: string | null;
  outcome: string | null;
  nextAction: string | null;
  domain: string | null;
  focus: string | null;
  goals: string[];
  capabilities: string[];
  interests: string[];
  doneWhen: string[];
  issues: Warning[];
  milestones: MilestoneRecord[];
}

export interface MilestoneRecord {
  kind: "milestone";
  path: string;
  name: string;
  parentLinkText: string | null;
  parentPath: string | null;
  status: Status | null;
  statusRaw: string | null;
  hardDeadline: boolean;
  target: CalendarDate | null;
  targetInvalid: string | null;
  issues: Warning[];
}

export interface TimelineItem {
  project: ProjectRecord;
  start: CalendarDate;
  target: CalendarDate;
}

export interface NeedsDatesItem {
  project: ProjectRecord;
  reason: string;
}

export interface DashboardModel {
  timeline: TimelineItem[];
  needsDates: NeedsDatesItem[];
  warnings: Warning[];
  projects: ProjectRecord[];
  milestones: MilestoneRecord[];
  hiddenCount: number;
  isEmptyDataset: boolean;
}

export interface BuildOptions {
  showCompleted: boolean;
  resolveLink?: (linkText: string, sourcePath: string) => string | null;
}

function asRawString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const text = String(value).trim();
    return text === "" ? null : text;
  }
  return null;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const text = asRawString(value);
  return text !== null && text.toLowerCase() === "true";
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = asRawString(value);
  if (text === null) return null;
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function stripLinkText(value: string): string {
  let text = value.trim();
  const wiki = /^!?\[\[(.*)\]\]$/.exec(text);
  if (wiki && wiki[1] !== undefined) text = wiki[1];
  text = text.replace(/^!?\[\[/, "").replace(/\]\]$/, "");
  const pipe = text.indexOf("|");
  if (pipe >= 0) text = text.slice(0, pipe);
  const hash = text.indexOf("#");
  if (hash >= 0) text = text.slice(0, hash);
  return text.trim();
}

function asLinkText(value: unknown): string | null {
  const raw = asRawString(value);
  if (raw === null) return null;
  const text = stripLinkText(raw);
  return text === "" ? null : text;
}

function asStringList(value: unknown): string[] {
  if (value == null) return [];
  const items = Array.isArray(value) ? value : [value];
  const result: string[] = [];
  for (const item of items) {
    const text = asRawString(item);
    if (text !== null) result.push(text);
  }
  return result;
}

interface FieldIssue {
  raw: string;
  message: string;
}

function readEnum<T extends string>(
  field: string,
  value: unknown,
  guard: (candidate: string) => candidate is T,
): { value: T | null; raw: string | null; issue: FieldIssue | null } {
  const raw = asRawString(value);
  if (raw === null) return { value: null, raw: null, issue: null };
  if (guard(raw)) return { value: raw, raw, issue: null };
  return {
    value: null,
    raw,
    issue: { raw, message: `unknown ${field} "${raw}"; shown with a neutral fallback` },
  };
}

function readDate(value: unknown): { date: CalendarDate | null; invalid: string | null } {
  const raw = asRawString(value);
  if (raw === null) return { date: null, invalid: null };
  const date = parseCalendarDate(raw);
  if (date) return { date, invalid: null };
  return { date: null, invalid: raw };
}

function readProgress(
  context: { path: string; name: string },
  value: unknown,
): { progress: number; raw: string | null; issue: Warning | null } {
  const raw = asRawString(value);
  if (raw === null) return { progress: 0, raw: null, issue: null };
  const numeric = asFiniteNumber(value);
  const make = (message: string): Warning => ({
    path: context.path,
    name: context.name,
    kind: "invalid-progress",
    message,
  });
  if (numeric === null) {
    return { progress: 0, raw, issue: make(`progress "${raw}" is not a number; shown as 0`) };
  }
  if (!Number.isInteger(numeric)) {
    const rounded = Math.round(numeric);
    return {
      progress: Math.min(100, Math.max(0, rounded)),
      raw,
      issue: make(
        `progress ${raw} is not a whole number; shown as ${Math.min(100, Math.max(0, rounded))}`,
      ),
    };
  }
  if (numeric < 0 || numeric > 100) {
    const clamped = Math.min(100, Math.max(0, numeric));
    return {
      progress: clamped,
      raw,
      issue: make(`progress ${raw} is outside 0-100; shown as ${clamped}`),
    };
  }
  return { progress: numeric, raw, issue: null };
}

export function parseProject(
  context: { path: string; name: string },
  values: Record<string, unknown>,
): ProjectRecord {
  const issues: Warning[] = [];
  const addIssue = (kind: WarningKind, message: string): void => {
    issues.push({ path: context.path, name: context.name, kind, message });
  };

  const status = readEnum("status", values.status, isStatus);
  const attention = readEnum("attention", values.attention, isAttention);
  const scheduleState = readEnum("schedule_state", values.schedule_state, isScheduleState);
  const priority = readEnum("priority", values.priority, isPriority);
  if (status.issue) addIssue("unknown-enum", status.issue.message);
  if (attention.issue) addIssue("unknown-enum", attention.issue.message);
  if (scheduleState.issue) addIssue("unknown-enum", scheduleState.issue.message);
  if (priority.issue) addIssue("unknown-enum", priority.issue.message);

  const start = readDate(values.start);
  const target = readDate(values.target);
  if (start.invalid)
    addIssue("invalid-date", `start "${start.invalid}" is not a valid YYYY-MM-DD date`);
  if (target.invalid)
    addIssue("invalid-date", `target "${target.invalid}" is not a valid YYYY-MM-DD date`);

  const progress = readProgress(context, values.progress);
  if (progress.issue) issues.push(progress.issue);

  const nextReview = readDate(values.next_review).date;

  return {
    kind: "project",
    path: context.path,
    name: context.name,
    status: status.value,
    statusRaw: status.raw,
    attention: attention.value,
    attentionRaw: attention.raw,
    scheduleState: scheduleState.value,
    scheduleStateRaw: scheduleState.raw,
    priority: priority.value,
    priorityRaw: priority.raw,
    hardDeadline: asBoolean(values.hard_deadline),
    progress: progress.progress,
    progressRaw: progress.raw,
    progressIssue: progress.issue,
    start: start.date,
    startInvalid: start.invalid,
    target: target.date,
    targetInvalid: target.invalid,
    nextReview,
    phase: asRawString(values.phase),
    outcome: asRawString(values.outcome),
    nextAction: asRawString(values.next_action),
    domain: asLinkText(values.domain),
    focus: asLinkText(values.focus),
    goals: asStringList(values.goals),
    capabilities: asStringList(values.capabilities),
    interests: asStringList(values.interests),
    doneWhen: asStringList(values.done_when),
    issues,
    milestones: [],
  };
}

export function parseMilestone(
  context: { path: string; name: string },
  values: Record<string, unknown>,
): MilestoneRecord {
  const issues: Warning[] = [];
  const addIssue = (kind: WarningKind, message: string): void => {
    issues.push({ path: context.path, name: context.name, kind, message });
  };

  const status = readEnum("status", values.status, isStatus);
  if (status.issue) addIssue("unknown-enum", status.issue.message);

  const target = readDate(values.target);
  if (target.invalid)
    addIssue("invalid-date", `target "${target.invalid}" is not a valid YYYY-MM-DD date`);
  if (target.date === null && target.invalid === null) {
    addIssue("invalid-date", "milestone has no target date");
  }

  return {
    kind: "milestone",
    path: context.path,
    name: context.name,
    parentLinkText: asLinkText(values.parent_project),
    parentPath: null,
    status: status.value,
    statusRaw: status.raw,
    hardDeadline: asBoolean(values.hard_deadline),
    target: target.date,
    targetInvalid: target.invalid,
    issues,
  };
}

export type Category =
  "finish-first" | "active" | "scheduled" | "defining" | "complete" | "closed" | "neutral";

export function categoryOf(status: Status | null, attention: Attention | null): Category {
  if (status === "complete") return "complete";
  if (status === "cancelled") return "closed";
  if (attention === "finish-first") return "finish-first";
  if (status === "active") return "active";
  if (status === "scheduled") return "scheduled";
  if (status === "defining") return "defining";
  return "neutral";
}

export function milestoneCategory(milestone: MilestoneRecord): Category {
  return categoryOf(milestone.status, null);
}

export function statusLabel(project: ProjectRecord): string | null {
  return statusLabelOf(project.status, project.statusRaw);
}

export function statusLabelOf(status: Status | null, raw: string | null): string | null {
  if (status) return status.charAt(0).toUpperCase() + status.slice(1);
  if (raw) return raw;
  return null;
}

export function metaTextOf(project: ProjectRecord): string {
  if (isClosedStatus(project.status)) return statusLabel(project) ?? "—";
  if (project.progressRaw !== null && project.progress > 0) return `${project.progress}%`;
  if (project.status === "defining") return "Defining";
  if (project.status) return statusLabel(project) ?? "—";
  return "—";
}

function priorityScore(priority: Priority | null): number {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;
  return 0;
}

export function sortTimelineItems(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => {
    const closedA = isClosedStatus(a.project.status) ? 1 : 0;
    const closedB = isClosedStatus(b.project.status) ? 1 : 0;
    if (closedA !== closedB) return closedA - closedB;
    const finishA = a.project.attention === "finish-first" ? 0 : 1;
    const finishB = b.project.attention === "finish-first" ? 0 : 1;
    if (finishA !== finishB) return finishA - finishB;
    const priorityDelta = priorityScore(b.project.priority) - priorityScore(a.project.priority);
    if (priorityDelta !== 0) return priorityDelta;
    const startDelta = dayIndex(a.start) - dayIndex(b.start);
    if (startDelta !== 0) return startDelta;
    return a.project.name.localeCompare(b.project.name);
  });
}

export function needsDatesReason(project: ProjectRecord): string {
  const noStart = project.start === null;
  const noTarget = project.target === null;
  const startText = project.startInvalid
    ? `unreadable start date ("${project.startInvalid}")`
    : "missing start date";
  const targetText = project.targetInvalid
    ? `unreadable target date ("${project.targetInvalid}")`
    : "missing target date";
  if (noStart && noTarget) {
    if (project.startInvalid && project.targetInvalid) {
      return "unreadable start and target dates";
    }
    if (project.startInvalid) {
      return `unreadable start date ("${project.startInvalid}") and missing target date`;
    }
    if (project.targetInvalid) {
      return `missing start date and unreadable target date ("${project.targetInvalid}")`;
    }
    return "missing start and target dates";
  }
  return noStart ? startText : targetText;
}

export function buildDashboard(rows: RawRow[], options: BuildOptions): DashboardModel {
  const projects: ProjectRecord[] = [];
  const milestones: MilestoneRecord[] = [];
  let sawOwnedRow = false;

  for (const row of rows) {
    const type = asRawString(row.values.type)?.toLowerCase();
    if (type === "project") {
      sawOwnedRow = true;
      projects.push(parseProject({ path: row.path, name: row.name }, row.values));
    } else if (type === "milestone") {
      sawOwnedRow = true;
      milestones.push(parseMilestone({ path: row.path, name: row.name }, row.values));
    }
  }

  const projectByPath = new Map<string, ProjectRecord>();
  for (const project of projects) projectByPath.set(project.path, project);

  const fuzzyByName = new Map<string, ProjectRecord>();
  for (const project of projects) fuzzyByName.set(project.name.toLowerCase(), project);

  for (const milestone of milestones) {
    if (milestone.parentLinkText === null) {
      milestone.issues.push({
        path: milestone.path,
        name: milestone.name,
        kind: "missing-parent",
        message: "milestone has no parent_project link",
      });
      continue;
    }
    let resolved: string | null = null;
    if (options.resolveLink) {
      resolved = options.resolveLink(milestone.parentLinkText, milestone.path);
    }
    if (resolved === null) {
      const fuzzy = fuzzyByName.get(milestone.parentLinkText.toLowerCase());
      if (fuzzy) resolved = fuzzy.path;
    }
    if (resolved !== null && projectByPath.has(resolved)) {
      milestone.parentPath = resolved;
      projectByPath.get(resolved)?.milestones.push(milestone);
    } else {
      milestone.issues.push({
        path: milestone.path,
        name: milestone.name,
        kind: "missing-parent",
        message: `parent project "${milestone.parentLinkText}" was not found in this Base`,
      });
    }
  }

  const timeline: TimelineItem[] = [];
  const needsDates: NeedsDatesItem[] = [];
  const warnings: Warning[] = [];
  const hiddenProjects = new Set<string>();
  let hiddenCount = 0;

  for (const project of projects) {
    for (const issue of project.issues) warnings.push(issue);

    if (isClosedStatus(project.status) && !options.showCompleted) {
      hiddenProjects.add(project.path);
      hiddenCount += 1 + project.milestones.length;
      continue;
    }

    if (project.start !== null && project.target !== null) {
      if (compareDates(project.target, project.start) < 0) {
        warnings.push({
          path: project.path,
          name: project.name,
          kind: "invalid-date",
          message: `target ${formatISO(project.target)} is before start ${formatISO(project.start)}; no timeline bar is drawn`,
        });
      } else {
        timeline.push({ project, start: project.start, target: project.target });
      }
    } else {
      needsDates.push({ project, reason: needsDatesReason(project) });
    }
  }

  for (const milestone of milestones) {
    for (const issue of milestone.issues) warnings.push(issue);
    if (milestone.parentPath !== null && !hiddenProjects.has(milestone.parentPath)) {
      if (isClosedStatus(milestone.status) && !options.showCompleted) {
        hiddenCount += 1;
      }
    }
  }

  warnings.sort((a, b) => a.name.localeCompare(b.name) || a.message.localeCompare(b.message));

  return {
    timeline: sortTimelineItems(timeline),
    needsDates,
    warnings,
    projects,
    milestones,
    hiddenCount,
    isEmptyDataset: !sawOwnedRow,
  };
}

export function openMilestones(project: ProjectRecord, showCompleted: boolean): MilestoneRecord[] {
  return project.milestones.filter(
    (milestone) =>
      milestone.target !== null && (showCompleted || !isClosedStatus(milestone.status)),
  );
}

export function describeMilestone(milestone: MilestoneRecord): string {
  if (milestone.target === null) return "no date";
  const hard = milestone.hardDeadline ? ", hard deadline" : "";
  return `${formatLong(milestone.target)}${hard}`;
}

export function describeDateRange(item: TimelineItem): string {
  return `${formatShort(item.start)} – ${formatShort(item.target)}`;
}
