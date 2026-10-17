import { type CalendarDate, dayIndex, formatLong } from "./dates";
import {
  type Category,
  type DashboardModel,
  type MilestoneRecord,
  type TimelineItem,
  categoryOf,
  describeDateRange,
  describeMilestone,
  metaTextOf,
  milestoneCategory,
  openMilestones,
  statusLabel,
  statusLabelOf,
} from "./model";
import type { Highlights } from "./select";
import { type TimelineScale, barRect, containsDate, xForDate, xForDateCenter } from "./scale";

export interface DashboardInteractions {
  openNote(path: string, event: MouseEvent): void;
  hoverNote?(path: string, event: MouseEvent, targetEl: HTMLElement): void;
}

export interface DashboardRenderInput {
  container: HTMLElement;
  model: DashboardModel;
  scale: TimelineScale | null;
  highlights: Highlights;
  showCompleted: boolean;
  today: CalendarDate;
  interactions: DashboardInteractions;
}

const CATEGORY_ORDER: Category[] = [
  "finish-first",
  "active",
  "scheduled",
  "defining",
  "neutral",
  "complete",
  "closed",
];

const CATEGORY_LABEL: Record<Category, string> = {
  "finish-first": "Finish first",
  active: "Active",
  scheduled: "Scheduled",
  defining: "Defining",
  neutral: "Other",
  complete: "Complete",
  closed: "Cancelled",
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function categoryClass(category: Category): string {
  return `pd-cat-${category}`;
}

function projectAriaLabel(item: TimelineItem): string {
  const project = item.project;
  const parts: string[] = [project.name];
  const status = statusLabel(project);
  if (status) parts.push(status);
  if (project.attention === "finish-first") parts.push("finish first");
  parts.push(`${project.progress}% complete`);
  parts.push(`${formatLong(item.start)} to ${formatLong(item.target)}`);
  parts.push(`${project.scheduleState ?? "proposed"} timing`);
  if (project.hardDeadline) parts.push("hard deadline");
  return parts.join(", ");
}

function projectTitle(item: TimelineItem): string {
  const project = item.project;
  const lines: string[] = [project.name];
  const status = statusLabel(project);
  if (status) lines.push(`Status: ${status}`);
  lines.push(`Progress: ${project.progress}%`);
  lines.push(`Range: ${describeDateRange(item)}`);
  lines.push(`Timing: ${project.scheduleState ?? "proposed"}`);
  if (project.phase) lines.push(`Phase: ${project.phase}`);
  if (project.nextAction) lines.push(`Next action: ${project.nextAction}`);
  return lines.join("\n");
}

function milestoneAriaLabel(milestone: MilestoneRecord): string {
  const status = statusLabelOf(milestone.status, milestone.statusRaw);
  return `Milestone ${milestone.name}, ${describeMilestone(milestone)}${status ? `, ${status}` : ""}`;
}

function attachInteractions(
  link: HTMLElement,
  path: string,
  interactions: DashboardInteractions,
): void {
  link.addEventListener("click", (event) => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0) return;
    mouseEvent.preventDefault();
    interactions.openNote(path, mouseEvent);
  });
  link.addEventListener("mouseover", (event) => {
    interactions.hoverNote?.(path, event as MouseEvent, link);
  });
}

function renderStrip(container: HTMLElement, highlights: Highlights): void {
  const strip = el("div", "pd-strip");
  strip.setAttribute("aria-label", "Derived project highlights");

  const cells: Array<{
    label: string;
    title: string | null;
    detail: string | null;
    extra: number;
    empty: string;
  }> = [
    {
      label: highlights.finishFirst.label,
      title: highlights.finishFirst.title,
      detail: highlights.finishFirst.detail,
      extra: highlights.finishFirst.extra,
      empty: "No project flagged",
    },
    {
      label: highlights.hardDeadline.label,
      title: highlights.hardDeadline.title,
      detail: highlights.hardDeadline.detail,
      extra: highlights.hardDeadline.extra,
      empty: "None ahead",
    },
    {
      label: highlights.nextMilestone.label,
      title: highlights.nextMilestone.title,
      detail: highlights.nextMilestone.detail,
      extra: highlights.nextMilestone.extra,
      empty: "None ahead",
    },
  ];

  for (const cell of cells) {
    const node = el("div", "pd-cell");
    node.append(el("span", "pd-cell-label", cell.label));
    if (cell.title === null) {
      node.append(el("strong", "pd-cell-value pd-cell-value--empty", cell.empty));
      node.append(el("span", "pd-cell-meta", ""));
    } else {
      node.append(el("strong", "pd-cell-value", cell.title));
      const meta = el("span", "pd-cell-meta");
      if (cell.detail) meta.append(el("span", "pd-cell-date", cell.detail));
      if (cell.extra > 0) meta.append(el("span", "pd-chip-extra", `+${cell.extra}`));
      node.append(meta);
    }
    strip.append(node);
  }
  container.append(strip);
}

function renderLegend(container: HTMLElement, model: DashboardModel, showCompleted: boolean): void {
  const categories = new Set<Category>();
  for (const item of model.timeline) {
    categories.add(categoryOf(item.project.status, item.project.attention));
    for (const milestone of openMilestones(item.project, showCompleted)) {
      categories.add(milestoneCategory(milestone));
    }
  }

  const toolbar = el("div", "pd-toolbar");
  const legend = el("div", "pd-legend");

  const committed = el("span", "pd-legend-item");
  committed.append(el("span", "pd-key pd-key--committed"), el("span", undefined, "Committed"));
  legend.append(committed);

  const proposed = el("span", "pd-legend-item");
  proposed.append(el("span", "pd-key pd-key--proposed"), el("span", undefined, "Proposed"));
  legend.append(proposed);

  for (const category of CATEGORY_ORDER) {
    if (!categories.has(category)) continue;
    const item = el("span", "pd-legend-item");
    const dot = el("span", `pd-dot ${categoryClass(category)}`);
    item.append(dot, el("span", undefined, CATEGORY_LABEL[category]));
    legend.append(item);
  }

  toolbar.append(legend);

  if (model.hiddenCount > 0) {
    const hiddenText = showCompleted
      ? `${model.hiddenCount} hidden item${model.hiddenCount === 1 ? "" : "s"} (complete or cancelled)`
      : `${model.hiddenCount} hidden (complete or cancelled) — enable "Show completed" to reveal`;
    toolbar.append(el("span", "pd-hidden-note", hiddenText));
  }

  container.append(toolbar);
}

function renderBar(
  track: HTMLElement,
  item: TimelineItem,
  scale: TimelineScale,
  interactions: DashboardInteractions,
): void {
  const rect = barRect(scale, item.start, item.target);
  const category = categoryOf(item.project.status, item.project.attention);
  const schedule = item.project.scheduleState ?? "proposed";
  const bar = el("div", `pd-bar ${categoryClass(category)} pd-bar--${schedule}`);
  bar.style.left = `${rect.left}px`;
  bar.style.width = `${rect.width}px`;
  bar.setAttribute("role", "link");
  bar.setAttribute("tabindex", "0");
  bar.setAttribute("aria-label", projectAriaLabel(item));
  bar.title = projectTitle(item);
  bar.setAttribute("data-project-path", item.project.path);

  const fill = el("div", "pd-bar-fill");
  fill.style.width = `${item.project.progress}%`;
  bar.append(fill);

  const text = item.project.phase ?? item.project.outcome ?? "";
  if (text !== "") {
    bar.append(el("span", "pd-bar-text", text));
  }

  bar.addEventListener("click", (event) => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0) return;
    mouseEvent.preventDefault();
    interactions.openNote(item.project.path, mouseEvent);
  });
  bar.addEventListener("keydown", (event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
    keyboardEvent.preventDefault();
    interactions.openNote(item.project.path, keyboardEvent as unknown as MouseEvent);
  });
  bar.addEventListener("mouseover", (event) => {
    interactions.hoverNote?.(item.project.path, event as MouseEvent, bar);
  });

  track.append(bar);
}

function renderMilestones(
  track: HTMLElement,
  item: TimelineItem,
  scale: TimelineScale,
  showCompleted: boolean,
  interactions: DashboardInteractions,
): void {
  const milestones = openMilestones(item.project, showCompleted)
    .filter((milestone) => milestone.target !== null)
    .sort((a, b) => {
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

    const marker = el("button", `pd-milestone ${categoryClass(milestoneCategory(milestone))}`);
    marker.type = "button";
    marker.style.left = `${x}px`;
    marker.style.setProperty("--pd-stack", String(stack));
    marker.setAttribute("aria-label", milestoneAriaLabel(milestone));
    marker.title = `${milestone.name} — ${describeMilestone(milestone)}`;
    marker.append(el("span", "pd-milestone-glyph", "◆"));
    marker.addEventListener("click", (event) => {
      const mouseEvent = event as MouseEvent;
      if (mouseEvent.button !== 0) return;
      mouseEvent.preventDefault();
      interactions.openNote(milestone.path, mouseEvent);
    });
    marker.addEventListener("mouseover", (event) => {
      interactions.hoverNote?.(milestone.path, event as MouseEvent, marker);
    });
    track.append(marker);
  }
}

function renderTimeline(input: DashboardRenderInput, container: HTMLElement): void {
  const { model, scale, today, showCompleted, interactions } = input;
  if (!scale || model.timeline.length === 0) return;

  const scroll = el("div", "pd-scroll");
  const grid = el("div", "pd-grid");
  grid.style.setProperty("--pd-track-width", `${scale.width}px`);

  const headLabel = el("div", "pd-head-row pd-head-label", "Project");
  const headTrack = el("div", "pd-head-row pd-head-track");
  for (const tick of scale.ticks) {
    const label = el(
      "span",
      tick.major ? "pd-tick-label pd-tick-label--major" : "pd-tick-label",
      tick.label,
    );
    if (tick.x < 28) {
      // Keep the first label clear of the sticky project column instead of
      // centering it half outside the track.
      label.style.left = `${tick.x + 6}px`;
      label.style.transform = "none";
    } else {
      label.style.left = `${tick.x}px`;
    }
    headTrack.append(label);
  }
  grid.append(headLabel, headTrack);

  for (const item of model.timeline) {
    const labelCell = el("div", "pd-row-label");
    const dot = el(
      "span",
      `pd-dot ${categoryClass(categoryOf(item.project.status, item.project.attention))}`,
    );
    const textWrap = el("span", "pd-label-text");
    const link = el("a", "pd-label-name", item.project.name);
    link.href = "#";
    attachInteractions(link, item.project.path, interactions);
    textWrap.append(link);
    const sub = item.project.phase ?? item.project.outcome;
    if (sub) textWrap.append(el("small", "pd-label-sub", sub));
    const meta = el("span", "pd-label-meta", metaTextOf(item.project));
    if (item.project.issues.length > 0 || item.project.progressIssue) {
      const warn = el("span", "pd-warn", "!");
      warn.title = [...item.project.issues.map((issue) => issue.message)].join("\n");
      meta.prepend(warn);
    }
    labelCell.append(dot, textWrap, meta);

    const track = el("div", "pd-row-track");
    renderBar(track, item, scale, interactions);
    renderMilestones(track, item, scale, showCompleted, interactions);

    grid.append(labelCell, track);
  }

  const overlay = el("div", "pd-overlay");
  for (const tick of scale.ticks) {
    const line = el("span", tick.major ? "pd-gridline pd-gridline--major" : "pd-gridline");
    line.style.left = `${tick.x}px`;
    overlay.append(line);
  }
  if (containsDate(scale, today)) {
    const todayLine = el("span", "pd-today");
    todayLine.style.left = `${xForDate(scale, today)}px`;
    todayLine.append(el("span", "pd-today-label", "Today"));
    overlay.append(todayLine);
  }
  grid.append(overlay);

  scroll.append(grid);
  container.append(scroll);
}

function renderEmptyState(input: DashboardRenderInput, container: HTMLElement): void {
  const { model, showCompleted } = input;
  if (model.timeline.length > 0) return;
  const empty = el("div", "pd-empty");
  if (model.isEmptyDataset) {
    empty.append(el("div", undefined, "No projects found in this Base."));
    empty.append(
      el(
        "div",
        "pd-empty-hint",
        "Filter the Base to notes with type: project (add type: milestone for milestones).",
      ),
    );
  } else if (
    model.hiddenCount > 0 &&
    model.needsDates.length === 0 &&
    model.warnings.length === 0
  ) {
    empty.append(
      el(
        "div",
        undefined,
        showCompleted
          ? "No projects to place on the timeline."
          : 'All projects are complete or cancelled. Enable "Show completed" in the view options to reveal them.',
      ),
    );
  } else if (model.needsDates.length > 0 && model.warnings.length === 0) {
    empty.append(
      el(
        "div",
        undefined,
        "No project has both a valid start and target date yet. See “Needs dates” below.",
      ),
    );
  } else if (model.warnings.length > 0) {
    empty.append(
      el(
        "div",
        undefined,
        "No project can be placed on the timeline. See the data warnings below.",
      ),
    );
  } else {
    empty.append(el("div", undefined, "No projects to show."));
  }
  container.append(empty);
}

function renderSections(input: DashboardRenderInput, container: HTMLElement): void {
  const { model, interactions } = input;

  if (model.needsDates.length > 0) {
    const section = el("section", "pd-section pd-needs");
    section.append(el("h3", "pd-section-title", `Needs dates (${model.needsDates.length})`));
    const list = el("ul", "pd-list");
    for (const item of model.needsDates) {
      const li = el("li", "pd-list-item");
      const link = el("a", "pd-link", item.project.name);
      link.href = "#";
      attachInteractions(link, item.project.path, interactions);
      li.append(link, el("span", "pd-list-reason", item.reason));
      list.append(li);
    }
    section.append(list);
    section.append(
      el(
        "p",
        "pd-section-note",
        "These notes need a start and a target date before they can appear on the timeline.",
      ),
    );
    container.append(section);
  }

  if (model.warnings.length > 0) {
    const section = el("section", "pd-section pd-warnings");
    section.append(el("h3", "pd-section-title", `Data warnings (${model.warnings.length})`));
    const list = el("ul", "pd-list");
    for (const warning of model.warnings) {
      const li = el("li", "pd-list-item pd-warning");
      const link = el("a", "pd-link", warning.name);
      link.href = "#";
      attachInteractions(link, warning.path, interactions);
      li.append(link, el("span", "pd-list-reason", warning.message));
      list.append(li);
    }
    section.append(list);
    container.append(section);
  }
}

export function renderDashboard(input: DashboardRenderInput): void {
  const { container, model, scale, highlights, showCompleted } = input;
  container.replaceChildren();

  const root = el("div", "project-dashboard");
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
