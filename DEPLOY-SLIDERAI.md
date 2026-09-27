# sliderai.uz — client site deployment

The client-facing marketing site lives in **`site/`** (React 19 + Vite, trilingual
UZ/RU/EN). It is completely separate from `web/` (tezhisobchi.uz + admin) — that one
is untouched and stays admin-only.

- Build output: `site/dist/` (static files)
- Served by **Nginx directly** as its own domain — NestJS is not involved.
- CI already builds it: `.github/workflows/deploy.yml` runs `cd site && npm install && npm run build`
  on every push to `main`.

## One-time server setup

### 1. DNS
At your domain registrar, point `sliderai.uz` (and `www`) to the server IP:

```
A     sliderai.uz        <SERVER_IP>
A     www.sliderai.uz    <SERVER_IP>
```

### 2. Build the site once (so dist/ exists before Nginx starts)
```bash
cd /var/www/tezkor_slide_ai/site
npm install
npm run build   # creates site/dist
```

### 3. Nginx server block
Create `/etc/nginx/sites-available/sliderai.uz`:

```nginx
server {
    listen 80;
    server_name sliderai.uz www.sliderai.uz;

    root /var/www/tezkor_slide_ai/site/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long cache for hashed assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable it and reload:
```bash
ln -s /etc/nginx/sites-available/sliderai.uz /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 4. HTTPS (Let's Encrypt)
```bash
certbot --nginx -d sliderai.uz -d www.sliderai.uz
```
Certbot rewrites the block to listen on 443 and auto-renews.

## After the first setup
Nothing else to do. Each `git push origin main`:
1. GitHub Actions SSHes in, pulls, and rebuilds `site/dist`.
2. Nginx serves the fresh files immediately (static, no restart needed).

## Editing links
Bot / support links are centralized in **`site/src/config.ts`**:
- `BOT_URL` = https://t.me/slider_ai_uz_bot
- `SUPPORT_URL` / `SUPPORT_HANDLE` = @fast_admin_1
