"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { BookingHeaderCard } from "@/components/public/BookingHeaderCard";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export default function BookingFormPage() {
  const params = useParams<{ username: string; slug: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const slotIso = search.get("slot") || "";
  const tz = search.get("tz") || "UTC";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const { data: eventType } = useQuery({
    queryKey: ["publicEventType", params.username, params.slug],
    queryFn: () => api.publicEventType(params.username, params.slug),
  });

  const book = useMutation({
    mutationFn: () => {
      if (!eventType?.id) throw new Error("Event type not loaded");
      return api.createBooking({
        eventTypeId: eventType.id,
        startUtc: new Date(slotIso).toISOString(),
        inviteeName: name,
        inviteeEmail: email,
        inviteeTimezone: tz,
        notes: notes || null,
      });
    },
    onSuccess: (data: any) => {
      try {
        if (data?.cancellationToken) {
          sessionStorage.setItem(`bt:${data.id}`, data.cancellationToken);
        }
      } catch {}
      router.push(`/booking/${data.id}/confirmation?token=${encodeURIComponent(data.cancellationToken || "")}`);
    },
    onError: (err: any) => {
      const code = err?.body?.error?.code;
      if (code === "SLOT_TAKEN") setBanner("This slot was just taken. Please select a new time.");
      else if (code === "VALIDATION_ERROR") {
        const details = err?.body?.error?.details || {};
        setErrors(details);
      } else toast.error(err?.body?.error?.message || "Booking failed");
    },
  });

  if (!slotIso) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-on-surface-variant">Missing slot. <Link href={`/${params.username}/${params.slug}`} className="text-primary underline">Go back</Link></p>
      </div>
    );
  }

  const durationMinutes = eventType?.durationMinutes || 30;
  const endIso = new Date(new Date(slotIso).getTime() + durationMinutes * 60000).toISOString();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {banner && (
        <div className="w-full bg-error text-on-error py-3 px-6 flex items-center justify-center gap-3">
          <Icon name="error" className="text-lg" />
          <p className="text-sm font-medium">{banner}</p>
        </div>
      )}
      <main className="flex-grow flex items-center justify-center p-4 md:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-[380px_1fr] bg-surface-container-lowest rounded-xl overflow-hidden shadow-elev-2">
          <aside className="bg-surface-container-low p-8 flex flex-col gap-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors group w-fit">
              <Icon name="arrow_back" className="text-lg group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back</span>
            </button>
            {eventType && (
              <div className="flex flex-col gap-6">
                <BookingHeaderCard
                  hostName={eventType.host?.displayName || "Host"}
                  hostAvatarUrl={eventType.host?.avatarUrl}
                  eventName={eventType.name}
                  durationMinutes={durationMinutes}
                  description={eventType.description}
                />
                <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant/20">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Icon name="calendar_today" className="text-xl opacity-60" />
                    <span className="text-sm font-medium">{formatInTimeZone(new Date(slotIso), tz, "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Icon name="access_time" className="text-xl opacity-60" />
                    <span className="text-sm font-medium">
                      {formatInTimeZone(new Date(slotIso), tz, "h:mm a")} – {formatInTimeZone(new Date(endIso), tz, "h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <Icon name="public" className="text-xl opacity-60" />
                    <span className="text-sm font-medium">{tz}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          <section className="p-8 md:p-12 flex flex-col">
            <div className="max-w-md w-full">
              <h2 className="text-xl font-bold text-on-surface mb-8">Enter Details</h2>
              <div className="flex flex-col gap-6">
                <div>
                  <Label>Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" error={errors.name} />
                  <FieldError message={errors.name} />
                </div>
                <div>
                  <Label>Email Address *</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" error={errors.email} />
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <Label>Anything else we should know?</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Please share any pre-meeting requirements or agenda points..." rows={4} />
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button onClick={() => { if (validate()) book.mutate(); }} loading={book.isPending}>Schedule Event</Button>
            </div>
          </section>
        </div>
      </main>
      <footer className="p-6 text-center">
        <p className="text-xs text-on-surface-variant/60 font-medium">Powered by <span className="text-on-surface font-semibold">Scheduler</span></p>
      </footer>
    </div>
  );
}
