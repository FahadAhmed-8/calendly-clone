"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api-client";
import { COMMON_TIMEZONES } from "@/lib/time";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// UI-only preferences kept in localStorage. These aren't columns on the
// User model — adding them would require a migration and they're purely
// display-side prefs, so the browser is the right home for them.
type LocalPrefs = {
  welcomeMessage: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  country: string;
};

const DEFAULT_PREFS: LocalPrefs = {
  welcomeMessage: "Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.",
  language: "English",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",
  country: "India",
};

const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Italian", "Japanese", "Chinese", "Hindi"];
const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Singapore", "United Arab Emirates"];

function loadPrefs(): LocalPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem("account.prefs");
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: LocalPrefs) {
  try { localStorage.setItem("account.prefs", JSON.stringify(p)); } catch { /* quota or private mode */ }
}

export default function AccountPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["account"], queryFn: api.getAccount });

  // Local form state. We keep DB-backed fields and local prefs in one
  // form object so Save Changes writes both in one click.
  const [form, setForm] = useState<any>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (data && !form) {
      setForm({
        displayName: data.displayName || "",
        email: data.email || "",
        avatarUrl: data.avatarUrl || "",
        timezone: data.timezone || "Asia/Kolkata",
        ...loadPrefs(),
      });
    }
  }, [data, form]);

  // Live clock so "Current Time" updates without a refresh.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      // Split: DB fields go through the API, UI prefs go to localStorage.
      await api.updateAccount({
        displayName: form.displayName,
        email: form.email,
        avatarUrl: form.avatarUrl || "",
        timezone: form.timezone,
      });
      savePrefs({
        welcomeMessage: form.welcomeMessage,
        language: form.language,
        dateFormat: form.dateFormat,
        timeFormat: form.timeFormat,
        country: form.country,
      });
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (err: any) => toast.error(err?.body?.error?.message || "Save failed"),
  });

  const cancelChanges = () => {
    if (data) {
      setForm({
        displayName: data.displayName || "",
        email: data.email || "",
        avatarUrl: data.avatarUrl || "",
        timezone: data.timezone || "Asia/Kolkata",
        ...loadPrefs(),
      });
      toast.info("Changes discarded");
    }
  };

  if (isLoading || !form) {
    return (
      <AdminShell title="Account">
        <div className="h-96 animate-pulse bg-surface-container-lowest rounded-xl" />
      </AdminShell>
    );
  }

  const initial = (form.displayName || "F").charAt(0).toUpperCase();
  // Format current time in the chosen timezone using the chosen time format.
  const currentTime = (() => {
    try {
      return now.toLocaleTimeString("en-US", {
        timeZone: form.timezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: form.timeFormat === "12h",
      });
    } catch {
      return "";
    }
  })();

  return (
    <AdminShell title="Account">
      <div className="max-w-3xl">
        <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Account details</p>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface mb-6">Profile</h2>

        <div className="h-px bg-outline-variant/30 mb-8" />

        <div className="space-y-8">
          {/* Avatar row */}
          <div className="flex items-start gap-6">
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={form.displayName}
                className="w-24 h-24 rounded-full object-cover bg-surface-container-low"
                onError={(e) => {
                  // If the URL is broken just drop it so the initial shows.
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center text-4xl font-bold text-outline">
                {initial}
              </div>
            )}
            <div className="pt-2">
              <Button
                variant="subtle"
                onClick={() => { setAvatarDraft(form.avatarUrl || ""); setAvatarOpen(true); }}
                className="rounded-full"
              >
                Upload picture
              </Button>
              <p className="text-xs text-on-surface-variant mt-2">
                JPG, GIF or PNG. Paste an image URL.
              </p>
            </div>
          </div>

          {/* Name */}
          <Field label="Name" hint="The name shown on your public booking page.">
            <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </Field>

          {/* Welcome message */}
          <Field label="Welcome Message" hint="Shown at the top of your public booking page.">
            <Textarea
              value={form.welcomeMessage}
              onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
              maxLength={500}
            />
          </Field>

          {/* Language */}
          <Field label="Language">
            <Select value={form.language} onChange={(v) => setForm({ ...form, language: v })} options={LANGUAGES} />
          </Field>

          {/* Date + Time format side-by-side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Date Format" hint="How calendar dates are displayed.">
              <Select
                value={form.dateFormat}
                onChange={(v) => setForm({ ...form, dateFormat: v })}
                options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]}
              />
            </Field>
            <Field label="Time Format" hint="12-hour clock or 24-hour clock.">
              <Select
                value={form.timeFormat}
                onChange={(v) => setForm({ ...form, timeFormat: v })}
                options={[{ value: "12h", label: "12h (am/pm)" }, { value: "24h", label: "24h" }]}
              />
            </Field>
          </div>

          {/* Country */}
          <Field label="Country">
            <Select value={form.country} onChange={(v) => setForm({ ...form, country: v })} options={COUNTRIES} />
          </Field>

          {/* Email — read-only-ish field; still editable for the demo. */}
          <Field label="Email" hint="Used for booking notifications.">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>

          {/* Timezone with live clock */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <Label className="mb-0">Time Zone</Label>
              <span className="text-sm text-on-surface-variant">
                Current Time: <span className="font-semibold text-on-surface">{currentTime}</span>
              </span>
            </div>
            <Select
              value={form.timezone}
              onChange={(v) => setForm({ ...form, timezone: v })}
              options={COMMON_TIMEZONES}
            />
          </div>

          {/* Action bar */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2">
              <Button onClick={() => save.mutate()} loading={save.isPending} className="rounded-full">
                Save Changes
              </Button>
              <Button variant="ghost" onClick={cancelChanges} disabled={save.isPending} className="rounded-full ghost-border">
                Cancel
              </Button>
            </div>
            <Button
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              className="rounded-full self-start sm:self-auto"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <AvatarModal
        open={avatarOpen}
        value={avatarDraft}
        onChange={setAvatarDraft}
        onClose={() => setAvatarOpen(false)}
        onSave={() => {
          setForm({ ...form, avatarUrl: avatarDraft.trim() });
          setAvatarOpen(false);
        }}
        onClear={() => {
          setForm({ ...form, avatarUrl: "" });
          setAvatarOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          // Account deletion isn't wired up in this demo — cascading through
          // event types, bookings, and schedules would need more than a
          // single endpoint. Leaving as a stub so the UI matches Calendly
          // without the risk of data loss.
          toast.error("Account deletion is disabled in the demo. Contact support to remove data.");
          setConfirmDelete(false);
        }}
        title="Delete your account?"
        message={"This will permanently remove your profile, event types, schedules, and booking history.\n\nThis cannot be undone."}
        confirmLabel="Delete Account"
        destructive
      />
    </AdminShell>
  );
}

/* ------------ field shell + dropdowns ------------ */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <Label className="mb-0">{label}</Label>
        {hint && (
          <span title={hint} className="text-outline cursor-help inline-flex">
            <Icon name="info" className="text-sm" />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

type SelectOption = string | { value: string; label: string };

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 pr-9 rounded bg-surface-container-lowest ghost-border focus-ring text-sm appearance-none cursor-pointer"
      >
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
      <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
    </div>
  );
}

/* ------------ avatar URL modal ------------ */

function AvatarModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
  onClear,
}: {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
  onClear: () => void;
}) {
  // Lightweight native dialog — we already have a Modal component but this
  // one-off wants an embedded preview, so keep it local.
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-surface-container-lowest rounded-xl shadow-elev-3 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-1">Profile picture</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Paste an image URL (hosted on any image CDN, GitHub, etc.).
        </p>
        <Input
          autoFocus
          placeholder="https://example.com/me.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <div className="mt-4 flex items-center gap-3">
            <img
              src={value}
              alt="preview"
              className="w-16 h-16 rounded-full object-cover bg-surface-container-low"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
              }}
            />
            <p className="text-xs text-on-surface-variant">Preview</p>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={onClear} className="text-error">
            <Icon name="delete" /> Remove
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
