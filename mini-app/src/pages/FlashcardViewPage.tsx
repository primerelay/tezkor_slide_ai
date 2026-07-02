import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCw, Home } from 'lucide-react';
import { api, FlashcardSet } from '../api/api';

export default function FlashcardViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton } = useTelegram();

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    showBackButton(() => { haptic('light'); navigate('/'); });
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, navigate, haptic]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await api.getFlashcards(id);
        setSet(data);
      } catch {
        /* ignore */
      }
      setLoading(false);
    })();
  }, [id]);

  const total = set?.cards.length ?? 0;
  const card = set?.cards[index];

  const go = (dir: 1 | -1) => {
    if (!total) return;
    haptic('light');
    setFlipped(false);
    setIndex((i) => (i + dir + total) % total);
  };

  const flip = () => { haptic('light'); setFlipped((f) => !f); };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 animate-pulse" />
      </div>
    );
  }

  if (!set || !card) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500">Kartalar topilmadi</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold">
          Bosh sahifa
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">{set.title}</h1>
            <p className="text-sm text-gray-500">{index + 1} / {total}</p>
          </div>
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Home className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div
          className="w-full max-w-sm"
          style={{ perspective: '1200px' }}
          onClick={flip}
        >
          <motion.div
            className="relative w-full"
            style={{ transformStyle: 'preserve-3d', minHeight: '20rem' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-3xl bg-white shadow-lg border border-gray-100 flex flex-col items-center justify-center p-6 text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">Savol</span>
              <p className="text-xl font-semibold text-gray-900 leading-snug">{card.front}</p>
              <span className="absolute bottom-4 text-xs text-gray-400">Javob uchun bosing</span>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg flex flex-col items-center justify-center p-6 text-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-4">Javob</span>
              <p className="text-lg font-medium text-white leading-relaxed">{card.back}</p>
              <span className="absolute bottom-4 text-xs text-white/70">Savolga qaytish uchun bosing</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-5 flex items-center justify-between gap-3">
        <button
          onClick={() => go(-1)}
          className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={flip}
          className="flex-1 h-14 rounded-2xl bg-amber-500 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <RotateCw className="w-5 h-5" />
          Ag'darish
        </button>
        <button
          onClick={() => go(1)}
          className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
