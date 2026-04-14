import { prisma } from "./db";
import { addMinutes, formatInTimeZone, fromZonedTime, parseHHmm } from "./time";

type AvailabilityBlock = { start: string; end: string }; // HH:mm in schedule tz

/**
 * Compute available UTC slot start times for a given eventType on a given date-in-tz.
 * `dateISO` is the calendar day the invitee is viewing in their timezone `inviteeTz`.
 */
export async function computeSlots(params: {
  eventTypeId: string;
  dateISO: string; // "YYYY-MM-DD" (invitee's day)
  inviteeTz: string;
}): Promise<string[]> {
  const eventType = await prisma.eventType.findUnique({
    where: { id: params.eventTypeId },
    include: {
      host: { include: { availabilitySchedules: { where: { isDefault: true }, include: { rules: true, overrides: true } } } },
    },
  });
  if (!eventType || eventType.deletedAt || !eventType.active) return [];
  const schedule = eventType.host.availabilitySchedules[0];
  if (!schedule) return [];
  const hostTz = schedule.timezone;
  const duration = eventType.durationMinutes;

  // Invitee day window in UTC.
  const dayStartUtc = fromZonedTime(`${params.dateISO}T00:00:00`, params.inviteeTz);
  const dayEndUtc = fromZonedTime(`${params.dateISO}T23:59:59.999`, params.inviteeTz);

  // Host-local dates that intersect the invitee day window (usually 1 or 2).
  const hostDateStart = formatInTimeZone(dayStartUtc, hostTz, "yyyy-MM-dd");
  const hostDateEnd = formatInTimeZone(dayEndUtc, hostTz, "yyyy-MM-dd");
  const hostDates = new Set<string>([hostDateStart, hostDateEnd]);

  // Build candidate windows in UTC from rules + overrides for each host date.
  const windows: { start: Date; end: Date }[] = [];
  for (const hostDate of hostDates) {
    const override = schedule.overrides.find((o) => o.date.toISOString().slice(0, 10) === hostDate);
    let blocks: AvailabilityBlock[] = [];
    if (override) {
      blocks = (override.blocks as AvailabilityBlock[]) || [];
    } else {
      // Weekday in host timezone for this host-local date.
      const weekdayIso = Number(formatInTimeZone(fromZonedTime(`${hostDate}T12:00:00`, hostTz), hostTz, "e"));
      const weekday = weekdayIso === 7 ? 0 : weekdayIso;
      blocks = schedule.rules
        .filter((r) => r.weekday === weekday)
        .map((r) => ({ start: r.startTime, end: r.endTime }));
    }
    for (const b of blocks) {
      const sUtc = fromZonedTime(`${hostDate}T${b.start}:00`, hostTz);
      const eUtc = fromZonedTime(`${hostDate}T${b.end}:00`, hostTz);
      windows.push({ start: sUtc, end: eUtc });
    }
  }

  // Clip windows to the invitee's visible day.
  const clipped = windows
    .map((w) => ({ start: new Date(Math.max(w.start.getTime(), dayStartUtc.getTime())), end: new Date(Math.min(w.end.getTime(), dayEndUtc.getTime())) }))
    .filter((w) => w.end.getTime() > w.start.getTime());

  // Existing confirmed bookings for this event type overlapping the window (include buffers).
  const bookings = await prisma.booking.findMany({
    where: {
      eventTypeId: eventType.id,
      status: "confirmed",
      endUtc: { gt: new Date(dayStartUtc.getTime() - eventType.bufferAfterMinutes * 60 * 1000) },
      startUtc: { lt: new Date(dayEndUtc.getTime() + eventType.bufferBeforeMinutes * 60 * 1000) },
    },
    select: { startUtc: true, endUtc: true },
  });
  const bookedIntervals = bookings.map((b) => ({
    start: new Date(b.startUtc.getTime() - eventType.bufferBeforeMinutes * 60 * 1000),
    end: new Date(b.endUtc.getTime() + eventType.bufferAfterMinutes * 60 * 1000),
  }));

  const now = new Date();
  const slots: string[] = [];
  for (const w of clipped) {
    let cursor = new Date(w.start);
    while (addMinutes(cursor, duration).getTime() <= w.end.getTime()) {
      const slotEnd = addMinutes(cursor, duration);
      const overlapping = bookedIntervals.some((b) => cursor < b.end && slotEnd > b.start);
      if (!overlapping && cursor > now) slots.push(cursor.toISOString());
      cursor = addMinutes(cursor, duration);
    }
  }
  // dedupe (tz edges may cause duplicates)
  return Array.from(new Set(slots)).sort();
}

// Helper to parse an HH:mm string, not used here but exported for symmetry.
export { parseHHmm };
