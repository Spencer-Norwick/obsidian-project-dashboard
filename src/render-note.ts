import { formatISO } from "./dates";
import {
  type Category,
  type ProjectRecord,
  categoryOf,
  parseProject,
  stripLinkText,
} from "./model";

export interface NoteSummaryInteractions {
  openLink(linkText: string, event: MouseEvent): void;
}

export interface NoteSummaryInput {
  name: string;
  values: Record<string, unknown> | undefined;
  interactions: NoteSummaryInteractions;
}

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

function looksLikeLink(value: string): boolean {
  return /^!?\[\[.*\]\]$/.test(value.trim());
}

function linkElement(
  linkText: string,
  label: string,
  interactions: NoteSummaryInteractions,
): HTMLElement {
  const link = el("a", "pd-link", label);
  link.href = "#";
  link.addEventListener("click", (event) => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0) return;
    mouseEvent.preventDefault();
    interactions.openLink(linkText, mouseEvent);
  });
  return link;
}

function categoryClass(category: Category): string {
  return `pd-cat-${category}`;
}

function renderStatusChip(root: HTMLElement, project: ProjectRecord): void {
  const chipRow = el("div", "pd-ns-chip-row");
  const category = categoryOf(project.status, project.attention);
  const chip = el("span", `pd-ns-chip ${categoryClass(category)}`);
  const statusText = project.status
    ? project.status.charAt(0).toUpperCase() + project.status.slice(1)
    : (project.statusRaw ?? "No status");
  chip.append(el("span", "pd-ns-chip-dot"), el("span", undefined, statusText));
  if (project.scheduleState)
    chip.append(el("span", "pd-ns-chip-sep", "·"), el("span", undefined, project.scheduleState));
  if (project.attention === "finish-first") {
    chip.append(el("span", "pd-ns-chip-sep", "·"), el("span", undefined, "finish first"));
  }
  chipRow.append(chip);
  root.append(chipRow);

  if (project.status === null && project.statusRaw !== null) {
    root.append(
      el(
        "p",
        "pd-ns-hint",
        `Unknown status "${project.statusRaw}"; shown with a neutral fallback.`,
      ),
    );
  }
}

interface RowSpec {
  key: string;
  value: Node | string;
  hint?: string;
}

function buildRows(project: ProjectRecord, interactions: NoteSummaryInteractions): RowSpec[] {
  const rows: RowSpec[] = [];

  rows.push({
    key: "Progress",
    value: `${project.progress}%`,
    hint: project.progressIssue?.message,
  });
  if (project.start) rows.push({ key: "Start", value: formatISO(project.start) });
  if (project.target) {
    rows.push({
      key: "Target",
      value: project.hardDeadline
        ? `${formatISO(project.target)} · hard deadline`
        : formatISO(project.target),
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
      value: project.priority.charAt(0).toUpperCase() + project.priority.slice(1),
    });
  }
  if (project.nextReview) rows.push({ key: "Next review", value: formatISO(project.nextReview) });

  return rows;
}

function renderFocusPanels(root: HTMLElement, project: ProjectRecord): void {
  const hasProgress = project.progressRaw !== null || project.progress > 0;
  const hasNextAction = project.nextAction !== null;
  if (!hasProgress && !hasNextAction) return;

  const grid = el("div", "pd-ns-focus");

  if (hasProgress) {
    const panel = el(
      "div",
      `pd-ns-panel ${categoryClass(categoryOf(project.status, project.attention))}`,
    );
    const head = el("div", "pd-ns-panel-head");
    head.append(
      el("span", "pd-ns-panel-label", "Progress"),
      el("b", "pd-ns-panel-value", `${project.progress}%`),
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

function renderColumns(
  root: HTMLElement,
  project: ProjectRecord,
  interactions: NoteSummaryInteractions,
): void {
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

export function renderNoteSummary(container: HTMLElement, input: NoteSummaryInput): void {
  container.replaceChildren();

  const root = el("div", "project-dashboard pd-note");
  const values = input.values ?? {};
  const type = typeof values.type === "string" ? values.type.trim().toLowerCase() : null;

  if (type !== "project") {
    root.append(
      el(
        "p",
        "pd-ns-empty",
        "No project properties on this note yet. Add type: project to see the summary.",
      ),
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
