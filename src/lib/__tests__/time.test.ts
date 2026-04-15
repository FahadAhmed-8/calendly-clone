import { describe, it, expect } from "vitest";
import { zonedDateTime, zonedWeekday, parseHHmm, hhmm, formatLocalDate } from "../time";

describe("parseHHmm", () => {
  it("parses a valid HH:mm string", () => {
    expect(parseHHmm("09:30")).toEqual({ h: 9, m: 30 });
    expect(parseHHmm("23:59")).toEqual({ h: 23, m: 59 });
  });
});

describe("zonedDateTime", () => {
  it("converts a local wall-clock time to UTC", () => {
    // 09:00 in Asia/Kolkata (UTC+5:30) === 03:30 UTC
    const d = zonedDateTime("2026-06-10", "09:00", "Asia/Kolkata");
    expect(d.toISOString()).toBe("2026-06-10T03:30:00.000Z");
  });

  it("handles DST correctly in America/New_York", () => {
    // After DST starts (Mar 8, 2026): 09:00 EDT = 13:00 UTC
    const afterDst = zonedDateTime("2026-06-10", "09:00", "America/New_York");
    expect(afterDst.toISOString()).toBe("2026-06-10T13:00:00.000Z");
    // Before DST starts (Jan 10, 2026): 09:00 EST = 14:00 UTC
    const beforeDst = zonedDateTime("2026-01-10", "09:00", "America/New_York");
    expect(beforeDst.toISOString()).toBe("2026-01-10T14:00:00.000Z");
  });
});

describe("zonedWeekday", () => {
  it("returns Sun=0..Sat=6 in the given tz", () => {
    // 2026-04-15 is a Wednesday (UTC)
    const wed = new Date("2026-04-15T12:00:00Z");
    expect(zonedWeekday(wed, "UTC")).toBe(3);
  });

  it("can flip the weekday across a tz boundary", () => {
    // 2026-04-15 23:00 UTC is still Wed in UTC but Thu in Asia/Kolkata
    const d = new Date("2026-04-15T23:00:00Z");
    expect(zonedWeekday(d, "UTC")).toBe(3);
    expect(zonedWeekday(d, "Asia/Kolkata")).toBe(4);
  });
});

describe("hhmm", () => {
  it("formats a UTC date in a target tz", () => {
    const d = new Date("2026-06-10T03:30:00Z");
    expect(hhmm(d, "Asia/Kolkata")).toBe("09:00");
  });
});

describe("formatLocalDate", () => {
  it("returns YYYY-MM-DD using LOCAL calendar fields (not UTC)", () => {
    // Construct a local-midnight Date the same way MonthCalendar does.
    const d = new Date(2026, 3, 16, 0, 0, 0, 0); // Apr is month 3 (0-indexed)
    expect(formatLocalDate(d)).toBe("2026-04-16");
  });

  it("zero-pads single-digit months and days", () => {
    const d = new Date(2026, 0, 5, 9, 30);
    expect(formatLocalDate(d)).toBe("2026-01-05");
  });

  it("is stable for a local-midnight date regardless of host tz offset", () => {
    // This is the specific class of bug we regressed: for users east of UTC,
    // a local-midnight Date serialised via toISOString() rolls back one day.
    // formatLocalDate uses local fields, so the output matches what the user
    // clicked on the calendar (in any tz the test happens to run in).
    const d = new Date(2026, 11, 31, 0, 0, 0, 0);
    expect(formatLocalDate(d)).toBe("2026-12-31");
  });
});
