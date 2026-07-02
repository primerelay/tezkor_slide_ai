-- ============================================================
-- SliderAI — "documents" jadvalini yaratish (mustaqil ish / referat)
-- Production DB'da (DigitalOcean) bir marta ishga tushiring.
-- Idempotent: qayta ishga tushirsa xato bermaydi.
-- ============================================================

-- gen_random_uuid() PostgreSQL 13+ da tayyor. Eski versiyalarda kerak bo'lsa:
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "documents" (
    "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId"           integer NOT NULL,
    "type"             varchar(30) NOT NULL,
    "topic"            text NOT NULL,
    "institution"      varchar(255),
    "studentName"      varchar(255),
    "teacherName"      varchar(255),
    "pageCount"        integer NOT NULL,
    "language"         varchar(5) NOT NULL DEFAULT 'uz',
    "status"           varchar(20) NOT NULL DEFAULT 'pending',
    "docxUrl"          text,
    "price"            integer NOT NULL DEFAULT 0,
    "aiCost"           numeric(10,6),
    "generationTimeMs" integer,
    "errorMessage"     text,
    "generatedContent" jsonb,
    "createdAt"        timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "FK_documents_userId" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_documents_userId" ON "documents" ("userId");

-- Tekshirish:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents';
