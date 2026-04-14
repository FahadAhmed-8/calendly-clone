import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { bookingToPublic as serialize } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const host = await getDefaultHost();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "upcoming";
    const now = new Date();
    const where: any = { hostId: host.id };
    if (status === "upcoming") { where.status = "confirmed"; where.endUtc = { gte: now }; }
    else if (status === "past") { where.status = "confirmed"; where.endUtc = { lt: now }; }
    else if (status === "cancelled") { where.status = "cancelled"; }
    const items = await prisma.booking.findMany({
      where,
      orderBy: { startUtc: status === "past" ? "desc" : "asc" },
      include: { eventType: true },
    });
    return NextResponse.json(items.map(serialize));
  } catch (e) { return errorResponse(e); }
}

