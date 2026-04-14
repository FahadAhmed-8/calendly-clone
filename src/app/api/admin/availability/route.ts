import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { updateAvailabilitySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const host = await getDefaultHost();
    let schedule = await prisma.availabilitySchedule.findFirst({
      where: { hostId: host.id, isDefault: true },
      include: { rules: true, overrides: true },
    });
    if (!schedule) {
      schedule = await prisma.availabilitySchedule.create({
        data: { hostId: host.id, name: "Working Hours", timezone: host.timezone, isDefault: true },
        include: { rules: true, overrides: true },
      });
    }
    return NextResponse.json({
      timezone: schedule.timezone,
      rules: schedule.rules.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
      overrides: schedule.overrides.map((o) => ({ date: o.date.toISOString().slice(0, 10), blocks: o.blocks })),
    });
  } catch (e) { return errorResponse(e); }
}

export async function PUT(req: Request) {
  try {
    const host = await getDefaultHost();
    const body = updateAvailabilitySchema.parse(await req.json());

    // Validate no overlapping rules on the same weekday.
    const byDay: Record<number, { start: number; end: number }[]> = {};
    for (const r of body.rules) {
      const s = parseMinutes(r.startTime), e = parseMinutes(r.endTime);
      if (e <= s) throw new AppError("OVERLAPPING_RULES", 422, `Invalid time range on weekday ${r.weekday}`);
      byDay[r.weekday] ??= [];
      byDay[r.weekday].push({ start: s, end: e });
    }
    for (const day of Object.values(byDay)) {
      day.sort((a, b) => a.start - b.start);
      for (let i = 1; i < day.length; i++) {
        if (day[i].start < day[i - 1].end) throw new AppError("OVERLAPPING_RULES", 422, "Overlapping time ranges.");
      }
    }

    const schedule = await prisma.availabilitySchedule.upsert({
      where: { id: (await prisma.availabilitySchedule.findFirst({ where: { hostId: host.id, isDefault: true } }))?.id || "__none__" },
      update: { timezone: body.timezone },
      create: { hostId: host.id, name: "Working Hours", timezone: body.timezone, isDefault: true },
    });

    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({ where: { scheduleId: schedule.id } }),
      prisma.dateOverride.deleteMany({ where: { scheduleId: schedule.id } }),
      prisma.availabilityRule.createMany({
        data: body.rules.map((r) => ({ scheduleId: schedule.id, weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
      }),
      ...body.overrides.map((o) =>
        prisma.dateOverride.create({ data: { scheduleId: schedule.id, date: new Date(o.date), blocks: o.blocks as any } }),
      ),
    ]);

    return NextResponse.json({ timezone: body.timezone, rules: body.rules, overrides: body.overrides });
  } catch (e) { return errorResponse(e); }
}

function parseMinutes(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}
