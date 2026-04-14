import { NextResponse } from "next/server";
import { prisma, DEFAULT_HOST_USERNAME } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username") || DEFAULT_HOST_USERNAME;
    const host = await prisma.user.findUnique({ where: { username } });
    if (!host) throw new AppError("NOT_FOUND", 404, "Host not found");
    const e = await prisma.eventType.findFirst({ where: { hostId: host.id, slug: params.slug, deletedAt: null } });
    if (!e) throw new AppError("NOT_FOUND", 404, "Event type not found");
    if (!e.active) throw new AppError("NOT_FOUND", 410, "This event type is not available");
    return NextResponse.json({
      id: e.id,
      name: e.name,
      slug: e.slug,
      durationMinutes: e.durationMinutes,
      description: e.description,
      color: e.color,
      host: { displayName: host.displayName, username: host.username, avatarUrl: host.avatarUrl, timezone: host.timezone },
    });
  } catch (e) { return errorResponse(e); }
}
