import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  dayIndex,
  formatISO,
  formatShort,
  fromDayIndex,
  parseCalendarDate,
  startOfMonth,
  startOfWeek,
  todayLocal,
} from "../src/dates";

describe("parseCalendarDate", () => {
  it("parses plain dates and datetimes as the same calendar day", () => {
    expect(parseCalendarDate("2026-10-12")).toEqual({ year: 2026, month: 10, day: 12 });
    expect(parseCalendarDate("2026-10-12T23:59:59")).toEqual({ year: 2026, month: 10, day: 12 });
    expect(parseCalendarDate("2026-10-12 07:30")).toEqual({ year: 2026, month: 10, day: 12 });
    expect(parseCalendarDate("2026-1-5")).toEqual({ year: 2026, month: 1, day: 5 });
  });

  it("rejects impossible and non-date input", () => {
    expect(parseCalendarDate("2026-13-01")).toBeNull();
    expect(parseCalendarDate("2026-02-30")).toBeNull();
    expect(parseCalendarDate("2026-02-29")).toBeNull();
    expect(parseCalendarDate("2028-02-29")).toEqual({ year: 2028, month: 2, day: 29 });
    expect(parseCalendarDate("next tuesday")).toBeNull();
    expect(parseCalendarDate("")).toBeNull();
    expect(parseCalendarDate(null)).toBeNull();
    expect(parseCalendarDate(42)).toBeNull();
  });

  it("never shifts a day across time zones", () => {
    const originalTz = process.env.TZ;
    try {
      for (const tz of ["America/Los_Angeles", "Asia/Tokyo", "UTC", "Pacific/Kiritimati"]) {
        process.env.TZ = tz;
        const lateEvening = new Date(2026, 9, 12, 23, 30);
        const earlyMorning = new Date(2026, 9, 12, 0, 15);
        expect(parseCalendarDate(lateEvening)).toEqual({ year: 2026, month: 10, day: 12 });
        expect(parseCalendarDate(earlyMorning)).toEqual({ year: 2026, month: 10, day: 12 });
      }
    } finally {
      process.env.TZ = originalTz;
    }
  });
});

describe("calendar arithmetic", () => {
  it("round-trips through the day index", () => {
    const date = { year: 2026, month: 11, day: 13 };
    expect(fromDayIndex(dayIndex(date))).toEqual(date);
    expect(addDays(date, 0)).toEqual(date);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays({ year: 2026, month: 10, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 11,
      day: 1,
    });
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
    expect(addDays({ year: 2027, month: 1, day: 1 }, -1)).toEqual({
      year: 2026,
      month: 12,
      day: 31,
    });
  });

  it("adds months with end-of-month clamping", () => {
    expect(addMonths({ year: 2027, month: 1, day: 31 }, 1)).toEqual({
      year: 2027,
      month: 2,
      day: 28,
    });
    expect(addMonths({ year: 2028, month: 1, day: 31 }, 1)).toEqual({
      year: 2028,
      month: 2,
      day: 29,
    });
    expect(addMonths({ year: 2026, month: 12, day: 15 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 15,
    });
  });

  it("computes Monday-based week starts", () => {
    // 2026-10-16 is a Friday.
    expect(startOfWeek({ year: 2026, month: 10, day: 16 })).toEqual({
      year: 2026,
      month: 10,
      day: 12,
    });
    expect(startOfWeek({ year: 2026, month: 10, day: 12 })).toEqual({
      year: 2026,
      month: 10,
      day: 12,
    });
    expect(startOfWeek({ year: 2026, month: 10, day: 18 })).toEqual({
      year: 2026,
      month: 10,
      day: 12,
    });
  });

  it("formats dates without locale-dependent shifts", () => {
    expect(formatISO({ year: 2026, month: 10, day: 5 })).toBe("2026-10-05");
    expect(formatShort({ year: 2026, month: 10, day: 5 })).toBe("Oct 5");
    expect(startOfMonth({ year: 2026, month: 10, day: 16 })).toEqual({
      year: 2026,
      month: 10,
      day: 1,
    });
  });

  it("builds today from local fields", () => {
    const local = new Date(2026, 9, 16, 23, 59);
    expect(todayLocal(local)).toEqual({ year: 2026, month: 10, day: 16 });
  });
});
