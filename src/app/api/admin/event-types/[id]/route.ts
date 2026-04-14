import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { updateEventTypeSchema } from "@/lib/schemas";
import { eventTypeToPublic as toPublic } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const e = await prisma.eventType.findUnique({ where: { id: params.id } });
    if (!e || e.deletedAt || e.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Event type not found");
    return NextResponse.json(toPublic(e, host.username));
  } catch (e) { return errorResponse(e); }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const body = updateEventTypeSchema.parse(await req.json());
    const e = await prisma.eventType.findUnique({ where: { id: params.id } });
    if (!e || e.deletedAt || e.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Event type not found");
    if (body.slug && body.slug !== e.slug) {
      const clash = await prisma.eventType.findFirst({ where: { hostId: host.id, slug: body.slug, deletedAt: null } });
      if (clash) throw new AppError("SLUG_TAKEN", 409, "That slug is already in use.");
    }
    const updated = await prisma.eventType.update({ where: { id: params.id }, data: body });
    return NextResponse.json(toPublic(updated, host.username));
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const e = await prisma.eventType.findUnique({ where: { id: params.id } });
    if (!e || e.deletedAt || e.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Event type not found");
    const futureConfirmed = await prisma.booking.count({ where: { eventTypeId: e.id, status: "confirmed", endUtc: { gt: new Date() } } });
    if (futureConfirmed > 0) throw new AppError("HAS_FUTURE_BOOKINGS", 409, "Cancel future bookings first.");
    await prisma.eventType.update({ where: { id: e.id }, data: { deletedAt: new Date() } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return errorResponse(e); }
}
