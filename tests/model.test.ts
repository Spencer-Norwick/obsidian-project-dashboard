import { describe, expect, it } from "vitest";
import { entryToRawRow } from "../src/adapter";
import { buildDashboard, categoryOf, needsDatesReason, type DashboardModel } from "../src/model";
import { demoEntries, entry } from "./fixtures/entries";

function modelFor(entries: ReturnType<typeof demoEntries>, showCompleted = false): DashboardModel {
  return buildDashboard(entries.map(entryToRawRow), { showCompleted });
}

describe("buildDashboard on the integration fixture", () => {
  const model = modelFor(demoEntries());

  it("keeps every project and milestone", () => {
    expect(model.projects).toHaveLength(10);
    expect(model.milestones).toHaveLength(6);
  });

  it("places exactly the projects with valid, ordered date ranges on the timeline", () => {
    const names = model.timeline.map((item) => item.project.name);
    expect(names).toContain("Refit the training singles");
    expect(names).toContain("Autumn regatta logistics");
    expect(names).toContain("Dock float replacement");
    expect(names).toContain("Learn-to-row fall session");
    expect(names).toContain("Winter storage plan");
    expect(names).toContain("Solar bench retrofit");
    expect(names).not.toContain("Paint the west stair");
    expect(names).not.toContain("Recatalog the map cabinet");
    expect(names).not.toContain("Summer open house");
    expect(names).not.toContain("Second launch ramp");
    expect(model.timeline).toHaveLength(6);
  });

  it("sorts finish-first, then priority, then earliest start", () => {
    expect(model.timeline[0]?.project.name).toBe("Refit the training singles");
    expect(model.timeline[1]?.project.name).toBe("Autumn regatta logistics");
  });

  it("collects undated projects into Needs dates with a precise reason", () => {
    expect(model.needsDates).toHaveLength(1);
    expect(model.needsDates[0]?.project.name).toBe("Recatalog the map cabinet");
    expect(model.needsDates[0]?.reason).toBe("missing start and target dates");
  });

  it("reports invalid ranges, unknown enums, invalid progress, and missing parents", () => {
    const messages = model.warnings.map((warning) => `${warning.name}: ${warning.message}`);
    expect(messages).toContain(
      "Paint the west stair: target 2026-10-15 is before start 2026-11-02; no timeline bar is drawn",
    );
    expect(messages).toContain(
      'Solar bench retrofit: unknown status "in-review"; shown with a neutral fallback',
    );
    expect(messages).toContain("Solar bench retrofit: progress 140 is outside 0-100; shown as 100");
    expect(messages).toContain("Order float bolts: milestone has no target date");
    expect(messages).toContain(
      'Book the speaker: parent project "Old committee plan" was not found in this Base',
    );
    expect(model.warnings).toHaveLength(5);
  });

  it("attaches milestones to their parent project", () => {
    const refit = model.projects.find((project) => project.name === "Refit the training singles");
    expect(refit?.milestones.map((milestone) => milestone.name)).toEqual([
      "Dry fit",
      "Sea trial",
      "Refit complete",
    ]);
  });

  it("counts hidden complete and cancelled projects", () => {
    expect(model.hiddenCount).toBe(2);
  });
});

describe("failure behavior", () => {
  it("clamps out-of-range and fractional progress with a warning", () => {
    const model = buildDashboard(
      [
        entryToRawRow(
          entry("P.md", {
            type: "project",
            progress: 50.5,
            start: "2026-10-05",
            target: "2026-10-06",
          }),
        ),
      ],
      { showCompleted: false },
    );
    expect(model.projects[0]?.progress).toBe(51);
    expect(model.projects[0]?.progressIssue?.message).toBe(
      "progress 50.5 is not a whole number; shown as 51",
    );
  });

  it("treats non-numeric progress as 0 with a warning", () => {
    const model = buildDashboard(
      [entryToRawRow(entry("P.md", { type: "project", progress: "mostly done" }))],
      { showCompleted: false },
    );
    expect(model.projects[0]?.progress).toBe(0);
    expect(model.projects[0]?.progressIssue?.message).toBe(
      'progress "mostly done" is not a number; shown as 0',
    );
  });

  it("treats unreadable dates as missing and explains why", () => {
    const model = buildDashboard(
      [entryToRawRow(entry("P.md", { type: "project", start: "2026-10-05", target: "someday" }))],
      { showCompleted: false },
    );
    expect(model.timeline).toHaveLength(0);
    expect(model.needsDates[0]?.reason).toBe('unreadable target date ("someday")');
    expect(model.warnings[0]?.message).toBe('target "someday" is not a valid YYYY-MM-DD date');
  });

  it("reports a single missing date without inventing one", () => {
    const model = buildDashboard(
      [entryToRawRow(entry("P.md", { type: "project", start: "2026-10-05" }))],
      { showCompleted: false },
    );
    expect(model.needsDates[0]?.reason).toBe("missing target date");
  });

  it("reports both missing dates explicitly", () => {
    const project = modelFor([entry("P.md", { type: "project" })]).projects[0];
    expect(project).toBeDefined();
    if (project) {
      expect(needsDatesReason(project)).toBe("missing start and target dates");
    }
  });

  it("uses the resolveLink hook for milestone parents", () => {
    const entries = [
      entry("Projects/Alfa.md", {
        type: "project",
        status: "active",
        start: "2026-10-05",
        target: "2026-10-20",
      }),
      entry("Milestones/M1.md", {
        type: "milestone",
        parent_project: "[[Any Alias]]",
        target: "2026-10-10",
      }),
    ];
    const model = buildDashboard(entries.map(entryToRawRow), {
      showCompleted: false,
      resolveLink: (linkText) => (linkText === "Any Alias" ? "Projects/Alfa.md" : null),
    });
    expect(model.warnings).toHaveLength(0);
    expect(model.projects[0]?.milestones[0]?.name).toBe("M1");
  });

  it("falls back to basename matching when a link cannot be resolved", () => {
    const entries = [
      entry("Projects/Alfa.md", {
        type: "project",
        status: "active",
        start: "2026-10-05",
        target: "2026-10-20",
      }),
      entry("Milestones/M1.md", {
        type: "milestone",
        parent_project: "[[alfa]]",
        target: "2026-10-10",
      }),
    ];
    const model = buildDashboard(entries.map(entryToRawRow), { showCompleted: false });
    expect(model.projects[0]?.milestones).toHaveLength(1);
  });

  it("reveals completed and cancelled projects when asked", () => {
    const model = modelFor(demoEntries(), true);
    const names = model.timeline.map((item) => item.project.name);
    expect(names).toContain("Summer open house");
    expect(names).toContain("Second launch ramp");
    expect(model.hiddenCount).toBe(0);
  });

  it("flags an empty dataset", () => {
    const model = buildDashboard([], { showCompleted: false });
    expect(model.isEmptyDataset).toBe(true);
    expect(model.timeline).toHaveLength(0);
  });

  it("maps categories with finish-first precedence and closed fallbacks", () => {
    expect(categoryOf("active", "finish-first")).toBe("finish-first");
    expect(categoryOf("active", null)).toBe("active");
    expect(categoryOf("scheduled", null)).toBe("scheduled");
    expect(categoryOf("defining", null)).toBe("defining");
    expect(categoryOf("complete", null)).toBe("complete");
    expect(categoryOf("cancelled", null)).toBe("closed");
    expect(categoryOf(null, null)).toBe("neutral");
  });
});

describe("closed outcomes and deliberately unscheduled projects", () => {
  it("preserves a missed cancellation without warnings or an active timeline bar", () => {
    const entries = [
      entry("Closed contest.md", {
        type: "project",
        status: "cancelled",
        schedule_state: "missed",
        start: "2026-10-17",
        target: "2026-11-15",
        progress: 0,
      }),
      entry("Unfinished draft.md", {
        type: "milestone",
        parent_project: "[[Closed contest]]",
        target: "2026-11-05",
        status: "scheduled",
      }),
    ];
    const hidden = modelFor(entries);
    expect(hidden.timeline).toHaveLength(0);
    expect(hidden.needsDates).toHaveLength(0);
    expect(hidden.warnings).toEqual([]);
    expect(hidden.hiddenCount).toBe(2);
    expect(hidden.projects[0]?.scheduleState).toBe("missed");
    expect(hidden.projects[0]?.progress).toBe(0);
    expect(hidden.projects[0]?.milestones).toHaveLength(1);
    const revealed = modelFor(entries, true);
    expect(revealed.timeline).toHaveLength(1);
    expect(categoryOf(revealed.projects[0]?.status ?? null, null)).toBe("closed");
    expect(revealed.warnings).toEqual([]);
  });

  it.each(["defining", "waiting", "paused"])(
    "lists an undated proposed %s project as unscheduled without inventing dates",
    (status) => {
      const model = modelFor([
        entry("Parked robot.md", {
          type: "project",
          status,
          schedule_state: "proposed",
          start: "",
          target: "",
        }),
      ]);
      expect(model.unscheduled).toHaveLength(1);
      expect(model.unscheduled[0]?.start).toBeNull();
      expect(model.unscheduled[0]?.target).toBeNull();
      expect(model.needsDates).toEqual([]);
      expect(model.timeline).toEqual([]);
      expect(model.warnings).toEqual([]);
      expect(model.hiddenCount).toBe(0);
    },
  );

  it.each([
    { status: "active", schedule_state: "proposed" },
    { status: "scheduled", schedule_state: "proposed" },
    { status: "waiting", schedule_state: "committed" },
    { status: "waiting", schedule_state: "unknown" },
    { status: "waiting", schedule_state: "proposed", start: "2026-11-20" },
    { status: "waiting", schedule_state: "proposed", target: "2026-12-20" },
    { status: "waiting", schedule_state: "proposed", start: "someday" },
    { status: "waiting", schedule_state: "proposed", target: "2026-02-30" },
  ])("keeps real scheduling problems visible: %j", (values) => {
    const model = modelFor([entry("Needs planning.md", { type: "project", ...values })]);
    expect(model.unscheduled).toEqual([]);
    expect(model.needsDates).toHaveLength(1);
    if (values.start === "someday" || values.target === "2026-02-30") {
      expect(model.warnings.some((warning) => warning.kind === "invalid-date")).toBe(true);
    }
  });

  it("places a proposed parked project on the timeline once real dates exist", () => {
    const model = modelFor([
      entry("Robot.md", {
        type: "project",
        status: "waiting",
        schedule_state: "proposed",
        start: "2026-12-01",
        target: "2026-12-20",
      }),
    ]);
    expect(model.unscheduled).toEqual([]);
    expect(model.timeline).toHaveLength(1);
  });
});
