# Tezkor Slide AI — Contabo Deploy + DigitalOcean'dan ko'chirish

Tanlangan server: **Contabo Cloud VPS 6** (6 vCPU, 12GB RAM, 200GB SSD),
region **European Union**, image **Ubuntu 24.04**.

> ⚠️ Bot **long-polling** ishlatadi (webhook EMAS). Shuning uchun:
> - Domen/webhook sozlash **shart emas** (mini-app + admin panel uchun domen ixtiyoriy).
> - Bir vaqtda **faqat bitta** instance ishlashi kerak. Ko'chirishda eski
>   serverni **to'xtatmasдан** yangisini yoqmang — aks holda Telegram `409 Conflict` beradi.

---

## 0-qadam: DigitalOcean'da (eski server) — backup olish

Eski serverga ulanib, ma'lumotni oling:

```bash
ssh root@ESKI_DO_IP
cd /var/www/tezkor_slide_ai

# 1) DB dump
docker exec tezkor-postgres pg_dump -U tezkor tezkor_slide_ai | gzip > /root/db_migrate.sql.gz

# 2) Storage (generatsiya qilingan fayllar) arxivi
tar -czf /root/storage_migrate.tar.gz storage

# 3) .env ni ham saqlab qo'ying (kalitlar shu yerda)
cp .env /root/env_backup
```

Lokal kompyuterga yuklab oling (yoki keyin to'g'ridan-to'g'ri yangi serverga `scp` qiling):
```bash
scp root@ESKI_DO_IP:/root/db_migrate.sql.gz .
scp root@ESKI_DO_IP:/root/storage_migrate.tar.gz .
scp root@ESKI_DO_IP:/root/env_backup .
```

---

## 1-qadam: Contabo serverга ulanish

```bash
ssh root@CONTABO_IP
apt update && apt upgrade -y
```

## 2-qadam: Kerakli dasturlar

```bash
apt install -y git curl gzip

# Docker + Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2 + Nginx + Certbot (SSL — faqat domen ishlatsangiz)
npm install -g pm2
apt install -y nginx certbot python3-certbot-nginx
```

## 3-qadam: Projectni olish

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/primerelay/tezkor_slide_ai.git
cd tezkor_slide_ai
```

## 4-qadam: `.env` sozlash

Eski serverdan olgan `env_backup`ни ko'chiring (eng ishonchli yo'l):
```bash
scp env_backup root@CONTABO_IP:/var/www/tezkor_slide_ai/.env
```
Yoki qo'lda yarating: `cp .env.example .env && nano .env`. **Kodda ishlatiladigan haqiqiy kalitlar:**

```env
NODE_ENV=production
PORT=3000

TELEGRAM_BOT_TOKEN=<BotFather_token>

# Database (Docker localhost)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=tezkor
DATABASE_PASSWORD=<kuchli_parol>
DATABASE_NAME=tezkor_slide_ai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI — faqat OpenRouter ishlatiladi (Gemini olib tashlangan)
OPENROUTER_API_KEY=<openrouter_key>
# ANTHROPIC_API_KEY=<ixtiyoriy, hozir ishlatilmaydi>

# Rasmlar (bepul stock)
UNSPLASH_ACCESS_KEY=<key>
PEXELS_API_KEY=<key>
IMAGE_OPENROUTER_ENABLED=false

# Storage — MUHIM: to'liq yo'l
STORAGE_PATH=/var/www/tezkor_slide_ai/storage

# Telegram admin (to'lov tasdiqlash)
ADMIN_TELEGRAM_IDS=<sizning_telegram_id>
ADMIN_USERNAME=<admin_username>

# Web admin panel
ADMIN_PHONE=998901234567
ADMIN_PASSWORD=<kuchli_parol>
ADMIN_NAME=Admin
JWT_SECRET=<openssl rand -hex 32 dan chiqqan satr>

# To'lov kartalari
HUMO_CARD_NUMBER=...
HUMO_CARD_OWNER=...
UZCARD_CARD_NUMBER=...
UZCARD_CARD_OWNER=...

# Majburiy kanal
REQUIRED_CHANNEL_USERNAME=<kanal>
REQUIRED_CHANNEL_URL=https://t.me/<kanal>

# Mini App (domen bo'lsa)
MINI_APP_URL=https://sizning-domen/mini-app

CREDITS_PER_PRESENTATION=1
DEFAULT_FREE_CREDITS=3
```

> `NODE_ENV=production` bo'lgani uchun TypeORM `synchronize` **o'chadi** — jadval sxemasi
> avtomatik o'zgармaydi. Ko'chirilgan DB dump sxemani o'zi bilan olib keladi (pastda).

## 5-qadam: PostgreSQL + Redis (Docker)

```bash
cd /var/www/tezkor_slide_ai
docker compose -f docker-compose.prod.yml up -d
docker ps   # tezkor-postgres va tezkor-redis ishlayaptimi?
```

## 6-qadam: Eski DB va storage'ni tiklash

```bash
# DB dump'ni serverga ko'chiring (agar hali qilmagan bo'lsangiz)
scp db_migrate.sql.gz storage_migrate.tar.gz root@CONTABO_IP:/root/

# DB'ni tiklash
gunzip -c /root/db_migrate.sql.gz | docker exec -i tezkor-postgres psql -U tezkor -d tezkor_slide_ai

# Storage'ni tiklash
cd /var/www/tezkor_slide_ai
tar -xzf /root/storage_migrate.tar.gz   # storage/ papkasini tiklaydi
```

## 7-qadam: Build + PM2 bilan ishga tushirish

```bash
cd /var/www/tezkor_slide_ai
bash deploy.sh          # backend + mini-app + web build + PM2 start
# yoki qo'lda: npm ci && npm run build && pm2 start ecosystem.config.js --env production

pm2 save
pm2 startup             # chiqqan buyruqni nusxalab ishga tushiring
pm2 logs tezkor-slide   # xatosiz ishga tushdimi tekshiring
```

> ⚠️ **Aynan shu paytda** eski DO serverida botni to'xtating (`pm2 stop tezkor-slide`),
> aks holda ikkalasi ham Telegram'ni poll qilib `409 Conflict` beradi.

## 8-qadam (ixtiyoriy): Domen + Nginx + SSL

Mini-app va admin panel HTTPS orqali ochilishi uchun. Bot o'zi domensiz ham ishlaydi.
Nginx config namunasi `DEPLOY.md`da bor — domenni yozib, keyin:
```bash
ln -s /etc/nginx/sites-available/tezkor-slide /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d sizning-domen
```
DNS A-record'ни (ahost.uz) yangi **Contabo IP**'ga yo'naltiring.

## 9-qadam: Off-site backup (MUHIM — ma'lumot yo'qolmasligi uchun)

Contabo puli tugab akkaunt o'chsa, serverdagi hamma narsa (Auto Backup ham) yo'qoladi.
Backupни serverdan tashqariga chiqaramiz:

```bash
apt install -y rclone
rclone config          # "backup" nomli remote yarating (Google Drive yoki R2/S3)

# Kunlik cron (soat 3:00)
(crontab -l 2>/dev/null; echo "0 3 * * * /var/www/tezkor_slide_ai/scripts/backup-offsite.sh >> /var/log/tezkor-backup.log 2>&1") | crontab -
```
Skript: `scripts/backup-offsite.sh` (DB + storage'ni off-site'ga yuklaydi, 30 kun saqlaydi).

## 10-qadam: CI/CD (GitHub Actions)

Workflow allaqachon Contabo'ga moslangan (`.github/workflows/deploy.yml`).
GitHub repo → Settings → Secrets and variables → Actions → 3 ta secret yangilang:
- `SERVER_HOST` = **Contabo IP**
- `SERVER_USER` = `root`
- `SSH_PRIVATE_KEY` = Contabo deploy uchun SSH private key

Serverда deploy kaliti:
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy    # buni GitHub SSH_PRIVATE_KEY secret'ga qo'ying
```
Endi `git push origin main` → avtomatik Contabo'ga deploy.

## 11-qadam: Xavfsizlik (firewall)

```bash
ufw allow 22 && ufw allow 80 && ufw allow 443
ufw enable
```

---

## Tekshirish
1. `pm2 status` — `tezkor-slide` online
2. Telegram'da `/start` — bot javob beradimi
3. Test prezentatsiya yaratib ko'ring (queue + generatsiya ishlaydimi)
4. Eski userlar tarixi joyidami (DB migratsiya to'g'ri bo'lgani belgisi)

## DO → Contabo ko'chirish checklist
- [ ] DO'da DB dump + storage + .env olindi
- [ ] Contabo server tayyor (Ubuntu 24.04, EU)
- [ ] Dasturlar o'rnatildi
- [ ] Project clone + .env sozlandi
- [ ] Postgres/Redis ishga tushdi
- [ ] DB va storage tiklandi
- [ ] Build + PM2 start, bot ishladi
- [ ] **DO'da bot to'xtatildi (409 oldini olish)**
- [ ] DNS Contabo IP'ga yo'naltirildi (domen bo'lsa)
- [ ] Off-site backup + cron sozlandi
- [ ] GitHub Secrets yangilandi

<!-- CI/CD auto-deploy faol: main push -> Contabo -->
