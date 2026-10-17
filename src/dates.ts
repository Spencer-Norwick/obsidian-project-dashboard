/**
 * Local calendar date helpers.
 *
 * Every date in this plugin is a plain calendar date (year, month, day). Dates
 * are never constructed from strings with `new Date("YYYY-MM-DD")` and never
 * converted through `toISOString()`, because both would shift the day across
 * time zones. Day arithmetic uses `Date.UTC(...)` purely as a linear day
 * counter for civil dates, which is time-zone independent.
 */

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const MS_PER_DAY = 86_400_000;

export const MONTHS_SHORT = [
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
  "Dec",
] as const;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
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

export function isValidCalendarDate(date: CalendarDate): boolean {
  if (!Number.isInteger(date.year) || date.year < 1000 || date.year > 9999) return false;
  if (!Number.isInteger(date.month) || date.month < 1 || date.month > 12) return false;
  if (
    !Number.isInteger(date.day) ||
    date.day < 1 ||
    date.day > daysInMonth(date.year, date.month)
  ) {
    return false;
  }
  return true;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/**
 * Parses `YYYY-MM-DD` (optionally followed by a time component, which is
 * ignored) or a JS `Date` into a calendar date. Returns `null` when the input
 * is not a usable local calendar date.
 */
export function parseCalendarDate(value: unknown): CalendarDate | null {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const date = {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    };
    return isValidCalendarDate(date) ? date : null;
  }

  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(value.trim());
    if (!match) return null;
    const date = {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
    return isValidCalendarDate(date) ? date : null;
  }

  if (typeof value === "object") {
    const candidate = value as Partial<CalendarDate>;
    if (
      typeof candidate.year === "number" &&
      typeof candidate.month === "number" &&
      typeof candidate.day === "number"
    ) {
      const date = {
        year: candidate.year,
        month: candidate.month,
        day: candidate.day,
      };
      return isValidCalendarDate(date) ? date : null;
    }
  }

  return null;
}

/** Linear day counter for civil dates; UTC is used only as a fixed-epoch counter. */
export function dayIndex(date: CalendarDate): number {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / MS_PER_DAY);
}

export function fromDayIndex(index: number): CalendarDate {
  const date = new Date(index * MS_PER_DAY);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayIndex(dayIndex(date) + days);
}

export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const total = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  const day = Math.min(date.day, daysInMonth(year, month));
  return { year, month, day };
}

export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return dayIndex(to) - dayIndex(from);
}

export function compareDates(a: CalendarDate, b: CalendarDate): number {
  return dayIndex(a) - dayIndex(b);
}

export function sameDate(a: CalendarDate, b: CalendarDate): boolean {
  return dayIndex(a) === dayIndex(b);
}

/** Monday-based start of week. */
export function startOfWeek(date: CalendarDate): CalendarDate {
  const weekday = new Date(dayIndex(date) * MS_PER_DAY).getUTCDay(); // 0 = Sunday
  const offset = (weekday + 6) % 7;
  return addDays(date, -offset);
}

export function startOfMonth(date: CalendarDate): CalendarDate {
  return { year: date.year, month: date.month, day: 1 };
}

export function endOfMonth(date: CalendarDate): CalendarDate {
  return { year: date.year, month: date.month, day: daysInMonth(date.year, date.month) };
}

export function formatISO(date: CalendarDate): string {
  return `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`;
}

export function formatShort(date: CalendarDate): string {
  return `${MONTHS_SHORT[date.month - 1]} ${date.day}`;
}

export function formatLong(date: CalendarDate): string {
  return `${MONTHS_SHORT[date.month - 1]} ${date.day}, ${date.year}`;
}

export function formatMonthYear(date: CalendarDate): string {
  return `${MONTHS_SHORT[date.month - 1]} ${date.year}`;
}

/** Today as a local calendar date, using local calendar fields only. */
export function todayLocal(now: Date = new Date()): CalendarDate {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}
