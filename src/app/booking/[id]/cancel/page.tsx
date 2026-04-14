"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Textarea, Label } from "@/components/ui/Input";

export default function CancelBookingPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

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

  const cancel = useMutation({
    mutationFn: () => api.cancelBookingPublic(params.id, token || "", reason || undefined),
    onSuccess: () => { setDone(true); toast.success("Meeting cancelled"); },
    onError: (err: any) => {
      const code = err?.body?.error?.code;
      if (code === "INVALID_TOKEN") toast.error("This cancellation link is invalid or has expired.");
      else toast.error(err?.body?.error?.message || "Failed to cancel");
    },
  });

  if (isLoading) return <Shell><p className="text-on-surface-variant">Loading...</p></Shell>;
  if (error || !booking) return <Shell><p className="text-error">Booking not found.</p></Shell>;

  const tz = booking.invitee?.timezone || "UTC";
  const start = new Date(booking.startUtc);
  const end = new Date(booking.endUtc);

  if (done || booking.status === "cancelled") {
    return (
      <Shell>
        <div className="max-w-lg w-full bg-surface-container-lowest rounded-xl shadow-elev-2 p-10 flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
            <Icon name="event_busy" className="text-4xl text-error" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">This meeting has been cancelled.</h1>
          <p className="text-on-surface-variant text-sm">The host has been notified.</p>
        </div>
      </Shell>
    );
  }

  if (!token) {
    return <Shell><p className="text-error">Missing cancellation token.</p></Shell>;
  }

  return (
    <Shell>
      <div className="max-w-lg w-full bg-surface-container-lowest rounded-xl shadow-elev-2 p-10 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Cancel your meeting</h1>
          <p className="text-on-surface-variant text-sm">Are you sure you want to cancel this booking?</p>
        </div>

        <div className="bg-surface-container-low rounded-lg p-5 flex flex-col gap-3">
          <Row icon="event_note" label={booking.eventType?.name} />
          <Row icon="schedule" label={`${formatInTimeZone(start, tz, "h:mm a")} – ${formatInTimeZone(end, tz, "h:mm a")}, ${formatInTimeZone(start, tz, "EEEE, MMMM d, yyyy")}`} />
          <Row icon="public" label={tz} />
        </div>

        <div>
          <Label>Reason for cancellation (optional)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let the host know why you're cancelling..." rows={4} />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => history.back()}>Go back</Button>
          <Button variant="primary" className="bg-error hover:bg-error/90" onClick={() => cancel.mutate()} loading={cancel.isPending}>Cancel event</Button>
        </div>
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
