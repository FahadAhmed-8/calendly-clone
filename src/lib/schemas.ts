import { z } from "zod";

export const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

// Strict 24h HH:mm — rejects "25:99", "9:00", etc. The previous /^\d{2}:\d{2}$/
// let through invalid wall-clocks that later blew up inside date-fns-tz.
export const hhmmRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
export const hhmmSchema = z.string().regex(hhmmRegex, "Time must be HH:mm in 24h format (00:00-23:59)");

export const createEventTypeSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(slugRegex, "Slug must be lowercase letters, numbers, and dashes."),
  durationMinutes: z.number().int().positive().max(600),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  active: z.boolean().optional(),
  bufferBeforeMinutes: z.number().int().min(0).max(240).optional(),
  bufferAfterMinutes: z.number().int().min(0).max(240).optional(),
  scheduleId: z.string().uuid().nullable().optional(),
});

// availability* schemas refine start<end so we don't need to duplicate the
// check in every route handler. Empty ranges like 10:00-10:00 are also rejected.
export const availabilityBlockSchema = z
  .object({ start: hhmmSchema, end: hhmmSchema })
  .refine((b) => b.start < b.end, { message: "End time must be after start time", path: ["end"] });

export const availabilityRuleSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startTime: hhmmSchema,
    endTime: hhmmSchema,
  })
  .refine((r) => r.startTime < r.endTime, { message: "End time must be after start time", path: ["endTime"] });

export const dateOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocks: z.array(availabilityBlockSchema),
});

export const updateAvailabilitySchema = z.object({
  timezone: z.string().min(1),
  rules: z.array(availabilityRuleSchema),
  overrides: z.array(dateOverrideSchema).optional().default([]),
});

export const createBookingSchema = z.object({
  eventTypeId: z.string().uuid(),
  startUtc: z.string().datetime(),
  inviteeName: z.string().min(1).max(120),
  inviteeEmail: z.string().email(),
  inviteeTimezone: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
  answers: z.array(z.object({ questionId: z.string(), answer: z.string() })).optional().default([]),
});

export const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tz: z.string().min(1),
});

export const cancelBookingSchema = z.object({
  token: z.string().optional(),
  reason: z.string().max(500).optional().nullable(),
});

// --- Schedules ---
export const createScheduleSchema = z.object({
  name: z.string().min(1).max(80),
  timezone: z.string().min(1),
});
export const patchScheduleSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  timezone: z.string().min(1).optional(),
  isDefault: z.literal(true).optional(),
});
export const saveScheduleRulesSchema = z.object({
  timezone: z.string().min(1),
  rules: z.array(availabilityRuleSchema),
  overrides: z.array(dateOverrideSchema).optional().default([]),
});

// --- Custom invitee questions ---
export const customQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(200),
  type: z.enum(["text", "textarea", "select"]).default("text"),
  options: z.array(z.string()).optional().nullable(),
  required: z.boolean().optional().default(false),
  position: z.number().int().min(0).default(0),
});
export const putQuestionsSchema = z.object({
  questions: z.array(customQuestionSchema),
});

// PATCH /api/admin/event-types/[id] accepts core fields AND an optional
// `questions` array so the edit page can save both in a single transaction.
export const updateEventTypeSchema = createEventTypeSchema.partial().extend({
  questions: z.array(customQuestionSchema).optional(),
});

// --- Account / Profile ---
// PATCH /api/admin/account — only the existing User columns we persist.
// Everything else on the Account page (welcome message, language, date
// format, country) is a UI-only preference kept in localStorage so we
// don't need a DB migration to add the full Calendly profile surface.
export const updateAccountSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  // Allow empty string to clear the avatar. Otherwise must be a URL.
  avatarUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  timezone: z.string().min(1).optional(),
});

// --- Reschedule ---
export const rescheduleBookingSchema = z.object({
  token: z.string().min(1),
  startUtc: z.string().datetime(),
});

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
