import { describe, expect, it, vi } from "vitest";
import { entryToRawRow, type EntryLike } from "../src/adapter";
import type { CalendarDate } from "../src/dates";
import { buildDashboard } from "../src/model";
import { renderDashboard } from "../src/render";
import { type ScaleOption, buildScale, rangeForItems, xForDate } from "../src/scale";
import { selectHighlights } from "../src/select";
import { TODAY, coreEntries, demoEntries } from "./fixtures/entries";

interface SetupOptions {
  showCompleted?: boolean;
  scaleOption?: ScaleOption;
  today?: CalendarDate;
}

function setup(entries: EntryLike[], options: SetupOptions = {}) {
  const today = options.today ?? TODAY;
  const showCompleted = options.showCompleted ?? false;
  const model = buildDashboard(entries.map(entryToRawRow), { showCompleted });
  const highlights = selectHighlights(model, today);
  const extraDates: CalendarDate[] = [];
  for (const item of model.timeline) {
    for (const milestone of item.project.milestones) {
      if (milestone.target !== null) extraDates.push(milestone.target);
    }
  }
  const range = rangeForItems(model.timeline, extraDates, today);
  const scale = range ? buildScale(range, options.scaleOption ?? "automatic", today) : null;
  const container = document.createElement("div");
  const openNote = vi.fn();
  renderDashboard({
    container,
    model,
    scale,
    highlights,
    showCompleted,
    today,
    interactions: { openNote },
  });
  return { container, model, scale, highlights, openNote };
}

describe("dashboard rendering on the integration fixture", () => {
  it("renders one bar per placeable project, styled by schedule state", () => {
    const { container } = setup(demoEntries());
    expect(container.querySelectorAll(".pd-bar")).toHaveLength(6);
    expect(container.querySelectorAll(".pd-bar--proposed")).toHaveLength(2);
    expect(container.querySelectorAll(".pd-bar--committed")).toHaveLength(4);
  });

  it("positions bars only from start and target", () => {
    const { container, scale } = setup(demoEntries());
    expect(scale).not.toBeNull();
    // The fixture's earliest start is 2026-09-14 (a Monday), so the padded
    // scale begins there and the bar for a 2026-10-05 start sits 21 days in.
    const bar = container.querySelector<HTMLElement>(
      '[data-project-path$="Refit the training singles.md"]',
    );
    expect(bar).not.toBeNull();
    expect(bar?.style.left).toBe("294px");
    expect(bar?.style.width).toBe("560px");
  });

  it("fills the bar with the manual progress value", () => {
    const { container } = setup(demoEntries());
    const bar = container.querySelector<HTMLElement>(
      '[data-project-path$="Refit the training singles.md"]',
    );
    const fill = bar?.querySelector<HTMLElement>(".pd-bar-fill");
    expect(fill?.style.width).toBe("55%");
  });

  it("fills every bar with its own progress value", () => {
    const { container, model } = setup(demoEntries());
    const bars = [...container.querySelectorAll<HTMLElement>(".pd-bar")];
    expect(bars).toHaveLength(model.timeline.length);
    for (const bar of bars) {
      const path = bar.getAttribute("data-project-path");
      const item = model.timeline.find((candidate) => candidate.project.path === path);
      expect(item).toBeDefined();
      const fill = bar.querySelector<HTMLElement>(".pd-bar-fill");
      expect(fill?.style.width).toBe(`${item?.project.progress}%`);
    }
  });

  it("left-aligns the first tick label so it is not clipped by the sticky column", () => {
    const { container } = setup(demoEntries());
    const labels = [...container.querySelectorAll<HTMLElement>(".pd-tick-label")];
    expect(labels[0]?.style.transform).toBe("none");
    expect(labels[0]?.style.left).toBe("6px");
  });

  it("labels bars with an accessible description and a tooltip", () => {
    const { container } = setup(demoEntries());
    const bar = container.querySelector<HTMLElement>(
      '[data-project-path$="Refit the training singles.md"]',
    );
    expect(bar?.getAttribute("aria-label")).toBe(
      "Refit the training singles, Active, finish first, 55% complete, Oct 5, 2026 to Nov 13, 2026, committed timing",
    );
    expect(bar?.title).toContain("Progress: 55%");
    expect(bar?.title).toContain("Timing: committed");
  });

  it("renders milestone markers on the parent project row, stacked when they share a date", () => {
    const { container } = setup(demoEntries());
    const markers = [...container.querySelectorAll<HTMLElement>(".pd-milestone")];
    expect(markers).toHaveLength(4);
    expect(markers[0]?.style.getPropertyValue("--pd-stack")).toBe("0");
    expect(markers[1]?.style.getPropertyValue("--pd-stack")).toBe("1");
    expect(markers[0]?.style.left).toBe("567px");
    expect(markers[0]?.getAttribute("aria-label")).toBe(
      "Milestone Dry fit, Oct 24, 2026, Scheduled",
    );
  });

  it("draws bars, milestone markers, and the today line inside the scroll area", () => {
    const { container, scale } = setup(demoEntries());
    expect(scale).not.toBeNull();
    if (!scale) return;
    const today = container.querySelector<HTMLElement>(".pd-today");
    expect(today).not.toBeNull();
    expect(today?.style.left).toBe(`${xForDate(scale, TODAY)}px`);
  });

  it("derives the summary strip from the data", () => {
    const { container } = setup(demoEntries());
    const cells = [...container.querySelectorAll(".pd-cell")];
    expect(cells).toHaveLength(3);
    expect(cells[0]?.querySelector(".pd-cell-value")?.textContent).toBe("Autumn regatta logistics");
    expect(cells[0]?.textContent).toContain("Oct 30");
    expect(cells[0]?.querySelector(".pd-chip-extra")?.textContent).toBe("+1");
    expect(cells[1]?.querySelector(".pd-cell-value")?.textContent).toBe("Autumn regatta logistics");
    expect(cells[2]?.querySelector(".pd-cell-value")?.textContent).toBe("Dry fit");
    expect(cells[2]?.querySelector(".pd-chip-extra")?.textContent).toBe("+4");
  });

  it("lists undated projects under Needs dates with the exact reason", () => {
    const { container } = setup(demoEntries());
    const section = container.querySelector(".pd-needs");
    expect(section).not.toBeNull();
    expect(section?.textContent).toContain("Recatalog the map cabinet");
    expect(section?.textContent).toContain("missing start and target dates");
  });

  it("lists every data warning with the offending note and value", () => {
    const { container } = setup(demoEntries());
    const items = [...container.querySelectorAll(".pd-warnings .pd-list-item")];
    expect(items).toHaveLength(5);
    const text = items.map((item) => item.textContent ?? "").join("\n");
    expect(text).toContain('unknown status "in-review"');
    expect(text).toContain("target 2026-10-15 is before start 2026-11-02");
    expect(text).toContain("progress 140 is outside 0-100; shown as 100");
    expect(text).toContain("milestone has no target date");
  });

  it("hides closed projects by default and explains how to reveal them", () => {
    const { container } = setup(demoEntries());
    expect(container.querySelector('[data-project-path$="Summer open house.md"]')).toBeNull();
    expect(container.querySelector(".pd-hidden-note")?.textContent).toContain("2 hidden");
  });

  it("reveals closed projects when the option is on", () => {
    const { container } = setup(demoEntries(), { showCompleted: true });
    expect(container.querySelectorAll(".pd-bar")).toHaveLength(8);
    const complete = container.querySelector<HTMLElement>(
      '[data-project-path$="Summer open house.md"]',
    );
    expect(complete?.classList.contains("pd-cat-complete")).toBe(true);
    expect(container.querySelector(".pd-hidden-note")).toBeNull();
  });

  it("opens the project note when a bar or name is clicked", () => {
    const { container, openNote } = setup(demoEntries());
    const name = [...container.querySelectorAll<HTMLAnchorElement>(".pd-label-name")].find(
      (node) => node.textContent === "Refit the training singles",
    );
    expect(name).toBeDefined();
    name?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    expect(openNote).toHaveBeenCalledWith(
      "Boathouse/Projects/Refit the training singles.md",
      expect.anything(),
    );

    openNote.mockClear();
    const bar = container.querySelector<HTMLElement>(
      '[data-project-path$="Autumn regatta logistics.md"]',
    );
    bar?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    expect(openNote).toHaveBeenCalledWith(
      "Boathouse/Projects/Autumn regatta logistics.md",
      expect.anything(),
    );
  });

  it("opens milestone notes when a marker is clicked", () => {
    const { container, openNote } = setup(demoEntries());
    const marker = container.querySelector<HTMLButtonElement>(".pd-milestone");
    marker?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    expect(openNote).toHaveBeenCalledWith("Boathouse/Milestones/Dry fit.md", expect.anything());
  });

  it("renders a calm empty state for an empty dataset", () => {
    const { container } = setup([]);
    expect(container.querySelectorAll(".pd-bar")).toHaveLength(0);
    expect(container.querySelector(".pd-empty")?.textContent).toContain(
      "No projects found in this Base.",
    );
  });

  it('treats missing Bases values rendered as "null" as absent dates', () => {
    const { container } = setup([
      {
        file: { path: "Projects/No dates.md", basename: "No dates", name: "No dates.md" },
        getValue: (propertyId: string) => {
          const key = propertyId.startsWith("note.")
            ? propertyId.slice("note.".length)
            : propertyId;
          if (key === "type") return { toString: () => "project", isTruthy: () => true };
          if (key === "status") return { toString: () => "defining", isTruthy: () => true };
          if (key === "start" || key === "target") {
            return { toString: () => "null", isTruthy: () => false };
          }
          return null;
        },
      },
    ]);
    const section = container.querySelector(".pd-needs");
    expect(section?.textContent).toContain("No dates");
    expect(section?.textContent).toContain("missing start and target dates");
    expect(container.querySelector(".pd-warnings")).toBeNull();
  });

  it("renders the clean subset without warnings", () => {
    const { container } = setup(coreEntries());
    expect(container.querySelector(".pd-warnings")).toBeNull();
    expect(container.querySelector(".pd-needs")).toBeNull();
    expect(container.querySelectorAll(".pd-bar")).toHaveLength(5);
  });
});
