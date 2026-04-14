import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { patchScheduleSchema, saveScheduleRulesSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const s = await prisma.availabilitySchedule.findUnique({
      where: { id: params.id },
      include: { rules: true, overrides: true },
    });
    if (!s || s.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Schedule not found");
    return NextResponse.json({
      id: s.id,
      name: s.name,
      timezone: s.timezone,
      isDefault: s.isDefault,
      rules: s.rules.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
      overrides: s.overrides.map((o) => ({ date: o.date.toISOString().slice(0, 10), blocks: o.blocks })),
    });
  } catch (e) { return errorResponse(e); }
}

// PATCH: rename, change tz, or promote to default.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const body = patchScheduleSchema.parse(await req.json());
    const s = await prisma.availabilitySchedule.findUnique({ where: { id: params.id } });
    if (!s || s.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Schedule not found");

    if (body.isDefault === true) {
      await prisma.$transaction([
        prisma.availabilitySchedule.updateMany({ where: { hostId: host.id, isDefault: true }, data: { isDefault: false } }),
        prisma.availabilitySchedule.update({ where: { id: s.id }, data: { isDefault: true } }),
      ]);
    }
    const updated = await prisma.availabilitySchedule.update({
      where: { id: s.id },
      data: { name: body.name ?? s.name, timezone: body.timezone ?? s.timezone },
    });
    return NextResponse.json({ id: updated.id, name: updated.name, timezone: updated.timezone, isDefault: updated.isDefault });
  } catch (e) { return errorResponse(e); }
}

// PUT: replace rules + overrides for a schedule.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const body = saveScheduleRulesSchema.parse(await req.json());
    const s = await prisma.availabilitySchedule.findUnique({ where: { id: params.id } });
    if (!s || s.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Schedule not found");

    // Validate no overlapping rules on the same weekday.
    const byDay: Record<number, { start: number; end: number }[]> = {};
    for (const r of body.rules) {
      const sm = parseMinutes(r.startTime), em = parseMinutes(r.endTime);
      if (em <= sm) throw new AppError("OVERLAPPING_RULES", 422, `Invalid range on weekday ${r.weekday}`);
      byDay[r.weekday] ??= [];
      byDay[r.weekday].push({ start: sm, end: em });
    }
    for (const day of Object.values(byDay)) {
      day.sort((a, b) => a.start - b.start);
      for (let i = 1; i < day.length; i++) {
        if (day[i].start < day[i - 1].end) throw new AppError("OVERLAPPING_RULES", 422, "Overlapping ranges.");
      }
    }

    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({ where: { scheduleId: s.id } }),
      prisma.dateOverride.deleteMany({ where: { scheduleId: s.id } }),
      prisma.availabilitySchedule.update({ where: { id: s.id }, data: { timezone: body.timezone } }),
      prisma.availabilityRule.createMany({
        data: body.rules.map((r) => ({ scheduleId: s.id, weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
      }),
      ...body.overrides.map((o) =>
        prisma.dateOverride.create({ data: { scheduleId: s.id, date: new Date(o.date), blocks: o.blocks as any } }),
      ),
    ]);

    return NextResponse.json({ timezone: body.timezone, rules: body.rules, overrides: body.overrides });
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const host = await getDefaultHost();
    const s = await prisma.availabilitySchedule.findUnique({ where: { id: params.id } });
    if (!s || s.hostId !== host.id) throw new AppError("NOT_FOUND", 404, "Schedule not found");
    const total = await prisma.availabilitySchedule.count({ where: { hostId: host.id } });
    if (total <= 1) throw new AppError("LAST_SCHEDULE", 409, "You must keep at least one schedule.");
    // If this was the default, promote the next-oldest remaining to default.
    await prisma.$transaction(async (tx) => {
      await tx.availabilitySchedule.delete({ where: { id: s.id } });
      if (s.isDefault) {
        const next = await tx.availabilitySchedule.findFirst({
          where: { hostId: host.id },
          orderBy: { createdAt: "asc" },
        });
        if (next) await tx.availabilitySchedule.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return errorResponse(e); }
}

function parseMinutes(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}
