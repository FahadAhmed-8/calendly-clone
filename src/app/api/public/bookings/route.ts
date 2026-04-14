import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { createBookingSchema } from "@/lib/schemas";
import { computeSlots } from "@/lib/slots";
import { hashToken, randomToken } from "@/lib/auth";
import { sendBookingConfirmation } from "@/lib/email";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = createBookingSchema.parse(await req.json());
    const eventType = await prisma.eventType.findUnique({
      where: { id: body.eventTypeId },
      include: { customQuestions: true },
    });
    if (!eventType || eventType.deletedAt || !eventType.active) throw new AppError("NOT_FOUND", 404, "Event type not found");

    const start = new Date(body.startUtc);
    const end = new Date(start.getTime() + eventType.durationMinutes * 60 * 1000);

    // Reject times in the past.
    if (start.getTime() <= Date.now()) throw new AppError("OUTSIDE_AVAILABILITY", 422, "That time is in the past");

    // Answers must target questions that belong to this event type.
    const validQuestionIds = new Set(eventType.customQuestions.map((q) => q.id));
    for (const a of body.answers) {
      if (!validQuestionIds.has(a.questionId)) {
        throw new AppError("VALIDATION_ERROR", 400, "Unknown question for this event type");
      }
    }
    // Required questions must be answered.
    for (const q of eventType.customQuestions) {
      if (!q.required) continue;
      const match = body.answers.find((a) => a.questionId === q.id);
      if (!match || !match.answer.trim()) {
        throw new AppError("VALIDATION_ERROR", 400, `Missing answer for "${q.label}"`);
      }
    }

    // Re-verify the slot is valid in the booking's day (invitee timezone).
    const inviteeDate = formatInTimeZone(start, body.inviteeTimezone, "yyyy-MM-dd");
    const available = await computeSlots({ eventTypeId: eventType.id, dateISO: inviteeDate, inviteeTz: body.inviteeTimezone });
    if (!available.includes(start.toISOString())) throw new AppError("OUTSIDE_AVAILABILITY", 422, "That time is not available");

    // Transaction: re-check overlap, insert. Unique(eventTypeId,startUtc) not enforced at DB level
    // because cancellations should free the slot; we rely on the final overlap check inside the tx.
    const rawToken = randomToken();
    const tokenHash = hashToken(rawToken);

    const created = await prisma.$transaction(async (tx) => {
      const overlap = await tx.booking.findFirst({
        where: {
          eventTypeId: eventType.id,
          status: "confirmed",
          startUtc: { lt: end },
          endUtc: { gt: start },
        },
      });
      if (overlap) throw new AppError("SLOT_TAKEN", 409, "This time was just booked. Please pick another.");
      return tx.booking.create({
        data: {
          eventTypeId: eventType.id,
          hostId: eventType.hostId,
          inviteeName: body.inviteeName,
          inviteeEmail: body.inviteeEmail,
          inviteeTimezone: body.inviteeTimezone,
          startUtc: start,
          endUtc: end,
          cancellationTokenHash: tokenHash,
          notes: body.notes || null,
          answers: { create: body.answers.map((a) => ({ questionId: a.questionId, answer: a.answer })) },
        },
        include: { eventType: true, host: true },
      });
    });

    // Fire-and-forget confirmation email; never block the response.
    sendBookingConfirmation({ booking: created as any, cancellationToken: rawToken }).catch(() => {});

    return NextResponse.json({
      id: created.id,
      eventType: { id: created.eventType.id, name: created.eventType.name, durationMinutes: created.eventType.durationMinutes },
      startUtc: created.startUtc,
      endUtc: created.endUtc,
      invitee: { name: created.inviteeName, email: created.inviteeEmail, timezone: created.inviteeTimezone },
      status: created.status,
      cancellationToken: rawToken, // returned once
    }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
