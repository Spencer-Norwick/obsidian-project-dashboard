import {
  type CalendarDate,
  addDays,
  addMonths,
  compareDates,
  dayIndex,
  daysBetween,
  formatMonthYear,
  formatShort,
  startOfMonth,
  startOfWeek,
  endOfMonth,
} from "./dates";
import type { TimelineItem } from "./model";

export type ScaleOption = "automatic" | "weeks" | "months";
export type ScaleMode = "weeks" | "months";

export const WEEKS_PX_PER_DAY = 14;
export const MONTHS_PX_PER_DAY = 5;
export const WEEKS_MAX_SPAN_DAYS = 84;
export const TODAY_EXPAND_GAP_DAYS = 60;
export const MIN_BAR_WIDTH = 10;

export interface ScaleTick {
  index: number;
  x: number;
  label: string;
  major: boolean;
}

export interface DateRange {
  start: CalendarDate;
  end: CalendarDate;
}

export interface TimelineScale {
  mode: ScaleMode;
  start: CalendarDate;
  end: CalendarDate;
  startIndex: number;
  totalDays: number;
  pxPerDay: number;
  width: number;
  ticks: ScaleTick[];
}

export function isScaleOption(value: unknown): value is ScaleOption {
  return value === "automatic" || value === "weeks" || value === "months";
}

export function coerceScaleOption(value: unknown): ScaleOption {
  return isScaleOption(value) ? value : "automatic";
}

/**
 * The visible range of the timeline: the data's own span (bars plus any
 * milestone dates that must stay visible), extended to include "today" only
 * when today is at most `TODAY_EXPAND_GAP_DAYS` away from it.
 */
export function rangeForItems(
  items: TimelineItem[],
  extraDates: CalendarDate[],
  today: CalendarDate,
): DateRange | null {
  if (items.length === 0) return null;
  let start = items[0]?.start;
  let end = items[0]?.target;
  for (const item of items) {
    if (start === undefined || compareDates(item.start, start) < 0) start = item.start;
    if (end === undefined || compareDates(item.target, end) > 0) end = item.target;
  }
  for (const date of extraDates) {
    if (start === undefined || compareDates(date, start) < 0) start = date;
    if (end === undefined || compareDates(date, end) > 0) end = date;
  }
  if (start === undefined || end === undefined) return null;

  if (compareDates(today, start) < 0) {
    if (daysBetween(today, start) <= TODAY_EXPAND_GAP_DAYS) start = today;
  } else if (compareDates(today, end) > 0) {
    if (daysBetween(end, today) <= TODAY_EXPAND_GAP_DAYS) end = today;
  }
  return { start, end };
}

function chooseMode(spanDays: number, option: ScaleOption): ScaleMode {
  if (option === "weeks" || option === "months") return option;
  return spanDays <= WEEKS_MAX_SPAN_DAYS ? "weeks" : "months";
}

function weekTicks(
  paddedStart: CalendarDate,
  paddedEnd: CalendarDate,
  pxPerDay: number,
): ScaleTick[] {
  const ticks: ScaleTick[] = [];
  const endIndex = dayIndex(paddedEnd);
  let cursor = paddedStart;
  while (dayIndex(cursor) <= endIndex) {
    const weekEnd = addDays(cursor, 6);
    const containsMonthStart =
      cursor.month !== weekEnd.month ||
      cursor.day === 1 ||
      dayIndex(cursor) === dayIndex(paddedStart);
    ticks.push({
      index: dayIndex(cursor),
      x: (dayIndex(cursor) - dayIndex(paddedStart)) * pxPerDay,
      label: formatShort(cursor),
      major: containsMonthStart,
    });
    cursor = addDays(cursor, 7);
  }
  return ticks;
}

function monthTicks(
  paddedStart: CalendarDate,
  paddedEnd: CalendarDate,
  pxPerDay: number,
): ScaleTick[] {
  const ticks: ScaleTick[] = [];
  const endIndex = dayIndex(paddedEnd);
  let cursor = startOfMonth(paddedStart);
  let first = true;
  while (dayIndex(cursor) <= endIndex) {
    const showYear = first || cursor.month === 1;
    ticks.push({
      index: dayIndex(cursor),
      x: (dayIndex(cursor) - dayIndex(paddedStart)) * pxPerDay,
      label: showYear ? formatMonthYear(cursor) : formatShort(cursor).replace(/ \d+$/, ""),
      major: true,
    });
    first = false;
    cursor = addMonths(cursor, 1);
  }
  return ticks;
}

export function buildScale(
  range: DateRange,
  option: ScaleOption,
  _today: CalendarDate,
): TimelineScale {
  const spanDays = daysBetween(range.start, range.end) + 1;
  const mode = chooseMode(spanDays, option);
  const pxPerDay = mode === "weeks" ? WEEKS_PX_PER_DAY : MONTHS_PX_PER_DAY;

  const paddedStart = mode === "weeks" ? startOfWeek(range.start) : startOfMonth(range.start);
  const paddedEnd = mode === "weeks" ? addDays(startOfWeek(range.end), 6) : endOfMonth(range.end);

  const startIndex = dayIndex(paddedStart);
  const totalDays = daysBetween(paddedStart, paddedEnd) + 1;
  const ticks =
    mode === "weeks"
      ? weekTicks(paddedStart, paddedEnd, pxPerDay)
      : monthTicks(paddedStart, paddedEnd, pxPerDay);

  return {
    mode,
    start: paddedStart,
    end: paddedEnd,
    startIndex,
    totalDays,
    pxPerDay,
    width: totalDays * pxPerDay,
    ticks,
  };
}

export function xForDate(scale: TimelineScale, date: CalendarDate): number {
  return (dayIndex(date) - scale.startIndex) * scale.pxPerDay;
}

export function xForDateCenter(scale: TimelineScale, date: CalendarDate): number {
  return xForDate(scale, date) + scale.pxPerDay / 2;
}

export function containsDate(scale: TimelineScale, date: CalendarDate): boolean {
  const index = dayIndex(date);
  return index >= scale.startIndex && index < scale.startIndex + scale.totalDays;
}

export interface BarRect {
  left: number;
  width: number;
}

export function barRect(scale: TimelineScale, start: CalendarDate, target: CalendarDate): BarRect {
  const left = xForDate(scale, start);
  const days = daysBetween(start, target) + 1;
  const width = Math.max(MIN_BAR_WIDTH, days * scale.pxPerDay);
  return { left, width };
}
