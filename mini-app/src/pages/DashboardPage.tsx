import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { Plus, FileText, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Mock recent presentations
const recentPresentations = [
  { id: '1', title: "O'zbekiston tarixi", slides: 8, createdAt: '2 soat oldin', status: 'completed' },
  { id: '2', title: 'Matematika asoslari', slides: 10, createdAt: 'Kecha', status: 'completed' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, haptic } = useTelegram();

  const handleCreate = () => {
    haptic('light');
    navigate('/create');
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
              Salom{user?.first_name ? `, ${user.first_name}` : ''}!
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Professional prezentatsiyalar yarating
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
              <div className="font-semibold text-lg">Yangi prezentatsiya</div>
              <div className="text-purple-200 text-sm">AI yordamida yarating</div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-200" />
          </div>
        </motion.button>

        {/* Recent Presentations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              So'nggi ishlar
            </h2>
          </div>

          {recentPresentations.length > 0 ? (
            <div className="space-y-3">
              {recentPresentations.map((pres, index) => (
                <motion.div
                  key={pres.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => {
                    haptic('light');
                    navigate(`/preview/${pres.id}`);
                  }}
                  className="card p-4 flex items-center gap-4 active:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{pres.title}</div>
                    <div className="text-sm text-gray-400">{pres.slides} slayd • {pres.createdAt}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">Hali prezentatsiya yo'q</p>
              <p className="text-gray-400 text-sm mt-1">Yangi prezentatsiya yarating</p>
            </div>
          )}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Imkoniyatlar
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <FeatureCard emoji="🎨" title="Shablonlar" subtitle="10+" />
            <FeatureCard emoji="⚡" title="Tezkor" subtitle="AI" />
            <FeatureCard emoji="📱" title="Qulay" subtitle="Mobil" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-xs font-medium text-gray-700">{title}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
  );
}
