"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api-client";
import { COMMON_TIMEZONES } from "@/lib/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Rule = { weekday: number; startTime: string; endTime: string };

export default function AvailabilityPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["availability"], queryFn: api.getAvailability });
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [rulesByDay, setRulesByDay] = useState<Record<number, { start: string; end: string }[]>>({});

  useEffect(() => {
    if (!data) return;
    setTimezone(data.timezone);
    const map: Record<number, { start: string; end: string }[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const r of data.rules as Rule[]) {
      map[r.weekday] ??= [];
      map[r.weekday].push({ start: r.startTime, end: r.endTime });
    }
    setRulesByDay(map);
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      const rules: Rule[] = [];
      for (const [dayStr, ranges] of Object.entries(rulesByDay)) {
        const day = Number(dayStr);
        for (const r of ranges) rules.push({ weekday: day, startTime: r.start, endTime: r.end });
      }
      return api.saveAvailability({ timezone, rules, overrides: [] });
    },
    onSuccess: () => { toast.success("Availability saved"); qc.invalidateQueries({ queryKey: ["availability"] }); },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Save failed"),
  });

  return (
    <AdminShell title="Availability">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">Availability</h2>
          <p className="text-on-surface-variant max-w-md">Set your weekly hours and timezone. Invitees will only be able to book within these ranges.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-lowest rounded-lg px-4 h-10 ghost-border">
          <Icon name="public" className="text-outline text-lg" />
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="bg-transparent text-sm font-semibold focus:outline-none">
            {COMMON_TIMEZONES.map((tz) => <option key={tz}>{tz}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl p-8 shadow-elev-1">
        <h3 className="text-lg font-bold mb-6">Weekly hours</h3>
        <div className="space-y-4">
          {DAYS.map((day, i) => {
            const ranges = rulesByDay[i] || [];
            const enabled = ranges.length > 0;
            return (
              <div key={day} className="flex items-start gap-6 py-3">
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
                          setRulesByDay({ ...rulesByDay, [i]: next.length ? next : [] });
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
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button>
      </div>
    </AdminShell>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="time" value={value} onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 text-sm rounded bg-surface-container-lowest ghost-border focus-ring" />
  );
}
