import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { createEventTypeSchema } from "@/lib/schemas";
import { eventTypeToPublic as toPublic } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const host = await getDefaultHost();
    const items = await prisma.eventType.findMany({
      where: { hostId: host.id, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(items.map((e) => toPublic(e, host.username)));
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    const host = await getDefaultHost();
    const body = createEventTypeSchema.parse(await req.json());
    const existing = await prisma.eventType.findFirst({ where: { hostId: host.id, slug: body.slug, deletedAt: null } });
    if (existing) throw new AppError("SLUG_TAKEN", 409, "That slug is already in use.");
    const created = await prisma.eventType.create({ data: { ...body, hostId: host.id } });
    return NextResponse.json(toPublic(created, host.username), { status: 201 });
  } catch (e) { return errorResponse(e); }
}

