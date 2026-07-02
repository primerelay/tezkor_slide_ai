import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Layers, FileText, Sparkles } from 'lucide-react';
import { api } from '../api/api';
import { getTelegramUserId } from '../utils/telegram';

type Step = 'content' | 'settings' | 'generating';

const CARD_PRICES = [
  { count: 10, price: 500 },
  { count: 20, price: 800 },
  { count: 30, price: 1000 },
];

export default function FlashcardCreatePage() {
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton } = useTelegram();
  const { language } = useLanguage();

  const [step, setStep] = useState<Step>('content');
  const [content, setContent] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [progress, setProgress] = useState(0);

  const price = CARD_PRICES.find((c) => c.count === cardCount)?.price ?? 800;

  useEffect(() => {
    showBackButton(() => {
      haptic('light');
      if (step === 'content') navigate('/');
      else if (step === 'settings') setStep('content');
    });
    return () => hideBackButton();
  }, [step, showBackButton, hideBackButton, navigate, haptic]);

  const handleNext = () => {
    haptic('light');
    if (step === 'content' && content.trim().length >= 10) setStep('settings');
    else if (step === 'settings') handleGenerate();
  };

  const handleGenerate = async () => {
    const telegramId = getTelegramUserId();
    if (!telegramId) {
      alert('Telegram foydalanuvchi aniqlanmadi. Ilovani bot ichidagi tugma orqali oching.');
      return;
    }

    setStep('generating');
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 12));
    }, 600);

    try {
      const set = await api.createFlashcards({
        telegramId,
        sourceContent: content.trim(),
        cardCount,
        language: (language as string) || 'uz',
      });
      clearInterval(progressInterval);
      setProgress(100);
      haptic('success');
      setTimeout(() => navigate(`/flashcards/${set.id}`), 600);
    } catch (error: any) {
      clearInterval(progressInterval);
      alert(error.message || 'Flesh kartalar yaratishda xatolik yuz berdi');
      navigate('/');
    }
  };

  const canProceed = step === 'content' ? content.trim().length >= 10 : true;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Flesh kartalar</h1>
            <p className="text-sm text-gray-500">
              {step === 'content' && 'Matn kiriting'}
              {step === 'settings' && 'Kartalar soni'}
              {step === 'generating' && 'Yaratilmoqda...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className={`flex-1 h-1 rounded-full ${step !== 'content' ? 'bg-amber-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'generating' ? 'bg-amber-500' : 'bg-gray-200'}`} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence mode="wait">
          {step === 'content' && (
            <motion.div key="content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4">
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <h3 className="font-medium text-gray-900 text-sm">Matn yoki mavzu</h3>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Kartalar yaratish uchun darslik matni yoki mavzuni kiriting... (kamida 10 belgi)"
                  className="w-full h-44 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{content.length} belgi</span>
                  {content.length >= 10 && <span className="text-xs text-green-600 font-medium">✓ Tayyor</span>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              <div className="card p-3">
                <h3 className="font-medium text-gray-900 text-sm mb-3">Kartalar sonini tanlang</h3>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_PRICES.map((c) => (
                    <button
                      key={c.count}
                      onClick={() => { haptic('light'); setCardCount(c.count); }}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        cardCount === c.count ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{c.count}</div>
                      <div className="text-xs text-gray-500">{c.price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Jami narx</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">{price.toLocaleString()} so'm</div>
                    <div className="text-xs text-gray-500">{cardCount} ta karta</div>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-amber-200 text-xs text-gray-600 space-y-1">
                  <div>✓ Har karta: savol/tushuncha + javob/ta'rif</div>
                  <div>✓ Kartani ag'darib takrorlash</div>
                  <div>✓ Telegram'da ham ochish mumkin</div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6 animate-pulse">
                <Layers className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Kartalar yaratilmoqda...</h3>
              <p className="text-gray-500 mb-6">AI eng muhim nuqtalarni tanlayapti</p>
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-amber-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step !== 'generating' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              canProceed ? 'bg-amber-500 text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === 'settings' ? (
              <>
                <Sparkles className="w-5 h-5" />
                {price.toLocaleString()} so'm — Yaratish
              </>
            ) : (
              <>
                Keyingisi
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
