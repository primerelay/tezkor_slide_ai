import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTelegramUserId } from '../utils/telegram';

const BOT_URL = 'https://t.me/slider_ai_uz_bot';

interface PriceItem {
  key: string;
  icon: string;
  name: Record<string, string>;
  detail: Record<string, string>;
  min: number;
  max: number;
}
interface PriceText {
  title: string;
  subtitle: string;
  som: string;
  free: string;
  balance: string;
  topUp: string;
}

const fmt = (n: number) => n.toLocaleString('en-US').replace(/,/g, ' ');

export default function PricesPage() {
  const navigate = useNavigate();
  const { webApp, haptic } = useTelegram();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const L = (['uz', 'ru', 'en'].includes(language) ? language : 'uz') as 'uz' | 'ru' | 'en';

  const [catalog, setCatalog] = useState<PriceItem[]>([]);
  const [text, setText] = useState<Record<string, PriceText> | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const telegramId = webApp?.initDataUnsafe?.user?.id || getTelegramUserId();

  useEffect(() => {
    fetch('/api/mini-app/prices')
      .then((r) => r.json())
      .then((d) => { setCatalog(d.catalog || []); setText(d.text || null); })
      .catch(() => {});
    if (telegramId) {
      fetch(`/api/mini-app/user/${telegramId}`)
        .then((r) => r.json())
        .then((u) => setBalance(u.credits ?? 0))
        .catch(() => {});
    }
  }, [telegramId]);

  const T = text?.[L];

  const openTopUp = () => {
    haptic('light');
    const w = webApp as unknown as { openTelegramLink?: (u: string) => void } | null;
    if (w?.openTelegramLink) w.openTelegramLink(BOT_URL);
    else window.open(BOT_URL, '_blank');
  };

  return (
    <div className={theme === 'dark' ? 'dark flex-1 flex flex-col overflow-hidden' : 'flex-1 flex flex-col overflow-hidden'}>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100">
        {/* Top bar */}
        <div className="flex items-center px-5 pt-5 pb-1">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
            aria-label="Back"
          >
            <span className="text-xl leading-none">‹</span>
          </button>
        </div>

        <div className="px-5 pb-32">
          <h1 className="text-3xl font-extrabold mt-2">🏷 {T?.title || 'Narxlar'}</h1>
          {T && <p className="text-slate-500 dark:text-slate-400 mt-1">{T.subtitle}</p>}

          <div className="mt-6 space-y-2.5">
            {catalog.map((p, i) => {
              const price = p.min === p.max ? fmt(p.min) : `${fmt(p.min)}–${fmt(p.max)}`;
              return (
                <motion.div
                  key={p.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl p-4 flex items-center gap-3 bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700"
                >
                  <div className="text-2xl">{p.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name[L]}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.detail[L]}</div>
                  </div>
                  <div className="text-right font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                    {price} <span className="text-xs font-medium text-slate-400">{T?.som}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sticky balance + top-up */}
        {T && (
          <div className="sticky bottom-0 px-5 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{T.balance}</div>
              <div className="text-xl font-extrabold">
                {balance !== null ? fmt(balance) : '—'} {T.som}
              </div>
            </div>
            <button
              onClick={openTopUp}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold active:scale-95 transition-transform"
            >
              {T.topUp}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
