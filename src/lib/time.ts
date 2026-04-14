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
  const formatted = formatInTimeZone(date, tz, "e"); // 1=Mon..7=Sun (ISO week, date-fns-tz)
  // Convert ISO (1..7) where 1=Mon to Sun=0..Sat=6
  const iso = Number(formatted);
  return iso === 7 ? 0 : iso;
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
