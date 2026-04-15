"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api-client";
import { COMMON_TIMEZONES, formatLocalDate } from "@/lib/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Rule = { weekday: number; startTime: string; endTime: string };
type Override = { date: string; blocks: { start: string; end: string }[] };

export default function AvailabilityPage() {
  const qc = useQueryClient();
  const { data: schedules } = useQuery({ queryKey: ["schedules"], queryFn: api.listSchedules });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-pick the default schedule when list loads.
  useEffect(() => {
    if (schedules?.length && !selectedId) {
      const def = schedules.find((s: any) => s.isDefault) || schedules[0];
      setSelectedId(def.id);
    }
  }, [schedules, selectedId]);

  const { data: schedule } = useQuery({
    queryKey: ["schedule", selectedId],
    queryFn: () => api.getSchedule(selectedId!),
    enabled: !!selectedId,
  });

  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [rulesByDay, setRulesByDay] = useState<Record<number, { start: string; end: string }[]>>({});
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!schedule) return;
    setTimezone(schedule.timezone);
    setName(schedule.name);
    const map: Record<number, { start: string; end: string }[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const r of schedule.rules as Rule[]) {
      map[r.weekday] ??= [];
      map[r.weekday].push({ start: r.startTime, end: r.endTime });
    }
    setRulesByDay(map);
    setOverrides((schedule.overrides as any[]).map((o) => ({ date: o.date, blocks: (o.blocks as any) || [] })));
  }, [schedule]);

  const save = useMutation({
    mutationFn: () => {
      const rules: Rule[] = [];
      for (const [dayStr, ranges] of Object.entries(rulesByDay)) {
        const day = Number(dayStr);
        for (const r of ranges) rules.push({ weekday: day, startTime: r.start, endTime: r.end });
      }
      return api.saveSchedule(selectedId!, { timezone, rules, overrides });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["schedule", selectedId] });
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Save failed"),
  });

  const rename = useMutation({
    mutationFn: () => api.patchSchedule(selectedId!, { name }),
    onSuccess: () => { toast.success("Renamed"); qc.invalidateQueries({ queryKey: ["schedules"] }); },
  });

  const setDefault = useMutation({
    mutationFn: () => api.patchSchedule(selectedId!, { isDefault: true }),
    onSuccess: () => { toast.success("Set as default"); qc.invalidateQueries({ queryKey: ["schedules"] }); },
  });

  const create = useMutation({
    mutationFn: (payload: { name: string; timezone: string }) => api.createSchedule(payload),
    onSuccess: (s: any) => {
      toast.success("Schedule created");
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setSelectedId(s.id);
    },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Create failed"),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteSchedule(selectedId!),
    onSuccess: () => {
      toast.success("Deleted");
      setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Delete failed"),
  });

  const selected = useMemo(() => schedules?.find((s: any) => s.id === selectedId), [schedules, selectedId]);

  return (
    <AdminShell title="Availability">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Availability</h2>
          <p className="text-on-surface-variant max-w-md">Manage multiple schedules; link each event type to one.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-container-lowest ghost-border text-sm font-semibold focus-ring"
          >
            {schedules?.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.isDefault ? " (default)" : ""}</option>
            ))}
          </select>
          <Button
            variant="ghost"
            onClick={() => {
              const n = prompt("New schedule name");
              if (!n) return;
              create.mutate({ name: n, timezone });
            }}
          >
            <Icon name="add" /> New
          </Button>
        </div>
      </div>

      {selected && (
        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-elev-1 mb-6">
          <div className="flex flex-wrap items-end gap-3 justify-between mb-6">
            <div className="flex items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => { if (name && name !== selected.name) rename.mutate(); }}
                className="h-10 px-3 text-lg font-bold rounded bg-surface-container-lowest ghost-border focus-ring"
              />
              {selected.isDefault ? (
                <span className="text-xs font-bold uppercase tracking-wide text-primary">Default</span>
              ) : (
                <button onClick={() => setDefault.mutate()} className="text-xs font-semibold text-primary hover:underline">
                  Make default
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-4 h-10 ghost-border">
              <Icon name="public" className="text-outline text-lg" />
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="bg-transparent text-sm font-semibold focus:outline-none">
                {COMMON_TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
              </select>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-4">Weekly hours</h3>
          <div className="space-y-4">
            {DAYS.map((day, i) => {
              const ranges = rulesByDay[i] || [];
              const enabled = ranges.length > 0;
              return (
                <div key={day} className="flex items-start gap-6 py-2">
                  <button onClick={() => setRulesByDay({ ...rulesByDay, [i]: enabled ? [] : [{ start: "09:00", end: "17:00" }] })}
                    className={`mt-2 w-10 h-5 rounded-full transition-colors relative ${enabled ? "bg-primary" : "bg-outline-variant"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${enabled ? "left-5" : "left-0.5"}`} />
                  </button>
                  <div className="w-12 pt-2 text-sm font-semibold text-on-surface">{day}</div>
                  {enabled ? (
                    <div className="flex-1 space-y-2">
                      {ranges.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <TimeInput value={r.start} onChange={(v) => {
                            const next = [...ranges]; next[idx] = { ...next[idx], start: v };
                            setRulesByDay({ ...rulesByDay, [i]: next });
                          }} />
                          <span className="text-outline">–</span>
                          <TimeInput value={r.end} onChange={(v) => {
                            const next = [...ranges]; next[idx] = { ...next[idx], end: v };
                            setRulesByDay({ ...rulesByDay, [i]: next });
                          }} />
                          <button onClick={() => {
                            const next = [...ranges]; next.splice(idx, 1);
                            setRulesByDay({ ...rulesByDay, [i]: next });
                          }} className="text-outline hover:text-error"><Icon name="delete" /></button>
                        </div>
                      ))}
                      <button onClick={() => setRulesByDay({ ...rulesByDay, [i]: [...ranges, { start: "09:00", end: "17:00" }] })}
                        className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                        <Icon name="add" className="text-sm" /> Add range
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 pt-2 text-sm text-outline">Unavailable</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overrides */}
          <div className="mt-10 pt-6 border-t border-outline-variant/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Date-specific hours</h3>
                <p className="text-sm text-on-surface-variant">Override weekly hours on specific dates (holidays, half-days, etc.).</p>
              </div>
              <Button variant="ghost" onClick={() => {
                const today = formatLocalDate(new Date());
                setOverrides([...overrides, { date: today, blocks: [] }]);
              }}>
                <Icon name="add" /> Add date
              </Button>
            </div>
            {overrides.length === 0 ? (
              <p className="text-sm text-outline">No overrides yet.</p>
            ) : (
              <div className="space-y-3">
                {overrides.map((o, oi) => (
                  <div key={oi} className="flex items-start gap-4 p-3 rounded-lg bg-surface-container-low">
                    <input type="date" value={o.date}
                      onChange={(e) => { const next = [...overrides]; next[oi] = { ...next[oi], date: e.target.value }; setOverrides(next); }}
                      className="h-10 px-3 text-sm rounded bg-surface-container-lowest ghost-border focus-ring" />
                    <div className="flex-1 space-y-2">
                      {o.blocks.length === 0 && (
                        <span className="text-xs font-semibold text-error">Unavailable all day</span>
                      )}
                      {o.blocks.map((b, bi) => (
                        <div key={bi} className="flex items-center gap-2">
                          <TimeInput value={b.start} onChange={(v) => {
                            const next = [...overrides]; const bs = [...next[oi].blocks]; bs[bi] = { ...bs[bi], start: v }; next[oi] = { ...next[oi], blocks: bs }; setOverrides(next);
                          }} />
                          <span className="text-outline">–</span>
                          <TimeInput value={b.end} onChange={(v) => {
                            const next = [...overrides]; const bs = [...next[oi].blocks]; bs[bi] = { ...bs[bi], end: v }; next[oi] = { ...next[oi], blocks: bs }; setOverrides(next);
                          }} />
                          <button onClick={() => {
                            const next = [...overrides]; const bs = [...next[oi].blocks]; bs.splice(bi, 1); next[oi] = { ...next[oi], blocks: bs }; setOverrides(next);
                          }} className="text-outline hover:text-error"><Icon name="delete" /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const next = [...overrides]; next[oi] = { ...next[oi], blocks: [...next[oi].blocks, { start: "09:00", end: "17:00" }] }; setOverrides(next);
                      }} className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
                        <Icon name="add" className="text-sm" /> Add time range
                      </button>
                    </div>
                    <button onClick={() => { const next = [...overrides]; next.splice(oi, 1); setOverrides(next); }}
                      className="text-outline hover:text-error"><Icon name="close" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 flex justify-between items-center border-t border-outline-variant/30">
            <Button variant="ghost" className="text-error" onClick={() => setConfirmDelete(true)}>
              <Icon name="delete" /> Delete schedule
            </Button>
            <Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { remove.mutate(); setConfirmDelete(false); }}
        title="Delete this schedule?"
        message={
          selected && selected.eventTypeCount > 0
            ? `${selected.eventTypeCount} event type(s) use this schedule. They will fall back to the default schedule after deletion.`
            : "This availability schedule will be permanently deleted."
        }
        confirmLabel="Delete schedule"
        destructive
        loading={remove.isPending}
      />
    </AdminShell>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 text-sm rounded bg-surface-container-lowest ghost-border focus-ring" />
  );
}
