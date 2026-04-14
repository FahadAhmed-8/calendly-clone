import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const b = await prisma.booking.findUnique({ where: { id: params.id }, include: { eventType: true, host: true } });
    if (!b) throw new AppError("NOT_FOUND", 404, "Booking not found");
    return NextResponse.json({
      id: b.id,
      eventType: { id: b.eventType.id, name: b.eventType.name, durationMinutes: b.eventType.durationMinutes, color: b.eventType.color },
      host: { displayName: b.host.displayName, username: b.host.username, avatarUrl: b.host.avatarUrl },
      startUtc: b.startUtc,
      endUtc: b.endUtc,
      invitee: { name: b.inviteeName, email: b.inviteeEmail, timezone: b.inviteeTimezone },
      status: b.status,
      cancelledAt: b.cancelledAt,
      cancelReason: b.cancelReason,
      createdAt: b.createdAt,
    });
  } catch (e) { return errorResponse(e); }
}
