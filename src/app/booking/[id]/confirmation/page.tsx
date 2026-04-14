"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export default function ConfirmationPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = search.get("token");
    if (t) setToken(t);
    else {
      try { setToken(sessionStorage.getItem(`bt:${params.id}`)); } catch {}
    }
  }, [params.id, search]);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking", params.id, token],
    queryFn: () => api.publicBooking(params.id, token || undefined),
    enabled: !!params.id,
  });

  if (isLoading) return <Shell><p className="text-on-surface-variant">Loading...</p></Shell>;
  if (error || !booking) return <Shell><p className="text-error">Booking not found.</p></Shell>;

  const tz = booking.inviteeTimezone || "UTC";
  const start = new Date(booking.startUtc);
  const end = new Date(booking.endUtc);
  const hostName = booking.eventType?.host?.displayName || "Host";

  const gcalUrl = buildGoogleCal(booking, start, end, hostName);
  const outlookUrl = buildOutlook(booking, start, end, hostName);
  const icsDataUrl = buildIcsDataUrl(booking, start, end, hostName);

  return (
    <Shell>
      <div className="max-w-xl w-full bg-surface-container-lowest rounded-xl shadow-elev-2 p-10 flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <Icon name="check_circle" className="text-5xl text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-1">You are scheduled</h1>
          <p className="text-on-surface-variant text-sm">A calendar invitation has been sent to your email.</p>
        </div>

        <div className="w-full bg-surface-container-low rounded-lg p-5 flex flex-col gap-3 text-left">
          <Row icon="event_note" label={booking.eventType?.name} />
          <Row icon="schedule" label={`${formatInTimeZone(start, tz, "h:mm a")} – ${formatInTimeZone(end, tz, "h:mm a")}, ${formatInTimeZone(start, tz, "EEEE, MMMM d, yyyy")}`} />
          <Row icon="public" label={tz} />
          <Row icon="person" label={`with ${hostName}`} />
        </div>

        <div className="w-full">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 text-left">Add to calendar</p>
          <div className="flex flex-wrap gap-2">
            <a href={gcalUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px]">
              <Button variant="ghost" className="w-full"><Icon name="event" /> Google</Button>
            </a>
            <a href={outlookUrl} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px]">
              <Button variant="ghost" className="w-full"><Icon name="event" /> Outlook</Button>
            </a>
            <a href={icsDataUrl} download={`booking-${booking.id}.ics`} className="flex-1 min-w-[100px]">
              <Button variant="ghost" className="w-full"><Icon name="download" /> ICS</Button>
            </a>
          </div>
        </div>

        {token && booking.status !== "cancelled" && (
          <Link href={`/booking/${booking.id}/cancel?token=${encodeURIComponent(token)}`} className="text-sm text-on-surface-variant hover:text-error font-medium">
            Need to cancel? <span className="underline">Cancel this meeting</span>
          </Link>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface flex items-center justify-center p-4 md:p-8">{children}</div>;
}

function Row({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-on-surface-variant">
      <Icon name={icon} className="text-xl opacity-60" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toCalDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function buildGoogleCal(b: any, start: Date, end: Date, host: string) {
  const title = encodeURIComponent(`${b.eventType?.name || "Meeting"} with ${host}`);
  const details = encodeURIComponent(b.invitee?.notes || "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${toCalDate(start)}/${toCalDate(end)}&details=${details}`;
}

function buildOutlook(b: any, start: Date, end: Date, host: string) {
  const title = encodeURIComponent(`${b.eventType?.name || "Meeting"} with ${host}`);
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${start.toISOString()}&enddt=${end.toISOString()}`;
}

function buildIcsDataUrl(b: any, start: Date, end: Date, host: string) {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Scheduler//EN",
    "BEGIN:VEVENT",
    `UID:${b.id}@scheduler`,
    `DTSTAMP:${toCalDate(new Date())}`,
    `DTSTART:${toCalDate(start)}`,
    `DTEND:${toCalDate(end)}`,
    `SUMMARY:${(b.eventType?.name || "Meeting").replace(/\n/g, " ")} with ${host}`,
    `DESCRIPTION:${(b.invitee?.notes || "").replace(/\n/g, "\\n")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
