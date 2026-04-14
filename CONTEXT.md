# Calendly Clone — Project Context (v2.0)

**Repo:** https://github.com/FahadAhmed-8/calendly-clone
**Owner:** Fhd (fahadahmedgulamulrehman@gmail.com)
**Purpose:** Scaler SDE Intern Fullstack Assignment — Calendly-style scheduling app.
**Status:** v2.0 tagged. All 5 bonus features shipped. Critical weekday bug fixed. 18/18 tests passing. Local dev verified end-to-end.

---

## Stack

- **Next.js 14** App Router (single app — Route Handlers serve the API; no separate Express)
- **TypeScript** strict
- **Tailwind CSS** with Material Design 3 tokens (Stitch "Architectural Chronos" — primary `#0054cc`, surface `#f8f9ff`, Inter font, no 1px borders)
- **Prisma 5** + **PostgreSQL** (Neon hosted)
- **TanStack Query** for server state
- **Zod** for validation (shared client/server schemas)
- **date-fns + date-fns-tz** for timezone math
- **Sonner** for toasts
- **nodemailer** for email (with console-log fallback)
- **Vitest** for unit tests

---

## v2.0 highlights (what changed since v1)

### Features
1. **Multiple availability schedules.** New `AvailabilitySchedule`-scoped CRUD endpoints. Each event type can link to one schedule; falls back to the host's default if unset. UI: schedule dropdown, New button, rename-on-blur, set-as-default, delete (promotes oldest remaining to default if deleting the default; blocks deleting the last one).
2. **Date-specific overrides UI.** Per-date time blocks in the availability page; empty blocks mean "unavailable all day."
3. **Rescheduling flow.** `POST /api/public/bookings/[id]/reschedule` + `/booking/[id]/reschedule?token=…` page. Token-gated (timing-safe), transaction-protected overlap check that excludes the booking itself.
4. **Custom invitee questions.** Per-event-type editor (`text` / `textarea` / `select`-with-comma-options, required toggle). Persisted via upsert-by-id so historical `BookingAnswer` FKs survive edits. Server re-validates on booking create.
5. **Email notifications.** `sendBookingConfirmation`, `sendCancellationNotice`, `sendRescheduleNotice` — all fire-and-forget.

### Security / correctness fixes
6. **Public booking GET is token-gated.** Invitee name/email/notes/answers are redacted unless `?token=…` hashes to `cancellationTokenHash`. Prevents PII leak via guessed IDs.
7. **Past-time bookings rejected** server-side (`startUtc <= now()` → 422).
8. **Cross-event-type answer injection blocked.** Every submitted `questionId` must belong to the target event type. Required questions enforced server-side.
9. **Dead admin-auth code purged.** `requireAdmin`, `ADMIN_API_KEY`, `UNAUTHORIZED` + `IN_USE` error codes removed. `.env.example` no longer advertises fake protection.
10. **Critical weekday bug fixed.** `slots.ts` and `zonedWeekday` were using date-fns `"e"` (locale-aware: Sun=1..Sat=7 in en-US) but treating results as ISO (`"i"`). This silently shifted availability rules by one day — Saturday rules applied to Sunday, Wednesday rules to Tuesday, etc. Switched to `"i"`. Test suite caught this.
11. **Cancel page tz bug fixed.** Was reading `booking.inviteeTimezone` instead of `booking.invitee.timezone`; rendered cancellation times in UTC.

### UX / quality
12. **Replaced all native `confirm()` dialogs** with a reusable `ConfirmDialog` component built on the existing `Modal`. 4 sites: meetings cancel, event-types list delete, event-type edit delete, availability schedule delete.
13. **Back-to-dashboard footer** on the confirmation page (Book another time + Back to dashboard).
14. **Vitest wired up.** `vitest.config.ts` with `@` path alias. 18 tests across `time.test.ts` (DST, tz boundary weekday flip, Kolkata offset) and `schemas.test.ts` (all validation paths).

---

## Project layout

```
calendly-clone/
├── prisma/
│   ├── schema.prisma          # 8 models: User, EventType, AvailabilitySchedule,
│   │                          #   AvailabilityRule, DateOverride, CustomQuestion,
│   │                          #   Booking, BookingAnswer
│   │                          # EventType gained nullable scheduleId (many→1)
│   ├── seed.ts                # default host "fhd", 3 event types, 2 sample bookings
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── event-types/         CRUD + [id]/questions (GET/PUT)
│   │   │   │   ├── availability/        legacy GET/PUT (still works for back-compat)
│   │   │   │   ├── schedules/           NEW: list/create + [id] (GET/PATCH/PUT/DELETE)
│   │   │   │   └── bookings/            GET + [id]/cancel (with email notice)
│   │   │   └── public/
│   │   │       ├── event-types/[slug]/  GET (includes customQuestions) + /slots
│   │   │       └── bookings/            POST (with email) + [id]/{GET token-gated,
│   │   │                                   cancel, reschedule}
│   │   ├── event-types/                 list, [id]/edit (questions editor + schedule picker)
│   │   ├── availability/                multi-schedule + overrides UI
│   │   ├── meetings/                    upcoming/past/cancelled tabs
│   │   ├── [username]/[slug]/           public booking + /book (custom questions)
│   │   ├── booking/[id]/                /confirmation, /cancel, /reschedule
│   │   └── layout.tsx, page.tsx, providers.tsx, globals.css
│   ├── components/
│   │   ├── admin/AdminShell.tsx
│   │   ├── public/                      MonthCalendar, SlotPicker, BookingHeaderCard
│   │   └── ui/                          Button, Input, Modal, Icon, ConfirmDialog (new)
│   └── lib/
│       ├── db.ts                        Prisma singleton; getDefaultHost("fhd")
│       ├── slots.ts                     Uses linked schedule; ISO weekday
│       ├── time.ts                      ISO weekday; tz helpers
│       ├── schemas.ts                   Zod — adds schedule/question/reschedule schemas
│       ├── auth.ts                      hashToken + randomToken (admin-key gone)
│       ├── errors.ts                    AppError + envelope (trimmed codes)
│       ├── serializers.ts               + scheduleId on event types
│       ├── api-client.ts                + schedules, questions, reschedule
│       ├── email.ts                     NEW: nodemailer + console fallback
│       ├── cn.ts                        clsx + twMerge
│       └── __tests__/                   NEW: time.test.ts, schemas.test.ts
├── tailwind.config.ts
├── vitest.config.ts                     NEW
├── package.json                         + vitest, nodemailer, test scripts
├── README.md
└── .env.example                         + SMTP_* (ADMIN_API_KEY removed)
```

---

## Key design decisions (v2.0)

1. **Single Next.js app.** Route Handlers do double duty as the API.
2. **No login.** Single-user assumption per the assignment. `getDefaultHost()` always returns user `fhd`. `auth.ts` only handles booking cancellation tokens.
3. **Token-gated booking GET.** Booking IDs (cuid) are hard to guess, but they appear in emails/URLs/logs. Full PII only returned if the caller supplies a valid cancellation token hash.
4. **Double-booking prevention via transaction overlap re-check.** No DB-level partial unique constraint because cancellations must free the slot. (Future improvement: Postgres partial unique index on `(eventTypeId, startUtc) WHERE status='confirmed'`.)
5. **Email is fire-and-forget.** Never blocks API responses. Falls back to `console.log` when SMTP isn't configured, so the assignment runs without credentials.
6. **Custom questions persist via upsert-by-id.** Editing questions doesn't break historical `BookingAnswer` FKs.
7. **Reschedule overlap check excludes the booking itself** (`NOT id = params.id`).
8. **ISO day-of-week everywhere** (`formatInTimeZone(..., "i")`), mapped `iso === 7 ? 0 : iso` so Sun=0..Sat=6. Avoids locale-dependent `"e"` bugs.

---

## Routes summary

### Admin (no auth)
| Path | Purpose |
|---|---|
| `/event-types` | List, create, delete event types |
| `/event-types/[id]/edit` | Details, buffers, color, active, schedule, custom questions |
| `/availability` | Multi-schedule editor + overrides |
| `/meetings` | Upcoming / past / cancelled bookings |

### Public booking flow
| Path | Purpose |
|---|---|
| `/[username]/[slug]` | Calendar + slot picker |
| `/[username]/[slug]/book?slot=…&tz=…` | Invitee form + custom questions |
| `/booking/[id]/confirmation?token=…` | Success + ICS / Google / Outlook + dashboard links |
| `/booking/[id]/reschedule?token=…` | Tokenized reschedule |
| `/booking/[id]/cancel?token=…` | Tokenized cancellation |

### API (under `/api`)
- Admin: `event-types` (CRUD + `/questions`), `availability` (legacy GET/PUT), `schedules` (CRUD), `bookings` (GET + cancel)
- Public: `event-types/[slug]` (GET + /slots), `bookings` (POST + GET + cancel + reschedule)
- All wrapped in try/catch → `errorResponse()` returns standard envelope
- Validation via Zod schemas in `src/lib/schemas.ts`

---

## Default seed data

- **Host:** `fhd` (Asia/Kolkata timezone)
- **Event types:** `15min` (green), `30min` (blue `#0054cc`), `interview` (60 min, purple)
- **Default schedule:** Mon–Fri 09:00–17:00
- **Sample bookings:** Sarah Chen (past), Marcus Lee (upcoming)

---

## Environment variables

```
DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional — unset = emails logged to server console
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Scheduler <no-reply@scheduler.local>"
```

Currently using **Neon** (`ep-sweet-wave-a1k1haf3-pooler.ap-southeast-1.aws.neon.tech`).

---

## Scripts

```
npm run dev        # next dev
npm run build      # prisma generate && next build
npm run db:seed    # tsx prisma/seed.ts
npm test           # vitest run (18 tests)
npm run test:watch # vitest in watch mode
npx prisma studio  # inspect DB
```

---

## Bugs found & fixed (v1 → v2)

1. **Locale-dependent weekday (critical, caught by tests).** Slot generation + `zonedWeekday` used date-fns `"e"` as if it were ISO. Availability rules were effectively shifted by one day. **Fix:** switched to `"i"`.
2. **Cancel page UTC render.** `booking.inviteeTimezone` vs `booking.invitee.timezone` mismatch. **Fix:** one-line patch.
3. **Past-time bookings accepted.** Server only re-checked against the invitee's visible slot list for the specified day, with no absolute `> now()` guard. **Fix:** explicit check before overlap.
4. **Cross-event-type answer injection.** `BookingAnswer` rows could target any `questionId`. **Fix:** `validQuestionIds = new Set(eventType.customQuestions.map(q => q.id))` + required-answer enforcement.
5. **PII via guessed booking ID.** GET returned name/email/answers for anyone. **Fix:** token-gate the GET; redact without a valid token hash.
6. **ADMIN_API_KEY security theater.** Advertised in `.env.example` but `requireAdmin` was dead code. **Fix:** deleted both; comment in `auth.ts` explains the intentional no-auth stance.
7. **Native `confirm()` popups** across 4 pages. **Fix:** `ConfirmDialog` component.

---

## What could still be added (out of scope)

- Rate limiting on public endpoints
- Upper-bound time check on reschedule (respect `bookingWindowDays`)
- Cross-midnight availability rules (currently rejected implicitly because `start < end` in HH:mm)
- Postgres partial unique index on `(eventTypeId, startUtc) WHERE status='confirmed'` for bulletproof double-booking
- Pagination on meetings/event-types lists
- Admin authentication (intentionally skipped per assignment)
- Real Google Calendar 2-way sync

---

## How to resume work in a fresh chat

Paste this:
> "I'm working on https://github.com/FahadAhmed-8/calendly-clone — a Next.js 14 + Prisma + Postgres Calendly clone. Read CONTEXT.md in the repo root for the full project context, then [your request]."
