import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { cancelBookingSchema } from "@/lib/schemas";
import { hashToken } from "@/lib/auth";
import { sendCancellationNotice } from "@/lib/email";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = cancelBookingSchema.parse(await req.json());
    if (!body.token) throw new AppError("FORBIDDEN", 403, "Missing token");
    const b = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!b) throw new AppError("NOT_FOUND", 404, "Booking not found");
    const submitted = Buffer.from(hashToken(body.token));
    const stored = Buffer.from(b.cancellationTokenHash);
    if (submitted.length !== stored.length || !timingSafeEqual(submitted, stored)) throw new AppError("FORBIDDEN", 403, "Invalid token");
    if (b.status === "cancelled") throw new AppError("ALREADY_CANCELLED", 409, "Already cancelled");
    const updated = await prisma.booking.update({
      where: { id: b.id },
      data: { status: "cancelled", cancelledAt: new Date(), cancelReason: body.reason || null },
      include: { eventType: true, host: true },
    });
    sendCancellationNotice({ booking: updated as any, reason: body.reason, cancelledBy: "invitee" }).catch((err) => {
      console.error("[email] sendCancellationNotice (invitee) failed", { bookingId: updated.id, err });
    });
    return NextResponse.json({ id: updated.id, status: updated.status, cancelledAt: updated.cancelledAt });
  } catch (e) { return errorResponse(e); }
}
