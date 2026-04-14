// Email notifications. Uses nodemailer when SMTP_HOST is configured;
// otherwise falls back to console logging so the app still runs without
// email credentials (useful for local/preview environments).
//
// Configure via env:
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS
//   EMAIL_FROM (e.g. "Scheduler <no-reply@scheduler.app>")
//   NEXT_PUBLIC_APP_URL (used to build cancel/reschedule links)

import nodemailer from "nodemailer";
import { formatInTimeZone } from "date-fns-tz";

type SendArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  cachedTransport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
      : undefined,
  });
  return cachedTransport;
}

async function sendMail(args: SendArgs): Promise<void> {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM || "Scheduler <no-reply@scheduler.local>";
  if (!transport) {
    // Fallback: log so the flow is visible in dev without SMTP creds.
    console.log(
      `\n[email:fallback] From: ${from}\n  To: ${args.to}\n  Subject: ${args.subject}\n  ---\n${args.text}\n`,
    );
    return;
  }
  await transport.sendMail({ from, to: args.to, subject: args.subject, text: args.text, html: args.html });
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function fmt(d: Date, tz: string) {
  return formatInTimeZone(d, tz, "EEE, MMM d, yyyy · h:mm a zzz");
}

type BookingWithRelations = {
  id: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeTimezone: string;
  startUtc: Date;
  endUtc: Date;
  eventType: { name: string };
  host: { displayName: string };
};

export async function sendBookingConfirmation(args: {
  booking: BookingWithRelations;
  cancellationToken: string;
}): Promise<void> {
  const { booking, cancellationToken } = args;
  const tz = booking.inviteeTimezone;
  const when = fmt(new Date(booking.startUtc), tz);
  const cancelUrl = `${baseUrl()}/booking/${booking.id}/cancel?token=${encodeURIComponent(cancellationToken)}`;
  const rescheduleUrl = `${baseUrl()}/booking/${booking.id}/reschedule?token=${encodeURIComponent(cancellationToken)}`;
  await sendMail({
    to: booking.inviteeEmail,
    subject: `Confirmed: ${booking.eventType.name} with ${booking.host.displayName}`,
    text:
      `Hi ${booking.inviteeName},\n\n` +
      `Your meeting "${booking.eventType.name}" with ${booking.host.displayName} is confirmed.\n\n` +
      `When: ${when}\n\n` +
      `Need to make changes?\n` +
      `Reschedule: ${rescheduleUrl}\n` +
      `Cancel: ${cancelUrl}\n\n` +
      `— Scheduler`,
  });
}

export async function sendCancellationNotice(args: {
  booking: BookingWithRelations;
  reason?: string | null;
  cancelledBy: "invitee" | "host";
}): Promise<void> {
  const { booking, reason, cancelledBy } = args;
  const tz = booking.inviteeTimezone;
  const when = fmt(new Date(booking.startUtc), tz);
  await sendMail({
    to: booking.inviteeEmail,
    subject: `Cancelled: ${booking.eventType.name} with ${booking.host.displayName}`,
    text:
      `Hi ${booking.inviteeName},\n\n` +
      `Your meeting "${booking.eventType.name}" on ${when} has been cancelled` +
      (cancelledBy === "host" ? ` by ${booking.host.displayName}` : "") +
      `.\n` +
      (reason ? `\nReason: ${reason}\n` : "") +
      `\n— Scheduler`,
  });
}

export async function sendRescheduleNotice(args: {
  booking: BookingWithRelations;
  oldStartUtc: Date;
}): Promise<void> {
  const { booking, oldStartUtc } = args;
  const tz = booking.inviteeTimezone;
  const before = fmt(new Date(oldStartUtc), tz);
  const after = fmt(new Date(booking.startUtc), tz);
  await sendMail({
    to: booking.inviteeEmail,
    subject: `Rescheduled: ${booking.eventType.name} with ${booking.host.displayName}`,
    text:
      `Hi ${booking.inviteeName},\n\n` +
      `Your meeting "${booking.eventType.name}" has been rescheduled.\n\n` +
      `Previously: ${before}\n` +
      `Now: ${after}\n\n` +
      `— Scheduler`,
  });
}
