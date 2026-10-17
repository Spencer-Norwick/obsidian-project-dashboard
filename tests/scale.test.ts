import { describe, expect, it } from "vitest";
import { entryToRawRow, type EntryLike } from "../src/adapter";
import { buildDashboard } from "../src/model";
import {
  MIN_BAR_WIDTH,
  buildScale,
  barRect,
  containsDate,
  rangeForItems,
  xForDate,
  xForDateCenter,
} from "../src/scale";

const TODAY = { year: 2026, month: 10, day: 16 };

function timelineFor(entries: EntryLike[]) {
  return buildDashboard(entries.map(entryToRawRow), { showCompleted: false }).timeline;
}

function project(name: string, start: string, target: string): EntryLike {
  return {
    file: { path: `Projects/${name}.md`, basename: name, name: `${name}.md` },
    getValue: (propertyId: string) => {
      const key = propertyId.startsWith("note.") ? propertyId.slice("note.".length) : propertyId;
      const raw =
        key === "type"
          ? "project"
          : key === "status"
            ? "active"
            : key === "start"
              ? start
              : key === "target"
                ? target
                : undefined;
      if (raw === undefined) return null;
      return { toString: () => String(raw), isTruthy: () => true };
    },
  };
}

describe("scale selection", () => {
  const shortRange = {
    start: { year: 2026, month: 10, day: 5 },
    end: { year: 2026, month: 11, day: 13 },
  };
  const longRange = {
    start: { year: 2026, month: 10, day: 5 },
    end: { year: 2027, month: 1, day: 15 },
  };

  it("switches to months automatically for long ranges", () => {
    expect(buildScale(shortRange, "automatic", TODAY).mode).toBe("weeks");
    expect(buildScale(longRange, "automatic", TODAY).mode).toBe("months");
  });

  it("honors explicit scale choices even for long ranges", () => {
    expect(buildScale(longRange, "weeks", TODAY).mode).toBe("weeks");
    expect(buildScale(shortRange, "months", TODAY).mode).toBe("months");
  });
});

describe("week scale geometry", () => {
  const range = {
    start: { year: 2026, month: 10, day: 5 },
    end: { year: 2026, month: 11, day: 13 },
  };
  const scale = buildScale(range, "weeks", TODAY);

  it("pads to whole weeks (Monday start, Sunday end)", () => {
    expect(scale.start).toEqual({ year: 2026, month: 10, day: 5 });
    expect(scale.end).toEqual({ year: 2026, month: 11, day: 15 });
    expect(scale.totalDays).toBe(42);
    expect(scale.width).toBe(588);
  });

  it("emits one tick per week with date labels", () => {
    expect(scale.ticks).toHaveLength(6);
    expect(scale.ticks[0]?.label).toBe("Oct 5");
    expect(scale.ticks[1]?.label).toBe("Oct 12");
    expect(scale.ticks[1]?.x).toBe(98);
  });

  it("computes bar rects from start and target only", () => {
    const rect = barRect(
      scale,
      { year: 2026, month: 10, day: 5 },
      { year: 2026, month: 11, day: 13 },
    );
    expect(rect.left).toBe(0);
    expect(rect.width).toBe(560);
  });

  it("enforces a minimum visible bar width", () => {
    const rect = barRect(
      scale,
      { year: 2026, month: 10, day: 5 },
      { year: 2026, month: 10, day: 5 },
    );
    expect(rect.width).toBe(14);
    const months = buildScale(range, "months", TODAY);
    const singleDay = barRect(
      months,
      { year: 2026, month: 10, day: 5 },
      { year: 2026, month: 10, day: 5 },
    );
    expect(singleDay.width).toBe(MIN_BAR_WIDTH);
  });

  it("places the today marker inside the padded range", () => {
    expect(containsDate(scale, TODAY)).toBe(true);
    expect(xForDate(scale, TODAY)).toBe(154);
    expect(xForDateCenter(scale, { year: 2026, month: 10, day: 24 })).toBe(273);
  });
});

describe("month scale geometry", () => {
  const range = {
    start: { year: 2026, month: 10, day: 5 },
    end: { year: 2027, month: 1, day: 15 },
  };
  const scale = buildScale(range, "months", TODAY);

  it("pads to whole months", () => {
    expect(scale.start).toEqual({ year: 2026, month: 10, day: 1 });
    expect(scale.end).toEqual({ year: 2027, month: 1, day: 31 });
    expect(scale.totalDays).toBe(123);
    expect(scale.width).toBe(615);
  });

  it("labels months, adding the year at the start and on the year boundary", () => {
    expect(scale.ticks.map((tick) => tick.label)).toEqual(["Oct 2026", "Nov", "Dec", "Jan 2027"]);
    expect(scale.ticks.map((tick) => tick.x)).toEqual([0, 155, 305, 460]);
  });
});

describe("range for items", () => {
  it("extends to today when it is close, and not when it is far", () => {
    const near = timelineFor([project("Near", "2026-11-01", "2026-11-20")]);
    const nearRange = rangeForItems(near, [], TODAY);
    expect(nearRange?.start).toEqual(TODAY);
    expect(nearRange?.end).toEqual({ year: 2026, month: 11, day: 20 });

    const far = timelineFor([project("Far", "2027-03-01", "2027-03-10")]);
    const farRange = rangeForItems(far, [], TODAY);
    expect(farRange?.start).toEqual({ year: 2027, month: 3, day: 1 });
  });

  it("includes extra milestone dates inside the range", () => {
    const items = timelineFor([project("Core", "2026-11-01", "2026-11-10")]);
    const range = rangeForItems(items, [{ year: 2026, month: 12, day: 20 }], TODAY);
    expect(range?.end).toEqual({ year: 2026, month: 12, day: 20 });
  });

  it("returns null for an empty timeline", () => {
    expect(rangeForItems([], [], TODAY)).toBeNull();
  });
});
