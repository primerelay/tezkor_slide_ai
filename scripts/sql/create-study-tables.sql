-- ============================================================
-- SliderAI — "glossary_sets" va "crossword_sets" jadvallari
-- Docker:
--   docker exec -i tezkor-postgres psql -U tezkor -d tezkor_slide_ai < THIS_FILE
-- ============================================================

CREATE TABLE IF NOT EXISTS "glossary_sets" (
    "id"             SERIAL PRIMARY KEY,
    "userId"         INTEGER NOT NULL,
    "title"          VARCHAR(255) NOT NULL,
    "sourceContent"  TEXT NOT NULL,
    "language"       VARCHAR(5) NOT NULL DEFAULT 'uz',
    "termCount"      INTEGER NOT NULL DEFAULT 20,
    "entries"        JSONB NOT NULL DEFAULT '[]',
    "docxUrl"        TEXT,
    "price"          INTEGER NOT NULL DEFAULT 0,
    "generationCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_glossary_sets_userId" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IDX_glossary_sets_userId" ON "glossary_sets" ("userId");

CREATE TABLE IF NOT EXISTS "crossword_sets" (
    "id"             SERIAL PRIMARY KEY,
    "userId"         INTEGER NOT NULL,
    "title"          VARCHAR(255) NOT NULL,
    "sourceContent"  TEXT NOT NULL,
    "language"       VARCHAR(5) NOT NULL DEFAULT 'uz',
    "wordCount"      INTEGER NOT NULL DEFAULT 10,
    "data"           JSONB NOT NULL,
    "docxUrl"        TEXT,
    "price"          INTEGER NOT NULL DEFAULT 0,
    "generationCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_crossword_sets_userId" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "IDX_crossword_sets_userId" ON "crossword_sets" ("userId");
