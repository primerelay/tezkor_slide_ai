import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getGift } from '../i18n/gift';
import { getDailyGift } from '../api/dailyGift';
import { getTelegramUserId } from '../utils/telegram';
import {
  FileText, ChevronRight, Sparkles, Gift, Brain, BookOpen, PenLine, Layers,
  GraduationCap, Newspaper, ScrollText, BookMarked, Puzzle, IdCard, Languages,
  Clock, Plus, Tag, type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from '../components/TopBar';

const BOT_URL = 'https://t.me/slider_ai_uz_bot';

interface RecentPresentation {
  id: string;
  topic: string;
  slideCount: number;
  status: string;
  createdAt: string;
}

interface ServiceItem {
  icon: LucideIcon;
  tile: string;
  labelKey: string;
  subKey: string;
  route: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, webApp, haptic } = useTelegram();
  const { t, language } = useLanguage();
  const themeCtx = useTheme();
  const g = getGift(language);

  const [recent, setRecent] = useState<RecentPresentation | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [giftReady, setGiftReady] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const telegramId = webApp?.initDataUnsafe?.user?.id || getTelegramUserId();

  useEffect(() => {
    if (!telegramId) { setLoaded(true); return; }
    (async () => {
      try {
        const uRes = await fetch(`/api/mini-app/user/${telegramId}`);
        if (uRes.ok) {
          const u = await uRes.json();
          setCredits(u.credits || 0);
          const pRes = await fetch(`/api/mini-app/presentations/${u.id}`);
          if (pRes.ok) {
            const list: RecentPresentation[] = await pRes.json();
            if (list.length > 0) setRecent(list[0]);
          }
        }
        const gift = await getDailyGift(telegramId).catch(() => null);
        if (gift) setGiftReady(gift.claimable);
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, [telegramId]);

  const go = (route: string) => { haptic('light'); navigate(route); };

  const openTopUp = () => {
    haptic('light');
    const w = webApp as unknown as { openTelegramLink?: (u: string) => void } | null;
    if (w?.openTelegramLink) w.openTelegramLink(BOT_URL);
    else window.open(BOT_URL, '_blank');
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `1 ${t.hoursAgo}`;
    if (hours < 24) return `${hours} ${t.hoursAgo}`;
    return t.yesterday;
  };

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User';
  const tr = t as unknown as Record<string, string>;

  const services: ServiceItem[] = [
    { icon: FileText, tile: 'bg-purple-100 text-purple-600', labelKey: 'createSlide', subKey: 'withAI', route: '/create' },
    { icon: Brain, tile: 'bg-indigo-100 text-indigo-600', labelKey: 'createQuiz', subKey: 'testQuestions', route: '/quiz/create' },
    { icon: FileText, tile: 'bg-blue-100 text-blue-600', labelKey: 'docMustaqilIsh', subKey: 'wordDocument', route: '/document/create?type=mustaqil_ish' },
    { icon: BookOpen, tile: 'bg-emerald-100 text-emerald-600', labelKey: 'docReferat', subKey: 'wordDocument', route: '/document/create?type=referat' },
    { icon: PenLine, tile: 'bg-rose-100 text-rose-600', labelKey: 'docInsho', subKey: 'inshoSubtitle', route: '/document/create?type=insho' },
    { icon: GraduationCap, tile: 'bg-indigo-100 text-indigo-600', labelKey: 'docKursIshi', subKey: 'wordDocument', route: '/document/create?type=kurs_ishi' },
    { icon: Newspaper, tile: 'bg-cyan-100 text-cyan-600', labelKey: 'docMaqola', subKey: 'scientificArticle', route: '/document/create?type=maqola' },
    { icon: ScrollText, tile: 'bg-violet-100 text-violet-600', labelKey: 'docTezis', subKey: 'conference', route: '/document/create?type=tezis' },
    { icon: Layers, tile: 'bg-amber-100 text-amber-600', labelKey: 'flashcards', subKey: 'quickMemorization', route: '/flashcards/create' },
    { icon: BookMarked, tile: 'bg-emerald-100 text-emerald-600', labelKey: 'docGlossary', subKey: 'glossarySubtitle', route: '/study/create?type=glossary' },
    { icon: Puzzle, tile: 'bg-teal-100 text-teal-600', labelKey: 'docCrossword', subKey: 'crosswordSubtitle', route: '/study/create?type=crossword' },
    { icon: IdCard, tile: 'bg-blue-100 text-blue-600', labelKey: 'docResume', subKey: 'forWork', route: '/resume/create' },
    { icon: Languages, tile: 'bg-sky-100 text-sky-600', labelKey: 'docTranslator', subKey: 'academicTranslation', route: '/translate' },
  ];

  return (
    <div className={themeCtx.theme === 'dark' ? 'dark flex-1 flex flex-col overflow-hidden' : 'flex-1 flex flex-col overflow-hidden'}>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100">
        <TopBar />

        {/* Profile */}
        <div className="px-5 pt-1 pb-2 flex items-center gap-3">
          {user?.photo_url ? (
            <img src={user.photo_url} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-white/70 dark:ring-slate-700" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold">
              {(user?.first_name?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold truncate">{fullName}</h1>
            <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-sm font-semibold">
              🎒 {g.role}
            </span>
          </div>
        </div>

        <div className="px-5 pb-6">
          {/* Balance card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl"
          >
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10" />
            <div className="relative">
              <div className="text-xs font-semibold tracking-widest text-white/70">{g.balanceLabel}</div>
              <div className="text-4xl font-extrabold mt-1">
                {credits !== null ? credits.toLocaleString() : '—'} {g.som}
              </div>
              <button
                onClick={openTopUp}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur font-semibold active:scale-95 transition-transform"
              >
                {g.topUp}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Daily gift row */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => go('/daily-gift')}
            className="w-full mt-4 rounded-2xl p-4 flex items-center gap-3 bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700 shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-400/15 flex items-center justify-center relative">
              <Gift className="w-6 h-6 text-amber-500" />
              {giftReady && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800 animate-pulse" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold">{g.dailyGift}</div>
              {giftReady && <div className="text-xs text-amber-500 font-medium">{g.todayBadge}</div>}
            </div>
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold">
              {g.openBox}
            </span>
          </motion.button>

          {/* Services */}
          <div className="mt-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Sparkles className="w-4 h-4 text-slate-400" />
              {g.services}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.labelKey}
                    onClick={() => go(s.route)}
                    className="card p-4 text-left active:opacity-80 transition-opacity"
                  >
                    <div className={`w-10 h-10 rounded-xl ${s.tile} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="font-medium text-sm mb-1 text-slate-900 dark:text-slate-100">
                      {tr[s.labelKey]}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {tr[s.subKey]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other section */}
          <div className="mt-6">
            <h2 className="font-semibold mb-3 text-slate-800 dark:text-slate-200 uppercase text-xs tracking-wider">
              {g.other}
            </h2>
            <div className="card divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
              {[
                { icon: Tag, tile: 'bg-orange-100 text-orange-600', title: g.pricesTitle, sub: g.pricesSub, route: '/prices' },
              ].map((o) => {
                const Icon = o.icon;
                return (
                  <button
                    key={o.route}
                    onClick={() => go(o.route)}
                    className="w-full flex items-center gap-3 p-4 active:opacity-80 transition-opacity"
                  >
                    <div className={`w-11 h-11 rounded-xl ${o.tile} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{o.title}</div>
                    </div>
                    <span className="text-xs text-slate-400 mr-1">{o.sub}</span>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent work */}
          <div className="mt-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Clock className="w-4 h-4 text-slate-400" />
              {t.recentWorks}
            </h2>
            {recent ? (
              <button
                onClick={() => go(`/editor/${recent.id}`)}
                className="card p-4 w-full flex items-center gap-4 active:opacity-80 transition-opacity"
              >
                <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-500/20 dark:to-purple-500/5 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate text-slate-900 dark:text-slate-100">{recent.topic}</div>
                  <div className="text-sm text-slate-400">
                    {recent.slideCount} {t.slides} • {formatTime(recent.createdAt)}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              </button>
            ) : loaded ? (
              <button
                onClick={() => go('/create')}
                className="card p-6 w-full flex flex-col items-center text-center active:opacity-80"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600 dark:text-slate-300">{t.createNew}</p>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
