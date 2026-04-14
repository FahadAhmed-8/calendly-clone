import { NextResponse } from "next/server";
import { prisma, DEFAULT_HOST_USERNAME } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { slotsQuerySchema } from "@/lib/schemas";
import { computeSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || DEFAULT_HOST_USERNAME;
    const { date, tz } = slotsQuerySchema.parse({ date: url.searchParams.get("date"), tz: url.searchParams.get("tz") });
    const host = await prisma.user.findUnique({ where: { username } });
    if (!host) throw new AppError("NOT_FOUND", 404, "Host not found");
    const eventType = await prisma.eventType.findFirst({ where: { hostId: host.id, slug: params.slug, deletedAt: null, active: true } });
    if (!eventType) throw new AppError("NOT_FOUND", 404, "Event type not found");
    const slots = await computeSlots({ eventTypeId: eventType.id, dateISO: date, inviteeTz: tz });
    return NextResponse.json({ slots });
  } catch (e) { return errorResponse(e); }
}
