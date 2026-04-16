"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/cn";
import { PageLoader } from "@/components/ui/PageLoader";

type Tab = "upcoming" | "past" | "cancelled";

export default function MeetingsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data: meetings, isLoading } = useQuery({ queryKey: ["meetings", tab], queryFn: () => api.listBookings(tab) });
  const cancel = useMutation({
    mutationFn: (id: string) => api.cancelBookingAdmin(id),
    onSuccess: () => { toast.success("Meeting cancelled"); setConfirmId(null); qc.invalidateQueries({ queryKey: ["meetings"] }); },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Failed"),
  });

  // Show meetings in the admin's browser timezone. "Asia/Kolkata" was
  // hardcoded, so meetings displayed wrong times for any admin in another tz.
  // Default to UTC on the server render pass to avoid hydration mismatch,
  // then switch to the browser's tz once mounted.
  const [tz, setTz] = useState<string>("UTC");
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);
  const grouped = useMemo(() => groupByDate(meetings || [], tz), [meetings, tz]);

  return (
    <AdminShell title="Meetings">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface mb-2">Meetings</h2>
        <p className="text-on-surface-variant max-w-md text-sm md:text-base">See everyone who has booked time with you.</p>
      </div>

      <div className="flex gap-4 md:gap-6 mb-8 overflow-x-auto">
        {(["upcoming", "past", "cancelled"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            "pb-3 text-sm font-semibold capitalize transition-colors relative",
            tab === t ? "text-primary" : "text-on-surface-variant hover:text-on-surface",
          )}>
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !meetings?.length ? (
        <div className="flex flex-col items-center text-center py-20">
          <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center mb-4"><Icon name="event_busy" className="text-4xl text-outline" /></div>
          <h3 className="text-lg font-bold text-on-surface">No {tab} meetings</h3>
          <p className="text-on-surface-variant text-sm mt-1">When someone books with you, it'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([label, items]) => (
            <div key={label}>
              <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-3">{label}</h3>
              <div className="bg-surface-container-lowest rounded-xl overflow-hidden">
                {items.map((m: any, i: number) => (
                  <div key={m.id} className={cn("flex items-center gap-4 px-5 py-4 group hover:bg-surface-container-low/50 transition", i > 0 && "mt-px")}>
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: m.eventType?.color || "#0054cc" }} />
                    <div className={cn("flex-1", m.status === "cancelled" && "opacity-60")}>
                      <div className={cn("text-sm font-semibold text-on-surface", m.status === "cancelled" && "line-through")}>
                        {formatInTimeZone(new Date(m.startUtc), tz, "h:mm a")} – {formatInTimeZone(new Date(m.endUtc), tz, "h:mm a")}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        <span className="font-medium">{m.invitee.name}</span> <span className="text-outline">·</span> {m.eventType?.name}
                      </div>
                    </div>
                    {m.status === "cancelled" && <span className="text-[10px] font-bold uppercase tracking-wider bg-error-container text-on-error-container px-2 py-1 rounded-full">Cancelled</span>}
                    {tab === "upcoming" && (
                      <div className="opacity-0 group-hover:opacity-100 transition flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setConfirmId(m.id)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && cancel.mutate(confirmId)}
        title="Cancel this meeting?"
        message="The invitee will be notified and the slot will be freed."
        confirmLabel="Cancel meeting"
        cancelLabel="Keep it"
        destructive
        loading={cancel.isPending}
      />
    </AdminShell>
  );
}

function groupByDate(items: any[], tz: string): [string, any[]][] {
  const groups: Record<string, any[]> = {};
  const today = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  const tomorrow = formatInTimeZone(new Date(Date.now() + 86400000), tz, "yyyy-MM-dd");
  for (const m of items) {
    const d = formatInTimeZone(new Date(m.startUtc), tz, "yyyy-MM-dd");
    let label = formatInTimeZone(new Date(m.startUtc), tz, "EEEE, MMM d");
    if (d === today) label = "Today";
    else if (d === tomorrow) label = "Tomorrow";
    groups[label] ??= [];
    groups[label].push(m);
  }
  return Object.entries(groups);
}
