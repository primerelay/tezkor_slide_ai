# Referral System - Channel Join Rewards

## Overview

The Referral System automatically rewards users with **1,000 som** when they join the required Telegram channel. The system is designed with smart tracking to prevent duplicate rewards while maintaining accurate membership history.

## Features

- ✅ **Automatic Reward**: 1,000 som bonus when user joins the required channel
- 🔒 **One-time Bonus**: Users receive reward only once, even if they leave and rejoin
- 📊 **Complete Tracking**: Full membership history (joins, leaves, bans)
- 💰 **Transaction Logging**: All rewards are logged in the transactions table
- 🌐 **Multi-language**: Notifications in all supported languages (uz, ru, en, de)
- ⚡ **Real-time**: Uses Telegram's chat_member updates for instant detection

## How It Works

### 1. User Joins Channel

When a user joins the required channel:
- Telegram sends a `chat_member` update to the bot
- The system checks if user has ever received a reward for this channel
- If eligible, awards 1,000 som and marks `rewardGiven = true`
- Sends notification to user with new balance

### 2. User Leaves Channel

When a user leaves:
- Membership status is updated to 'left'
- `leftAt` timestamp is recorded
- Reward is NOT revoked (user keeps the bonus)

### 3. User Rejoins Channel

When a previously rewarded user rejoins:
- Status is updated to 'joined'
- `leftAt` is cleared
- NO additional reward is given (already rewarded once)

## Database Schema

### `channel_memberships` Table

```sql
CREATE TABLE "channel_memberships" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "channelUsername" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL,         -- joined/left/kicked/banned
    "joinedAt" TIMESTAMP NOT NULL,
    "leftAt" TIMESTAMP,                    -- nullable
    "rewardGiven" BOOLEAN DEFAULT false,
    "rewardAmount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),
    CONSTRAINT "FK_channel_memberships_userId"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX "IDX_channel_memberships_userId" ON "channel_memberships" ("userId");
CREATE INDEX "IDX_channel_memberships_userId_channelUsername"
    ON "channel_memberships" ("userId", "channelUsername");
```

## Setup Instructions

### Step 1: Enable chat_member Updates

By default, Telegram bots don't receive `chat_member` updates. You need to enable them:

#### Option A: Using BotFather (Recommended)

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/mybots`
3. Select your bot
4. Click "Bot Settings" → "Group Privacy"
5. Set to "Disabled" (allows bot to receive member updates)

#### Option B: Using setWebhook API

If using webhooks, set `allowed_updates`:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhook",
    "allowed_updates": ["message", "callback_query", "chat_member", "my_chat_member"]
  }'
```

#### Option C: Using getUpdates (Polling)

If using polling, specify `allowed_updates`:

```typescript
bot.launch({
  allowedUpdates: ['message', 'callback_query', 'chat_member', 'my_chat_member']
});
```

### Step 2: Run Database Migration

```bash
# Run migration to create channel_memberships table
npm run typeorm migration:run
```

Or manually in production:

```bash
# SSH to production server
ssh your-server

# Access PostgreSQL container
docker exec -it tezkor-postgres psql -U tezkor -d tezkor_slide_ai

# Run migration SQL (from migration file)
# Or use TypeORM migration:run command
```

### Step 3: Configure Required Channel

Ensure your `.env` file has the required channel configured:

```env
REQUIRED_CHANNEL_USERNAME=your_channel_username
REQUIRED_CHANNEL_URL=https://t.me/your_channel_username
```

### Step 4: Deploy

```bash
npm run build
# Copy JSON files (translations)
cp -r src/common/i18n/*.json dist/common/i18n/

# Deploy to production
git add .
git commit -m "feat: add referral system with channel join rewards"
git push
```

## Testing

### Manual Testing Steps

1. **Test First Join**:
   - Start bot with `/start`
   - Click "Join Channel" button
   - Join the channel
   - Click "I joined, check"
   - Verify you receive 1,000 som bonus notification
   - Check balance increased by 1,000

2. **Test Duplicate Prevention**:
   - Leave the channel
   - Rejoin the channel
   - Click "I joined, check" again
   - Verify NO additional bonus is given
   - Balance should stay the same

3. **Test Automatic Detection**:
   - Create a new test user
   - Join the channel directly (without clicking bot buttons)
   - Bot should automatically detect and award bonus
   - Verify notification is sent

4. **Test Multi-language**:
   - Change language to Russian `/language`
   - Leave and rejoin channel (should not get reward)
   - Verify notification messages appear in Russian

### Database Verification

```sql
-- Check membership records
SELECT * FROM channel_memberships
WHERE "userId" = YOUR_USER_ID;

-- Check transactions
SELECT * FROM transactions
WHERE "userId" = YOUR_USER_ID
AND description LIKE '%bonus%';

-- Check users balance
SELECT id, "firstName", credits
FROM users
WHERE id = YOUR_USER_ID;
```

## Cost Analysis

### Database Storage

- Each membership record: ~100 bytes
- 1,000 users = ~100 KB
- 10,000 users = ~1 MB
- 100,000 users = ~10 MB

**Verdict**: Negligible storage cost

### API Calls

- `chat_member` updates are **push-based** (no polling required)
- No additional API calls needed
- Uses existing webhook/polling infrastructure

**Verdict**: No additional API costs

### Reward Cost

- 1,000 som per new channel member
- One-time cost per user
- No ongoing costs

**Verdict**: Predictable, one-time expense

## Security & Edge Cases

### Handled Edge Cases

✅ **User leaves and rejoins**: No duplicate reward
✅ **User banned then unbanned**: No duplicate reward
✅ **User clicks "check" multiple times**: No duplicate reward
✅ **Bot restarts**: Membership history preserved in database
✅ **Concurrent joins**: Database constraints prevent race conditions
✅ **Invalid channel**: Gracefully handles errors

### Not Handled (Future Enhancements)

❌ **Reward clawback**: If user leaves immediately after getting reward
❌ **Fraud detection**: Multiple accounts by same person
❌ **Tiered rewards**: Different rewards for different channels

## Monitoring

### Key Metrics to Track

1. **Total rewards given**: `SUM(rewardAmount) WHERE rewardGiven = true`
2. **Active members**: `COUNT(*) WHERE status = 'joined'`
3. **Churn rate**: Members who left after joining
4. **Cost per member**: Total rewards / Active members

### Logs to Monitor

```bash
# Check referral service logs
tail -f /var/log/backend.log | grep "ReferralService"

# Look for:
# - "awarded X som" (successful rewards)
# - "already received reward" (duplicate prevention working)
# - "rejoined channel" (tracking user returns)
```

## Troubleshooting

### Users Not Getting Rewards

1. **Check bot permissions**:
   - Bot must be admin in channel (to receive member updates)
   - Or channel must be public

2. **Verify allowed_updates**:
   ```bash
   # Check bot info
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   # Look for "allowed_updates" field
   ```

3. **Check database**:
   ```sql
   SELECT * FROM channel_memberships WHERE "userId" = USER_ID;
   ```

### Chat Member Updates Not Received

1. **Enable group privacy** in BotFather
2. **Make bot admin** in the channel
3. **Check allowed_updates** configuration
4. **Verify webhook** is working (if using webhooks)

## API Reference

### ReferralService Methods

#### `handleChannelJoin(userId, channelUsername)`
Awards bonus if eligible.

**Returns**: `{ rewarded: boolean, amount: number }`

#### `handleChannelLeave(userId, channelUsername, status)`
Updates membership status when user leaves.

#### `isEligibleForReward(userId, channelUsername)`
Checks if user can receive reward.

**Returns**: `boolean`

#### `getUserMembershipHistory(userId, channelUsername)`
Gets full membership history.

**Returns**: `ChannelMembership[]`

## Future Enhancements

- [ ] Admin dashboard to view referral statistics
- [ ] Configurable reward amounts per channel
- [ ] Multi-channel support (different rewards for different channels)
- [ ] Referral leaderboard
- [ ] Time-limited bonuses (e.g., double rewards during promotions)
- [ ] Fraud detection (similar IP, device fingerprinting)
- [ ] Reward clawback for immediate leavers

## Support

For issues or questions:
- Check logs: `/var/log/backend.log`
- Database queries: Use psql in Docker container
- Code: `src/telegram/referral.service.ts`
