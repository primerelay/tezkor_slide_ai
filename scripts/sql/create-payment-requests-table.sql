-- ============================================================
-- SliderAI — "payment_requests" jadvali (to'lov tasdiqlash oqimi)
-- Bir to'lovni bir nechta admin ko'radi; birinchi qaror hammasiga
-- ta'sir qiladi va ikki karra tasdiqni to'xtatadi.
-- Docker:
--   docker exec -i tezkor-postgres psql -U tezkor -d tezkor_slide_ai < THIS_FILE
-- ============================================================

CREATE TABLE IF NOT EXISTS "payment_requests" (
    "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"        INTEGER NOT NULL,
    "telegramId"    VARCHAR(32) NOT NULL,
    "status"        VARCHAR(20) NOT NULL DEFAULT 'pending',
    "amount"        INTEGER,
    "rejectReason"  TEXT,
    "adminMessages" JSONB NOT NULL DEFAULT '[]',
    "processedBy"   VARCHAR(64),
    "createdAt"     TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_payment_requests_status" ON "payment_requests" ("status");
