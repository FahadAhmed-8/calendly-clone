"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Input";
import { api } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export default function EventTypesPage() {
  const qc = useQueryClient();
  const { data: eventTypes, isLoading } = useQuery({ queryKey: ["event-types"], queryFn: api.listEventTypes });
  const [createOpen, setCreateOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => api.deleteEventType(id),
    onSuccess: () => { toast.success("Event type deleted"); setToDelete(null); qc.invalidateQueries({ queryKey: ["event-types"] }); },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Delete failed"),
  });

  const copyLink = (url: string) => { navigator.clipboard.writeText(url); toast.success("Link copied"); };

  return (
    <AdminShell title="Event Types">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Event Types</h2>
          <p className="text-on-surface-variant max-w-md">Manage your public booking links and personal scheduling automation rules from a single dashboard.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Icon name="add" /><span>Create New</span></Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-6 h-44 animate-pulse" />
          ))}
        </div>
      ) : !eventTypes?.length ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventTypes.map((e: any) => (
            <div key={e.id} className="relative bg-surface-container-lowest rounded-xl p-6 shadow-elev-1 hover:shadow-elev-2 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color, boxShadow: `0 0 8px ${e.color}66` }} />
                <div className="flex items-center gap-2">
                  <button onClick={() => copyLink(e.bookingUrl)} className="text-outline hover:text-primary transition-colors" aria-label="Copy link"><Icon name="content_copy" /></button>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === e.id ? null : e.id)} className="text-outline hover:text-primary transition-colors"><Icon name="more_horiz" /></button>
                    {openMenuId === e.id && (
                      <div className="absolute right-0 top-8 w-48 bg-surface-container-lowest rounded-lg shadow-elev-3 py-2 z-10 ghost-border">
                        <Link href={`/event-types/${e.id}/edit`} className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-3">
                          <Icon name="edit" className="text-lg" /> Edit
                        </Link>
                        <button
                          onClick={() => { setOpenMenuId(null); setToDelete({ id: e.id, name: e.name }); }}
                          className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/20 flex items-center gap-3"
                        >
                          <Icon name="delete" className="text-lg" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-1">{e.name}</h3>
              <div className="flex items-center gap-3 mb-6">
                <span className="px-2 py-1 bg-surface-container-low text-on-surface-variant text-xs font-semibold rounded uppercase tracking-wider">{e.durationMinutes} mins</span>
                {e.active && (
                  <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Active
                  </span>
                )}
              </div>
              <Link href={e.bookingUrl.replace(process.env.NEXT_PUBLIC_APP_URL || "", "") || `/${e.slug}`} className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
                View booking page <Icon name="arrow_forward" className="text-sm" />
              </Link>
            </div>
          ))}
          <button onClick={() => setCreateOpen(true)} className="rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity group ghost-border">
            <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon name="add" className="text-outline" />
            </div>
            <p className="text-sm font-semibold text-on-surface-variant">Add another template</p>
            <p className="text-xs text-outline">Streamline your workflows</p>
          </button>
        </div>
      )}

      <CreateEventTypeModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        title={`Delete "${toDelete?.name ?? ""}"?`}
        message="This event type will stop accepting bookings. Existing bookings are preserved."
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
      />
    </AdminShell>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-24">
      <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mb-6">
        <Icon name="event_note" className="text-5xl text-primary" />
      </div>
      <h3 className="text-2xl font-bold text-on-surface mb-2">Create your first event type</h3>
      <p className="text-on-surface-variant max-w-sm mb-6">Event types are reusable scheduling links that make it easy for people to book time with you.</p>
      <Button onClick={onCreate}><Icon name="add" /><span>Create Event Type</span></Button>
    </div>
  );
}

function CreateEventTypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("30 Minute Meeting");
  const [slug, setSlug] = useState("30min");
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0054cc");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const colors = ["#0054cc", "#10B981", "#A855F7", "#F59E0B", "#EF4444", "#14B8A6"];

  const create = useMutation({
    mutationFn: () => api.createEventType({ name, slug, durationMinutes: duration, description: description || null, color }),
    onSuccess: () => {
      toast.success("Event type created");
      qc.invalidateQueries({ queryKey: ["event-types"] });
      onClose();
      setName(""); setSlug(""); setDescription(""); setErrors({});
    },
    onError: (err: any) => {
      const code = err?.body?.error?.code;
      if (code === "SLUG_TAKEN") setErrors({ slug: "Already in use" });
      else toast.error(err?.body?.error?.message || "Create failed");
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Create Event Type" size="md">
      <div className="space-y-5">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="30 Minute Meeting" />
        </div>
        <div>
          <Label>Duration</Label>
          <div className="flex gap-2">
            {[15, 30, 45, 60, 90].map((d) => (
              <button key={d} onClick={() => setDuration(d)}
                className={`h-10 px-4 rounded text-sm font-semibold transition ${duration === d ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}>
                {d} min
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>URL Slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-outline font-mono bg-surface-container-low px-3 h-10 inline-flex items-center rounded">scheduler.app/fhd/</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} error={errors.slug} />
          </div>
          <FieldError message={errors.slug} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this event about?" />
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-transform ${color === c ? "ring-2 ring-primary ring-offset-2 scale-110" : ""}`}
                style={{ backgroundColor: c }} aria-label={c} />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} loading={create.isPending}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}
