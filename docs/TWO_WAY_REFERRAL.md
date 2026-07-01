# Ikki Tomonlama Referral Tizimi

## Umumiy ma'lumot

Bu tizim foydalanuvchilarga do'stlarini taklif qilish va ikkala tomon ham bonus olishni ta'minlaydi:

- **Yangi foydalanuvchi**: Kanalga qo'shilganda **1,000 so'm** ✅
- **Taklif qilgan (referrer)**: Do'sti kanalga qo'shilganda **1,000 so'm** ✅

## Qanday ishlaydi?

### 1. Referral havolasini olish

Foydalanuvchi botda:
1. `/start` buyrug'ini yuboradi
2. "🎁 Do'stlarni taklif qilish" tugmasini bosadi
3. Shaxsiy referral havolasini oladi

**Misol havola:**
```
https://t.me/your_bot?start=ref_123456_abc12345
```

### 2. Do'stni taklif qilish

Foydalanuvchi havolani do'stiga yuboradi:
- Telegram orqali to'g'ridan-to'g'ri ulashish tugmasi
- Yoki havolani nusxalash va qo'lda yuborish

### 3. Yangi foydalanuvchi ro'yxatdan o'tish

Do'st havolani bosadi:
1. Bot ishga tushadi
2. Kimning havolasi orqali kelganini aniqlaydi
3. Foydalanuvchini yaratadi va `referredBy` maydoniga referrer ID sini saqlaydi
4. "👋 Sizni [Ism] taklif qildi!" xabarini ko'rsatadi

### 4. Kanalga qo'shilish va bonuslar

Do'st kanalga qo'shilganda:
1. **Yangi foydalanuvchiga** 1,000 so'm beriladi
2. **Referrerga** 1,000 so'm beriladi
3. Referrerning `referralCount` 1 ga oshadi
4. Ikkala tomonga ham xabar yuboriladi

## Database o'zgarishlari

### `users` jadvaliga qo'shilgan maydonlar:

```sql
ALTER TABLE "users"
ADD COLUMN "referredBy" INTEGER,           -- Kim taklif qilgan (user ID)
ADD COLUMN "referralCount" INTEGER DEFAULT 0,  -- Necha kishi taklif qilgan
ADD COLUMN "referralCode" VARCHAR(255) UNIQUE; -- Unikal referral kodi

CREATE INDEX "IDX_users_referralCode" ON "users" ("referralCode");
CREATE INDEX "IDX_users_referredBy" ON "users" ("referredBy");
```

## Kod tuzilmasi

### Yangi metodlar

#### TelegramService

```typescript
// Referral havolasini olish
getReferralLink(user: User): string

// Referral kod orqali foydalanuvchini topish
getUserByReferralCode(referralCode: string): Promise<User | null>

// Referral statistikasini olish
getReferralStats(userId: number): Promise<{
  referralCount: number;
  totalEarned: number;
}>
```

#### ReferralService

```typescript
// Referrerni mukofotlash (private)
private async rewardReferrer(
  referrerId: number,
  invitedUser: User,
  invitedUserI18n: I18nService,
): Promise<void>
```

### Action Handlers

```typescript
@Action('share_referral')
async onShareReferral(@Ctx() ctx: BotContext)
```

## Translatsiyalar

### Uzbek tilida

```json
{
  "referral": {
    "referrerBonus": "🎉 Ajoyib! {name} sizning havolangiz orqali kanalga qo'shildi!",
    "shareTitle": "🎁 Do'stlaringizni taklif qiling!",
    "shareButton": "📤 Havolani ulashish",
    "invitedBy": "👋 Sizni {name} taklif qildi!"
  },
  "buttons": {
    "inviteFriends": "🎁 Do'stlarni taklif qilish"
  }
}
```

Hammasi 4 ta tilda (uz, ru, en, de) qo'shilgan.

## Production Deploy

### 1. Database Migration

```bash
# SSH to server
ssh your-server

# Access PostgreSQL
docker exec -it tezkor-postgres psql -U tezkor -d tezkor_slide_ai

# Run migration
ALTER TABLE "users"
ADD COLUMN "referredBy" INTEGER,
ADD COLUMN "referralCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "referralCode" VARCHAR(255) UNIQUE;

CREATE INDEX "IDX_users_referralCode" ON "users" ("referralCode");
CREATE INDEX "IDX_users_referredBy" ON "users" ("referredBy");

-- Generate referral codes for existing users
UPDATE "users"
SET "referralCode" = 'ref_' || "id" || '_' || substr(md5(random()::text), 1, 8)
WHERE "referralCode" IS NULL;
```

### 2. Environment Variable (Optional)

`.env` ga qo'shing:

```env
TELEGRAM_BOT_USERNAME=your_bot_username
```

Bu referral havolalarni yaratish uchun kerak.

### 3. Deploy Code

```bash
git add .
git commit -m "feat: add two-way referral system"
git push
```

## Testlash

### Test 1: Referral havolasini olish

1. Botga `/start` yuboring
2. "🎁 Do'stlarni taklif qilish" tugmasini bosing
3. Statistika va havola ko'rsatilishi kerak:
   ```
   🎁 Do'stlaringizni taklif qiling!

   📊 Taklif qilganlar: 0 ta
   💰 Taklif orqali topilgan: 0 so'm

   👇 Quyidagi havolani do'stlaringizga yuboring:
   ```

### Test 2: Do'st taklif qilish

1. **Test account 1**: Referral havolasini oling
2. **Test account 2**: Havolani bosib botni ishga tushiring
3. Tekshiring:
   - Account 2 da "👋 Sizni [Ism] taklif qildi!" xabari
   - Database da `referredBy` to'ldirilgan

```sql
SELECT id, "firstName", "referredBy", "referralCode"
FROM users
WHERE "telegramId" = 'TEST_ACCOUNT_2_ID';
```

### Test 3: Kanalga qo'shilish - ikkala bonus

1. **Test account 2** kanalga qo'shilsin
2. Tekshiring:
   - Account 2: +1,000 so'm (kanalga qo'shilish)
   - Account 1: +1,000 so'm (do'stni taklif qilish)

```sql
-- Check balances
SELECT "firstName", credits, "referralCount"
FROM users
WHERE "telegramId" IN ('ACCOUNT_1_ID', 'ACCOUNT_2_ID');

-- Check transactions
SELECT u."firstName", t.amount, t.description, t."createdAt"
FROM transactions t
JOIN users u ON u.id = t."userId"
WHERE t.description LIKE '%taklif%'
   OR t.description LIKE '%bonus%'
ORDER BY t."createdAt" DESC;
```

## Monitoring

### Key Metrics

```sql
-- Total referrals
SELECT COUNT(*) as "jami_takliflar"
FROM users
WHERE "referredBy" IS NOT NULL;

-- Top referrers
SELECT
    u.id,
    u."firstName",
    u."referralCount" as "takliflar",
    u."referralCount" * 1000 as "topilgan"
FROM users u
WHERE u."referralCount" > 0
ORDER BY u."referralCount" DESC
LIMIT 10;

-- Referral conversion rate
SELECT
    COUNT(DISTINCT cm."userId") as "kanalga_qoshilgan",
    COUNT(DISTINCT u.id) as "jami_referrallar",
    ROUND(
        COUNT(DISTINCT cm."userId")::numeric /
        NULLIF(COUNT(DISTINCT u.id), 0) * 100,
        2
    ) as "conversion_rate_%"
FROM users u
LEFT JOIN channel_memberships cm
    ON cm."userId" = u.id
    AND cm."rewardGiven" = true
WHERE u."referredBy" IS NOT NULL;
```

## Xavfsizlik

### Firibgarlikni oldini olish

#### ✅ Amalga oshirilgan:

1. **Referral kod noyob** - bir xil kod 2 marta ishlatilmaydi
2. **Kanalga qo'shilish tekshiriladi** - faqat haqiqatan qo'shilganda bonus
3. **Bir marta bonus** - qayta qo'shilganda bonus berilmaydi
4. **Database constraint** - `referralCode UNIQUE`

#### ❌ Kelajakda qo'shish kerak:

1. **Bir shaxsning ko'p akkauntlari** - IP/device fingerprinting
2. **Tezda chiqib ketish** - Kanaldan 1 kun ichida chiqsa bonus qaytarib olish
3. **Limit** - Har kuni maksimal N ta referral
4. **Bot detection** - Avtomatik akkauntlarni aniqlash

## Cost Analysis

### Per Successful Referral:

- Yangi user: 1,000 so'm
- Referrer: 1,000 so'm
- **Total: 2,000 so'm**

### Agar 100 ta foydalanuvchi taklif qilsa:

- 100 yangi user × 1,000 = 100,000 so'm
- 100 referrer × 1,000 = 100,000 so'm
- **Total: 200,000 so'm**

### Database overhead:

- 3 yangi column per user: ~24 bytes
- 10,000 users ≈ 240 KB
- **Negligible**

## Troubleshooting

### Referral havola ishlamayapti

**Tekshiring:**

1. Bot username to'g'rimi?
```sql
SELECT "referralCode" FROM users WHERE id = YOUR_ID;
```

2. `.env` da `TELEGRAM_BOT_USERNAME` bormi?

3. Referral kod noyobmi?
```sql
SELECT "referralCode", COUNT(*)
FROM users
GROUP BY "referralCode"
HAVING COUNT(*) > 1;
```

### Referrer bonus olmayapti

**Tekshiring:**

1. `referredBy` to'ldirilganmi?
```sql
SELECT "referredBy" FROM users WHERE id = NEW_USER_ID;
```

2. Loglarni ko'ring:
```bash
pm2 logs backend | grep "Referrer.*awarded"
```

3. Referrer kanalga qo'shilganmi? (shart emas, lekin logikani tekshirish uchun)

## Future Enhancements

- [ ] Referral leaderboard (top 10 referrers)
- [ ] Tiered rewards (10+ referrals = bonus multiplier)
- [ ] Referral campaigns (ma'lum vaqtda 2x bonus)
- [ ] Admin dashboard (referral statistics)
- [ ] Fraud detection (IP/device analysis)
- [ ] Reward clawback (user leaves < 24h)
- [ ] Multi-level referrals (referrer of referrer)
- [ ] Custom referral messages

## API Reference

### Environment Variables

```env
TELEGRAM_BOT_USERNAME=your_bot  # Required for referral links
```

### Database Schema

```typescript
interface User {
  referredBy?: number;      // Who invited them
  referralCount: number;    // How many they invited
  referralCode?: string;    // Unique code (e.g., ref_123_abc)
}
```

### Translation Keys

```
referral.referrerBonus
referral.referrerBonusDescription
referral.shareTitle
referral.shareButton
referral.yourReferralLink
referral.invitedBy
buttons.inviteFriends
```
