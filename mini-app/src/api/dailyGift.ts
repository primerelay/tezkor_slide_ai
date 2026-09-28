export interface DailyGiftStatus {
  day: number;
  streak: number;
  claimable: boolean;
  claimedToday: boolean;
  min: number;
  max: number;
  jackpot: number;
  balance: number;
}

export interface DailyGiftClaim {
  reward: number;
  isJackpot: boolean;
  day: number;
  streak: number;
  balance: number;
  boxes: number[];
}

export async function getDailyGift(telegramId: string | number): Promise<DailyGiftStatus> {
  const res = await fetch(`/api/mini-app/daily-gift/${telegramId}`);
  if (!res.ok) throw new Error('Failed to load daily gift');
  return res.json();
}

export async function claimDailyGift(
  telegramId: string | number,
  boxIndex: number,
): Promise<DailyGiftClaim> {
  const res = await fetch('/api/mini-app/daily-gift/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramId, boxIndex }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || 'Failed to claim daily gift');
  }
  return res.json();
}
