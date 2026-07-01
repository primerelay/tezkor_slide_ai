import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { PRICING } from '../i18n/translations';
import { Plus, FileText, Clock, ChevronRight, Wallet, Sparkles, Gift, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecentPresentation {
  id: string;
  topic: string;
  slideCount: number;
  status: string;
  createdAt: string;
}

interface UserData {
  id: number;
  credits: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, webApp, haptic } = useTelegram();
  const { t } = useLanguage();
  const [recent, setRecent] = useState<RecentPresentation | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch user data and last presentation
  useEffect(() => {
    const telegramId = webApp?.initDataUnsafe?.user?.id;
    if (!telegramId) { setLoaded(true); return; }

    (async () => {
      try {
        // Get user first to get internal userId and credits
        const uRes = await fetch(`/api/mini-app/user/${telegramId}`);
        if (!uRes.ok) { setLoaded(true); return; }
        const u = await uRes.json();
        setUserData({ id: u.id, credits: u.credits || 0 });

        // Get presentations
        const pRes = await fetch(`/api/mini-app/presentations/${u.id}`);
        if (!pRes.ok) { setLoaded(true); return; }
        const list: RecentPresentation[] = await pRes.json();

        // Show the last one (already sorted DESC from backend)
        if (list.length > 0) setRecent(list[0]);
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, [webApp]);

  const handleCreate = () => {
    haptic('light');
    navigate('/create');
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `1 ${t.hoursAgo}`;
    if (hours < 24) return `${hours} ${t.hoursAgo}`;
    return t.yesterday;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.greeting}{user?.first_name ? `, ${user.first_name}` : ''}!
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {t.createProfessional}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-sm">
              {user?.first_name?.[0] || 'U'}
            </span>
          </div>
        </motion.div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-5 pb-6">
        {/* Create Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleCreate}
          className="w-full mb-6 p-5 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl text-white shadow-lg active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">{t.newPresentation}</div>
              <div className="text-purple-200 text-sm">{t.createWithAI}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-200" />
          </div>
        </motion.button>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gray-400" />
            Barcha funksiyalar
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Slide Create */}
            <button
              onClick={handleCreate}
              className="card p-4 text-left active:bg-purple-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="font-medium text-gray-900 text-sm mb-1">Slide yaratish</div>
              <div className="text-xs text-gray-500">AI yordamida</div>
            </button>

            {/* Quiz Generator */}
            <button
              onClick={() => {
                haptic('light');
                window.open('/admin/quiz/create', '_blank');
              }}
              className="card p-4 text-left active:bg-indigo-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                <Brain className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="font-medium text-gray-900 text-sm mb-1">Quiz yaratish</div>
              <div className="text-xs text-gray-500">Test savollar</div>
            </button>

            {/* Balance */}
            <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <div className="font-medium text-gray-900 text-sm mb-1">Balans</div>
              <div className="text-xs text-amber-700 font-semibold">
                {userData ? userData.credits.toLocaleString() : '---'} so'm
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent — last presentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {t.recentWorks}
            </h2>
          </div>

          {recent ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => {
                haptic('light');
                navigate(`/editor/${recent.id}`);
              }}
              className="card p-4 flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{recent.topic}</div>
                <div className="text-sm text-gray-400">
                  {recent.slideCount} {t.slides} • {formatTime(recent.createdAt)}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </motion.div>
          ) : loaded ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">{t.noPresentation}</p>
              <p className="text-gray-400 text-sm mt-1">{t.createNew}</p>
            </div>
          ) : null}
        </motion.div>

        {/* Balance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="card p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-emerald-600 font-medium">{t.yourBalance}</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {userData ? userData.credits.toLocaleString() : '---'} {t.uzs}
                  </div>
                </div>
              </div>
              {userData && userData.credits > 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  <Gift className="w-3 h-3" />
                  {t.giftBalance}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pricing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t.pricing}
          </h3>
          <div className="card overflow-hidden divide-y divide-gray-100">
            {PRICING.map((item, index) => (
              <div
                key={item.slides}
                className={`px-4 py-2.5 flex items-center justify-between ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <span className="text-sm text-gray-600">
                  {item.slides} {t.slides}
                </span>
                <span className="text-sm font-semibold text-purple-600">
                  {item.price.toLocaleString()} {t.uzs}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Free Editing Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 mb-4"
        >
          <div className="card p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-purple-700">{t.freeEditing}</div>
                <div className="text-xs text-purple-600 mt-1 leading-relaxed">
                  {t.freeEditingDesc}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

