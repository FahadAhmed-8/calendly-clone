"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatLocalDate } from "@/lib/time";
import { MonthCalendar } from "@/components/public/MonthCalendar";
import { SlotPicker } from "@/components/public/SlotPicker";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

export default function ReschedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const t = search.get("token");
    if (t) setToken(t);
    else {
      try { setToken(sessionStorage.getItem(`bt:${params.id}`)); } catch {}
    }
  }, [params.id, search]);

  const { data: booking } = useQuery({
    queryKey: ["booking", params.id],
    queryFn: () => api.publicBooking(params.id, token || undefined),
    enabled: !!params.id,
  });

  const tz = booking?.invitee?.timezone || "UTC";

  // Fetch slots for the selected date, using the event type's public slug.
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["reschedule-slots", booking?.eventType?.slug, booking?.host?.username, selectedDate?.toISOString(), tz],
    queryFn: () => {
      if (!selectedDate || !booking) return Promise.resolve({ slots: [] as string[] });
      // LOCAL date — see formatLocalDate docstring for why toISOString is wrong.
      const dateStr = formatLocalDate(selectedDate);
      return api.publicSlots(booking.eventType.slug, dateStr, tz, booking.host.username);
    },
    enabled: !!selectedDate && !!booking,
  });

  const reschedule = useMutation({
    mutationFn: (slotIso: string) => api.reschedule(params.id, { token: token!, startUtc: slotIso }),
    onSuccess: () => {
      toast.success("Meeting rescheduled");
      router.push(`/booking/${params.id}/confirmation${token ? `?token=${encodeURIComponent(token)}` : ""}`);
    },
    onError: (err: any) => {
      const code = err?.body?.error?.code;
      if (code === "SLOT_TAKEN") toast.error("That time was just taken. Please choose another.");
      else toast.error(err?.body?.error?.message || "Reschedule failed");
    },
  });

  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center p-4"><p className="text-on-surface-variant">Loading…</p></div>;
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Icon name="lock" className="text-4xl text-outline mb-3" />
          <p className="text-on-surface font-semibold mb-2">Missing token</p>
          <p className="text-on-surface-variant text-sm">This reschedule link is missing its security token. Please use the link from your confirmation email.</p>
        </div>
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-on-surface-variant">This booking was cancelled and cannot be rescheduled.</p>
      </div>
    );
  }

  const start = new Date(booking.startUtc);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 md:p-8">
      <main className="w-full max-w-[960px] bg-surface-container-lowest rounded-xl shadow-elev-2 overflow-hidden flex flex-col md:flex-row">
        <section className="w-full md:w-[34%] p-8 border-r border-outline-variant/20 flex flex-col gap-6">
          <Button variant="ghost" onClick={() => router.back()} className="self-start">
            <Icon name="arrow_back" /> Back
          </Button>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Reschedule</p>
            <h1 className="text-xl font-bold text-on-surface">{booking.eventType?.name}</h1>
            <p className="text-sm text-on-surface-variant mt-1">with {booking.host?.displayName}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4 text-sm">
            <p className="text-xs font-semibold uppercase text-outline mb-1">Currently scheduled</p>
            <p className="text-on-surface font-medium">
              {formatInTimeZone(start, tz, "EEE, MMM d • h:mm a")}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{tz}</p>
          </div>
        </section>

        <section className="w-full md:w-[36%] p-8 bg-surface-bright">
          <MonthCalendar
            value={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            month={month}
            onMonthChange={(d) => {
              const nm = new Date(month);
              nm.setMonth(nm.getMonth() + (d === "prev" ? -1 : 1));
              setMonth(nm);
            }}
          />
        </section>

        <section className="w-full md:w-[30%] p-8 border-l border-outline-variant/20 flex flex-col">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-base mb-4">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </h3>
              {slotsLoading ? (
                <p className="text-sm text-on-surface-variant">Loading times…</p>
              ) : (
                <SlotPicker
                  slots={slotsData?.slots || []}
                  tz={tz}
                  onConfirm={(iso) => reschedule.mutate(iso)}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Icon name="event_available" className="text-4xl text-primary mb-3" />
              <p className="font-semibold">Pick a new date</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
