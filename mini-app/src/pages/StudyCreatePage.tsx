import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookMarked, Puzzle, FileText, Sparkles, CheckCircle2, Send } from 'lucide-react';
import { api } from '../api/api';
import { getTelegramUserId } from '../utils/telegram';

type Step = 'content' | 'settings' | 'generating' | 'done';
type StudyType = 'glossary' | 'crossword';

const CONFIG: Record<
  StudyType,
  {
    title: string;
    hint: string;
    icon: typeof BookMarked;
    iconBg: string;
    iconFg: string;
    barColor: string;
    btnColor: string;
    selBorder: string;
    selBg: string;
    unit: string;
    options: { count: number; price: number }[];
    features: string[];
  }
> = {
  glossary: {
    title: 'Glossary',
    hint: 'AI muhim atamalarni ta\'riflari bilan alfavit tartibda tayyorlaydi.',
    icon: BookMarked,
    iconBg: 'bg-emerald-100',
    iconFg: 'text-emerald-600',
    barColor: 'bg-emerald-500',
    btnColor: 'bg-emerald-600',
    selBorder: 'border-emerald-600',
    selBg: 'bg-emerald-50',
    unit: 'atama',
    options: [
      { count: 20, price: 500 },
      { count: 30, price: 800 },
      { count: 50, price: 1200 },
    ],
    features: ['Alfavit tartibda atamalar', 'Aniq akademik ta\'riflar', 'Word (.docx) — chop etishga tayyor'],
  },
  crossword: {
    title: 'Krossvord',
    hint: 'AI so\'zlarni tanlab, ularni bir-biriga kesishtirib krossvord tuzadi.',
    icon: Puzzle,
    iconBg: 'bg-teal-100',
    iconFg: 'text-teal-600',
    barColor: 'bg-teal-500',
    btnColor: 'bg-teal-600',
    selBorder: 'border-teal-600',
    selBg: 'bg-teal-50',
    unit: 'so\'z',
    options: [
      { count: 10, price: 800 },
      { count: 15, price: 1200 },
    ],
    features: ['Kesishgan katakchalar', 'Savollar (gorizontal/vertikal)', 'Javoblar kaliti bilan'],
  },
};

export default function StudyCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { haptic, showBackButton, hideBackButton } = useTelegram();
  const { language } = useLanguage();

  const type = (searchParams.get('type') as StudyType) || 'glossary';
  const cfg = CONFIG[type] || CONFIG.glossary;

  const [step, setStep] = useState<Step>('content');
  const [content, setContent] = useState('');
  const [count, setCount] = useState(cfg.options[0].count);
  const [progress, setProgress] = useState(0);

  const price = cfg.options.find((o) => o.count === count)?.price ?? cfg.options[0].price;

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
      setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 10));
    }, 700);

    try {
      const lang = (language as string) || 'uz';
      if (type === 'glossary') {
        await api.createGlossary({ telegramId, sourceContent: content.trim(), termCount: count, language: lang });
      } else {
        await api.createCrossword({ telegramId, sourceContent: content.trim(), wordCount: count, language: lang });
      }
      clearInterval(progressInterval);
      setProgress(100);
      haptic('success');
      setStep('done');
    } catch (error: any) {
      clearInterval(progressInterval);
      alert(error.message || 'Xatolik yuz berdi');
      navigate('/');
    }
  };

  const canProceed = step === 'content' ? content.trim().length >= 10 : true;
  const Icon = cfg.icon;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${cfg.iconFg}`} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{cfg.title}</h1>
            <p className="text-sm text-gray-500">
              {step === 'content' && 'Matn kiriting'}
              {step === 'settings' && 'Sozlamalar'}
              {step === 'generating' && 'Yaratilmoqda...'}
              {step === 'done' && 'Tayyor!'}
            </p>
          </div>
        </div>
        {step !== 'done' && (
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full ${step !== 'content' ? cfg.barColor : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step === 'generating' ? cfg.barColor : 'bg-gray-200'}`} />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence mode="wait">
          {step === 'content' && (
            <motion.div key="content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              <div className="card p-4 bg-gradient-to-br from-gray-50 to-white">
                <p className="text-sm text-gray-600">{cfg.hint}</p>
              </div>
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-4 h-4 ${cfg.iconFg}`} />
                  <h3 className="font-medium text-gray-900 text-sm">Matn yoki mavzu</h3>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Darslik matni yoki mavzuni kiriting... (kamida 10 belgi)"
                  className="w-full h-40 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
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
                <h3 className="font-medium text-gray-900 text-sm mb-3">{cfg.title === 'Glossary' ? 'Atamalar' : 'So\'zlar'} sonini tanlang</h3>
                <div className={`grid ${cfg.options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                  {cfg.options.map((o) => (
                    <button
                      key={o.count}
                      onClick={() => { haptic('light'); setCount(o.count); }}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        count === o.count ? `${cfg.selBorder} ${cfg.selBg}` : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{o.count}</div>
                      <div className="text-xs text-gray-500">{o.price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-4 bg-gray-50 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Jami narx</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{price.toLocaleString()} so'm</div>
                    <div className="text-xs text-gray-500">{count} {cfg.unit}</div>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                  {cfg.features.map((f) => <div key={f}>✓ {f}</div>)}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center px-4">Tayyor Word (.docx) fayli Telegram'ga yuboriladi.</p>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
              <div className={`w-20 h-20 rounded-full ${cfg.iconBg} flex items-center justify-center mb-6 animate-pulse`}>
                <Icon className={`w-10 h-10 ${cfg.iconFg}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{cfg.title} yaratilmoqda...</h3>
              <p className="text-gray-500 mb-6 text-center">Bu bir necha soniya vaqt oladi.</p>
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div className={`h-full ${cfg.barColor}`} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-11 h-11 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tayyor! 🎉</h3>
              <div className="flex items-center gap-2 text-gray-500 mb-8">
                <Send className="w-4 h-4" />
                <p className="text-center">Word (.docx) fayli Telegram chatingizga yuborildi.</p>
              </div>
              <button onClick={() => { haptic('light'); navigate('/'); }} className={`w-full max-w-xs py-3 rounded-xl font-semibold text-white ${cfg.btnColor} active:scale-[0.98] transition-all`}>
                Bosh sahifaga qaytish
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step !== 'generating' && step !== 'done' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              canProceed ? `${cfg.btnColor} text-white active:scale-[0.98]` : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
