import { describe, expect, it } from "vitest";
import { entryToRawRow, type EntryLike } from "../src/adapter";
import { buildDashboard } from "../src/model";
import { selectHighlights } from "../src/select";

const TODAY = { year: 2026, month: 10, day: 16 };

function model(entries: EntryLike[]) {
  return buildDashboard(entries.map(entryToRawRow), { showCompleted: false });
}

function project(name: string, props: Record<string, string | number | boolean>): EntryLike {
  return {
    file: { path: `Projects/${name}.md`, basename: name, name: `${name}.md` },
    getValue: (propertyId: string) => {
      const key = propertyId.startsWith("note.") ? propertyId.slice("note.".length) : propertyId;
      const raw = props[key];
      if (raw === undefined) return null;
      return { toString: () => String(raw), isTruthy: () => raw !== false };
    },
  };
}

describe("finish first", () => {
  it("picks the highest priority, then the earliest valid target", () => {
    const highlights = selectHighlights(
      model([
        project("Low", {
          type: "project",
          attention: "finish-first",
          priority: "low",
          target: "2026-10-20",
          status: "active",
        }),
        project("Later high", {
          type: "project",
          attention: "finish-first",
          priority: "high",
          target: "2026-11-01",
          status: "active",
        }),
        project("Sooner high", {
          type: "project",
          attention: "finish-first",
          priority: "high",
          target: "2026-10-18",
          status: "active",
        }),
        project("Closed", {
          type: "project",
          attention: "finish-first",
          priority: "high",
          target: "2026-10-19",
          status: "complete",
        }),
        project("Normal", {
          type: "project",
          attention: "normal",
          priority: "high",
          target: "2026-10-17",
          status: "active",
        }),
      ]),
      TODAY,
    );
    expect(highlights.finishFirst.title).toBe("Sooner high");
    expect(highlights.finishFirst.detail).toBe("Oct 18");
    expect(highlights.finishFirst.extra).toBe(2);
  });

  it("prefers projects with a target over projects without one", () => {
    const highlights = selectHighlights(
      model([
        project("No target", {
          type: "project",
          attention: "finish-first",
          priority: "high",
          status: "active",
        }),
        project("Has target", {
          type: "project",
          attention: "finish-first",
          priority: "high",
          target: "2026-12-01",
          status: "active",
        }),
      ]),
      TODAY,
    );
    expect(highlights.finishFirst.title).toBe("Has target");
    expect(highlights.finishFirst.extra).toBe(1);
  });
});

describe("hard deadline", () => {
  it("picks the nearest open project with a future hard deadline", () => {
    const highlights = selectHighlights(
      model([
        project("Today", {
          type: "project",
          status: "active",
          hard_deadline: true,
          target: "2026-10-16",
        }),
        project("Next month", {
          type: "project",
          status: "active",
          hard_deadline: true,
          target: "2026-11-01",
        }),
        project("Past", {
          type: "project",
          status: "active",
          hard_deadline: true,
          target: "2026-10-10",
        }),
        project("Not hard", {
          type: "project",
          status: "active",
          hard_deadline: false,
          target: "2026-10-17",
        }),
        project("No target", { type: "project", status: "active", hard_deadline: true }),
        project("Closed", {
          type: "project",
          status: "cancelled",
          hard_deadline: true,
          target: "2026-10-17",
        }),
      ]),
      TODAY,
    );
    expect(highlights.hardDeadline.title).toBe("Today");
    expect(highlights.hardDeadline.detail).toBe("Oct 16");
    expect(highlights.hardDeadline.extra).toBe(1);
  });
});

describe("next milestone", () => {
  it("picks the nearest future open milestone with deterministic ties", () => {
    const entries: EntryLike[] = [project("Parent", { type: "project", status: "active" })];
    const milestoneEntries: EntryLike[] = [
      ["Zulu check", "2026-10-20", "scheduled"],
      ["Aardvark check", "2026-10-20", "scheduled"],
      ["Later check", "2026-11-02", "scheduled"],
      ["Past check", "2026-10-10", "scheduled"],
      ["Closed check", "2026-10-18", "complete"],
    ].map(([name, target, status]) => ({
      file: { path: `Milestones/${name}.md`, basename: name ?? "", name: `${name}.md` },
      getValue: (propertyId: string) => {
        const key = propertyId.startsWith("note.") ? propertyId.slice("note.".length) : propertyId;
        const raw =
          key === "type"
            ? "milestone"
            : key === "target"
              ? target
              : key === "status"
                ? status
                : undefined;
        if (raw === undefined) return null;
        return { toString: () => String(raw), isTruthy: () => true };
      },
    }));

    const highlights = selectHighlights(model([...entries, ...milestoneEntries]), TODAY);
    expect(highlights.nextMilestone.title).toBe("Aardvark check");
    expect(highlights.nextMilestone.detail).toBe("Oct 20");
    expect(highlights.nextMilestone.extra).toBe(2);
  });
});

describe("empty states", () => {
  it("returns calm empty highlights when nothing qualifies", () => {
    const highlights = selectHighlights(
      model([project("Quiet", { type: "project", status: "active" })]),
      TODAY,
    );
    expect(highlights.finishFirst.title).toBeNull();
    expect(highlights.finishFirst.detail).toBeNull();
    expect(highlights.finishFirst.extra).toBe(0);
    expect(highlights.hardDeadline.title).toBeNull();
    expect(highlights.nextMilestone.title).toBeNull();
  });
});
