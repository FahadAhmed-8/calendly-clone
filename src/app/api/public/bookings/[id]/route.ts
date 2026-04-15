import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { hashToken } from "@/lib/auth";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || "";
    const b = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { eventType: true, host: true, answers: { include: { question: true } } },
    });
    if (!b) throw new AppError("NOT_FOUND", 404, "Booking not found");

    let tokenValid = false;
    if (token) {
      const submitted = Buffer.from(hashToken(token));
      const stored = Buffer.from(b.cancellationTokenHash);
      tokenValid = submitted.length === stored.length && timingSafeEqual(submitted, stored);
    }

    // Minimal (no-PII) response for anyone hitting the URL without a valid token.
    // The invitee keeps their token in sessionStorage or via the email link.
    return NextResponse.json({
      id: b.id,
      eventType: { id: b.eventType.id, name: b.eventType.name, slug: b.eventType.slug, durationMinutes: b.eventType.durationMinutes, color: b.eventType.color },
      host: { displayName: b.host.displayName, username: b.host.username, avatarUrl: b.host.avatarUrl },
      startUtc: b.startUtc,
      endUtc: b.endUtc,
      invitee: tokenValid
        ? { name: b.inviteeName, email: b.inviteeEmail, timezone: b.inviteeTimezone }
        : { name: null, email: null, timezone: b.inviteeTimezone },
      notes: tokenValid ? b.notes : null,
      answers: tokenValid ? b.answers.map((a) => ({ label: a.question.label, value: a.answer })) : [],
      status: b.status,
      cancelledAt: b.cancelledAt,
      // cancelReason is free-form invitee input — treat as PII, gate on token.
      cancelReason: tokenValid ? b.cancelReason : null,
      createdAt: b.createdAt,
      tokenRequired: !tokenValid,
    });
  } catch (e) { return errorResponse(e); }
}
