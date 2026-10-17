/*
Project Dashboard - generated bundle. Do not edit by hand.
Source: https://github.com/Spencer-Norwick/obsidian-project-dashboard
Build command: npm run build
*/
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ProjectDashboardPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/note-summary.ts
var import_obsidian = require("obsidian");

// src/dates.ts
var MS_PER_DAY = 864e5;
var MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
function isLeapYear(year) {
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
function daysInMonth(year, month) {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}
function isValidCalendarDate(date) {
  if (!Number.isInteger(date.year) || date.year < 1e3 || date.year > 9999) return false;
  if (!Number.isInteger(date.month) || date.month < 1 || date.month > 12) return false;
  if (!Number.isInteger(date.day) || date.day < 1 || date.day > daysInMonth(date.year, date.month)) {
    return false;
  }
  return true;
}
function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}
function parseCalendarDate(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const date = {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate()
    };
    return isValidCalendarDate(date) ? date : null;
  }
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(value.trim());
    if (!match) return null;
    const date = {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3])
    };
    return isValidCalendarDate(date) ? date : null;
  }
  if (typeof value === "object") {
    const candidate = value;
    if (typeof candidate.year === "number" && typeof candidate.month === "number" && typeof candidate.day === "number") {
      const date = {
        year: candidate.year,
        month: candidate.month,
        day: candidate.day
      };
      return isValidCalendarDate(date) ? date : null;
    }
  }
  return null;
}
function dayIndex(date) {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
}
function fromDayIndex(index) {
  const date = new Date(index * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}
function addDays(date, days) {
  return fromDayIndex(dayIndex(date) + days);
}
function addMonths(date, months) {
  const total = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12 + 12) % 12 + 1;
  const day = Math.min(date.day, daysInMonth(year, month));
  return { year, month, day };
}
function daysBetween(from, to) {
  return dayIndex(to) - dayIndex(from);
}
function compareDates(a, b) {
  return dayIndex(a) - dayIndex(b);
}
function startOfWeek(date) {
  const weekday = new Date(dayIndex(date) * MS_PER_DAY).getUTCDay();
  const offset = (weekday + 6) % 7;
  return addDays(date, -offset);
}
function startOfMonth(date) {
  return { year: date.year, month: date.month, day: 1 };
}
function endOfMonth(date) {
  return { year: date.year, month: date.month, day: daysInMonth(date.year, date.month) };
}
function formatISO(date) {
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}
function formatShort(date) {
  return `${MONTHS_SHORT[date.month - 1]} ${date.day}`;
}
function formatLong(date) {
  return `${MONTHS_SHORT[date.month - 1]} ${date.day}, ${date.year}`;
}
function formatMonthYear(date) {
  return `${MONTHS_SHORT[date.month - 1]} ${date.year}`;
}
function todayLocal(now = /* @__PURE__ */ new Date()) {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  };
}

// src/schema.ts
var STATUS_VALUES = [
  "defining",
  "scheduled",
  "active",
  "waiting",
  "paused",
  "complete",
  "cancelled"
];
var ATTENTION_VALUES = ["finish-first", "normal"];
var SCHEDULE_STATE_VALUES = ["proposed", "committed"];
var PRIORITY_VALUES = ["high", "medium", "low"];
var CLOSED_STATUS_VALUES = ["complete", "cancelled"];
function isStatus(value) {
  return STATUS_VALUES.includes(value);
}
function isAttention(value) {
  return ATTENTION_VALUES.includes(value);
}
function isScheduleState(value) {
  return SCHEDULE_STATE_VALUES.includes(value);
}
function isPriority(value) {
  return PRIORITY_VALUES.includes(value);
}
function isClosedStatus(status) {
  return status !== null && CLOSED_STATUS_VALUES.includes(status);
}

// src/model.ts
function asRawString(value) {
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
function asBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = asRawString(value);
  return text !== null && text.toLowerCase() === "true";
}
function asFiniteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = asRawString(value);
  if (text === null) return null;
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}
function stripLinkText(value) {
  let text = value.trim();
  const wiki = /^!?\[\[(.*)\]\]$/.exec(text);
  if (wiki && wiki[1] !== void 0) text = wiki[1];
  text = text.replace(/^!?\[\[/, "").replace(/\]\]$/, "");
  const pipe = text.indexOf("|");
  if (pipe >= 0) text = text.slice(0, pipe);
  const hash = text.indexOf("#");
  if (hash >= 0) text = text.slice(0, hash);
  return text.trim();
}
function asLinkText(value) {
  const raw = asRawString(value);
  if (raw === null) return null;
  const text = stripLinkText(raw);
  return text === "" ? null : text;
}
function asStringList(value) {
  if (value == null) return [];
  const items = Array.isArray(value) ? value : [value];
  const result = [];
  for (const item of items) {
    const text = asRawString(item);
    if (text !== null) result.push(text);
  }
  return result;
}
function readEnum(field, value, guard) {
  const raw = asRawString(value);
  if (raw === null) return { value: null, raw: null, issue: null };
  if (guard(raw)) return { value: raw, raw, issue: null };
  return {
    value: null,
    raw,
    issue: { raw, message: `unknown ${field} "${raw}"; shown with a neutral fallback` }
  };
}
function readDate(value) {
  const raw = asRawString(value);
  if (raw === null) return { date: null, invalid: null };
  const date = parseCalendarDate(raw);
  if (date) return { date, invalid: null };
  return { date: null, invalid: raw };
}
function readProgress(context, value) {
  const raw = asRawString(value);
  if (raw === null) return { progress: 0, raw: null, issue: null };
  const numeric = asFiniteNumber(value);
  const make = (message) => ({
    path: context.path,
    name: context.name,
    kind: "invalid-progress",
    message
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
        `progress ${raw} is not a whole number; shown as ${Math.min(100, Math.max(0, rounded))}`
      )
    };
  }
  if (numeric < 0 || numeric > 100) {
    const clamped = Math.min(100, Math.max(0, numeric));
    return {
      progress: clamped,
      raw,
      issue: make(`progress ${raw} is outside 0-100; shown as ${clamped}`)
    };
  }
  return { progress: numeric, raw, issue: null };
}
function parseProject(context, values) {
  const issues = [];
  const addIssue = (kind, message) => {
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
    milestones: []
  };
}
function parseMilestone(context, values) {
  const issues = [];
  const addIssue = (kind, message) => {
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
    issues
  };
}
function categoryOf(status, attention) {
  if (status === "complete") return "complete";
  if (status === "cancelled") return "closed";
  if (attention === "finish-first") return "finish-first";
  if (status === "active") return "active";
  if (status === "scheduled") return "scheduled";
  if (status === "defining") return "defining";
  return "neutral";
}
function milestoneCategory(milestone) {
  return categoryOf(milestone.status, null);
}
function statusLabel(project) {
  return statusLabelOf(project.status, project.statusRaw);
}
function statusLabelOf(status, raw) {
  if (status) return status.charAt(0).toUpperCase() + status.slice(1);
  if (raw) return raw;
  return null;
}
function metaTextOf(project) {
  if (isClosedStatus(project.status)) return statusLabel(project) ?? "\u2014";
  if (project.progressRaw !== null && project.progress > 0) return `${project.progress}%`;
  if (project.status === "defining") return "Defining";
  if (project.status) return statusLabel(project) ?? "\u2014";
  return "\u2014";
}
function priorityScore(priority) {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;
  return 0;
}
function sortTimelineItems(items) {
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
function needsDatesReason(project) {
  const noStart = project.start === null;
  const noTarget = project.target === null;
  const startText = project.startInvalid ? `unreadable start date ("${project.startInvalid}")` : "missing start date";
  const targetText = project.targetInvalid ? `unreadable target date ("${project.targetInvalid}")` : "missing target date";
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
function buildDashboard(rows, options) {
  const projects = [];
  const milestones = [];
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
  const projectByPath = /* @__PURE__ */ new Map();
  for (const project of projects) projectByPath.set(project.path, project);
  const fuzzyByName = /* @__PURE__ */ new Map();
  for (const project of projects) fuzzyByName.set(project.name.toLowerCase(), project);
  for (const milestone of milestones) {
    if (milestone.parentLinkText === null) {
      milestone.issues.push({
        path: milestone.path,
        name: milestone.name,
        kind: "missing-parent",
        message: "milestone has no parent_project link"
      });
      continue;
    }
    let resolved = null;
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
        message: `parent project "${milestone.parentLinkText}" was not found in this Base`
      });
    }
  }
  const timeline = [];
  const needsDates = [];
  const warnings = [];
  const hiddenProjects = /* @__PURE__ */ new Set();
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
          message: `target ${formatISO(project.target)} is before start ${formatISO(project.start)}; no timeline bar is drawn`
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
    isEmptyDataset: !sawOwnedRow
  };
}
function openMilestones(project, showCompleted) {
  return project.milestones.filter(
    (milestone) => milestone.target !== null && (showCompleted || !isClosedStatus(milestone.status))
  );
}
function describeMilestone(milestone) {
  if (milestone.target === null) return "no date";
  const hard = milestone.hardDeadline ? ", hard deadline" : "";
  return `${formatLong(milestone.target)}${hard}`;
}
function describeDateRange(item) {
  return `${formatShort(item.start)} \u2013 ${formatShort(item.target)}`;
}

// src/render-note.ts
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function looksLikeLink(value) {
  return /^!?\[\[.*\]\]$/.test(value.trim());
}
function linkElement(linkText, label, interactions) {
  const link = el("a", "pd-link", label);
  link.href = "#";
  link.addEventListener("click", (event) => {
    const mouseEvent = event;
    if (mouseEvent.button !== 0) return;
    mouseEvent.preventDefault();
    interactions.openLink(linkText, mouseEvent);
  });
  return link;
}
function categoryClass(category) {
  return `pd-cat-${category}`;
}
function renderStatusChip(root, project) {
  const chipRow = el("div", "pd-ns-chip-row");
  const category = categoryOf(project.status, project.attention);
  const chip = el("span", `pd-ns-chip ${categoryClass(category)}`);
  const statusText = project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : project.statusRaw ?? "No status";
  chip.append(el("span", "pd-ns-chip-dot"), el("span", void 0, statusText));
  if (project.scheduleState)
    chip.append(el("span", "pd-ns-chip-sep", "\xB7"), el("span", void 0, project.scheduleState));
  if (project.attention === "finish-first") {
    chip.append(el("span", "pd-ns-chip-sep", "\xB7"), el("span", void 0, "finish first"));
  }
  chipRow.append(chip);
  root.append(chipRow);
  if (project.status === null && project.statusRaw !== null) {
    root.append(
      el(
        "p",
        "pd-ns-hint",
        `Unknown status "${project.statusRaw}"; shown with a neutral fallback.`
      )
    );
  }
}
function buildRows(project, interactions) {
  const rows = [];
  rows.push({
    key: "Progress",
    value: `${project.progress}%`,
    hint: project.progressIssue?.message
  });
  if (project.start) rows.push({ key: "Start", value: formatISO(project.start) });
  if (project.target) {
    rows.push({
      key: "Target",
      value: project.hardDeadline ? `${formatISO(project.target)} \xB7 hard deadline` : formatISO(project.target)
    });
  }
  if (project.phase) rows.push({ key: "Phase", value: project.phase });
  if (project.domain) {
    rows.push({ key: "Domain", value: linkElement(project.domain, project.domain, interactions) });
  }
  if (project.focus) {
    rows.push({ key: "Focus", value: linkElement(project.focus, project.focus, interactions) });
  }
  if (project.priority) {
    rows.push({
      key: "Priority",
      value: project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
    });
  }
  if (project.nextReview) rows.push({ key: "Next review", value: formatISO(project.nextReview) });
  return rows;
}
function renderFocusPanels(root, project) {
  const hasProgress = project.progressRaw !== null || project.progress > 0;
  const hasNextAction = project.nextAction !== null;
  if (!hasProgress && !hasNextAction) return;
  const grid = el("div", "pd-ns-focus");
  if (hasProgress) {
    const panel = el(
      "div",
      `pd-ns-panel ${categoryClass(categoryOf(project.status, project.attention))}`
    );
    const head = el("div", "pd-ns-panel-head");
    head.append(
      el("span", "pd-ns-panel-label", "Progress"),
      el("b", "pd-ns-panel-value", `${project.progress}%`)
    );
    panel.append(head);
    const bar = el("div", "pd-progress");
    const fill = el("i");
    fill.style.width = `${project.progress}%`;
    bar.append(fill);
    panel.append(bar);
    if (project.progressIssue) panel.append(el("p", "pd-ns-hint", project.progressIssue.message));
    grid.append(panel);
  }
  if (hasNextAction) {
    const panel = el("div", "pd-ns-panel");
    panel.append(el("span", "pd-ns-panel-label", "Next action"));
    panel.append(el("strong", "pd-ns-panel-strong", project.nextAction ?? ""));
    grid.append(panel);
  }
  root.append(grid);
}
function renderColumns(root, project, interactions) {
  if (project.outcome === null && project.doneWhen.length === 0) return;
  const columns = el("div", "pd-ns-columns");
  if (project.outcome !== null) {
    const section = el("section", "pd-ns-column");
    section.append(el("h4", "pd-ns-column-title", "Outcome"));
    section.append(el("p", "pd-ns-column-text", project.outcome));
    columns.append(section);
  }
  if (project.doneWhen.length > 0) {
    const section = el("section", "pd-ns-column");
    section.append(el("h4", "pd-ns-column-title", "Done when"));
    const list = el("ul", "pd-ns-list");
    for (const item of project.doneWhen) {
      const li = el("li", "pd-ns-list-item");
      if (looksLikeLink(item)) {
        const text = stripLinkText(item);
        li.append(linkElement(text, text, interactions));
      } else {
        li.textContent = item;
      }
      list.append(li);
    }
    section.append(list);
    columns.append(section);
  }
  root.append(columns);
}
function renderNoteSummary(container, input) {
  container.replaceChildren();
  const root = el("div", "project-dashboard pd-note");
  const values = input.values ?? {};
  const type = typeof values.type === "string" ? values.type.trim().toLowerCase() : null;
  if (type !== "project") {
    root.append(
      el(
        "p",
        "pd-ns-empty",
        "No project properties on this note yet. Add type: project to see the summary."
      )
    );
    container.append(root);
    return;
  }
  const project = parseProject({ path: "", name: input.name }, values);
  renderStatusChip(root, project);
  const rows = buildRows(project, input.interactions);
  if (rows.length > 0) {
    const props = el("div", "pd-ns-props");
    for (const row of rows) {
      const rowNode = el("div", "pd-ns-row");
      rowNode.append(el("span", "pd-ns-key", row.key));
      const valueNode = el("span", "pd-ns-value");
      if (typeof row.value === "string") valueNode.textContent = row.value;
      else valueNode.append(row.value);
      if (row.hint) valueNode.title = row.hint;
      rowNode.append(valueNode);
      props.append(rowNode);
    }
    root.append(props);
  }
  renderFocusPanels(root, project);
  renderColumns(root, project, input.interactions);
  container.append(root);
}

// src/note-summary.ts
var NOTE_SUMMARY_LANGUAGE = "project-summary";
function registerNoteSummaryProcessor(plugin) {
  plugin.registerMarkdownCodeBlockProcessor(NOTE_SUMMARY_LANGUAGE, (_source, el3, ctx) => {
    ctx.addChild(new NoteSummaryBlock(el3, ctx, plugin.app));
  });
}
var NoteSummaryBlock = class extends import_obsidian.MarkdownRenderChild {
  ctx;
  app;
  constructor(containerEl, ctx, app) {
    super(containerEl);
    this.ctx = ctx;
    this.app = app;
  }
  onload() {
    this.render();
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file.path === this.ctx.sourcePath) this.render();
      })
    );
  }
  render() {
    const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    let name = this.ctx.sourcePath;
    let values;
    if (file instanceof import_obsidian.TFile) {
      name = file.basename;
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (frontmatter) values = frontmatter;
    }
    renderNoteSummary(this.containerEl, {
      name,
      values,
      interactions: {
        openLink: (linkText, event) => {
          const newLeaf = import_obsidian.Keymap.isModEvent(event);
          void this.app.workspace.openLinkText(linkText, this.ctx.sourcePath, newLeaf);
        }
      }
    });
  }
};

// src/view.ts
var import_obsidian2 = require("obsidian");

// src/adapter.ts
var TIMELINE_PROPERTIES = [
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
  "parent_project"
];
function valueToRaw(value) {
  let text;
  try {
    text = value.toString();
  } catch {
    return void 0;
  }
  const trimmed = text.trim();
  if (trimmed === "") return void 0;
  if (trimmed === "null" || trimmed === "undefined") return void 0;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^[+-]?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}
function entryToRawRow(entry) {
  const values = {};
  for (const property of TIMELINE_PROPERTIES) {
    const value = entry.getValue(`note.${property}`);
    if (value === null) continue;
    const raw = valueToRaw(value);
    if (raw !== void 0) values[property] = raw;
  }
  return {
    path: entry.file.path,
    name: entry.file.basename || entry.file.name,
    values
  };
}

// src/scale.ts
var WEEKS_PX_PER_DAY = 14;
var MONTHS_PX_PER_DAY = 5;
var WEEKS_MAX_SPAN_DAYS = 84;
var TODAY_EXPAND_GAP_DAYS = 60;
var MIN_BAR_WIDTH = 10;
function isScaleOption(value) {
  return value === "automatic" || value === "weeks" || value === "months";
}
function coerceScaleOption(value) {
  return isScaleOption(value) ? value : "automatic";
}
function rangeForItems(items, extraDates, today) {
  if (items.length === 0) return null;
  let start = items[0]?.start;
  let end = items[0]?.target;
  for (const item of items) {
    if (start === void 0 || compareDates(item.start, start) < 0) start = item.start;
    if (end === void 0 || compareDates(item.target, end) > 0) end = item.target;
  }
  for (const date of extraDates) {
    if (start === void 0 || compareDates(date, start) < 0) start = date;
    if (end === void 0 || compareDates(date, end) > 0) end = date;
  }
  if (start === void 0 || end === void 0) return null;
  if (compareDates(today, start) < 0) {
    if (daysBetween(today, start) <= TODAY_EXPAND_GAP_DAYS) start = today;
  } else if (compareDates(today, end) > 0) {
    if (daysBetween(end, today) <= TODAY_EXPAND_GAP_DAYS) end = today;
  }
  return { start, end };
}
function chooseMode(spanDays, option) {
  if (option === "weeks" || option === "months") return option;
  return spanDays <= WEEKS_MAX_SPAN_DAYS ? "weeks" : "months";
}
function weekTicks(paddedStart, paddedEnd, pxPerDay) {
  const ticks = [];
  const endIndex = dayIndex(paddedEnd);
  let cursor = paddedStart;
  while (dayIndex(cursor) <= endIndex) {
    const weekEnd = addDays(cursor, 6);
    const containsMonthStart = cursor.month !== weekEnd.month || cursor.day === 1 || dayIndex(cursor) === dayIndex(paddedStart);
    ticks.push({
      index: dayIndex(cursor),
      x: (dayIndex(cursor) - dayIndex(paddedStart)) * pxPerDay,
      label: formatShort(cursor),
      major: containsMonthStart
    });
    cursor = addDays(cursor, 7);
  }
  return ticks;
}
function monthTicks(paddedStart, paddedEnd, pxPerDay) {
  const ticks = [];
  const endIndex = dayIndex(paddedEnd);
  let cursor = startOfMonth(paddedStart);
  let first = true;
  while (dayIndex(cursor) <= endIndex) {
    const showYear = first || cursor.month === 1;
    ticks.push({
      index: dayIndex(cursor),
      x: (dayIndex(cursor) - dayIndex(paddedStart)) * pxPerDay,
      label: showYear ? formatMonthYear(cursor) : formatShort(cursor).replace(/ \d+$/, ""),
      major: true
    });
    first = false;
    cursor = addMonths(cursor, 1);
  }
  return ticks;
}
function buildScale(range, option, _today) {
  const spanDays = daysBetween(range.start, range.end) + 1;
  const mode = chooseMode(spanDays, option);
  const pxPerDay = mode === "weeks" ? WEEKS_PX_PER_DAY : MONTHS_PX_PER_DAY;
  const paddedStart = mode === "weeks" ? startOfWeek(range.start) : startOfMonth(range.start);
  const paddedEnd = mode === "weeks" ? addDays(startOfWeek(range.end), 6) : endOfMonth(range.end);
  const startIndex = dayIndex(paddedStart);
  const totalDays = daysBetween(paddedStart, paddedEnd) + 1;
  const ticks = mode === "weeks" ? weekTicks(paddedStart, paddedEnd, pxPerDay) : monthTicks(paddedStart, paddedEnd, pxPerDay);
  return {
    mode,
    start: paddedStart,
    end: paddedEnd,
    startIndex,
    totalDays,
    pxPerDay,
    width: totalDays * pxPerDay,
    ticks
  };
}
function xForDate(scale, date) {
  return (dayIndex(date) - scale.startIndex) * scale.pxPerDay;
}
function xForDateCenter(scale, date) {
  return xForDate(scale, date) + scale.pxPerDay / 2;
}
function containsDate(scale, date) {
  const index = dayIndex(date);
  return index >= scale.startIndex && index < scale.startIndex + scale.totalDays;
}
function barRect(scale, start, target) {
  const left = xForDate(scale, start);
  const days = daysBetween(start, target) + 1;
  const width = Math.max(MIN_BAR_WIDTH, days * scale.pxPerDay);
  return { left, width };
}

// src/render.ts
var CATEGORY_ORDER = [
  "finish-first",
  "active",
  "scheduled",
  "defining",
  "neutral",
  "complete",
  "closed"
];
var CATEGORY_LABEL = {
  "finish-first": "Finish first",
  active: "Active",
  scheduled: "Scheduled",
  defining: "Defining",
  neutral: "Other",
  complete: "Complete",
  closed: "Cancelled"
};
function el2(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function categoryClass2(category) {
  return `pd-cat-${category}`;
}
function projectAriaLabel(item) {
  const project = item.project;
  const parts = [project.name];
  const status = statusLabel(project);
  if (status) parts.push(status);
  if (project.attention === "finish-first") parts.push("finish first");
  parts.push(`${project.progress}% complete`);
  parts.push(`${formatLong(item.start)} to ${formatLong(item.target)}`);
  parts.push(`${project.scheduleState ?? "proposed"} timing`);
  if (project.hardDeadline) parts.push("hard deadline");
  return parts.join(", ");
}
function projectTitle(item) {
  const project = item.project;
  const lines = [project.name];
  const status = statusLabel(project);
  if (status) lines.push(`Status: ${status}`);
  lines.push(`Progress: ${project.progress}%`);
  lines.push(`Range: ${describeDateRange(item)}`);
  lines.push(`Timing: ${project.scheduleState ?? "proposed"}`);
  if (project.phase) lines.push(`Phase: ${project.phase}`);
  if (project.nextAction) lines.push(`Next action: ${project.nextAction}`);
  return lines.join("\n");
}
function milestoneAriaLabel(milestone) {
  const status = statusLabelOf(milestone.status, milestone.statusRaw);
  return `Milestone ${milestone.name}, ${describeMilestone(milestone)}${status ? `, ${status}` : ""}`;
}
function attachInteractions(link, path, interactions) {
  link.addEventListener("click", (event) => {
    const mouseEvent = event;
    if (mouseEvent.button !== 0) return;
    mouseEvent.preventDefault();
    interactions.openNote(path, mouseEvent);
  });
  link.addEventListener("mouseover", (event) => {
    interactions.hoverNote?.(path, event, link);
  });
}
function renderStrip(container, highlights) {
  const strip = el2("div", "pd-strip");
  strip.setAttribute("aria-label", "Derived project highlights");
  const cells = [
    {
      label: highlights.finishFirst.label,
      title: highlights.finishFirst.title,
      detail: highlights.finishFirst.detail,
      extra: highlights.finishFirst.extra,
      empty: "No project flagged"
    },
    {
      label: highlights.hardDeadline.label,
      title: highlights.hardDeadline.title,
      detail: highlights.hardDeadline.detail,
      extra: highlights.hardDeadline.extra,
      empty: "None ahead"
    },
    {
      label: highlights.nextMilestone.label,
      title: highlights.nextMilestone.title,
      detail: highlights.nextMilestone.detail,
      extra: highlights.nextMilestone.extra,
      empty: "None ahead"
    }
  ];
  for (const cell of cells) {
    const node = el2("div", "pd-cell");
    node.append(el2("span", "pd-cell-label", cell.label));
    if (cell.title === null) {
      node.append(el2("strong", "pd-cell-value pd-cell-value--empty", cell.empty));
      node.append(el2("span", "pd-cell-meta", ""));
    } else {
      node.append(el2("strong", "pd-cell-value", cell.title));
      const meta = el2("span", "pd-cell-meta");
      if (cell.detail) meta.append(el2("span", "pd-cell-date", cell.detail));
      if (cell.extra > 0) meta.append(el2("span", "pd-chip-extra", `+${cell.extra}`));
      node.append(meta);
    }
    strip.append(node);
  }
  container.append(strip);
}
function renderLegend(container, model, showCompleted) {
  const categories = /* @__PURE__ */ new Set();
  for (const item of model.timeline) {
    categories.add(categoryOf(item.project.status, item.project.attention));
    for (const milestone of openMilestones(item.project, showCompleted)) {
      categories.add(milestoneCategory(milestone));
    }
  }
  const toolbar = el2("div", "pd-toolbar");
  const legend = el2("div", "pd-legend");
  const committed = el2("span", "pd-legend-item");
  committed.append(el2("span", "pd-key pd-key--committed"), el2("span", void 0, "Committed"));
  legend.append(committed);
  const proposed = el2("span", "pd-legend-item");
  proposed.append(el2("span", "pd-key pd-key--proposed"), el2("span", void 0, "Proposed"));
  legend.append(proposed);
  for (const category of CATEGORY_ORDER) {
    if (!categories.has(category)) continue;
    const item = el2("span", "pd-legend-item");
    const dot = el2("span", `pd-dot ${categoryClass2(category)}`);
    item.append(dot, el2("span", void 0, CATEGORY_LABEL[category]));
    legend.append(item);
  }
  toolbar.append(legend);
  if (model.hiddenCount > 0) {
    const hiddenText = showCompleted ? `${model.hiddenCount} hidden item${model.hiddenCount === 1 ? "" : "s"} (complete or cancelled)` : `${model.hiddenCount} hidden (complete or cancelled) \u2014 enable "Show completed" to reveal`;
    toolbar.append(el2("span", "pd-hidden-note", hiddenText));
  }
  container.append(toolbar);
}
function renderBar(track, item, scale, interactions) {
  const rect = barRect(scale, item.start, item.target);
  const category = categoryOf(item.project.status, item.project.attention);
  const schedule = item.project.scheduleState ?? "proposed";
  const bar = el2("div", `pd-bar ${categoryClass2(category)} pd-bar--${schedule}`);
  bar.style.left = `${rect.left}px`;
  bar.style.width = `${rect.width}px`;
  bar.setAttribute("role", "link");
  bar.setAttribute("tabindex", "0");
  bar.setAttribute("aria-label", projectAriaLabel(item));
  bar.title = projectTitle(item);
  bar.setAttribute("data-project-path", item.project.path);
  const fill = el2("div", "pd-bar-fill");
  fill.style.width = `${item.project.progress}%`;
  bar.append(fill);
  const text = item.project.phase ?? item.project.outcome ?? "";
  if (text !== "") {
    bar.append(el2("span", "pd-bar-text", text));
  }
  bar.addEventListener("click", (event) => {
    const mouseEvent = event;
    if (mouseEvent.button !== 0) return;
    mouseEvent.preventDefault();
    interactions.openNote(item.project.path, mouseEvent);
  });
  bar.addEventListener("keydown", (event) => {
    const keyboardEvent = event;
    if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
    keyboardEvent.preventDefault();
    interactions.openNote(item.project.path, keyboardEvent);
  });
  bar.addEventListener("mouseover", (event) => {
    interactions.hoverNote?.(item.project.path, event, bar);
  });
  track.append(bar);
}
function renderMilestones(track, item, scale, showCompleted, interactions) {
  const milestones = openMilestones(item.project, showCompleted).filter((milestone) => milestone.target !== null).sort((a, b) => {
    const aIndex = a.target ? dayIndex(a.target) : 0;
    const bIndex = b.target ? dayIndex(b.target) : 0;
    return aIndex - bIndex || a.name.localeCompare(b.name);
  });
  let lastX = Number.NEGATIVE_INFINITY;
  let stack = 0;
  for (const milestone of milestones) {
    const target = milestone.target;
    if (target === null) continue;
    const x = xForDateCenter(scale, target);
    stack = x - lastX < 14 ? Math.min(stack + 1, 3) : 0;
    lastX = x;
    const marker = el2("button", `pd-milestone ${categoryClass2(milestoneCategory(milestone))}`);
    marker.type = "button";
    marker.style.left = `${x}px`;
    marker.style.setProperty("--pd-stack", String(stack));
    marker.setAttribute("aria-label", milestoneAriaLabel(milestone));
    marker.title = `${milestone.name} \u2014 ${describeMilestone(milestone)}`;
    marker.append(el2("span", "pd-milestone-glyph", "\u25C6"));
    marker.addEventListener("click", (event) => {
      const mouseEvent = event;
      if (mouseEvent.button !== 0) return;
      mouseEvent.preventDefault();
      interactions.openNote(milestone.path, mouseEvent);
    });
    marker.addEventListener("mouseover", (event) => {
      interactions.hoverNote?.(milestone.path, event, marker);
    });
    track.append(marker);
  }
}
function renderTimeline(input, container) {
  const { model, scale, today, showCompleted, interactions } = input;
  if (!scale || model.timeline.length === 0) return;
  const scroll = el2("div", "pd-scroll");
  const grid = el2("div", "pd-grid");
  grid.style.setProperty("--pd-track-width", `${scale.width}px`);
  const headLabel = el2("div", "pd-head-row pd-head-label", "Project");
  const headTrack = el2("div", "pd-head-row pd-head-track");
  for (const tick of scale.ticks) {
    const label = el2(
      "span",
      tick.major ? "pd-tick-label pd-tick-label--major" : "pd-tick-label",
      tick.label
    );
    if (tick.x < 28) {
      label.style.left = `${tick.x + 6}px`;
      label.style.transform = "none";
    } else {
      label.style.left = `${tick.x}px`;
    }
    headTrack.append(label);
  }
  grid.append(headLabel, headTrack);
  for (const item of model.timeline) {
    const labelCell = el2("div", "pd-row-label");
    const dot = el2(
      "span",
      `pd-dot ${categoryClass2(categoryOf(item.project.status, item.project.attention))}`
    );
    const textWrap = el2("span", "pd-label-text");
    const link = el2("a", "pd-label-name", item.project.name);
    link.href = "#";
    attachInteractions(link, item.project.path, interactions);
    textWrap.append(link);
    const sub = item.project.phase ?? item.project.outcome;
    if (sub) textWrap.append(el2("small", "pd-label-sub", sub));
    const meta = el2("span", "pd-label-meta", metaTextOf(item.project));
    if (item.project.issues.length > 0 || item.project.progressIssue) {
      const warn = el2("span", "pd-warn", "!");
      warn.title = [...item.project.issues.map((issue) => issue.message)].join("\n");
      meta.prepend(warn);
    }
    labelCell.append(dot, textWrap, meta);
    const track = el2("div", "pd-row-track");
    renderBar(track, item, scale, interactions);
    renderMilestones(track, item, scale, showCompleted, interactions);
    grid.append(labelCell, track);
  }
  const overlay = el2("div", "pd-overlay");
  for (const tick of scale.ticks) {
    const line = el2("span", tick.major ? "pd-gridline pd-gridline--major" : "pd-gridline");
    line.style.left = `${tick.x}px`;
    overlay.append(line);
  }
  if (containsDate(scale, today)) {
    const todayLine = el2("span", "pd-today");
    todayLine.style.left = `${xForDate(scale, today)}px`;
    todayLine.append(el2("span", "pd-today-label", "Today"));
    overlay.append(todayLine);
  }
  grid.append(overlay);
  scroll.append(grid);
  container.append(scroll);
}
function renderEmptyState(input, container) {
  const { model, showCompleted } = input;
  if (model.timeline.length > 0) return;
  const empty = el2("div", "pd-empty");
  if (model.isEmptyDataset) {
    empty.append(el2("div", void 0, "No projects found in this Base."));
    empty.append(
      el2(
        "div",
        "pd-empty-hint",
        "Filter the Base to notes with type: project (add type: milestone for milestones)."
      )
    );
  } else if (model.hiddenCount > 0 && model.needsDates.length === 0 && model.warnings.length === 0) {
    empty.append(
      el2(
        "div",
        void 0,
        showCompleted ? "No projects to place on the timeline." : 'All projects are complete or cancelled. Enable "Show completed" in the view options to reveal them.'
      )
    );
  } else if (model.needsDates.length > 0 && model.warnings.length === 0) {
    empty.append(
      el2(
        "div",
        void 0,
        "No project has both a valid start and target date yet. See \u201CNeeds dates\u201D below."
      )
    );
  } else if (model.warnings.length > 0) {
    empty.append(
      el2(
        "div",
        void 0,
        "No project can be placed on the timeline. See the data warnings below."
      )
    );
  } else {
    empty.append(el2("div", void 0, "No projects to show."));
  }
  container.append(empty);
}
function renderSections(input, container) {
  const { model, interactions } = input;
  if (model.needsDates.length > 0) {
    const section = el2("section", "pd-section pd-needs");
    section.append(el2("h3", "pd-section-title", `Needs dates (${model.needsDates.length})`));
    const list = el2("ul", "pd-list");
    for (const item of model.needsDates) {
      const li = el2("li", "pd-list-item");
      const link = el2("a", "pd-link", item.project.name);
      link.href = "#";
      attachInteractions(link, item.project.path, interactions);
      li.append(link, el2("span", "pd-list-reason", item.reason));
      list.append(li);
    }
    section.append(list);
    section.append(
      el2(
        "p",
        "pd-section-note",
        "These notes need a start and a target date before they can appear on the timeline."
      )
    );
    container.append(section);
  }
  if (model.warnings.length > 0) {
    const section = el2("section", "pd-section pd-warnings");
    section.append(el2("h3", "pd-section-title", `Data warnings (${model.warnings.length})`));
    const list = el2("ul", "pd-list");
    for (const warning of model.warnings) {
      const li = el2("li", "pd-list-item pd-warning");
      const link = el2("a", "pd-link", warning.name);
      link.href = "#";
      attachInteractions(link, warning.path, interactions);
      li.append(link, el2("span", "pd-list-reason", warning.message));
      list.append(li);
    }
    section.append(list);
    container.append(section);
  }
}
function renderDashboard(input) {
  const { container, model, scale, highlights, showCompleted } = input;
  container.replaceChildren();
  const root = el2("div", "project-dashboard");
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Project timeline");
  root.setAttribute("data-scale", scale?.mode ?? "none");
  renderStrip(root, highlights);
  renderLegend(root, model, showCompleted);
  renderTimeline(input, root);
  renderEmptyState(input, root);
  renderSections(input, root);
  container.append(root);
}

// src/select.ts
function priorityScore2(project) {
  if (project.priority === "high") return 3;
  if (project.priority === "medium") return 2;
  if (project.priority === "low") return 1;
  return 0;
}
function byTargetThenName(aTarget, bTarget, aName, bName) {
  if (aTarget && bTarget) {
    const delta = compareDates(aTarget, bTarget);
    if (delta !== 0) return delta;
  } else if (aTarget) {
    return -1;
  } else if (bTarget) {
    return 1;
  }
  return aName.localeCompare(bName);
}
function isOpen(status) {
  return !isClosedStatus(status);
}
function selectHighlights(model, today) {
  const openProjects = model.projects.filter((project) => isOpen(project.status));
  const finishFirstCandidates = openProjects.filter((project) => project.attention === "finish-first").sort((a, b) => {
    const priorityDelta = priorityScore2(b) - priorityScore2(a);
    if (priorityDelta !== 0) return priorityDelta;
    return byTargetThenName(a.target, b.target, a.name, b.name);
  });
  const todayIndex = dayIndex(today);
  const hardDeadlineCandidates = openProjects.filter(
    (project) => project.hardDeadline && project.target !== null && dayIndex(project.target) >= todayIndex
  ).sort((a, b) => byTargetThenName(a.target, b.target, a.name, b.name));
  const nextMilestoneCandidates = model.milestones.filter(
    (milestone) => isOpen(milestone.status) && milestone.target !== null && dayIndex(milestone.target) >= todayIndex
  ).sort((a, b) => byTargetThenName(a.target, b.target, a.name, b.name));
  const firstFinishFirst = finishFirstCandidates[0] ?? null;
  const firstHardDeadline = hardDeadlineCandidates[0] ?? null;
  const firstMilestone = nextMilestoneCandidates[0] ?? null;
  return {
    finishFirst: {
      label: "Finish first",
      title: firstFinishFirst?.name ?? null,
      detail: firstFinishFirst?.target ? formatShort(firstFinishFirst.target) : null,
      extra: Math.max(0, finishFirstCandidates.length - 1)
    },
    hardDeadline: {
      label: "Hard deadline",
      title: firstHardDeadline?.name ?? null,
      detail: firstHardDeadline?.target ? formatShort(firstHardDeadline.target) : null,
      extra: Math.max(0, hardDeadlineCandidates.length - 1)
    },
    nextMilestone: {
      label: "Next milestone",
      title: firstMilestone?.name ?? null,
      detail: firstMilestone?.target ? formatShort(firstMilestone.target) : null,
      extra: Math.max(0, nextMilestoneCandidates.length - 1)
    }
  };
}

// src/view.ts
var PROJECT_TIMELINE_VIEW_TYPE = "project-timeline";
var SCALE_OPTION_KEY = "scale";
var SHOW_COMPLETED_OPTION_KEY = "showCompleted";
var ProjectTimelineView = class extends import_obsidian2.BasesView {
  hoverPopover = null;
  type = PROJECT_TIMELINE_VIEW_TYPE;
  hostEl;
  constructor(controller, parentEl) {
    super(controller);
    this.hostEl = parentEl.createDiv({ cls: "project-dashboard-host" });
  }
  onDataUpdated() {
    const rows = this.data.data.map((entry) => entryToRawRow(entry));
    const showCompleted = this.config.get(SHOW_COMPLETED_OPTION_KEY) === true;
    const today = todayLocal();
    const model = buildDashboard(rows, {
      showCompleted,
      resolveLink: (linkText, sourcePath) => {
        const dest = this.app.metadataCache.getFirstLinkpathDest(linkText, sourcePath);
        return dest ? dest.path : null;
      }
    });
    const highlights = selectHighlights(model, today);
    const extraDates = [];
    for (const item of model.timeline) {
      for (const milestone of item.project.milestones) {
        if (milestone.target !== null) extraDates.push(milestone.target);
      }
    }
    const range = rangeForItems(model.timeline, extraDates, today);
    const scale = range ? buildScale(range, coerceScaleOption(this.config.get(SCALE_OPTION_KEY)), today) : null;
    renderDashboard({
      container: this.hostEl,
      model,
      scale,
      highlights,
      showCompleted,
      today,
      interactions: {
        openNote: (path, event) => this.openNote(path, event),
        hoverNote: (linktext, event, targetEl) => this.showHover(linktext, event, targetEl)
      }
    });
  }
  openNote(path, event) {
    const newLeaf = import_obsidian2.Keymap.isModEvent(event);
    void this.app.workspace.openLinkText(path, "", newLeaf);
  }
  showHover(linktext, event, targetEl) {
    this.app.workspace.trigger("hover-link", {
      event,
      source: PROJECT_TIMELINE_VIEW_TYPE,
      hoverParent: this,
      targetEl,
      linktext
    });
  }
};

// src/main.ts
var ProjectDashboardPlugin = class extends import_obsidian3.Plugin {
  onload() {
    const registered = this.registerTimelineView();
    if (!registered) {
      this.app.workspace.onLayoutReady(() => {
        if (!this.registerTimelineView()) {
          console.warn(
            "Project Dashboard: the Bases core plugin is not enabled, so the Timeline view is unavailable. The project-summary code block still works."
          );
        }
      });
    }
    registerNoteSummaryProcessor(this);
  }
  registerTimelineView() {
    return this.registerBasesView(PROJECT_TIMELINE_VIEW_TYPE, {
      name: "Project timeline",
      icon: "lucide-gantt-chart",
      factory: (controller, containerEl) => new ProjectTimelineView(controller, containerEl),
      options: () => [
        {
          type: "dropdown",
          key: SCALE_OPTION_KEY,
          displayName: "Scale",
          default: "automatic",
          options: {
            automatic: "Automatic",
            weeks: "Weeks",
            months: "Months"
          }
        },
        {
          type: "toggle",
          key: SHOW_COMPLETED_OPTION_KEY,
          displayName: "Show completed and cancelled",
          default: false
        }
      ]
    });
  }
};
