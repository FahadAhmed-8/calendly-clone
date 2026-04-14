import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { createScheduleSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const host = await getDefaultHost();
    const schedules = await prisma.availabilitySchedule.findMany({
      where: { hostId: host.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { eventTypes: true } } },
    });
    return NextResponse.json(
      schedules.map((s) => ({
        id: s.id,
        name: s.name,
        timezone: s.timezone,
        isDefault: s.isDefault,
        eventTypeCount: s._count.eventTypes,
      })),
    );
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: Request) {
  try {
    const host = await getDefaultHost();
    const body = createScheduleSchema.parse(await req.json());
    const created = await prisma.availabilitySchedule.create({
      data: { hostId: host.id, name: body.name, timezone: body.timezone, isDefault: false },
    });
    return NextResponse.json({ id: created.id, name: created.name, timezone: created.timezone, isDefault: created.isDefault, eventTypeCount: 0 }, { status: 201 });
  } catch (e) { return errorResponse(e); }
}
