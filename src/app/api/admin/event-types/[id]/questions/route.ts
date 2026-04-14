import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { putQuestionsSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const e = await prisma.eventType.findUnique({ where: { id: params.id } });
    if (!e || e.deletedAt || e.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Event type not found");
    const qs = await prisma.customQuestion.findMany({ where: { eventTypeId: e.id }, orderBy: { position: "asc" } });
    return NextResponse.json(qs.map(serialize));
  } catch (e) { return errorResponse(e); }
}

// PUT replaces the full question set. Existing questions with answers are preserved
// (matched by id) so we don't break historical BookingAnswer FKs.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const e = await prisma.eventType.findUnique({ where: { id: params.id } });
    if (!e || e.deletedAt || e.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Event type not found");
    const body = putQuestionsSchema.parse(await req.json());

    const existing = await prisma.customQuestion.findMany({ where: { eventTypeId: e.id } });
    const incomingIds = new Set(body.questions.map((q) => q.id).filter(Boolean) as string[]);
    const toDelete = existing.filter((q) => !incomingIds.has(q.id));

    // Delete questions the user removed. Cascade removes their answers.
    await prisma.$transaction([
      ...toDelete.map((q) => prisma.customQuestion.delete({ where: { id: q.id } })),
      ...body.questions.map((q, idx) =>
        q.id
          ? prisma.customQuestion.update({
              where: { id: q.id },
              data: {
                label: q.label,
                type: q.type,
                options: (q.options as any) ?? undefined,
                required: q.required ?? false,
                position: idx,
              },
            })
          : prisma.customQuestion.create({
              data: {
                eventTypeId: e.id,
                label: q.label,
                type: q.type,
                options: (q.options as any) ?? undefined,
                required: q.required ?? false,
                position: idx,
              },
            }),
      ),
    ]);

    const fresh = await prisma.customQuestion.findMany({ where: { eventTypeId: e.id }, orderBy: { position: "asc" } });
    return NextResponse.json(fresh.map(serialize));
  } catch (e) { return errorResponse(e); }
}

function serialize(q: any) {
  return { id: q.id, label: q.label, type: q.type, options: q.options, required: q.required, position: q.position };
}
