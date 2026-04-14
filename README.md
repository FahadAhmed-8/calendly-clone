# Scheduler — Calendly Clone (v2.0)

A single-user Calendly-style scheduling app built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **PostgreSQL**. Handles event types, multiple weekly availability schedules, date-specific overrides, timezone-correct slot generation, transaction-based double-booking prevention, tokenized public cancellation and rescheduling, custom invitee questions, and email notifications.

## What's new in v2.0

- **Multiple availability schedules** — create/name/delete independent schedules; set one as default; assign a schedule per event type.
- **Date-specific overrides** — per-date time blocks (empty = unavailable that day) with a dedicated UI.
- **Rescheduling flow** — public `/booking/[id]/reschedule?token=...` with the same calendar + slot picker as the booking page, token-gated and transaction-protected against overlap.
- **Custom invitee questions** — per event type, with `text` / `textarea` / `select` types, required toggle, and persisted answers. Server re-validates on booking create (unknown-question rejection + required-answer enforcement).
- **Email notifications** — `nodemailer` for booking confirmation, cancellation, and reschedule. When `SMTP_HOST` is unset, messages are logged to the server console (keeps local dev frictionless).
- **Security hardening** — booking GET is now token-gated (without a valid token, invitee name/email/notes/answers are redacted). Past-time bookings and cross-event-type answer injection are rejected server-side.
- **Weekday-computation bug fix** — slot generation was using a locale-dependent date-fns token and silently shifting availability rules by one day (Saturday rules applying to Sunday, etc.). Switched to ISO day-of-week.
- **Confirm dialogs** — replaced all native `confirm()` popups with a consistent M3 `ConfirmDialog` component.
- **Vitest unit tests** — 18 tests covering time helpers (DST, tz boundary) and Zod schemas.

## Tech stack

- Next.js 14 App Router (single app — Route Handlers serve the API)
- TypeScript (strict)
- Tailwind CSS with Material Design 3 tokens
- Prisma ORM + PostgreSQL
- TanStack Query (React Query) for server state
- Zod for schema validation (shared client/server)
- date-fns + date-fns-tz for timezone math
- Sonner for toasts
- nodemailer for email
- Vitest for unit tests

## Prerequisites

- Node 20+
- PostgreSQL 14+ (local or hosted — Neon / Supabase / Railway all work)

## Setup

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env
# Edit .env and set DATABASE_URL, NEXT_PUBLIC_APP_URL, (optional) SMTP_*
```

`.env` should contain:

```
DATABASE_URL="postgresql://user:password@localhost:5432/scheduler?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional — unset = emails logged to server console
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Scheduler <no-reply@scheduler.local>"
```

```bash
# 3. Generate Prisma client + push schema
npx prisma db push

# 4. Seed the default host + sample event types + bookings
npm run db:seed

# 5. Start the dev server
npm run dev

# 6. (Optional) Run the test suite
npm test
```

Open <http://localhost:3000>. You'll be redirected to the admin console.

## Routes

### Admin (no auth — single-user assumption per the assignment)

- `/event-types` — list, create, delete
- `/event-types/[id]/edit` — details, buffers, color, active toggle, **schedule picker**, **custom questions editor**
- `/availability` — **multiple schedules** + weekly hours + tz + **date-specific overrides**
- `/meetings` — upcoming / past / cancelled tabs

### Public booking flow

- `/[username]/[slug]` — calendar + slot picker (default `/fhd/30min`)
- `/[username]/[slug]/book?slot=…&tz=…` — invitee details form + custom questions
- `/booking/[id]/confirmation?token=…` — success + Add-to-Calendar + **Back to dashboard / Book another time**
- `/booking/[id]/reschedule?token=…` — tokenized reschedule (3-column layout)
- `/booking/[id]/cancel?token=…` — tokenized cancellation

### API

All endpoints live under `/api/admin/*` and `/api/public/*`. See `src/lib/api-client.ts` for the full surface. Highlights added in v2.0:

- `GET/POST /api/admin/schedules` · `GET/PATCH/PUT/DELETE /api/admin/schedules/[id]`
- `GET/PUT /api/admin/event-types/[id]/questions`
- `POST /api/public/bookings/[id]/reschedule`

## Key implementation notes

**Double-booking prevention.** `POST /api/public/bookings` opens a Prisma transaction, re-checks for any overlapping non-cancelled booking, and only then inserts. No DB-level unique constraint is used because cancellations must re-open the slot; the overlap check is the source of truth.

**Timezone-correct slot generation.** `src/lib/slots.ts` converts the invitee's calendar day into a UTC window, intersects it with the host-timezone days it overlaps, applies the event-type's linked schedule (falling back to the host's default schedule) + weekly rules + overrides, generates slots at `step = durationMinutes`, then subtracts existing bookings (with buffer math). Uses ISO day-of-week (`"i"` token) to be locale-independent.

**Cancellation tokens.** On booking creation, a 32-byte base64url token is generated; only its SHA-256 hash is stored (`cancellationTokenHash`). The plaintext is returned **once** in the create response and persisted to `sessionStorage` + embedded in email links. Verification uses timing-safe comparison. The same token authorizes cancel, reschedule, and full-detail GET.

**Public booking GET is token-gated.** Without a valid token, the response omits invitee name/email/notes/answers (but keeps time + host + event type + status visible, so the cancel/confirmation pages can still render a minimal view if the token is lost). Prevents PII leak via guessed booking IDs.

**Server-side question validation.** The booking POST validates every submitted `questionId` belongs to the target event type and enforces required-answer presence — not just the client.

**Email.** `src/lib/email.ts` wraps nodemailer. When `SMTP_HOST` is unset it logs to the server console with full formatting. Sends are fire-and-forget so they never block the API response.

**Design system.** Tokens come from the Stitch export in `/stitch_scheduler_web_app_ui/` ("Architectural Chronos" — tonal layering, Inter font, no 1px borders). Primary `#0054cc`, surface `#f8f9ff`.

## Scripts

```bash
npm run dev          # Next dev server
npm run build        # prisma generate + next build
npm run start        # production server
npm run db:seed      # seed default host + samples
npm test             # vitest run (18 tests)
npm run test:watch   # watch mode
npx prisma studio    # inspect DB
```

## Deployment

Recommended: **Vercel + Neon Postgres**.

1. Push to GitHub.
2. Create a Neon project, copy the pooled `DATABASE_URL`.
3. Import the repo on Vercel. Set env vars:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL`
   - (Optional) `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
4. Build command (if overriding): `prisma migrate deploy && prisma generate && next build`
5. After first deploy, run the seed locally against the prod DB:
   ```bash
   DATABASE_URL="<prod url>" npm run db:seed
   ```

## Project structure

```
src/
  app/
    api/
      admin/          # event-types, availability, schedules, questions, bookings
      public/         # event-types/[slug], bookings (CRUD + reschedule + cancel)
    event-types/      # list, [id]/edit (with question editor)
    availability/     # multi-schedule + overrides UI
    meetings/
    [username]/[slug]/# public booking + /book form
    booking/[id]/     # confirmation, cancel, reschedule
  components/
    admin/AdminShell.tsx
    public/           # MonthCalendar, SlotPicker, BookingHeaderCard
    ui/               # Button, Input, Modal, Icon, ConfirmDialog
  lib/
    db.ts
    slots.ts
    time.ts
    schemas.ts
    api-client.ts
    auth.ts           # SHA-256 token hashing (no admin-key cruft)
    errors.ts
    email.ts          # nodemailer + console fallback
    serializers.ts
    __tests__/        # vitest — time.test.ts, schemas.test.ts
prisma/
  schema.prisma
  seed.ts
vitest.config.ts
```

## Default seed data

- Host: **fhd** (Asia/Kolkata)
- Event types: `15min`, `30min`, `interview` (60 min)
- Default schedule: Mon–Fri 9:00–17:00
- Sample bookings: one past (Sarah Chen), one upcoming (Marcus Lee)

## License

MIT
