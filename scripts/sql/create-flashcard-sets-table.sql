-- ============================================================
-- SliderAI — "flashcard_sets" jadvalini yaratish (flesh kartalar)
-- Production DB'da (DigitalOcean/Docker) bir marta ishga tushiring.
-- Docker misol:
--   docker exec -i tezkor-postgres psql -U tezkor -d tezkor_slide_ai < THIS_FILE
-- ============================================================

CREATE TABLE IF NOT EXISTS "flashcard_sets" (
    "id"             SERIAL PRIMARY KEY,
    "userId"         INTEGER NOT NULL,
    "title"          VARCHAR(255) NOT NULL,
    "sourceContent"  TEXT NOT NULL,
    "language"       VARCHAR(5) NOT NULL DEFAULT 'uz',
    "cardCount"      INTEGER NOT NULL DEFAULT 10,
    "status"         VARCHAR(20) NOT NULL DEFAULT 'completed',
    "cards"          JSONB NOT NULL DEFAULT '[]',
    "price"          INTEGER NOT NULL DEFAULT 0,
    "generationCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "errorMessage"   TEXT,
    "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_flashcard_sets_userId" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_flashcard_sets_userId" ON "flashcard_sets" ("userId");
