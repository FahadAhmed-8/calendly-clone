import { NextResponse } from "next/server";
import { prisma, getDefaultHost } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { updateAccountSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// GET /api/admin/account — returns the default host's profile. We
// intentionally DON'T expose `id`; everything else (displayName, email,
// avatarUrl, timezone, username) is fine to show on the settings page.
export async function GET() {
  try {
    const host = await getDefaultHost();
    return NextResponse.json({
      username: host.username,
      displayName: host.displayName,
      email: host.email,
      avatarUrl: host.avatarUrl,
      timezone: host.timezone,
    });
  } catch (e) { return errorResponse(e); }
}

export async function PATCH(req: Request) {
  try {
    const host = await getDefaultHost();
    const body = updateAccountSchema.parse(await req.json());
    // Normalise empty-string avatarUrl to null so the DB stores a real
    // absence and the UI stops rendering a broken image.
    const data = {
      ...body,
      avatarUrl: body.avatarUrl === "" ? null : body.avatarUrl,
    };
    const updated = await prisma.user.update({ where: { id: host.id }, data });
    return NextResponse.json({
      username: updated.username,
      displayName: updated.displayName,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      timezone: updated.timezone,
    });
  } catch (e) { return errorResponse(e); }
}
