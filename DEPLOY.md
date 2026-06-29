# Tezkor Slide AI - Production Deployment Guide

## Tavsiya etilgan: Hetzner VPS (€4.51/oy)

##1. Hetzner Cloud'da VPS yaratish

1. https://www.hetzner.com/cloud ga kiring
2. "Add Server" bosing
3. Tanlang:
   - **Location**: Falkenstein (DE) yoki Helsinki (FI)
   - **Image**: Ubuntu 24.04
   - **Type**: CX22 (2 vCPU, 4GB RAM, 40GB SSD) - €4.51/oy
   - **SSH Key**: O'zingizning SSH kalitingizni qo'shing

### 2. Serverga ulanish

```bash
ssh root@YOUR_SERVER_IP
```

### 3. Asosiy dasturlarni o'rnatish

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
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

### 4. Projectni serverga ko'chirish

**Lokal kompyuterda:**

```bash
# Build mini-app
cd mini-app && npm run build && cd ..

# Create archive (without node_modules)
tar --exclude='node_modules' --exclude='dist' --exclude='.git' \
    -czvf tezkor-slide.tar.gz .

# Upload to server
scp tezkor-slide.tar.gz root@YOUR_SERVER_IP:/root/
```

**Serverda:**

```bash
mkdir -p /var/www/tezkor-slide
cd /var/www/tezkor-slide
tar -xzvf /root/tezkor-slide.tar.gz

# Install dependencies
npm install

# Build backend
npm run build
```

### 5. Environment o'rnatish

```bash
cp .env.example .env
nano .env
```

**.env faylini to'ldiring:**

```env
NODE_ENV=production
PORT=3000

# Telegram
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN

# Database (Docker da ishga tushadi)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=tezkor
DATABASE_PASSWORD=STRONG_PASSWORD_HERE
DATABASE_NAME=tezkor_slide_ai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI
GEMINI_API_KEY=YOUR_KEY
OPENROUTER_API_KEY=YOUR_KEY

# Images
UNSPLASH_ACCESS_KEY=YOUR_KEY
PEXELS_API_KEY=YOUR_KEY

# Storage
STORAGE_PATH=/var/www/tezkor-slide/storage

# Admin
ADMIN_TELEGRAM_IDS=YOUR_TELEGRAM_ID
ADMIN_USERNAME=your_username

# Payment Cards
HUMO_CARD_NUMBER=YOUR_CARD
HUMO_CARD_OWNER=YOUR_NAME
UZCARD_CARD_NUMBER=YOUR_CARD
UZCARD_CARD_OWNER=YOUR_NAME

# Mini App (domain olganingizdan keyin)
MINI_APP_URL=https://slide.yourdomain.com/mini-app
```

### 6. Docker Compose bilan PostgreSQL va Redis

```bash
# docker-compose.prod.yml yarating
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: tezkor
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: tezkor_slide_ai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"

volumes:
  postgres_data:
  redis_data:
EOF

# Start databases
docker compose -f docker-compose.prod.yml up -d
```

### 7. PM2 bilan NestJS'ni ishga tushirish

```bash
# ecosystem.config.js yarating
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tezkor-slide',
    script: 'dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    max_memory_restart: '500M',
    error_file: '/var/log/tezkor/error.log',
    out_file: '/var/log/tezkor/out.log',
  }]
};
EOF

# Create log directory
mkdir -p /var/log/tezkor

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 8. Nginx sozlash (SSL bilan)

```bash
# Nginx config
cat > /etc/nginx/sites-available/tezkor-slide << 'EOF'
server {
    listen 80;
    server_name slide.yourdomain.com;

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

        # For file uploads
        client_max_body_size 50M;
    }

    # Mini app static files
    location /mini-app {
        alias /var/www/tezkor-slide/mini-app/dist;
        try_files $uri $uri/ /mini-app/index.html;
    }

    # Storage for generated files
    location /storage {
        alias /var/www/tezkor-slide/storage;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/tezkor-slide /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL certificate
certbot --nginx -d slide.yourdomain.com
```

### 9. Telegram Bot Webhook sozlash

```bash
# Set webhook (SSL kerak)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://slide.yourdomain.com/telegram/webhook"}'
```

### 10. Monitoring va Backup

```bash
# Kunlik backup script
cat > /root/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/root/backups

mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker exec tezkor-slide-postgres-1 pg_dump -U tezkor tezkor_slide_ai > $BACKUP_DIR/db_$DATE.sql

# Storage backup
tar -czvf $BACKUP_DIR/storage_$DATE.tar.gz /var/www/tezkor-slide/storage

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
EOF

chmod +x /root/backup.sh

# Add to cron (daily at 3 AM)
echo "0 3 * * * /root/backup.sh" | crontab -
```

---

## Foydali buyruqlar

```bash
# Loglarni ko'rish
pm2 logs tezkor-slide

# Restart
pm2 restart tezkor-slide

# Database console
docker exec -it tezkor-slide-postgres-1 psql -U tezkor tezkor_slide_ai

# Redis console
docker exec -it tezkor-slide-redis-1 redis-cli
```

---

## Narxlar xulosasi

| Xizmat           | Narx/oy    |
| ---------------- | ---------- |
| Hetzner CX22 VPS | €4.51      |
| Domain (.com)    | ~$1        |
| **Jami**         | **~$6/oy** |

Bu narxda 10,000+ foydalanuvchini ko'tara olasiz!
