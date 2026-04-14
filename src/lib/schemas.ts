import { z } from "zod";

export const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export const createEventTypeSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(slugRegex, "Slug must be lowercase letters, numbers, and dashes."),
  durationMinutes: z.number().int().positive().max(600),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  active: z.boolean().optional(),
  bufferBeforeMinutes: z.number().int().min(0).max(240).optional(),
  bufferAfterMinutes: z.number().int().min(0).max(240).optional(),
});

export const updateEventTypeSchema = createEventTypeSchema.partial();

export const availabilityBlockSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

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

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
