"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

export default function EditEventTypePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["event-type", params.id], queryFn: () => api.getEventType(params.id) });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = useMutation({
    mutationFn: () => api.updateEventType(params.id, {
      name: form.name, slug: form.slug, durationMinutes: form.durationMinutes,
      description: form.description, color: form.color, active: form.active,
    }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["event-types"] }); },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Save failed"),
  });

  const del = useMutation({
    mutationFn: () => api.deleteEventType(params.id),
    onSuccess: () => { toast.success("Deleted"); router.push("/event-types"); },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Delete failed"),
  });

  if (isLoading || !form) return <AdminShell title="Edit Event Type"><div className="h-96 animate-pulse bg-surface-container-lowest rounded-xl" /></AdminShell>;

  return (
    <AdminShell title="Edit Event Type">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-elev-1">
          <h2 className="text-xl font-bold mb-6">What event is this?</h2>
          <div className="space-y-5">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-outline font-mono bg-surface-container-low px-3 h-10 inline-flex items-center rounded">scheduler.app/fhd/</span>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} />
              </div>
            </div>
            <div>
              <Label>Duration</Label>
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60, 90, 120].map((d) => (
                  <button key={d} onClick={() => setForm({ ...form, durationMinutes: d })}
                    className={`h-10 px-4 rounded text-sm font-semibold transition ${form.durationMinutes === d ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2">
                {["#0054cc", "#10B981", "#A855F7", "#F59E0B", "#EF4444", "#14B8A6"].map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "ring-2 ring-primary ring-offset-2 scale-110" : ""}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.active ? "bg-primary" : "bg-outline-variant"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.active ? "left-6" : "left-0.5"}`} />
              </button>
              <span className="text-sm font-medium">{form.active ? "Active" : "Hidden"}</span>
            </div>
          </div>
          <div className="mt-8 pt-6 flex justify-between items-center">
            <Button variant="ghost" className="text-error" onClick={() => { if (confirm("Delete this event type?")) del.mutate(); }}>
              <Icon name="delete" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => router.push("/event-types")}>Cancel</Button>
              <Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-elev-1">
          <p className="text-xs font-bold text-outline uppercase tracking-widest mb-4">Preview</p>
          <div className="flex flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary font-bold text-xl">F</div>
            <div>
              <h3 className="text-on-surface-variant text-sm">Fhd</h3>
              <h1 className="text-on-surface text-xl font-bold tracking-tight mt-1">{form.name}</h1>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Icon name="schedule" className="text-xl" /><span className="text-sm font-medium">{form.durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-3 text-on-surface-variant">
              <Icon name="videocam" className="text-xl" /><span className="text-sm font-medium">Web conferencing details provided upon confirmation.</span>
            </div>
            {form.description && <p className="text-on-surface-variant text-sm leading-relaxed">{form.description}</p>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
