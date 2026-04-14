# Scheduler — Calendly Clone

A single-user Calendly-style scheduling app built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma**, and **PostgreSQL**. Features event types, weekly availability, timezone-correct slot generation, double-booking prevention via transactions, and tokenized public cancellation.

## Tech stack

- Next.js 14 App Router (single app — Route Handlers serve the API)
- TypeScript (strict)
- Tailwind CSS with Material Design 3 tokens
- Prisma ORM + PostgreSQL
- TanStack Query (React Query) for server state
- Zod for schema validation (shared client/server)
- date-fns + date-fns-tz for timezone math
- Sonner for toasts

## Prerequisites

- Node 20+
- PostgreSQL 14+ (local or hosted — Neon / Supabase / Railway all work)

## Setup

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env
# Edit .env and set DATABASE_URL, NEXT_PUBLIC_APP_URL
```

`.env` should contain:

```
DATABASE_URL="postgresql://user:password@localhost:5432/scheduler?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

```bash
# 3. Generate Prisma client + run migrations
npx prisma migrate dev --name init

# 4. Seed the default host + sample event types + bookings
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to the admin console.

## Routes

### Admin (no auth — single-user assumption)

- `/event-types` — list, create, delete
- `/event-types/[id]/edit` — edit details, active toggle
- `/availability` — weekly hours + timezone
- `/meetings` — upcoming / past / cancelled tabs

### Public booking flow

- `/[username]/[slug]` — calendar + slot picker (default `/fhd/30min`)
- `/[username]/[slug]/book?slot=…&tz=…` — invitee details form
- `/booking/[id]/confirmation?token=…` — success + Add to Calendar
- `/booking/[id]/cancel?token=…` — tokenized cancellation

### API

All endpoints live under `/api/admin/*` and `/api/public/*`. See `src/lib/api-client.ts` for the full surface.

## Key implementation notes

**Double-booking prevention.** The public `POST /api/public/bookings` route opens a Prisma transaction, re-checks for any overlapping non-cancelled booking, and only then inserts. No DB-level unique constraint is used because cancellations must re-open the slot; the overlap check is the source of truth. See `src/app/api/public/bookings/route.ts`.

**Timezone-correct slot generation.** `src/lib/slots.ts` converts the invitee's calendar day into a UTC window, intersects it with the host-timezone days it overlaps, applies weekly rules + overrides, generates slots at `step = durationMinutes`, then subtracts existing bookings.

**Cancellation tokens.** On booking creation, a 32-byte base64url token is generated; only its SHA-256 hash is stored (`cancellationTokenHash`). The plaintext is returned **once** in the create response and embedded in the confirmation URL. Verification uses timing-safe comparison (`src/lib/auth.ts`).

**Design system.** Tokens come from the Stitch export in `/stitch_scheduler_web_app_ui/` ("Architectural Chronos" — tonal layering, Inter font, no 1px borders). Primary `#0054cc`, surface `#f8f9ff`.

## Scripts

```bash
npm run dev          # Next dev server
npm run build        # prisma generate + next build
npm run start        # production server
npm run db:seed      # seed default host + samples
npx prisma studio    # inspect DB
```

## Deployment

Recommended: **Vercel + Neon Postgres**.

1. Push to GitHub.
2. Create a Neon project, copy the pooled `DATABASE_URL`.
3. Import the repo on Vercel. Set env vars:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL` (your production URL)
4. Add a Vercel build step override if needed:
   ```
   Build Command: prisma migrate deploy && prisma generate && next build
   ```
5. After first deploy, run the seed locally against the prod DB:
   ```bash
   DATABASE_URL="<prod url>" npm run db:seed
   ```

## Project structure

```
src/
  app/
    api/            # Route handlers (admin + public)
    (admin pages)   # event-types, availability, meetings
    [username]/
      [slug]/       # public booking + form
    booking/[id]/   # confirmation + cancel
  components/
    admin/AdminShell.tsx
    public/         # MonthCalendar, SlotPicker, BookingHeaderCard
    ui/             # Button, Input, Modal, Icon
  lib/
    db.ts           # Prisma singleton
    slots.ts        # Slot generator
    time.ts         # TZ helpers
    schemas.ts      # Zod schemas
    api-client.ts   # Browser fetch helpers
    auth.ts         # Token hashing
    errors.ts       # AppError + response envelope
prisma/
  schema.prisma
  seed.ts
```

## Default seed data

- Host: **fhd** (Asia/Kolkata)
- Event types: `15min`, `30min`, `interview` (60 min)
- Weekly hours: Mon–Fri 9:00–17:00
- Sample bookings: one past (Sarah Chen), one upcoming (Marcus Lee)

## License

MIT
