// Robust Telegram user id resolution. `initDataUnsafe.user` can occasionally be
// empty (client quirks, timing), so we fall back through every available
// source and cache the first success in localStorage for the rest of the session.

const CACHE_KEY = 'tg_user_id';

function cache(id: string): void {
  try {
    localStorage.setItem(CACHE_KEY, id);
  } catch {
    /* ignore storage errors */
  }
}

export function getTelegramUserId(): string | undefined {
  const tg = (window as any)?.Telegram?.WebApp;

  // 1. Parsed unsafe data (the normal path).
  const fromUnsafe = tg?.initDataUnsafe?.user?.id;
  if (fromUnsafe) {
    cache(String(fromUnsafe));
    return String(fromUnsafe);
  }

  // 2. Raw initData query string: "user=%7B...%22id%22%3A123...%7D&..."
  const raw: string | undefined = tg?.initData;
  if (raw) {
    try {
      const userStr = new URLSearchParams(raw).get('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed?.id) {
          cache(String(parsed.id));
          return String(parsed.id);
        }
      }
    } catch {
      /* malformed initData — fall through */
    }
  }

  // 3. Cached id from an earlier successful resolve this session.
  try {
    return localStorage.getItem(CACHE_KEY) || undefined;
  } catch {
    return undefined;
  }
}
