# Calendly Clone — Project Context (v1)

**Repo:** https://github.com/FahadAhmed-8/calendly-clone
**Owner:** Fhd (fahadahmedgulamulrehman@gmail.com)
**Purpose:** Scaler SDE Intern Fullstack Assignment — Calendly-style scheduling app.
**Status:** v1 shipped to GitHub. Local dev verified end-to-end (admin + public booking + cancel).

---

## Stack

- **Next.js 14** App Router (single app — Route Handlers serve the API; no separate Express)
- **TypeScript** strict
- **Tailwind CSS** with Material Design 3 tokens (Stitch "Architectural Chronos" theme — primary `#0054cc`, surface `#f8f9ff`, Inter font, no 1px borders)
- **Prisma 5** + **PostgreSQL** (Neon hosted)
- **TanStack Query** for server state
- **Zod** for validation (shared client/server schemas)
- **date-fns + date-fns-tz** for timezone math
- **Sonner** for toasts

---

## Project layout

```
calendly-clone/
├── prisma/
│   ├── schema.prisma          # 8 models: User, EventType, AvailabilitySchedule,
│   │                          #   AvailabilityRule, DateOverride, CustomQuestion,
│   │                          #   Booking, BookingAnswer
│   ├── seed.ts                # default host "fhd", 3 event types, 2 sample bookings
│   └── migrations/            # 20260414190938_init applied
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── event-types/         GET, POST + [id]/{GET,PATCH,DELETE}
│   │   │   │   ├── availability/        GET, PUT
│   │   │   │   └── bookings/            GET + [id]/cancel/POST
│   │   │   └── public/
│   │   │       ├── event-types/[slug]/  GET + /slots/GET
│   │   │       └── bookings/            POST + [id]/{GET, cancel/POST}
│   │   ├── event-types/                 list, [id]/edit
│   │   ├── availability/                weekly hours + tz
│   │   ├── meetings/                    upcoming/past/cancelled tabs
│   │   ├── [username]/[slug]/           public booking + /book form
│   │   ├── booking/[id]/                /confirmation, /cancel
│   │   ├── layout.tsx, page.tsx (→ /event-types), providers.tsx, globals.css
│   ├── components/
│   │   ├── admin/AdminShell.tsx         240px sidebar + topbar
│   │   ├── public/                      MonthCalendar, SlotPicker, BookingHeaderCard
│   │   └── ui/                          Button, Input, Modal, Icon
│   └── lib/
│       ├── db.ts                        Prisma singleton; getDefaultHost("fhd")
│       ├── slots.ts                     Timezone-correct slot generator
│       ├── time.ts                      tz helpers, COMMON_TIMEZONES
│       ├── schemas.ts                   Zod schemas
│       ├── auth.ts                      hashToken (SHA-256), randomToken (32-byte b64url)
│       ├── errors.ts                    AppError + envelope `{error:{code,message,details}}`
│       ├── serializers.ts               eventTypeToPublic, bookingToPublic
│       ├── api-client.ts                browser fetch wrapper
│       └── cn.ts                        clsx + twMerge
├── tailwind.config.ts                   MD3 tokens copied from Stitch export
├── package.json                         scripts: dev, build, db:seed
├── README.md                            user-facing setup + deploy guide
└── .env.example                         DATABASE_URL, NEXT_PUBLIC_APP_URL
```

---

## Key design decisions

1. **Single Next.js app, not monorepo.** Route Handlers do double duty as the API. Faster to ship within the 2-day deadline.
2. **No login.** Single-user assumption per the assignment. `getDefaultHost()` always returns user `fhd`. `auth.ts` exists only to hash booking cancellation tokens.
3. **Double-booking prevention via transaction overlap re-check.** No DB-level partial unique constraint, because cancelled bookings must free the slot. The public POST `/api/public/bookings` opens `prisma.$transaction`, re-queries for any overlapping `confirmed` booking, then inserts.
4. **Cancellation tokens.** 32-byte base64url token generated on booking create. Only the **SHA-256 hash** (`cancellationTokenHash`, char(64)) is persisted. Plaintext is returned **once** in the create response and embedded in the confirmation/cancel URL. Verification uses timing-safe comparison.
5. **Timezone-correct slot generation.** `src/lib/slots.ts` converts the invitee's calendar day into a UTC window, intersects it with the host-timezone days it overlaps (1 or 2), applies weekly rules + overrides, builds candidate slots at `step = durationMinutes`, subtracts existing bookings (with buffer math), filters past slots.
6. **Design tokens straight from Stitch HTML exports** in `/stitch_scheduler_web_app_ui/`. No ad-hoc colors anywhere.

---

## Routes summary

### Admin (no auth)
| Path | Purpose |
|---|---|
| `/event-types` | List, create, delete event types |
| `/event-types/[id]/edit` | Edit details, color, active toggle |
| `/availability` | Weekly hours + timezone |
| `/meetings` | Upcoming / past / cancelled bookings |

### Public booking flow
| Path | Purpose |
|---|---|
| `/[username]/[slug]` | Calendar + slot picker (e.g. `/fhd/30min`) |
| `/[username]/[slug]/book?slot=…&tz=…` | Invitee details form |
| `/booking/[id]/confirmation?token=…` | Success + Add-to-Calendar (Google/Outlook/ICS) |
| `/booking/[id]/cancel?token=…` | Tokenized cancellation |

### API (under `/api`)
- Admin: `event-types` (CRUD), `availability` (GET/PUT), `bookings` (GET + cancel)
- Public: `event-types/[slug]` (GET + /slots), `bookings` (POST + GET/cancel)
- All wrapped in try/catch → `errorResponse()` returns standard envelope
- Validation via Zod schemas in `src/lib/schemas.ts`

---

## Default seed data

- **Host:** `fhd` (Asia/Kolkata timezone)
- **Event types:** `15min` (green), `30min` (blue `#0054cc`), `interview` (60 min, purple)
- **Weekly hours:** Mon–Fri 09:00–17:00
- **Sample bookings:** Sarah Chen (past), Marcus Lee (upcoming)

---

## Environment variables

```
DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Currently using **Neon** (`ep-sweet-wave-a1k1haf3-pooler.ap-southeast-1.aws.neon.tech`).

---

## Scripts

```
npm run dev       # next dev
npm run build     # prisma generate && next build  (passes clean — verified)
npm run db:seed   # tsx prisma/seed.ts
npx prisma studio # inspect DB
```

---

## Bugs found & fixed during testing

1. **Build failure:** Next.js route files only allow specific exports. `serialize` and `toPublic` helpers were exported from route files. **Fix:** moved to `src/lib/serializers.ts`.
2. **400 on Schedule Event:** booking form sent `{eventTypeSlug, username, invitee:{...}}` but API expects `{eventTypeId, inviteeName, inviteeEmail, ...}` flat. **Fix:** flattened the body in `src/app/[username]/[slug]/book/page.tsx` and use `eventType.id` from the loaded query.

---

## What still could be added (out of scope for v1)

- Email notifications on booking/cancel (Resend/Postmark)
- Real Google Calendar 2-way sync
- Custom questions per event type (data model exists, UI not built)
- Date overrides UI (model exists, only weekly rules editable)
- Mobile-responsive polish for admin pages
- Admin authentication (intentionally skipped per assignment)
- Tests — none written

---

## How to resume work in a fresh chat

Paste this:
> "I'm working on https://github.com/FahadAhmed-8/calendly-clone — a Next.js 14 + Prisma + Postgres Calendly clone. Read CONTEXT.md in the repo root for the full project context, then [your request]."
