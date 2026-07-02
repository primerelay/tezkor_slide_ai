-- ============================================================
-- SliderAI — "resumes" jadvali (rezyume / CV)
-- Docker:
--   docker exec -i tezkor-postgres psql -U tezkor -d tezkor_slide_ai < THIS_FILE
-- ============================================================

CREATE TABLE IF NOT EXISTS "resumes" (
    "id"             SERIAL PRIMARY KEY,
    "userId"         INTEGER NOT NULL,
    "language"       VARCHAR(5) NOT NULL DEFAULT 'uz',
    "data"           JSONB NOT NULL,
    "docxUrl"        TEXT,
    "price"          INTEGER NOT NULL DEFAULT 0,
    "generationCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_resumes_userId" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IDX_resumes_userId" ON "resumes" ("userId");
