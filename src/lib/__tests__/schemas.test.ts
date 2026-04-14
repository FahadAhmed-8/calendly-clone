import { describe, it, expect } from "vitest";
import {
  createBookingSchema,
  createEventTypeSchema,
  rescheduleBookingSchema,
  availabilityRuleSchema,
  putQuestionsSchema,
} from "../schemas";

describe("createEventTypeSchema", () => {
  it("accepts a valid payload", () => {
    const ok = createEventTypeSchema.safeParse({
      name: "30 Minute Meeting",
      slug: "30min",
      durationMinutes: 30,
      color: "#0054cc",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a bad slug (uppercase)", () => {
    const bad = createEventTypeSchema.safeParse({
      name: "X",
      slug: "BadSlug",
      durationMinutes: 30,
    });
    expect(bad.success).toBe(false);
  });

  it("rejects a non-positive duration", () => {
    const bad = createEventTypeSchema.safeParse({
      name: "X",
      slug: "ok",
      durationMinutes: 0,
    });
    expect(bad.success).toBe(false);
  });
});

describe("createBookingSchema", () => {
  const base = {
    eventTypeId: "11111111-1111-1111-1111-111111111111",
    startUtc: "2026-06-10T10:00:00.000Z",
    inviteeName: "Fhd",
    inviteeEmail: "fhd@example.com",
    inviteeTimezone: "Asia/Kolkata",
  };

  it("accepts minimal payload and defaults answers to []", () => {
    const parsed = createBookingSchema.parse(base);
    expect(parsed.answers).toEqual([]);
  });

  it("rejects invalid email", () => {
    const bad = createBookingSchema.safeParse({ ...base, inviteeEmail: "nope" });
    expect(bad.success).toBe(false);
  });

  it("rejects non-ISO startUtc", () => {
    const bad = createBookingSchema.safeParse({ ...base, startUtc: "tomorrow" });
    expect(bad.success).toBe(false);
  });
});

describe("rescheduleBookingSchema", () => {
  it("requires a non-empty token", () => {
    const bad = rescheduleBookingSchema.safeParse({ token: "", startUtc: "2026-06-10T10:00:00.000Z" });
    expect(bad.success).toBe(false);
  });
});

describe("availabilityRuleSchema", () => {
  it("accepts HH:mm times", () => {
    expect(
      availabilityRuleSchema.safeParse({ weekday: 1, startTime: "09:00", endTime: "17:00" }).success,
    ).toBe(true);
  });

  it("rejects malformed times", () => {
    expect(
      availabilityRuleSchema.safeParse({ weekday: 1, startTime: "9:00", endTime: "17:00" }).success,
    ).toBe(false);
  });

  it("rejects weekday out of range", () => {
    expect(
      availabilityRuleSchema.safeParse({ weekday: 7, startTime: "09:00", endTime: "17:00" }).success,
    ).toBe(false);
  });
});

describe("putQuestionsSchema", () => {
  it("accepts a text question without options", () => {
    const ok = putQuestionsSchema.safeParse({
      questions: [{ label: "Phone number", type: "text", required: true, position: 0 }],
    });
    expect(ok.success).toBe(true);
  });

  it("rejects empty label", () => {
    const bad = putQuestionsSchema.safeParse({
      questions: [{ label: "", type: "text", position: 0 }],
    });
    expect(bad.success).toBe(false);
  });
});
