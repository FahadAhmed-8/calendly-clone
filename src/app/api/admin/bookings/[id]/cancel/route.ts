import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { bookingToPublic as serialize } from "@/lib/serializers";
import { sendCancellationNotice } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const body = await req.json().catch(() => ({}));
    const b = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!b || b.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Booking not found");
    if (b.status === "cancelled") throw new AppError("ALREADY_CANCELLED", 409, "Already cancelled");
    const updated = await prisma.booking.update({
      where: { id: b.id },
      data: { status: "cancelled", cancelledAt: new Date(), cancelReason: body?.reason || null },
      include: { eventType: true, host: true },
    });
    sendCancellationNotice({ booking: updated as any, reason: body?.reason, cancelledBy: "host" }).catch(() => {});
    return NextResponse.json(serialize(updated));
  } catch (e) { return errorResponse(e); }
}
