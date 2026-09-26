import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, DollarSign, LogOut, BarChart3, Bot, RefreshCw, Layers, Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  api,
  type StatsResponse,
  type DateFilter,
  type RecentPresentation,
  type FeatureStatsResponse,
  type AdminUser,
  type UserCreated,
} from '../api/api';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: '7d', label: '7 kun' },
  { value: '1m', label: '1 oy' },
  { value: '2m', label: '2 oy' },
  { value: '1y', label: '1 yil' },
  { value: 'all', label: 'Hammasi' },
];

// Ordered feature chips shown in the users table ("what they created").
const FEATURE_META: { key: keyof UserCreated; emoji: string; label: string }[] = [
  { key: 'presentation', emoji: '📊', label: 'Slayd' },
  { key: 'document', emoji: '📄', label: 'Hujjat' },
  { key: 'quiz', emoji: '🧠', label: 'Quiz' },
  { key: 'flashcard', emoji: '🎴', label: 'Flashcard' },
  { key: 'glossary', emoji: '📖', label: 'Glossary' },
  { key: 'crossword', emoji: '🧩', label: 'Krossvord' },
  { key: 'resume', emoji: '📇', label: 'Rezyume' },
  { key: 'translator', emoji: '🌍', label: 'Tarjima' },
];

const userLimitOptions = [20, 50, 100];

export default function DashboardPage() {
  const { admin, logout } = useAuth();
  const [filter, setFilter] = useState<DateFilter>('1m');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [featureStats, setFeatureStats] = useState<FeatureStatsResponse | null>(null);
  const [recentPresentations, setRecentPresentations] = useState<RecentPresentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Users table has its own search + limit, independent of the date filter.
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userLimit, setUserLimit] = useState(50);
  const [usersLoading, setUsersLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, features, presentations] = await Promise.all([
        api.getStats(filter),
        api.getFeatureStats(filter),
        api.getRecentPresentations(8),
      ]);
      setStats(statsData);
      setFeatureStats(features);
      setRecentPresentations(presentations);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  // Debounced user search — refetch when the query or the row limit changes.
  useEffect(() => {
    setUsersLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.getUsers(userSearch, userLimit);
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setUsersLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [userSearch, userLimit]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
    api.getUsers(userSearch, userLimit).then(setUsers).catch(() => {});
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('uz-UZ').format(value) + " so'm";
  const formatNumber = (value: number) => new Intl.NumberFormat('uz-UZ').format(value);
  const formatShort = (value: number) => {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1_000) return Math.round(value / 1000) + 'K';
    return String(Math.round(value));
  };

  const maxRevenue = Math.max(1, ...(featureStats?.features.map((f) => f.revenue) || [1]));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5 min-w-0">
              <img src="/logo.png" alt="SliderAI" className="w-9 h-9 rounded-xl shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold text-gray-900 leading-tight truncate">Admin Panel</h1>
                <p className="text-xs text-gray-500 truncate">{admin?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-ghost p-2"
                aria-label="Yangilash"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={logout} className="btn btn-ghost text-red-600 hover:bg-red-50 p-2" aria-label="Chiqish">
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Chiqish</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" />
            Statistika
          </h2>
          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200 overflow-x-auto no-scrollbar -mx-1 sm:mx-0">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard icon={Users} label="Foydalanuvchilar" value={formatNumber(stats?.totalUsers || 0)} color="blue" />
          <StatCard icon={FileText} label="Prezentatsiyalar" value={formatNumber(stats?.totalPresentations || 0)} color="purple" />
          <StatCard icon={DollarSign} label="To'lovlar" value={formatCurrency(stats?.totalIncome || 0)} color="green" />
          <StatCard
            icon={Bot}
            label="AI xarajat"
            value={formatCurrency(featureStats?.totals.aiCost || 0)}
            subtext={`Sof foyda: ${formatCurrency(featureStats?.totals.profit || 0)}`}
            color="orange"
          />
        </div>

        {/* Feature breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" />
            Feature bo'yicha statistika
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Jami ishlatilgan', value: formatNumber(featureStats?.totals.count || 0) + ' ta', ring: 'ring-blue-100', text: 'text-blue-600' },
              { label: 'Sarflangan (feature)', value: formatCurrency(featureStats?.totals.revenue || 0), ring: 'ring-emerald-100', text: 'text-emerald-600' },
              { label: 'AI xarajat', value: formatCurrency(featureStats?.totals.aiCost || 0), ring: 'ring-orange-100', text: 'text-orange-500' },
              { label: 'Sof foyda', value: formatCurrency(featureStats?.totals.profit || 0), ring: 'ring-violet-100', text: 'text-violet-600' },
            ].map((s) => (
              <div key={s.label} className={`bg-white rounded-2xl border border-gray-100 ring-1 ${s.ring} p-4`}>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-lg font-bold ${s.text} tabular-nums leading-tight break-words`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(featureStats?.features || []).map((f) => (
              <div
                key={f.key}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl leading-none">{f.emoji}</span>
                    <span className="font-semibold text-gray-900 truncate">{f.label}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-lg tabular-nums">
                    {formatNumber(f.count)}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-gray-100 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    style={{ width: `${Math.round((f.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Daromad</p>
                    <p className="text-sm font-bold text-emerald-600 tabular-nums">{formatShort(f.revenue)}</p>
                  </div>
                  <div className="border-x border-gray-100">
                    <p className="text-[11px] text-gray-400 mb-0.5">AI</p>
                    <p className="text-sm font-bold text-orange-500 tabular-nums">{formatShort(f.aiCost)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Foyda</p>
                    <p className="text-sm font-bold text-violet-600 tabular-nums">{formatShort(f.profit)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-600" />
              Foydalanuvchilar
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ism, @username yoki ID..."
                  className="pl-9 pr-3 py-2 w-56 sm:w-72 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-200">
                {userLimitOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => setUserLimit(n)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      userLimit === n ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 font-medium text-left">Foydalanuvchi</th>
                    <th className="px-4 py-3 font-medium text-left">Telegram ID</th>
                    <th className="px-4 py-3 font-medium text-center">Til</th>
                    <th className="px-4 py-3 font-medium text-right">Kredit</th>
                    <th className="px-4 py-3 font-medium text-left">Yaratgan</th>
                    <th className="px-4 py-3 font-medium text-right">Ro'yxatdan</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">Yuklanmoqda...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">Foydalanuvchi topilmadi</td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Noma\'lum';
                      return (
                        <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 align-top">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <span className="font-semibold text-blue-600">
                                  {(u.firstName || u.username || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{fullName}</p>
                                {u.username ? (
                                  <a
                                    href={`https://t.me/${u.username}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-primary-600 hover:underline"
                                  >
                                    @{u.username}
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">@username yo'q</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 tabular-nums whitespace-nowrap">{u.telegramId}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-lg uppercase">
                              {u.language}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums whitespace-nowrap">
                            {formatNumber(u.credits)}
                          </td>
                          <td className="px-4 py-3">
                            {u.totalCreated === 0 ? (
                              <span className="text-gray-300">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {FEATURE_META.filter((m) => u.created[m.key] > 0).map((m) => (
                                  <span
                                    key={m.key}
                                    title={m.label}
                                    className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg tabular-nums"
                                  >
                                    <span>{m.emoji}</span>
                                    <span className="font-semibold">{u.created[m.key]}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-gray-400 whitespace-nowrap">{u.createdAgo}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            "Yaratgan" — foydalanuvchi har bir feature'dan nechta yaratgani. Qidiruv ism, @username va Telegram ID bo'yicha ishlaydi.
          </p>
        </div>

        {/* Recent Presentations */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            So'nggi prezentatsiyalar
          </h3>
          <div className="space-y-3">
            {recentPresentations.map((pres) => (
              <div key={pres.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{pres.title}</p>
                  <p className="text-sm text-gray-500">{pres.userName} • {pres.slidesCount} slayd</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{pres.createdAt}</span>
              </div>
            ))}
            {recentPresentations.length === 0 && (
              <p className="text-center text-gray-500 py-8">Ma'lumot yo'q</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-center justify-between mb-2.5 sm:mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {subtext && <div className="text-xs text-green-600 font-medium mt-2">{subtext}</div>}
    </motion.div>
  );
}
