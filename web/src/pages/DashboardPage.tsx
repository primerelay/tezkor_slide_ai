import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, DollarSign, TrendingUp, TrendingDown,
  LogOut, BarChart3, Bot, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { api, type StatsResponse, type ChartData, type DateFilter, type RecentPresentation, type RecentUser } from '../api/api';

const filterOptions: { value: DateFilter; label: string }[] = [
  { value: '7d', label: '7 kun' },
  { value: '1m', label: '1 oy' },
  { value: '2m', label: '2 oy' },
  { value: '1y', label: '1 yil' },
  { value: 'all', label: 'Hammasi' },
];

export default function DashboardPage() {
  const { admin, logout } = useAuth();
  const [filter, setFilter] = useState<DateFilter>('1m');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentPresentations, setRecentPresentations] = useState<RecentPresentation[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, chart, presentations, users] = await Promise.all([
        api.getStats(filter),
        api.getChartData(filter),
        api.getRecentPresentations(5),
        api.getRecentUsers(5),
      ]);
      setStats(statsData);
      setChartData(chart);
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
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SliderAI" className="w-10 h-10 rounded-xl" />
              <div>
                <h1 className="font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">{admin?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn btn-ghost p-2"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={logout} className="btn btn-ghost text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
                Chiqish
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            Statistika
          </h2>
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            label="Daromad"
            value={formatCurrency(stats?.totalIncome || 0)}
            change={stats?.incomeGrowth || 0}
            color="green"
          />
          <StatCard
            icon={Bot}
            label="AI xarajat"
            value={formatCurrency(stats?.totalAiCost || 0)}
            subtext={`Foyda: ${formatCurrency(stats?.profit || 0)}`}
            color="orange"
          />
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
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
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
