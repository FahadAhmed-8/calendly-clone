"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { COMMON_TIMEZONES } from "@/lib/time";
import { MonthCalendar } from "@/components/public/MonthCalendar";
import { SlotPicker } from "@/components/public/SlotPicker";
import { BookingHeaderCard } from "@/components/public/BookingHeaderCard";
import { Icon } from "@/components/ui/Icon";
import { toast } from "sonner";

interface PageProps {
  params: {
    username: string;
    slug: string;
  };
}

export default function PublicBookingPage({ params }: PageProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [month, setMonth] = useState(new Date());
  const [timezone, setTimezone] = useState<string>("");

  // Detect user timezone on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  // Fetch event type details
  const {
    data: eventType,
    isLoading: eventLoading,
    error: eventError,
  } = useQuery({
    queryKey: ["publicEventType", params.username, params.slug],
    queryFn: () => api.publicEventType(params.username, params.slug),
  });

  // Fetch available slots for selected date
  const {
    data: slotsData,
    isLoading: slotsLoading,
  } = useQuery({
    queryKey: ["publicSlots", params.slug, selectedDate, timezone, params.username],
    queryFn: () => {
      if (!selectedDate || !timezone || !eventType) {
        return Promise.resolve({ slots: [] });
      }
      const dateStr = selectedDate.toISOString().split("T")[0];
      return api.publicSlots(params.slug, dateStr, timezone, params.username);
    },
    enabled: !!selectedDate && !!timezone && !!eventType,
  });

  if (eventError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-error text-lg font-semibold mb-2">Event not found</p>
          <p className="text-on-surface-variant text-sm">This event type is no longer available.</p>
        </div>
      </div>
    );
  }

  if (!timezone || !eventType) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-on-surface-variant">Loading...</div>
      </div>
    );
  }

  const handleSlotConfirm = (slotIso: string) => {
    const params_tz = new URLSearchParams({
      slot: slotIso,
      tz: timezone,
    });
    router.push(`./${params.slug}/book?${params_tz.toString()}`);
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    const newMonth = new Date(month);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setMonth(newMonth);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 md:p-8 bg-surface">
      <main className="w-full max-w-[960px] bg-surface-container-lowest rounded-xl shadow-elev-2 overflow-hidden flex flex-col md:flex-row">
        {/* Left Column: Host & Info */}
        <section className="w-full md:w-[30%] p-8 border-r border-outline-variant/20 flex flex-col gap-6 bg-surface-container-lowest">
          <BookingHeaderCard
            hostName={eventType.host?.displayName || "Host"}
            hostAvatarUrl={eventType.host?.avatarUrl}
            eventName={eventType.name}
            durationMinutes={eventType.durationMinutes}
            description={eventType.description}
          />
        </section>

        {/* Middle Column: Calendar */}
        <section className="w-full md:w-[40%] p-8 flex flex-col gap-6 bg-surface-bright">
          <MonthCalendar
            value={selectedDate}
            onChange={setSelectedDate}
            minDate={new Date()}
            month={month}
            onMonthChange={handleMonthChange}
          />

          {/* Timezone Select */}
          <div className="mt-auto pt-6 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 text-on-surface-variant/80">
              <Icon name="public" className="text-lg" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:ring-0 p-0 cursor-pointer outline-none"
              >
                {Array.from(new Set([timezone, ...COMMON_TIMEZONES])).map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Right Column: Slots or Empty State */}
        <section className="w-full md:w-[30%] p-8 flex flex-col items-center justify-center text-center gap-6 border-l border-outline-variant/20 bg-surface-container-lowest">
          {selectedDate ? (
            <div className="w-full">
              <div className="mb-6">
                <h3 className="text-on-surface font-semibold text-base mb-1">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </h3>
                <p className="text-on-surface-variant text-sm">Select a time</p>
              </div>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-on-surface-variant text-sm">Loading times...</p>
                </div>
              ) : (
                <SlotPicker
                  slots={slotsData?.slots || []}
                  tz={timezone}
                  onConfirm={handleSlotConfirm}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mx-auto">
                <Icon name="event_available" className="text-4xl text-primary" />
              </div>
              <h3 className="text-on-surface font-bold text-lg">Select a Date</h3>
              <p className="text-on-surface-variant text-sm px-4">
                Please select a date on the calendar to see available slots.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-6 text-center w-full pointer-events-none">
        <p className="text-xs text-on-surface-variant/60 font-medium">
          Powered by <span className="text-on-surface font-semibold">Scheduler</span>
        </p>
      </footer>
    </div>
  );
}
