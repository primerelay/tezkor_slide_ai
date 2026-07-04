import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, DollarSign, TrendingUp, TrendingDown,
  LogOut, BarChart3, Bot, RefreshCw, Brain, Zap, BookOpen, Layers, CalendarDays
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { api, type StatsResponse, type ChartData, type DateFilter, type RecentPresentation, type RecentUser, type FeatureStatsResponse, type DailyStat } from '../api/api';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: '7d', label: '7 kun' },
  { value: '1m', label: '1 oy' },
  { value: '2m', label: '2 oy' },
  { value: '1y', label: '1 yil' },
  { value: 'all', label: 'Hammasi' },
];

export default function DashboardPage() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<DateFilter>('1m');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [featureStats, setFeatureStats] = useState<FeatureStatsResponse | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [recentPresentations, setRecentPresentations] = useState<RecentPresentation[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, chart, features, daily, presentations, users] = await Promise.all([
        api.getStats(filter),
        api.getChartData(filter),
        api.getFeatureStats(filter),
        api.getDailyStats(filter),
        api.getRecentPresentations(5),
        api.getRecentUsers(5),
      ]);
      setStats(statsData);
      setChartData(chart);
      setFeatureStats(features);
      setDailyStats(daily);
      setRecentPresentations(presentations);
      setRecentUsers(users);
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('uz-UZ').format(value) + " so'm";
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('uz-UZ').format(value);
  };

  // Compact money for tight metric cells: 1 200 000 → "1.2M", 850 000 → "850K".
  const formatShort = (value: number) => {
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (value >= 1_000) return Math.round(value / 1000) + 'K';
    return String(Math.round(value));
  };

  const maxRevenue = Math.max(1, ...(featureStats?.features.map((f) => f.revenue) || [1]));

  const dailyTotals = dailyStats.reduce(
    (a, d) => ({ income: a.income + d.income, aiCost: a.aiCost + d.aiCost, profit: a.profit + d.profit }),
    { income: 0, aiCost: 0, profit: 0 },
  );

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
          <StatCard
            icon={Users}
            label="Foydalanuvchilar"
            value={formatNumber(stats?.totalUsers || 0)}
            change={stats?.userGrowth || 0}
            color="blue"
          />
          <StatCard
            icon={FileText}
            label="Prezentatsiyalar"
            value={formatNumber(stats?.totalPresentations || 0)}
            change={stats?.presentationGrowth || 0}
            color="purple"
          />
          <StatCard
            icon={DollarSign}
            label="To'lovlar"
            value={formatCurrency(stats?.totalIncome || 0)}
            change={stats?.incomeGrowth || 0}
            color="green"
          />
          <StatCard
            icon={Bot}
            label="AI xarajat"
            value={formatCurrency(featureStats?.totals.aiCost || 0)}
            subtext={`Foyda: ${formatCurrency((stats?.totalIncome || 0) - (featureStats?.totals.aiCost || 0))}`}
            color="orange"
          />
        </div>

        {/* Feature breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary-600" />
            Feature bo'yicha statistika
          </h2>

          {/* Totals summary */}
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

          {/* Per-feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(featureStats?.features || []).map((f) => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
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

                {/* revenue share bar */}
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
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            💡 Bu yerdagi "Sarflangan" — foydalanuvchilar feature'larga ishlatgan kredit ({formatCurrency(featureStats?.totals.revenue || 0)}).
            Yuqoridagi "To'lovlar" ({formatCurrency(stats?.totalIncome || 0)}) esa balansga kiritilgan umumiy pul — farqi hali balansda turibdi.
            Slaydlar sarfi slayd soniga qarab, Tarjimon esa foydalanish tranzaksiyalaridan hisoblanadi.
          </p>
        </div>

        {/* Daily cash flow table */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary-600" />
            Kunlik hisobot
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 font-medium text-left">Sana</th>
                    <th className="px-4 py-3 font-medium text-right">Tushum</th>
                    <th className="px-4 py-3 font-medium text-right">Chiqim (AI)</th>
                    <th className="px-4 py-3 font-medium text-right">Foyda</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyStats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        Bu davr uchun ma'lumot yo'q
                      </td>
                    </tr>
                  ) : (
                    dailyStats.map((d, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                        <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{d.date}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold tabular-nums whitespace-nowrap">{formatNumber(d.income)}</td>
                        <td className="px-4 py-3 text-right text-orange-500 tabular-nums whitespace-nowrap">{formatNumber(d.aiCost)}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${d.profit >= 0 ? 'text-violet-600' : 'text-red-500'}`}>{formatNumber(d.profit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {dailyStats.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-bold text-gray-900 border-t border-gray-200">
                      <td className="px-4 py-3 whitespace-nowrap">Jami</td>
                      <td className="px-4 py-3 text-right text-emerald-600 tabular-nums whitespace-nowrap">{formatNumber(dailyTotals.income)}</td>
                      <td className="px-4 py-3 text-right text-orange-500 tabular-nums whitespace-nowrap">{formatNumber(dailyTotals.aiCost)}</td>
                      <td className="px-4 py-3 text-right text-violet-600 tabular-nums whitespace-nowrap">{formatNumber(dailyTotals.profit)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Summalar so'mda. Tushum — kunlik to'lovlar (balansga), Chiqim — AI xarajati. Uzoq davrda kunlar hafta/oyga birlashtiriladi.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Tezkor harakatlar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quiz Generator Card */}
            <button
              onClick={() => navigate('/admin/quiz/create')}
              className="card hover:shadow-lg transition-all duration-200 text-left group cursor-pointer border-2 border-transparent hover:border-indigo-500"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-600 transition-colors">
                  <Brain className="w-8 h-8 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600">
                    🎯 Test Yaratish
                  </h3>
                  <p className="text-sm text-gray-500">
                    AI yordamida professional testlar yarating
                  </p>
                  <div className="mt-3 text-xs text-indigo-600 font-medium">
                    Yangi test →
                  </div>
                </div>
              </div>
            </button>

            {/* View Quizzes Card */}
            <button
              onClick={() => navigate('/admin/quizzes')}
              className="card hover:shadow-lg transition-all duration-200 text-left group cursor-pointer border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-600 transition-colors">
                  <BookOpen className="w-8 h-8 text-purple-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600">
                    📚 Testlarim
                  </h3>
                  <p className="text-sm text-gray-500">
                    Yaratilgan testlarni ko'ring va boshqaring
                  </p>
                  <div className="mt-3 text-xs text-purple-600 font-medium">
                    Testlarni ko'rish →
                  </div>
                </div>
              </div>
            </button>

            {/* Presentations Card */}
            <button
              onClick={() => navigate('/admin')}
              className="card hover:shadow-lg transition-all duration-200 text-left group cursor-pointer border-2 border-transparent hover:border-green-500"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-600 transition-colors">
                  <FileText className="w-8 h-8 text-green-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-green-600">
                    📊 Prezentatsiyalar
                  </h3>
                  <p className="text-sm text-gray-500">
                    Barcha yaratilgan prezentatsiyalar
                  </p>
                  <div className="mt-3 text-xs text-green-600 font-medium">
                    Ko'rish →
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Income Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Daromad va xarajat
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Daromad"
                    stroke="#10b981"
                    fill="url(#incomeGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="aiCost"
                    name="AI xarajat"
                    stroke="#f97316"
                    fill="url(#costGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Presentations Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Prezentatsiyalar va foydalanuvchilar
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="presentations" name="Prezentatsiyalar" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="users" name="Yangi foydalanuvchilar" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Presentations */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              So'nggi prezentatsiyalar
            </h3>
            <div className="space-y-3">
              {recentPresentations.map((pres) => (
                <div key={pres.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{pres.title}</p>
                    <p className="text-sm text-gray-500">{pres.userName} • {pres.slidesCount} slayd</p>
                  </div>
                  <span className="text-xs text-gray-400">{pres.createdAt}</span>
                </div>
              ))}
              {recentPresentations.length === 0 && (
                <p className="text-center text-gray-500 py-8">Ma'lumot yo'q</p>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Yangi foydalanuvchilar
            </h3>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="font-semibold text-blue-600">
                      {user.firstName?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{user.firstName}</p>
                    <p className="text-sm text-gray-500">
                      {user.presentationsCount} prezentatsiya • {user.language.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{user.credits.toLocaleString()} so'm</p>
                    <span className="text-xs text-gray-400">{user.createdAt}</span>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-center text-gray-500 py-8">Ma'lumot yo'q</p>
              )}
            </div>
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
  change?: number;
  subtext?: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

function StatCard({ icon: Icon, label, value, change, subtext, color }: StatCardProps) {
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
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs sm:text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {subtext && <div className="text-xs text-green-600 font-medium mt-2">{subtext}</div>}
    </motion.div>
  );
}
