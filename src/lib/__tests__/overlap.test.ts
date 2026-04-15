import { describe, it, expect } from "vitest";
import { overlapsAnyWithBuffers, intervalsOverlap, expandWithBuffers } from "../overlap";

const at = (iso: string) => new Date(iso);
const interval = (s: string, e: string) => ({ startUtc: at(s), endUtc: at(e) });

describe("intervalsOverlap", () => {
  it("is true for overlapping intervals", () => {
    const a = interval("2026-04-16T10:00:00Z", "2026-04-16T11:00:00Z");
    const b = interval("2026-04-16T10:30:00Z", "2026-04-16T11:30:00Z");
    expect(intervalsOverlap(a, b)).toBe(true);
  });

  it("is false for touching-but-not-overlapping intervals", () => {
    const a = interval("2026-04-16T10:00:00Z", "2026-04-16T11:00:00Z");
    const b = interval("2026-04-16T11:00:00Z", "2026-04-16T12:00:00Z");
    expect(intervalsOverlap(a, b)).toBe(false);
  });

  it("is false for fully disjoint intervals", () => {
    const a = interval("2026-04-16T10:00:00Z", "2026-04-16T11:00:00Z");
    const b = interval("2026-04-16T13:00:00Z", "2026-04-16T14:00:00Z");
    expect(intervalsOverlap(a, b)).toBe(false);
  });
});

describe("expandWithBuffers", () => {
  it("pads start by bufferBefore and end by bufferAfter", () => {
    const x = expandWithBuffers(
      interval("2026-04-16T10:00:00Z", "2026-04-16T10:30:00Z"),
      { bufferBeforeMinutes: 15, bufferAfterMinutes: 10 },
    );
    expect(x.startUtc.toISOString()).toBe("2026-04-16T09:45:00.000Z");
    expect(x.endUtc.toISOString()).toBe("2026-04-16T10:40:00.000Z");
  });
});

describe("overlapsAnyWithBuffers", () => {
  const cfg = { bufferBeforeMinutes: 15, bufferAfterMinutes: 15 };

  it("rejects a booking that starts inside the buffer window of an existing booking", () => {
    // Existing 10:00-10:30, with 15m buffer each side the guarded range is 09:45-10:45.
    // A new 10:40-11:10 would have been allowed without buffers but must be rejected with them.
    const candidate = interval("2026-04-16T10:40:00Z", "2026-04-16T11:10:00Z");
    const existing = [interval("2026-04-16T10:00:00Z", "2026-04-16T10:30:00Z")];
    expect(overlapsAnyWithBuffers(candidate, existing, cfg)).toBe(true);
  });

  it("allows a booking that sits outside both buffers", () => {
    // Existing 10:00-10:30 (+15m = guards to 10:45). New 11:00-11:30 (-15m = starts from 10:45). No overlap.
    const candidate = interval("2026-04-16T11:00:00Z", "2026-04-16T11:30:00Z");
    const existing = [interval("2026-04-16T10:00:00Z", "2026-04-16T10:30:00Z")];
    expect(overlapsAnyWithBuffers(candidate, existing, cfg)).toBe(false);
  });

  it("reduces to plain overlap when both buffers are zero", () => {
    const zero = { bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };
    // Back-to-back is NOT overlap.
    expect(
      overlapsAnyWithBuffers(
        interval("2026-04-16T10:30:00Z", "2026-04-16T11:00:00Z"),
        [interval("2026-04-16T10:00:00Z", "2026-04-16T10:30:00Z")],
        zero,
      ),
    ).toBe(false);
    // Actually overlapping.
    expect(
      overlapsAnyWithBuffers(
        interval("2026-04-16T10:15:00Z", "2026-04-16T10:45:00Z"),
        [interval("2026-04-16T10:00:00Z", "2026-04-16T10:30:00Z")],
        zero,
      ),
    ).toBe(true);
  });

  it("returns false with no existing bookings", () => {
    expect(
      overlapsAnyWithBuffers(
        interval("2026-04-16T10:00:00Z", "2026-04-16T10:30:00Z"),
        [],
        cfg,
      ),
    ).toBe(false);
  });
});
