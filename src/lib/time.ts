import { addMinutes, format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isSameDay } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

export { format, addMinutes, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, isSameDay };
export { formatInTimeZone, fromZonedTime, toZonedTime };

/** Returns "HH:mm" in a given timezone for a UTC Date. */
export function hhmm(date: Date, tz: string) {
  return formatInTimeZone(date, tz, "HH:mm");
}

/** Parse "HH:mm" -> {h, m}. */
export function parseHHmm(s: string): { h: number; m: number } {
  const [h, m] = s.split(":").map(Number);
  return { h, m };
}

/** Given a calendar date (ISO "YYYY-MM-DD") and a time "HH:mm" in tz, return UTC Date. */
export function zonedDateTime(dateISO: string, timeHHmm: string, tz: string): Date {
  return fromZonedTime(`${dateISO}T${timeHHmm}:00`, tz);
}

/** Get weekday (0..6, Sun=0) for a Date in a timezone. */
export function zonedWeekday(date: Date, tz: string): number {
  // "i" = ISO day-of-week: 1=Mon..7=Sun (locale-independent).
  const iso = Number(formatInTimeZone(date, tz, "i"));
  return iso === 7 ? 0 : iso; // Sun(7)->0, Mon(1)->1, ..., Sat(6)->6
}

/** Common IANA timezones (short list for the select UI). */
export const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];
