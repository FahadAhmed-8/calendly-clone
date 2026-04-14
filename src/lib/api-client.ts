// Browser-side fetch helpers. For admin writes we proxy through the same-origin
// API routes; the admin key lives only on the server for protected routes.

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body?.error?.message || res.statusText), { body });
  }
  return res.json();
}

export const api = {
  // Admin
  listEventTypes: () => fetch("/api/admin/event-types").then((r) => json<any[]>(r)),
  createEventType: (body: any) =>
    fetch("/api/admin/event-types", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json(r)),
  updateEventType: (id: string, body: any) =>
    fetch(`/api/admin/event-types/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json(r)),
  deleteEventType: (id: string) => fetch(`/api/admin/event-types/${id}`, { method: "DELETE" }).then((r) => json(r)),
  getEventType: (id: string) => fetch(`/api/admin/event-types/${id}`).then((r) => json<any>(r)),
  getAvailability: () => fetch("/api/admin/availability").then((r) => json<any>(r)),
  saveAvailability: (body: any) =>
    fetch("/api/admin/availability", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json(r)),
  listBookings: (status: "upcoming" | "past" | "cancelled") =>
    fetch(`/api/admin/bookings?status=${status}`).then((r) => json<any[]>(r)),
  cancelBookingAdmin: (id: string, reason?: string) =>
    fetch(`/api/admin/bookings/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) }).then((r) => json(r)),

  // Schedules
  listSchedules: () => fetch("/api/admin/schedules").then((r) => json<any[]>(r)),
  createSchedule: (body: { name: string; timezone: string }) =>
    fetch("/api/admin/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json<any>(r)),
  getSchedule: (id: string) => fetch(`/api/admin/schedules/${id}`).then((r) => json<any>(r)),
  patchSchedule: (id: string, body: any) =>
    fetch(`/api/admin/schedules/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json(r)),
  saveSchedule: (id: string, body: any) =>
    fetch(`/api/admin/schedules/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json(r)),
  deleteSchedule: (id: string) => fetch(`/api/admin/schedules/${id}`, { method: "DELETE" }).then((r) => json(r).catch(() => null)),

  // Questions
  listQuestions: (eventTypeId: string) => fetch(`/api/admin/event-types/${eventTypeId}/questions`).then((r) => json<any[]>(r)),
  saveQuestions: (eventTypeId: string, body: any) =>
    fetch(`/api/admin/event-types/${eventTypeId}/questions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json<any[]>(r)),

  // Public
  reschedule: (id: string, body: { token: string; startUtc: string }) =>
    fetch(`/api/public/bookings/${id}/reschedule`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json<any>(r)),
  publicEventType: (username: string, slug: string) =>
    fetch(`/api/public/event-types/${slug}?username=${username}`).then((r) => json<any>(r)),
  publicSlots: (slug: string, date: string, tz: string, username: string) =>
    fetch(`/api/public/event-types/${slug}/slots?date=${date}&tz=${encodeURIComponent(tz)}&username=${username}`).then((r) => json<{ slots: string[] }>(r)),
  createBooking: (body: any) =>
    fetch("/api/public/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => json<any>(r)),
  publicBooking: (id: string, token?: string) =>
    fetch(`/api/public/bookings/${id}${token ? `?token=${token}` : ""}`).then((r) => json<any>(r)),
  cancelBookingPublic: (id: string, token: string, reason?: string) =>
    fetch(`/api/public/bookings/${id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, reason }) }).then((r) => json<any>(r)),
};
