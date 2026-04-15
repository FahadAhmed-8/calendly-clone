"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";

type Question = {
  id?: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[] | null;
  required?: boolean;
  position?: number;
};

export default function EditEventTypePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["event-type", params.id], queryFn: () => api.getEventType(params.id) });
  const { data: schedules } = useQuery({ queryKey: ["schedules"], queryFn: api.listSchedules });
  const { data: initialQuestions } = useQuery({ queryKey: ["questions", params.id], queryFn: () => api.listQuestions(params.id) });

  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);
  useEffect(() => { if (initialQuestions) setQuestions(initialQuestions as Question[]); }, [initialQuestions]);

  const save = useMutation({
    mutationFn: () =>
      // Single PATCH — the server saves core fields AND questions in one
      // transaction, so we can't end up with a half-saved state where the
      // event type updated but questions didn't (or vice versa).
      api.updateEventType(params.id, {
        name: form.name, slug: form.slug, durationMinutes: form.durationMinutes,
        description: form.description, color: form.color, active: form.active,
        bufferBeforeMinutes: form.bufferBeforeMinutes, bufferAfterMinutes: form.bufferAfterMinutes,
        scheduleId: form.scheduleId ?? null,
        questions,
      }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["event-types"] });
      qc.invalidateQueries({ queryKey: ["questions", params.id] });
    },
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
                <SlugPrefix />
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
            <div>
              <Label>Availability schedule</Label>
              <select
                value={form.scheduleId ?? ""}
                onChange={(e) => setForm({ ...form, scheduleId: e.target.value || null })}
                className="w-full h-10 px-3 rounded bg-surface-container-lowest ghost-border focus-ring text-sm"
              >
                <option value="">(Use default)</option>
                {schedules?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}{s.isDefault ? " — default" : ""}</option>
                ))}
              </select>
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
            <Button variant="ghost" className="text-error" onClick={() => setConfirmDelete(true)}>
              <Icon name="delete" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => router.push("/event-types")}>Cancel</Button>
              <Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button>
            </div>
          </div>
        </div>

        {/* Right column: Preview + Custom questions editor */}
        <div className="flex flex-col gap-6">
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
              {form.description && <p className="text-on-surface-variant text-sm leading-relaxed">{form.description}</p>}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-elev-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Custom invitee questions</h3>
                <p className="text-sm text-on-surface-variant">Ask for extra information on the booking form.</p>
              </div>
              <Button variant="ghost" onClick={() => setQuestions([...questions, { label: "New question", type: "text", required: false }])}>
                <Icon name="add" /> Add
              </Button>
            </div>
            {questions.length === 0 ? (
              <p className="text-sm text-outline">No questions yet. Invitees will only be asked for name & email.</p>
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={i} className="p-4 rounded-lg bg-surface-container-low space-y-2">
                    <div className="flex items-center gap-2">
                      <Input value={q.label} onChange={(e) => {
                        const n = [...questions]; n[i] = { ...n[i], label: e.target.value }; setQuestions(n);
                      }} />
                      <button onClick={() => { const n = [...questions]; n.splice(i, 1); setQuestions(n); }}
                        className="text-outline hover:text-error p-2"><Icon name="delete" /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={q.type}
                        onChange={(e) => { const n = [...questions]; n[i] = { ...n[i], type: e.target.value as Question["type"] }; setQuestions(n); }}
                        className="h-9 px-3 text-sm rounded bg-surface-container-lowest ghost-border focus-ring"
                      >
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                        <option value="select">Dropdown</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!q.required}
                          onChange={(e) => { const n = [...questions]; n[i] = { ...n[i], required: e.target.checked }; setQuestions(n); }} />
                        Required
                      </label>
                    </div>
                    {q.type === "select" && (
                      <Input
                        placeholder="Comma-separated options (e.g. Engineering, Design, PM)"
                        value={(q.options || []).join(", ")}
                        onChange={(e) => {
                          const opts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          const n = [...questions]; n[i] = { ...n[i], options: opts }; setQuestions(n);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => del.mutate()}
        title="Delete this event type?"
        message="It will stop accepting new bookings. Existing bookings are preserved."
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
      />
    </AdminShell>
  );
}

function SlugPrefix() {
  const [host, setHost] = useState<string>("");
  useEffect(() => { setHost(window.location.host); }, []);
  return (
    <span className="text-xs text-outline font-mono bg-surface-container-low px-3 h-10 inline-flex items-center rounded">
      {host || "your-site.com"}/fhd/
    </span>
  );
}
