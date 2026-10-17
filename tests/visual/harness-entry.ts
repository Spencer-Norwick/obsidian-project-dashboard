import { type EntryLike, entryToRawRow } from "../../src/adapter";
import type { CalendarDate } from "../../src/dates";
import { buildDashboard } from "../../src/model";
import { renderDashboard } from "../../src/render";
import { renderNoteSummary } from "../../src/render-note";
import { type ScaleOption, buildScale, rangeForItems } from "../../src/scale";
import { selectHighlights } from "../../src/select";
import { coreEntries, demoEntries, noteSummaryValues } from "../fixtures/entries";

export interface HarnessRequest {
  variant: "timeline" | "note";
  dataset: "core" | "full";
  scale: ScaleOption;
  showCompleted: boolean;
  today: CalendarDate;
  scrollToISO?: string;
}

/**
 * Renders the plugin's real renderers with fictional demo data. This module is
 * bundled by `make-screenshots.mjs` and is never shipped with the plugin.
 */
export function renderHarness(request: HarnessRequest, container: HTMLElement): void {
  if (request.variant === "note") {
    renderNoteSummary(container, {
      name: "Refit the training singles",
      values: noteSummaryValues(),
      interactions: { openLink: () => undefined },
    });
    return;
  }

  const entries: EntryLike[] = request.dataset === "core" ? coreEntries() : demoEntries();
  const model = buildDashboard(entries.map(entryToRawRow), {
    showCompleted: request.showCompleted,
  });
  const highlights = selectHighlights(model, request.today);

  const extraDates: CalendarDate[] = [];
  for (const item of model.timeline) {
    for (const milestone of item.project.milestones) {
      if (milestone.target !== null) extraDates.push(milestone.target);
    }
  }

  const range = rangeForItems(model.timeline, extraDates, request.today);
  const scale = range ? buildScale(range, request.scale, request.today) : null;

  renderDashboard({
    container,
    model,
    scale,
    highlights,
    showCompleted: request.showCompleted,
    today: request.today,
    interactions: { openNote: () => undefined },
  });

  if (request.scrollToISO !== undefined && scale !== null) {
    const scroll = container.querySelector<HTMLElement>(".pd-scroll");
    const target = parseISO(request.scrollToISO);
    if (scroll && target) {
      const x = (daysBetween(scale.start, target) + 0.5) * scale.pxPerDay;
      scroll.scrollLeft = Math.max(0, x - 140);
    }
  }
}

function parseISO(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function daysBetween(from: CalendarDate, to: CalendarDate): number {
  const fromIndex = Date.UTC(from.year, from.month - 1, from.day) / 86_400_000;
  const toIndex = Date.UTC(to.year, to.month - 1, to.day) / 86_400_000;
  return toIndex - fromIndex;
}

declare global {
  interface Window {
    renderHarness: typeof renderHarness;
  }
}

window.renderHarness = renderHarness;
