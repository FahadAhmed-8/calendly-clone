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

    // Split `questions` out of the core update payload — it's not a column on
    // EventType. When the client sends it, apply the same replace-set semantics
    // as PUT .../questions, but inside the same transaction as the core update
    // so we can't end up with a half-saved state on failure.
    const { questions, ...coreUpdate } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedEt = await tx.eventType.update({ where: { id: params.id }, data: coreUpdate });

      if (questions) {
        const existing = await tx.customQuestion.findMany({ where: { eventTypeId: updatedEt.id } });
        const incomingIds = new Set(questions.map((q) => q.id).filter(Boolean) as string[]);
        const toDelete = existing.filter((q) => !incomingIds.has(q.id));
        for (const q of toDelete) {
          await tx.customQuestion.delete({ where: { id: q.id } });
        }
        for (const [idx, q] of questions.entries()) {
          if (q.id) {
            await tx.customQuestion.update({
              where: { id: q.id },
              data: {
                label: q.label,
                type: q.type,
                options: (q.options as any) ?? undefined,
                required: q.required ?? false,
                position: idx,
              },
            });
          } else {
            await tx.customQuestion.create({
              data: {
                eventTypeId: updatedEt.id,
                label: q.label,
                type: q.type,
                options: (q.options as any) ?? undefined,
                required: q.required ?? false,
                position: idx,
              },
            });
          }
        }
      }
      return updatedEt;
    });

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
