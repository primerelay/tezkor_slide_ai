# Tezkor Slide AI - Production Deployment Guide

## Tavsiya etilgan: DigitalOcean VPS ($12/oy yoki Student Pack bilan $200 credit)

---

## 📋 Tezkor Ko'rsatma

1. ✅ DigitalOcean'da droplet yarating
2. ✅ Domain sozlang (A record)
3. ✅ Serverga Docker, Node.js, PM2, Nginx o'rnating
4. ✅ GitHub'dan projectni clone qiling
5. ✅ Environment sozlang
6. ✅ PostgreSQL va Redis ishga tushiring
7. ✅ PM2 bilan backend ishga tushiring
8. ✅ Nginx va SSL sozlang
9. ✅ CI/CD (GitHub Actions) sozlang - **AVTOMATIK DEPLOY!**

---

## 1. DigitalOcean'da Droplet yaratish

1. https://www.digitalocean.com ga kiring (Student Pack uchun: https://education.github.com/pack)
2. **Create** > **Droplets** bosing
3. Tanlang:
   - **Region**: Singapore (SGP) yoki yaqin lokatsiya
   - **Image**: Ubuntu 24.04 LTS x64
   - **Size**:
     - Basic $6/oy (1 vCPU, 1GB RAM, 25GB SSD)
     - Basic $12/oy (2 vCPU, 2GB RAM, 50GB SSD) - **Tavsiya**
   - **Authentication**: SSH Key qo'shing yoki Password
   - **Hostname**: tezkor-slide
4. **Create Droplet** bosing
5. IP manzilni ko'chirib oling (masalan: `174.138.22.248`)

---

## 2. Domain sozlash (aHost yoki boshqa)

### aHost orqali:
1. https://my.ahost.uz ga kiring
2. Domeningizni tanlang (masalan: tezhisobchi.uz)
3. **DNS boshqaruvi** ga o'ting
4. **A record** qo'shing:
   - **Host**: @ (yoki bo'sh)
   - **Value**: Droplet IP (masalan: 174.138.22.248)
   - **TTL**: 3600

DNS 10-30 daqiqada tarqaladi. Tekshirish:
```bash
nslookup yourdomain.com
```

---

## 3. Serverga ulanish

```bash
ssh root@YOUR_SERVER_IP
```

---

## 4. Asosiy dasturlarni o'rnatish

```bash
# Update system
apt update && apt upgrade -y

# Install Git
apt install git -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose Plugin
apt install docker-compose-plugin -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Install PM2
npm install -g pm2

# Install Nginx
apt install nginx -y

# Install Certbot for SSL
apt install certbot python3-certbot-nginx -y
```

---

## 5. Projectni GitHub'dan clone qilish

```bash
# Project papkasini yaratish
mkdir -p /var/www
cd /var/www

# GitHub'dan clone qilish
git clone https://github.com/YOUR_USERNAME/tezkor_slide_ai.git
cd tezkor_slide_ai

# Backend dependencies
npm install

# Backend build
npm run build

# Mini-app dependencies va build
cd mini-app
npm install
npm run build
cd ..

# Web app (admin panel) dependencies va build
cd web
npm install
npm run build
cd ..
```

---

## 6. Environment o'rnatish

```bash
# .env yaratish
cp .env.example .env
nano .env
```

**.env faylini to'ldiring:**

```env
NODE_ENV=production
PORT=3000

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_@BotFather

# Database (Docker localhost)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=tezkor
DATABASE_PASSWORD=STRONG_PASSWORD_HERE_123!
DATABASE_NAME=tezkor_slide_ai

# Redis (Docker localhost)
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Providers
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Image sources (FREE)
UNSPLASH_ACCESS_KEY=your_unsplash_key
PEXELS_API_KEY=your_pexels_key
IMAGE_OPENROUTER_ENABLED=false

# Storage
STORAGE_PATH=/var/www/tezkor_slide_ai/storage

# Admin
ADMIN_TELEGRAM_IDS=your_telegram_id
ADMIN_USERNAME=your_username
ADMIN_PHONE=998901234567
ADMIN_PASSWORD=secure_admin_password
ADMIN_NAME=Admin
JWT_SECRET=your_jwt_secret_random_string

# Payment Cards (O'zbekiston)
HUMO_CARD_NUMBER=9860 1234 5678 9012
HUMO_CARD_OWNER=Ism Familiya
UZCARD_CARD_NUMBER=8600 1234 5678 9012
UZCARD_CARD_OWNER=Ism Familiya

# Required Channel
REQUIRED_CHANNEL_USERNAME=your_channel
REQUIRED_CHANNEL_URL=https://t.me/your_channel

# Mini App URL (HTTPS kerak)
MINI_APP_URL=https://yourdomain.com/mini-app

# Pricing
CREDITS_PER_PRESENTATION=1
DEFAULT_FREE_CREDITS=3
```

**CTRL+O**, **ENTER**, **CTRL+X** - saqlash va chiqish

---

## 7. Docker Compose bilan PostgreSQL va Redis

Docker Compose fayli allaqachon loyihada bor (`docker-compose.prod.yml`):

```bash
# Docker containers ni ishga tushirish
docker compose -f docker-compose.prod.yml up -d

# Statusni tekshirish
docker ps

# Loglarni ko'rish
docker compose -f docker-compose.prod.yml logs
```

---

## 8. PM2 bilan Backend ishga tushirish

PM2 config fayli allaqachon loyihada bor (`ecosystem.config.js`):

```bash
# PM2 bilan ishga tushirish
pm2 start ecosystem.config.js

# PM2'ni avtomatik ishga tushirish
pm2 save
pm2 startup

# (Chiqgan commandni copy-paste qiling)
```

**Foydali PM2 buyruqlar:**
```bash
pm2 status              # Holat
pm2 logs tezkor-slide   # Loglar
pm2 restart tezkor-slide # Restart
pm2 stop tezkor-slide   # To'xtatish
```

---

## 9. Nginx sozlash

```bash
# Nginx config yaratish
nano /etc/nginx/sites-available/tezkor-slide
```

**Quyidagini yozing:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Backend API
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }

    # Mini app static files
    location /mini-app {
        alias /var/www/tezkor_slide_ai/mini-app/dist;
        try_files $uri $uri/ /mini-app/index.html;
    }

    # Storage for generated files
    location /storage {
        alias /var/www/tezkor_slide_ai/storage;
    }
}
```

**Aktivlashtirish:**

```bash
# Symlink yaratish
ln -s /etc/nginx/sites-available/tezkor-slide /etc/nginx/sites-enabled/

# Nginx testdan o'tkazish
nginx -t

# Nginx restart
systemctl reload nginx
```

---

## 10. SSL (HTTPS) sozlash

```bash
# Let's Encrypt SSL sertifikat olish
certbot --nginx -d yourdomain.com

# Avtomatik yangilanish tekshirish
certbot renew --dry-run
```

SSL o'rnatilgandan keyin saytingiz HTTPS orqali ochiladi: `https://yourdomain.com`

---

## 11. CI/CD - Avtomatik Deploy (GitHub Actions) 🚀

**Bu eng muhim qism!** Endi har safar GitHub'ga push qilganingizda avtomatik deploy bo'ladi.

### 11.1. Serverda SSH Key yaratish

```bash
# SSH key yaratish (deploy uchun)
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""

# Public keyni authorized_keys ga qo'shish
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Private keyni ko'rish (buni GitHub'ga qo'yasiz)
cat ~/.ssh/github_deploy
```

**Private keyni butunlay copy qiling** (`-----BEGIN OPENSSH PRIVATE KEY-----` dan `-----END OPENSSH PRIVATE KEY-----` gacha).

### 11.2. GitHub Secrets sozlash

1. GitHub repository: https://github.com/YOUR_USERNAME/tezkor_slide_ai
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** bosing
4. 3 ta secret qo'shing:

**Secret 1:**
- **Name**: `SERVER_HOST`
- **Value**: `YOUR_SERVER_IP` (masalan: 174.138.22.248)

**Secret 2:**
- **Name**: `SERVER_USER`
- **Value**: `root`

**Secret 3:**
- **Name**: `SSH_PRIVATE_KEY`
- **Value**: (yuqoridagi private key - butun matni)

### 11.3. GitHub Actions Workflow

Workflow fayli allaqachon loyihada bor: `.github/workflows/deploy.yml`

**Qanday ishlaydi:**
1. Siz kodda o'zgarish qilasiz (backend, bot, mini-app, web)
2. Git commit va push qilasiz:
   ```bash
   git add .
   git commit -m "yangi feature"
   git push origin main
   ```
3. GitHub Actions avtomatik:
   - Serverga SSH orqali ulanadi
   - `git pull` qiladi
   - Backend build qiladi
   - Mini-app build qiladi
   - Web app build qiladi
   - PM2 restart qiladi
4. 2-3 daqiqada yangi versiya live bo'ladi! ✅

**Progress ko'rish:**
https://github.com/YOUR_USERNAME/tezkor_slide_ai/actions

**Qo'lda ham ishga tushirish:**
- **Actions** tab → **Deploy to DigitalOcean** → **Run workflow**

---

## 12. Database Backup (Avtomatik)

```bash
# Backup script yaratish
nano /root/backup.sh
```

**Script:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/root/backups

mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker exec tezkor-postgres pg_dump -U tezkor tezkor_slide_ai | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Storage backup
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /var/www/tezkor_slide_ai/storage

# Eski backuplarni o'chirish (7 kundan eski)
find $BACKUP_DIR -mtime +7 -delete

echo "✅ Backup completed: $DATE"
```

**Ishga tushirish:**

```bash
# Execute ruxsati
chmod +x /root/backup.sh

# Cron job (har kuni soat 3 da)
crontab -e
```

**Crontab ga qo'shing:**
```
0 3 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

---

## 13. Monitoring va Debugging

### PM2 Monitoring
```bash
pm2 status                # Holat
pm2 logs tezkor-slide     # Real-time loglar
pm2 logs --lines 100      # Oxirgi 100 qator
pm2 monit                 # CPU/Memory monitoring
```

### Docker Monitoring
```bash
docker ps                 # Running containers
docker stats              # Resource usage
docker logs tezkor-postgres   # PostgreSQL logs
docker logs tezkor-redis      # Redis logs
```

### Nginx Logs
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Disk Space
```bash
df -h                     # Disk usage
du -sh /var/www/tezkor_slide_ai/storage   # Storage size
```

---

## 14. Foydali Buyruqlar

### Server Management
```bash
# System resources
htop
free -h
df -h

# Restart services
systemctl restart nginx
pm2 restart all
docker compose -f docker-compose.prod.yml restart
```

### Database Console
```bash
# PostgreSQL
docker exec -it tezkor-postgres psql -U tezkor tezkor_slide_ai

# Redis
docker exec -it tezkor-redis redis-cli
```

### Update Project (Manual - agar CI/CD ishlamasa)
```bash
cd /var/www/tezkor_slide_ai
git pull origin main
npm install
npm run build
cd mini-app && npm install && npm run build && cd ..
cd web && npm install && npm run build && cd ..
pm2 restart tezkor-slide
```

---

## 15. Troubleshooting

### Bot ishlamayapti?
```bash
# PM2 loglarni tekshiring
pm2 logs tezkor-slide

# Telegram API connection tekshiring
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe

# Environment to'g'rimi?
cat /var/www/tezkor_slide_ai/.env | grep TELEGRAM_BOT_TOKEN
```

### Database ulanmayapti?
```bash
# PostgreSQL container ishyaptimi?
docker ps | grep postgres

# Database ga ulanish testi
docker exec tezkor-postgres pg_isready -U tezkor
```

### Nginx 502 Bad Gateway?
```bash
# Backend ishyaptimi?
pm2 status
curl http://localhost:3000/api/health

# Nginx config to'g'rimi?
nginx -t
```

### CI/CD ishlamayapti?
- GitHub Actions loglarini tekshiring: https://github.com/YOUR_USERNAME/tezkor_slide_ai/actions
- Server SSH key to'g'ri qo'shildimi: `cat ~/.ssh/authorized_keys`
- GitHub Secrets to'g'ri sozlandimi: Settings → Secrets

---

## 16. Narxlar xulosasi

| Xizmat                  | Narx/oy       | Eslatma                    |
|-------------------------|---------------|----------------------------|
| DigitalOcean Basic      | $6-12         | $200 student credit bilan  |
| Domain (.uz)            | ~50,000 so'm  | Yiliga                     |
| SSL (Let's Encrypt)     | **BEPUL**     | -                          |
| **Jami**                | **~$6-12/oy** | + domain yiliga            |

**Student Pack:** https://education.github.com/pack (DigitalOcean $200 credit)

Bu narxda **10,000+ foydalanuvchini** ko'tara olasiz! 🚀

---

## 17. Qo'shimcha Tavsiyalar

### Security
- Firewall yoqing: `ufw enable`
- Faqat kerakli portlarni oching: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- SSH password login o'chiring, faqat key bilan
- Muntazam backup oling

### Performance
- Redis'ni cache uchun to'liq ishlatilayapti
- PM2 cluster mode (2 instance)
- Nginx static file caching
- Image optimization (presentation generation)

### Cost Optimization
- Eski presentation fayllarini o'chiring
- Log rotation sozlang
- Database vakuum qiling
- Monitoring: resource usage track qiling

---

## ✅ Deploy Checklist

- [ ] DigitalOcean droplet yaratdim
- [ ] Domain A record sozladim
- [ ] Git, Docker, Node.js, PM2, Nginx o'rnatdim
- [ ] GitHub'dan clone qildim
- [ ] .env sozladim
- [ ] PostgreSQL va Redis ishga tushdim
- [ ] PM2 bilan backend ishga tushdim
- [ ] Nginx sozladim
- [ ] SSL o'rnatdim (HTTPS)
- [ ] GitHub Actions CI/CD sozladim ✅
- [ ] Backup script sozladim
- [ ] Bot ishlayapti va presentation yaratayapti! 🎉

---

**Muammolar yoki savollar bo'lsa:** GitHub Issues ga yozing yoki documentation'ni qaytadan o'qing.

**CI/CD ishlayapti = Kod yozdingiz, push qildingiz, avtomatik deploy bo'ldi!** 🚀
