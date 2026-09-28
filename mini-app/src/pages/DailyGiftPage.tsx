import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../hooks/useTelegram';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getGift } from '../i18n/gift';
import { getTelegramUserId } from '../utils/telegram';
import {
  getDailyGift,
  claimDailyGift,
  type DailyGiftStatus,
  type DailyGiftClaim,
} from '../api/dailyGift';

type Phase = 'loading' | 'idle' | 'opening' | 'revealed' | 'claimed';

export default function DailyGiftPage() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const g = getGift(language);

  const [status, setStatus] = useState<DailyGiftStatus | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<DailyGiftClaim | null>(null);

  const telegramId = getTelegramUserId();

  useEffect(() => {
    if (!telegramId) {
      setPhase('idle');
      return;
    }
    getDailyGift(telegramId)
      .then((s) => {
        setStatus(s);
        setPhase(s.claimable ? 'idle' : 'claimed');
      })
      .catch(() => setPhase('idle'));
  }, [telegramId]);

  const day = status?.day ?? 1;

  const handlePick = async (index: number) => {
    if (phase !== 'idle' || !telegramId) return;
    haptic('medium');
    setChosen(index);
    setPhase('opening');
    try {
      const res = await claimDailyGift(telegramId, index);
      setResult(res);
      setTimeout(() => {
        haptic(res.isJackpot ? 'success' : 'success');
        setPhase('revealed');
      }, 900);
    } catch {
      // Likely already claimed elsewhere — refetch status.
      const s = await getDailyGift(telegramId).catch(() => null);
      if (s) setStatus(s);
      setPhase('claimed');
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark flex-1 flex flex-col overflow-hidden' : 'flex-1 flex flex-col overflow-hidden'}>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100">
        {/* Top bar (back) */}
        <div className="flex items-center px-5 pt-5 pb-1">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
            aria-label="Back"
          >
            <span className="text-xl leading-none">‹</span>
          </button>
        </div>

        <div className="px-5 pb-12">
          <h1 className="text-3xl font-extrabold mt-2">{g.title} 🎁</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{g.streak(day)}</p>

          {/* Day selector */}
          <div className="grid grid-cols-7 gap-2 mt-6">
            {[1, 2, 3, 4, 5, 6].map((d) => {
              const done = d < day || (phase === 'claimed' && d <= day);
              const active = d === day;
              return (
                <div
                  key={d}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold border transition-colors ${
                    active
                      ? 'border-amber-400 text-amber-500 bg-amber-400/10'
                      : done
                        ? 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  {done ? '✓' : d}
                </div>
              );
            })}
            <div
              className={`aspect-square rounded-xl flex items-center justify-center text-lg border ${
                day === 7 ? 'border-amber-400 bg-amber-400/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60'
              }`}
            >
              💰
            </div>
          </div>

          {/* Info card */}
          {status && (
            <div className="mt-6 rounded-2xl p-5 bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700">
              <p className="font-bold text-lg leading-snug">{g.chooseBox(status.min, status.max)}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{g.jackpotHint(status.jackpot)}</p>
            </div>
          )}

          {/* Boxes / states */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {phase === 'revealed' && result ? (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl p-8 text-center bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl relative overflow-hidden"
                >
                  <div className="text-6xl mb-3">{result.isJackpot ? '💎' : '🎉'}</div>
                  <div className="text-lg font-semibold opacity-90">
                    {result.isJackpot ? g.jackpotWon : g.youWon}
                  </div>
                  <motion.div
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                    className="text-4xl font-extrabold mt-2"
                  >
                    +{result.reward.toLocaleString()} {g.som}
                  </motion.div>
                  <button
                    onClick={() => {
                      haptic('light');
                      navigate('/');
                    }}
                    className="mt-6 px-8 py-3 rounded-full bg-white text-purple-700 font-bold active:scale-95 transition-transform"
                  >
                    {g.great}
                  </button>
                </motion.div>
              ) : phase === 'claimed' ? (
                <motion.div
                  key="claimed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl p-8 text-center bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700"
                >
                  <div className="text-5xl mb-3">🎁</div>
                  <div className="font-bold text-lg">{g.claimedTitle}</div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{g.comeBackTomorrow}</p>
                </motion.div>
              ) : (
                <motion.div key="boxes" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-3">{g.tapToOpen}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => {
                      const isChosen = chosen === i;
                      const opening = phase === 'opening';
                      return (
                        <motion.button
                          key={i}
                          disabled={opening}
                          onClick={() => handlePick(i)}
                          whileTap={{ scale: 0.94 }}
                          animate={
                            opening && isChosen
                              ? { rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.08, 1] }
                              : opening
                                ? { opacity: 0.4 }
                                : { y: [0, -4, 0] }
                          }
                          transition={
                            opening && isChosen
                              ? { duration: 0.7, repeat: Infinity }
                              : { duration: 2.4, repeat: Infinity, delay: i * 0.2 }
                          }
                          className="aspect-square rounded-2xl flex items-center justify-center text-5xl bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                          🎁
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer note */}
          <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-8 leading-relaxed px-2">
            {g.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
