# Tezkor Slide AI — Project Guide

> AI-powered **Telegram-first** platform for Uzbek/CIS students: generates academic
> presentations (PPTX), documents (DOCX), quizzes, flashcards, glossaries, crosswords,
> resumes and translations. Telegram bot + Mini App + web admin dashboard.
>
> ⚠️ **Public repo** — never commit secrets (tokens, passwords, card numbers, server IP,
> group IDs). All real values live only in the server `.env` (git-ignored).

---

## Tech stack

- **Backend:** NestJS 11 + TypeScript (modular)
- **Bot:** Telegraf via `nestjs-telegraf` — **long-polling** (no webhook)
- **DB:** PostgreSQL 16 + TypeORM (16 entities)
- **Queue:** BullMQ + Redis (async generation)
- **AI:** **OpenRouter only** (`OpenRouterProvider`, default model `openai/gpt-4o-mini`).
  An `AnthropicProvider` exists but is unused. Gemini was fully removed.
- **Rendering:** `pptxgenjs` (slides), `docx` (documents)
- **Images:** Unsplash → Pexels → optional OpenRouter image gen (hybrid fallback)
- **Frontends:** `mini-app/` (React 18 + Vite, Telegram Mini App), `web/` (React 19 + Vite, landing + admin dashboard)
- **Process manager:** PM2 (single fork instance — see gotchas)

## Architecture (JSON-driven, deterministic rendering)

Core principle (see `project_ADR.md`): **AI only produces structured JSON; a deterministic
layout engine turns it into PPTX/DOCX.** Design quality > model intelligence.

```
Telegram bot / Mini App  →  deduct credits + create DB row  →  BullMQ queue
   →  Processor: multi-agent AI pipeline  →  Renderer (PPTX/DOCX)
   →  local storage  →  delivered to user via Telegram
```

**Presentation pipeline** (`src/ai/pipeline/`, `src/ai/agents/`):
`OutlineAgent → ContentAgent → LayoutAgent (rule-based, not AI) → AssetAgent → RendererService`.

**Document pipeline** (`src/document/`): `DocPlannerAgent → DocWriterAgent (per section) → DocxRenderer`.

Processors are **single-run (no auto-retry)**: on failure they refund credits (where the
entity has a `price`) and message the user — auto-retry would double-charge/double-deliver.

## Features & pricing (all in so'm)

| Feature | Module | Price | Delivery |
|---|---|---|---|
| Presentation | `ai/`, `renderer/`, `queue/` | 1000–2500 (by slide count) | PPTX |
| Document (referat/mustaqil_ish/insho/kurs_ishi/maqola/tezis) | `document/` | 1500–11000 | DOCX |
| Quiz | `quiz/` | 500–2000 | Telegram poll |
| Flashcard | `flashcard/` | 500–1000 | in-app + share link |
| Glossary | `study/glossary/` | 500–1200 | DOCX |
| Crossword | `study/crossword/` | 800–1200 | DOCX |
| Resume | `resume/` | 2500 | DOCX |
| Translator | `translator/` | 500 | real-time (no queue) |

Pure pay-as-you-go credits (so'm), no subscriptions. New user starts with a free balance.
Payments are **manually approved**: user sends a screenshot → forwarded to admins/group →
admin approves with an amount (atomic "first admin wins" claim). Referral + channel-join bonuses.

## Repository layout

```
src/
  main.ts, app.module.ts        # bootstrap (custom TelegramLogger + crash handlers)
  config/configuration.ts       # all env → config
  telegram/                     # bot: update.ts (all handlers), scenes/, keyboards/, referral
  ai/                           # providers/, agents/, pipeline/, services/ (image)
  queue/                        # BullMQ processors/, events/, types/
  document/                     # doc agents/, pipeline/, docx renderer/
  renderer/                     # themes/ (30+), layouts/ (hero,bullets,timeline,…)
  quiz/ flashcard/ study/ resume/ translator/   # feature modules
  mini-app/                     # Mini App REST API (controller + service)
  admin/                        # web dashboard API (JWT auth, stats)
  payment/  storage/            # payment packages; local file storage
  database/entities/            # 16 TypeORM entities
  common/i18n/                  # 9 languages (uz,uzc,ru,en,de,tr,kk,ar,ko)
  common/error-reporter/        # forwards errors to a Telegram group
mini-app/  web/                 # React frontends (built to dist/, served by NestJS)
DEPLOY-CONTABO.md               # full step-by-step deploy/migration guide
scripts/backup-offsite.sh       # DB + storage → Google Drive (rclone), daily cron
```

## Data model (key entities in `src/database/entities/`)

`User` (telegramId, credits, language, referral*), `Transaction` (topup/usage/refund/bonus),
`PaymentRequest` (multi-admin approval, `adminMessages` jsonb), `Admin` (web panel, bcrypt),
`Presentation`, `GeneratedDocument`, `Quiz`+`Question`+`QuizAttempt`, `FlashcardSet`,
`GlossarySet`, `CrosswordSet`, `Resume`, `GenerationJob`, `ChannelMembership`.
Per-feature rows store `price` (so'm) and `aiCost` (USD) for admin profit analytics.

## Local development

```bash
npm install
npm run start:dev        # watch mode (needs Postgres + Redis running)
npm run build            # nest build → dist/
npm run lint
npm test
# frontends
( cd mini-app && npm install && npm run build )
( cd web && npm install && npm run build )
```

Postgres + Redis for local dev: `docker compose -f docker-compose.prod.yml up -d`.

## Environment variables

Real values live only in the server `.env`. Names + purpose (see `.env.example`):

| Var | Required | Purpose |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | bot auth |
| `TELEGRAM_BOT_USERNAME` | ✅ | referral/flashcard share links (empty → "YOUR_BOT") |
| `OPENROUTER_API_KEY` | ✅ | all AI generation |
| `DATABASE_*`, `REDIS_*` | ✅ | Postgres / Redis connection |
| `ADMIN_TELEGRAM_IDS` | ✅ | comma-separated admin IDs (payment approval) |
| `JWT_SECRET`, `ADMIN_PHONE/PASSWORD/NAME` | for web panel | admin dashboard login |
| `PAYMENT_GROUP_ID` | optional | send payment proofs to this group **AND** admin DMs |
| `ERROR_LOG_GROUP_ID` | optional | forward all runtime errors to this group |
| `HUMO_*`, `UZCARD_*` | optional | payment card details shown to users |
| `REQUIRED_CHANNEL_*` | optional | mandatory channel-join |
| `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY` | optional | stock images |
| `STORAGE_PATH` | ✅ | where generated files are written |
| `MINI_APP_URL` | optional | HTTPS URL of the Mini App |

The bot must be a **member** of any group referenced by `PAYMENT_GROUP_ID` / `ERROR_LOG_GROUP_ID`.
For the payment group, **disable bot privacy mode** in BotFather so admins can type the approve amount.

## Deployment — Contabo VPS

Hosting is **Contabo Cloud VPS** (EU, Ubuntu 24.04). Full step-by-step: **`DEPLOY-CONTABO.md`**.
Stack on the box: Docker (postgres:16 + redis:7 via `docker-compose.prod.yml`) + Node 20 + PM2 + Nginx.
App path: `/var/www/tezkor_slide_ai`. Public site: `tezhisobchi.uz` (HTTPS via certbot). Files: **local disk** (`storage/`).

### ⚠️ Critical gotchas

1. **Single instance only.** The bot uses Telegram long-polling — one poller per token.
   `ecosystem.config.js` is `instances: 1, exec_mode: fork`. Two instances → constant `409 Conflict`.
   When redeploying/migrating, stop the old instance before starting a new one.
2. **Fresh DB schema.** In production TypeORM `synchronize` is OFF, the migrations in
   `src/database/migrations/` are **incomplete**, and there is **no `data-source.ts`**, so
   `migration:run` can't build the schema. To bootstrap an empty DB, boot ONCE with
   `NODE_ENV=development node dist/main.js` (synchronize creates all tables from entities),
   Ctrl+C, then start with PM2 in production.
3. **`.env` is not in git.** Changing it requires editing on the server + `pm2 restart tezkor-slide --update-env`.
4. **Off-site backup** (`scripts/backup-offsite.sh`) pushes DB + `storage/` to Google Drive via
   `rclone` (remote name `slideraibackup`) on a daily cron — because if the VPS is deleted, its
   local + provider backups die with it.

## CI/CD — push to deploy

`.github/workflows/deploy.yml` ("Deploy to Contabo") runs on push to `main`: SSHes into the
server, `git pull`, installs + builds backend/mini-app/web, `pm2 restart tezkor-slide`.

Required GitHub secrets: `SERVER_HOST`, `SERVER_USER` (`root`), `SSH_PRIVATE_KEY`.
So the normal workflow is just: **`git push origin main` → auto-deploy**.

> Editing `.github/workflows/*` via push needs a token with the `workflow` scope — the `gh`
> CLI OAuth token usually lacks it, so change the workflow through the GitHub UI or a scoped PAT.
> `.env`-only changes are NOT auto-applied — update on the server + `pm2 restart --update-env`.

## Common ops (run on the server)

```bash
cd /var/www/tezkor_slide_ai
git pull origin main && npm run build && pm2 restart tezkor-slide   # manual deploy
pm2 status                       # process state
pm2 logs tezkor-slide            # live logs
pm2 restart tezkor-slide --update-env   # after editing .env
docker exec -it tezkor-postgres psql -U tezkor tezkor_slide_ai      # DB console
bash scripts/backup-offsite.sh   # run backup now
```

Update one env var safely (upsert + reload):
```bash
KEY=SOME_VAR; VALUE=some_value; ENV=/var/www/tezkor_slide_ai/.env
grep -q "^${KEY}=" "$ENV" && sed -i "s|^${KEY}=.*|${KEY}=${VALUE}|" "$ENV" || echo "${KEY}=${VALUE}" >> "$ENV"
pm2 restart tezkor-slide --update-env
```

## Conventions & notes

- 9 languages via `src/common/i18n/` — wire new strings into every `*.json` locale.
- All errors: use NestJS `Logger.error(...)` — the custom `TelegramLogger` forwards them to the
  error group (deduped, rate-limited). Don't `console.error` for app errors.
- Prices are hardcoded per-feature (so'm); AI cost tracked in USD for admin profit stats.
- Frontends build into `dist/` and are served statically by NestJS (`/` = web, `/mini-app` = mini-app).
- Commit style: conventional commits. Confirm before `git push`.
