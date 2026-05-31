# Tezkor Slide AI - Timeweb Deploy Qo'llanmasi

## 1-qadam: Timeweb'da VPS yaratish

1. https://timeweb.com/ru/services/vps/ ga kiring
2. "Cloud серверы" bo'limini tanlang
3. Quyidagilarni tanlang:
   - **Тариф**: Cloud 2 (2 CPU, 2GB RAM, 30GB SSD) - 349 RUB/oy
   - **Операционная система**: Ubuntu 24.04 LTS
   - **Локация**: Россия (Saint Petersburg yoki Moscow)
   - **SSH ключ**: Qo'shing (yoki parol bilan)

4. Server yaratilgandan so'ng IP manzilni oling (masalan: `185.68.xxx.xxx`)

---

## 2-qadam: Ahost'da DNS sozlash

Ahost.uz shaxsiy kabinetga kiring:

1. **Домены** → Sizning domeningiz → **DNS**
2. Yangi yozuv qo'shing:

```
Тип:    A
Имя:    @  (yoki bo'sh qoldiring - asosiy domen uchun)
Адрес:  185.68.xxx.xxx  (Timeweb server IP)
TTL:    3600
```

Agar subdomen ishlatsangiz (masalan: `slide.yourdomain.uz`):
```
Тип:    A
Имя:    slide
Адрес:  185.68.xxx.xxx
TTL:    3600
```

⏳ DNS yangilanishi 5-30 daqiqa olishi mumkin.

---

## 3-qadam: Serverga ulanish

**Terminal/PowerShell'da:**
```bash
ssh root@185.68.xxx.xxx
# Parolni kiriting (yoki SSH kalit bilan avtomatik)
```

---

## 4-qadam: Server sozlash

Serverga ulangandan so'ng quyidagi buyruqlarni bajaring:

```bash
# Tizimni yangilash
apt update && apt upgrade -y

# Docker o'rnatish
curl -fsSL https://get.docker.com | sh

# Docker Compose o'rnatish
apt install docker-compose-plugin -y

# Node.js 20 o'rnatish
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# PM2 o'rnatish (process manager)
npm install -g pm2

# Nginx o'rnatish (reverse proxy)
apt install nginx -y

# Certbot o'rnatish (SSL sertifikat)
apt install certbot python3-certbot-nginx -y

# Kerakli papkalarni yaratish
mkdir -p /var/www/tezkor-slide
mkdir -p /var/log/tezkor
```

---

## 5-qadam: Projectni serverga yuklash

### Lokal kompyuterda (Mac/Linux):

```bash
# Project papkasiga kiring
cd /Users/Learning/tezkor_slide_ai

# Mini-app'ni build qiling
cd mini-app && npm run build && cd ..

# Backend'ni build qiling
npm run build

# Arxiv yarating (node_modules'siz)
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='mini-app/node_modules' \
    -czvf tezkor-slide.tar.gz .

# Serverga yuklang
scp tezkor-slide.tar.gz root@185.68.xxx.xxx:/var/www/tezkor-slide/
```

### Windows (PowerShell) uchun:

```powershell
# 7-Zip o'rnatilgan bo'lishi kerak
cd C:\path\to\tezkor_slide_ai

# Arxiv yarating
7z a -ttar -xr!node_modules -xr!.git tezkor-slide.tar .
7z a -tgzip tezkor-slide.tar.gz tezkor-slide.tar

# Serverga yuklash (scp yoki WinSCP dasturi orqali)
scp tezkor-slide.tar.gz root@185.68.xxx.xxx:/var/www/tezkor-slide/
```

---

## 6-qadam: Serverda projectni ochish

```bash
# Project papkasiga o'ting
cd /var/www/tezkor-slide

# Arxivni oching
tar -xzvf tezkor-slide.tar.gz

# Arxivni o'chiring (joy tejash)
rm tezkor-slide.tar.gz

# Dependencies o'rnatish
npm install --production

# Mini-app dependencies (agar build qilinmagan bo'lsa)
cd mini-app && npm install && npm run build && cd ..
```

---

## 7-qadam: Database va Redis ishga tushirish

```bash
cd /var/www/tezkor-slide

# Docker Compose bilan ishga tushirish
docker compose -f docker-compose.prod.yml up -d

# Tekshirish
docker ps
# postgres va redis ishlayotganini ko'rishingiz kerak
```

---

## 8-qadam: Environment sozlash

```bash
# .env faylini yarating
cp .env.example .env

# Tahrirlash
nano .env
```

**.env faylini to'ldiring:**
```env
# App
NODE_ENV=production
PORT=3000

# Telegram Bot
TELEGRAM_BOT_TOKEN=8887703637:AAFeAbauUc2NG1Ic3MxOswDXUS68J3zsp9E

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=tezkor
DATABASE_PASSWORD=TezkorSecure2024!
DATABASE_NAME=tezkor_slide_ai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Providers
GEMINI_API_KEY=AIzaSyAs4P92_bwBhtCeEPPSfkq3qHctTdCN_ao
OPENROUTER_API_KEY=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

# Images
UNSPLASH_ACCESS_KEY=qw2INuodOnqegT8jNs-rAuBFBOF_wW5kuBtdQssBI0w
PEXELS_API_KEY=U9xxKGR0dxrA5K6zGXcYtpw8qmSAgOQ5K6P1jn2OwKG3YCtnd64isFph
IMAGE_OPENROUTER_ENABLED=false

# Storage
STORAGE_PATH=/var/www/tezkor-slide/storage

# Admin
ADMIN_TELEGRAM_IDS=7827740215
ADMIN_USERNAME=fast_admin_1

# Payment Cards
HUMO_CARD_NUMBER=9860 1234 5678 9012
HUMO_CARD_OWNER=Dilnoza Turdaliyeva
UZCARD_CARD_NUMBER=8600 1234 5678 9012
UZCARD_CARD_OWNER=Dilnoza Turdaliyeva

# Pricing
CREDITS_PER_PRESENTATION=1
DEFAULT_FREE_CREDITS=3

# Required Channel
REQUIRED_CHANNEL_USERNAME=sliderai
REQUIRED_CHANNEL_URL=https://t.me/sliderai

# Mini App URL (domeningizni yozing)
MINI_APP_URL=https://slide.yourdomain.uz/mini-app

# JWT
JWT_SECRET=tezkor-slide-jwt-super-secret-key-2024-production
```

**Ctrl+O** - saqlash, **Ctrl+X** - chiqish

---

## 9-qadam: Nginx sozlash

```bash
# Nginx config yaratish
nano /etc/nginx/sites-available/tezkor-slide
```

Quyidagini yozing (domeningizni almashtiring):

```nginx
server {
    listen 80;
    server_name slide.yourdomain.uz;  # O'zingizning domeningiz

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

        # Katta fayllar uchun
        client_max_body_size 50M;
        proxy_read_timeout 300s;
    }

    # Mini App static files
    location /mini-app {
        alias /var/www/tezkor-slide/mini-app/dist;
        try_files $uri $uri/ /mini-app/index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # Storage (generated presentations)
    location /storage {
        alias /var/www/tezkor-slide/storage;

        # Allow downloads
        add_header Content-Disposition "attachment";
    }
}
```

```bash
# Saqlang va chiqing (Ctrl+O, Ctrl+X)

# Saytni yoqish
ln -s /etc/nginx/sites-available/tezkor-slide /etc/nginx/sites-enabled/

# Default saytni o'chirish
rm -f /etc/nginx/sites-enabled/default

# Nginx configni tekshirish
nginx -t

# Nginx'ni qayta yuklash
systemctl reload nginx
```

---

## 10-qadam: SSL sertifikat olish (HTTPS)

```bash
# Certbot bilan SSL olish
certbot --nginx -d slide.yourdomain.uz

# Email kiriting va shartlarga rozilik bering
# Certbot avtomatik ravishda Nginx configni yangilaydi
```

---

## 11-qadam: Applicationni ishga tushirish

```bash
cd /var/www/tezkor-slide

# PM2 bilan ishga tushirish
pm2 start ecosystem.config.js --env production

# Saqlash (server restart bo'lganda avtomatik ishga tushadi)
pm2 save

# Startup script yaratish
pm2 startup
# Ko'rsatilgan buyruqni nusxalab ishga tushiring
```

---

## 12-qadam: Telegram Webhook sozlash

```bash
# Webhook o'rnatish
curl -X POST "https://api.telegram.org/bot8887703637:AAFeAbauUc2NG1Ic3MxOswDXUS68J3zsp9E/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://slide.yourdomain.uz/telegram/webhook"}'

# Tekshirish
curl "https://api.telegram.org/bot8887703637:AAFeAbauUc2NG1Ic3MxOswDXUS68J3zsp9E/getWebhookInfo"
```

---

## 13-qadam: Tekshirish

1. **Brauzerda ochish**: https://slide.yourdomain.uz
2. **Mini App**: https://slide.yourdomain.uz/mini-app
3. **Telegram botni tekshirish**: /start buyrug'ini yuboring

---

## Foydali buyruqlar

```bash
# === PM2 ===
pm2 status              # Holat
pm2 logs tezkor-slide   # Loglar
pm2 restart tezkor-slide # Qayta ishga tushirish
pm2 stop tezkor-slide   # To'xtatish

# === Docker ===
docker ps               # Konteynerlar
docker logs tezkor-postgres  # DB loglar
docker logs tezkor-redis     # Redis loglar

# === Database ===
docker exec -it tezkor-postgres psql -U tezkor tezkor_slide_ai

# === Nginx ===
nginx -t                # Config tekshirish
systemctl reload nginx  # Qayta yuklash
tail -f /var/log/nginx/error.log  # Xatolar

# === SSL yangilash (avtomatik, lekin manual) ===
certbot renew
```

---

## Backup sozlash

```bash
# Backup script yaratish
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/root/backups
mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker exec tezkor-postgres pg_dump -U tezkor tezkor_slide_ai | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Storage backup
tar -czvf $BACKUP_DIR/storage_$DATE.tar.gz /var/www/tezkor-slide/storage 2>/dev/null

# Eski backuplarni o'chirish (7 kunlik)
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup.sh

# Har kuni soat 3:00 da backup
(crontab -l 2>/dev/null; echo "0 3 * * * /root/backup.sh >> /var/log/backup.log 2>&1") | crontab -
```

---

## Xatolar va yechimlar

### Bot ishlamayapti
```bash
pm2 logs tezkor-slide --lines 50
# Xatoni ko'ring va .env ni tekshiring
```

### Database ulanmayapti
```bash
docker ps  # postgres ishlayaptimi?
docker logs tezkor-postgres
```

### Mini App ochilmayapti
```bash
ls /var/www/tezkor-slide/mini-app/dist/
# index.html bo'lishi kerak
nginx -t
```

### SSL xatosi
```bash
certbot renew --dry-run
```

---

## Narxlar xulosasi

| Xizmat | Narx |
|--------|------|
| Timeweb Cloud 2 | 349 RUB/oy (~45,000 so'm) |
| Ahost domain | ~50,000 so'm/yil |
| **Jami** | **~50,000 so'm/oy** |

---

Muammolar bo'lsa, yozing! 🚀
