-- ============================================================================
-- Migration: cascade question delete + partial unique slug index
-- ============================================================================
--
-- Two fixes in one migration:
--
-- 1) CustomQuestion cascade.
--    BookingAnswer.questionId previously had ON DELETE RESTRICT. The questions
--    PUT endpoint (src/app/api/admin/event-types/[id]/questions/route.ts)
--    hard-deletes any question whose id is missing from the incoming payload.
--    With RESTRICT, deleting a question that already has historical answers
--    would 500. Switching to ON DELETE CASCADE makes the documented
--    replace-set behaviour actually work (the answers disappear with the
--    question, which is acceptable because the label is what the admin is
--    editing — this matches the pattern used elsewhere in the schema).
--
-- 2) Partial unique index on (hostId, slug).
--    EventType uses soft-delete (deletedAt). The original index
--    "EventType_hostId_slug_key" was a plain UNIQUE on (hostId, slug), so once
--    a slug was soft-deleted, no new EventType could reuse it even though the
--    old row is invisible to the app. The admin API's SLUG_TAKEN check
--    already scopes to deletedAt IS NULL, so the DB-level constraint was
--    stricter than the app rule. Replace it with a PARTIAL UNIQUE INDEX that
--    only applies to live rows.
-- ============================================================================

-- ---- 1) CustomQuestion cascade ---------------------------------------------

ALTER TABLE "BookingAnswer"
  DROP CONSTRAINT "BookingAnswer_questionId_fkey";

ALTER TABLE "BookingAnswer"
  ADD CONSTRAINT "BookingAnswer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "CustomQuestion"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---- 2) Partial unique slug --------------------------------------------------

DROP INDEX IF EXISTS "EventType_hostId_slug_key";

-- Prisma will also create a plain btree index for the @@index([hostId, slug])
-- in the next generated migration if schema drift is ever reconciled, but we
-- explicitly create the partial unique here since Prisma can't express it.
CREATE UNIQUE INDEX "EventType_hostId_slug_active_key"
  ON "EventType" ("hostId", "slug")
  WHERE "deletedAt" IS NULL;

-- A non-unique covering index for the hostId+slug lookup path (matches the
-- @@index([hostId, slug]) declared in prisma/schema.prisma).
CREATE INDEX IF NOT EXISTS "EventType_hostId_slug_idx"
  ON "EventType" ("hostId", "slug");
