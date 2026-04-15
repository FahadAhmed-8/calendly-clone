import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { rescheduleBookingSchema } from "@/lib/schemas";
import { hashToken } from "@/lib/auth";
import { timingSafeEqual } from "crypto";
import { computeSlots } from "@/lib/slots";
import { formatInTimeZone } from "date-fns-tz";
import { sendRescheduleNotice } from "@/lib/email";
import { overlapsAnyWithBuffers } from "@/lib/overlap";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = rescheduleBookingSchema.parse(await req.json());
    const b = await prisma.booking.findUnique({ where: { id: params.id }, include: { eventType: true, host: true } });
    if (!b) throw new AppError("NOT_FOUND", 404, "Booking not found");
    if (b.status === "cancelled") throw new AppError("ALREADY_CANCELLED", 409, "Booking is cancelled");

    // Timing-safe token check.
    const submitted = Buffer.from(hashToken(body.token));
    const stored = Buffer.from(b.cancellationTokenHash);
    if (submitted.length !== stored.length || !timingSafeEqual(submitted, stored)) {
      throw new AppError("INVALID_TOKEN", 403, "Invalid token");
    }

    const newStart = new Date(body.startUtc);
    const newEnd = new Date(newStart.getTime() + b.eventType.durationMinutes * 60 * 1000);
    if (newStart.getTime() <= Date.now()) throw new AppError("OUTSIDE_AVAILABILITY", 422, "Start must be in the future.");

    // Re-verify against availability in the invitee's timezone.
    const inviteeDate = formatInTimeZone(newStart, b.inviteeTimezone, "yyyy-MM-dd");
    const available = await computeSlots({ eventTypeId: b.eventTypeId, dateISO: inviteeDate, inviteeTz: b.inviteeTimezone });
    if (!available.includes(newStart.toISOString())) {
      throw new AppError("OUTSIDE_AVAILABILITY", 422, "That time is not available");
    }

    // Transaction: re-check overlap (ignoring this booking) with the same
    // buffer-aware rule used on create. See lib/overlap.ts.
    const updated = await prisma.$transaction(async (tx) => {
      const bufCfg = {
        bufferBeforeMinutes: b.eventType.bufferBeforeMinutes,
        bufferAfterMinutes: b.eventType.bufferAfterMinutes,
      };
      const bufBefore = bufCfg.bufferBeforeMinutes * 60 * 1000;
      const bufAfter = bufCfg.bufferAfterMinutes * 60 * 1000;
      const nearby = await tx.booking.findMany({
        where: {
          id: { not: b.id },
          eventTypeId: b.eventTypeId,
          status: "confirmed",
          startUtc: { lt: new Date(newEnd.getTime() + bufAfter + bufBefore) },
          endUtc: { gt: new Date(newStart.getTime() - bufBefore - bufAfter) },
        },
        select: { startUtc: true, endUtc: true },
      });
      if (overlapsAnyWithBuffers({ startUtc: newStart, endUtc: newEnd }, nearby, bufCfg)) {
        throw new AppError("SLOT_TAKEN", 409, "This time was just booked. Please pick another.");
      }
      return tx.booking.update({
        where: { id: b.id },
        data: { startUtc: newStart, endUtc: newEnd },
        include: { eventType: true, host: true },
      });
    });

    // Fire-and-forget email; do not block the response if it fails, but
    // log so silent SMTP outages are visible in server logs.
    sendRescheduleNotice({ booking: updated as any, oldStartUtc: b.startUtc }).catch((err) => {
      console.error("[email] sendRescheduleNotice failed", { bookingId: updated.id, err });
    });

    return NextResponse.json({
      id: updated.id,
      startUtc: updated.startUtc,
      endUtc: updated.endUtc,
      status: updated.status,
    });
  } catch (e) { return errorResponse(e); }
}
