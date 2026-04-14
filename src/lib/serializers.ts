export function eventTypeToPublic(e: any, username: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    id: e.id,
    name: e.name,
    slug: e.slug,
    durationMinutes: e.durationMinutes,
    description: e.description,
    color: e.color,
    active: e.active,
    bufferBeforeMinutes: e.bufferBeforeMinutes,
    bufferAfterMinutes: e.bufferAfterMinutes,
    bookingUrl: `${base}/${username}/${e.slug}`,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export function bookingToPublic(b: any) {
  return {
    id: b.id,
    eventType: b.eventType
      ? { id: b.eventType.id, name: b.eventType.name, durationMinutes: b.eventType.durationMinutes, color: b.eventType.color }
      : null,
    startUtc: b.startUtc,
    endUtc: b.endUtc,
    invitee: { name: b.inviteeName, email: b.inviteeEmail, timezone: b.inviteeTimezone },
    status: b.status,
    cancelledAt: b.cancelledAt,
    cancelReason: b.cancelReason,
    notes: b.notes,
    createdAt: b.createdAt,
  };
}
