# Referral System - Production Deployment Guide

## Summary of Changes

### New Files Created
1. `src/database/entities/channel-membership.entity.ts` - Entity for tracking memberships
2. `src/database/migrations/1782928521595-CreateChannelMemberships.ts` - Database migration
3. `src/telegram/referral.service.ts` - Referral reward logic
4. `docs/REFERRAL_SYSTEM.md` - Complete documentation

### Files Modified
1. `src/telegram/telegram.module.ts` - Added ChannelMembership entity and ReferralService
2. `src/telegram/telegram.update.ts` - Added chat_member handler and referral trigger
3. `src/common/i18n/*.json` - Added referral translations (all 4 languages)

### Database Changes
- New table: `channel_memberships`
- Tracks user joins/leaves with reward status

## Production Deployment Steps

### 1. Database Migration (Required)

SSH to production and run the SQL manually:

```bash
# SSH to server
ssh your-server

# Access PostgreSQL container
docker exec -it tezkor-postgres psql -U tezkor -d tezkor_slide_ai
```

Then run this SQL:

```sql
-- Create channel_memberships table
CREATE TABLE "channel_memberships" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "channelUsername" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "joinedAt" TIMESTAMP NOT NULL,
    "leftAt" TIMESTAMP,
    "rewardGiven" BOOLEAN NOT NULL DEFAULT false,
    "rewardAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_channel_memberships_userId"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "IDX_channel_memberships_userId"
    ON "channel_memberships" ("userId");

CREATE INDEX "IDX_channel_memberships_userId_channelUsername"
    ON "channel_memberships" ("userId", "channelUsername");

-- Verify table created
\dt channel_memberships
SELECT * FROM channel_memberships LIMIT 1;
```

Exit psql with `\q`.

### 2. Enable chat_member Updates (CRITICAL)

This is required for the referral system to work automatically.

#### Method 1: BotFather (Easiest)

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/mybots`
3. Select your bot
4. Bot Settings → Group Privacy → **Disable**

#### Method 2: API Call

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tezhisobchi.uz/webhook",
    "allowed_updates": ["message", "callback_query", "chat_member", "my_chat_member"]
  }'
```

### 3. Deploy Code

```bash
# Build locally
npm run build

# Commit changes
git add .
git commit -m "feat: add referral system with 1000 som channel join bonus"
git push

# Wait for CI/CD to deploy automatically
# Or deploy manually if needed
```

### 4. Verify Deployment

After deployment, check:

```bash
# Check if backend restarted successfully
pm2 status

# Check logs for errors
pm2 logs backend --lines 50

# Test the feature
# - Join channel with test account
# - Verify bonus notification received
# - Check database for new record
```

### 5. Test in Production

1. Create test Telegram account (or use existing)
2. Start bot: `/start`
3. Leave channel if already joined
4. Click "Join Channel" button
5. Join the channel
6. Click "✅ Qo'shildim, tekshirish"
7. **Expected**: Receive notification with 1,000 som bonus
8. **Verify balance**: Balance increased by 1,000
9. **Test duplicate prevention**:
   - Leave channel
   - Rejoin channel
   - Click check again
   - Should NOT receive another bonus

## Rollback Plan

If something goes wrong:

### Quick Rollback (Code)

```bash
# Revert to previous commit
git revert HEAD
git push

# Or rollback to specific commit
git reset --hard <previous-commit-hash>
git push --force
```

### Database Rollback

If you need to remove the table:

```sql
DROP INDEX "IDX_channel_memberships_userId_channelUsername";
DROP INDEX "IDX_channel_memberships_userId";
DROP TABLE "channel_memberships";
```

**Note**: This will lose all referral tracking data!

## Monitoring After Deployment

### Check Logs

```bash
# Real-time logs
pm2 logs backend --lines 100

# Search for referral events
grep "ReferralService" /var/log/backend.log

# Look for:
# - "awarded 1000 som" ✅
# - "already received reward" ✅
# - "Error handling channel" ❌
```

### Database Queries

```sql
-- Check total rewards given
SELECT COUNT(*) as total_rewards, SUM("rewardAmount") as total_amount
FROM channel_memberships WHERE "rewardGiven" = true;

-- Check recent memberships
SELECT u."firstName", cm."channelUsername", cm.status, cm."rewardGiven", cm."createdAt"
FROM channel_memberships cm
JOIN users u ON u.id = cm."userId"
ORDER BY cm."createdAt" DESC
LIMIT 10;

-- Check users who received bonus
SELECT u.id, u."firstName", u.credits, cm."rewardAmount", cm."createdAt"
FROM users u
JOIN channel_memberships cm ON cm."userId" = u.id
WHERE cm."rewardGiven" = true
ORDER BY cm."createdAt" DESC;
```

### Metrics to Track

1. **Conversion Rate**: Users who join channel vs total users
2. **Reward Cost**: Total som spent on rewards
3. **Duplicate Prevention**: Count of rejoins without reward
4. **Average time to join**: Time from /start to channel join

## Troubleshooting

### Issue: Users not receiving rewards

**Check**:
1. Is table created? `\dt channel_memberships`
2. Are chat_member updates enabled in BotFather?
3. Check logs for errors: `pm2 logs backend | grep Referral`

### Issue: Duplicate rewards given

**Check**:
```sql
-- Find users with multiple rewards
SELECT "userId", COUNT(*) as reward_count
FROM channel_memberships
WHERE "rewardGiven" = true
GROUP BY "userId"
HAVING COUNT(*) > 1;
```

**Fix**: Update code to add unique constraint if needed

### Issue: Chat member updates not received

**Solution**:
1. Make bot admin in channel
2. Or enable group privacy in BotFather
3. Verify `allowed_updates` includes `chat_member`

## Configuration

### Environment Variables

Ensure these are set in `.env`:

```env
REQUIRED_CHANNEL_USERNAME=your_channel
REQUIRED_CHANNEL_URL=https://t.me/your_channel
```

### Reward Amount

To change reward amount, edit:

`src/telegram/referral.service.ts`:
```typescript
const REFERRAL_REWARD_AMOUNT = 1000; // Change this value
```

Then rebuild and deploy.

## Success Criteria

✅ Database table created successfully
✅ chat_member updates enabled
✅ Code deployed without errors
✅ Test user receives 1,000 som on first join
✅ Test user does NOT receive bonus on rejoin
✅ Notifications appear in correct language
✅ Transactions logged in database
✅ No errors in logs

## Timeline

- **Database Migration**: 2 minutes
- **Enable chat_member**: 1 minute
- **Code Deployment**: 5-10 minutes (via CI/CD)
- **Testing**: 5 minutes
- **Total**: ~15-20 minutes

## Support

If issues occur:
1. Check `pm2 logs backend`
2. Verify database table exists
3. Test chat_member updates with BotFather
4. Review `docs/REFERRAL_SYSTEM.md` for detailed troubleshooting
