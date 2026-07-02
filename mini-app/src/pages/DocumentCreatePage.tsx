import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  FileText,
  BookOpen,
  PenLine,
  Building2,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { api, DocumentType } from '../api/api';
import { getTelegramUserId } from '../utils/telegram';

type Step = 'topic' | 'details' | 'settings' | 'generating' | 'done';

type PriceOption = { pages: number; price: number };

const ACADEMIC_PRICES: PriceOption[] = [
  { pages: 10, price: 2500 },
  { pages: 15, price: 3500 },
  { pages: 20, price: 4500 },
  { pages: 25, price: 5500 },
];

const ESSAY_PRICES: PriceOption[] = [
  { pages: 2, price: 1500 },
  { pages: 3, price: 2000 },
  { pages: 5, price: 2500 },
];

const DOC_META: Record<
  DocumentType,
  {
    title: string;
    desc: string;
    icon: typeof FileText;
    iconBg: string;
    iconFg: string;
    prices: PriceOption[];
    defaultPages: number;
    withDetails: boolean;
  }
> = {
  mustaqil_ish: {
    title: 'Mustaqil ish',
    desc: 'AI professional mustaqil ish tayyorlaydi',
    icon: FileText,
    iconBg: 'bg-blue-100',
    iconFg: 'text-blue-600',
    prices: ACADEMIC_PRICES,
    defaultPages: 15,
    withDetails: true,
  },
  referat: {
    title: 'Referat',
    desc: 'AI professional referat tayyorlaydi',
    icon: BookOpen,
    iconBg: 'bg-emerald-100',
    iconFg: 'text-emerald-600',
    prices: ACADEMIC_PRICES,
    defaultPages: 15,
    withDetails: true,
  },
  insho: {
    title: 'Insho',
    desc: 'AI ravon, professional insho yozadi',
    icon: PenLine,
    iconBg: 'bg-rose-100',
    iconFg: 'text-rose-600',
    prices: ESSAY_PRICES,
    defaultPages: 3,
    withDetails: false,
  },
};

export default function DocumentCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { haptic, showBackButton, hideBackButton } = useTelegram();
  const { language } = useLanguage();

  const docType = (searchParams.get('type') as DocumentType) || 'mustaqil_ish';
  const meta = DOC_META[docType] || DOC_META.mustaqil_ish;

  const [step, setStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [institution, setInstitution] = useState('');
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [pageCount, setPageCount] = useState(meta.defaultPages);
  const [progress, setProgress] = useState(0);

  const price = meta.prices.find((p) => p.pages === pageCount)?.price ?? meta.prices[0].price;

  useEffect(() => {
    showBackButton(() => {
      haptic('light');
      if (step === 'topic') navigate('/');
      else if (step === 'details') setStep('topic');
      // Essays skip the details step, so 'settings' goes straight back to topic.
      else if (step === 'settings') setStep(meta.withDetails ? 'details' : 'topic');
    });
    return () => hideBackButton();
  }, [step, showBackButton, hideBackButton, navigate, haptic, meta.withDetails]);

  const handleNext = () => {
    haptic('light');
    if (step === 'topic' && topic.trim().length >= 5) {
      setStep(meta.withDetails ? 'details' : 'settings');
    } else if (step === 'details') {
      setStep('settings');
    } else if (step === 'settings') {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    const telegramId = getTelegramUserId();
    if (!telegramId) {
      alert(
        "Telegram foydalanuvchi aniqlanmadi. Iltimos, ilovani bot ichidagi \"🚀 Web ilovani ochish\" tugmasi orqali oching (brauzerda emas).",
      );
      return;
    }

    setStep('generating');
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 8));
    }, 900);

    try {
      const { documentId } = await api.createDocument({
        telegramId,
        docType,
        topic: topic.trim(),
        pageCount,
        institution: institution.trim() || undefined,
        studentName: studentName.trim() || undefined,
        teacherName: teacherName.trim() || undefined,
        language: (language as 'uz' | 'ru' | 'en' | 'de') || 'uz',
      });
      pollStatus(documentId, progressInterval);
    } catch (error: any) {
      clearInterval(progressInterval);
      alert(error.message || 'Hujjat yaratishda xatolik yuz berdi');
      navigate('/');
    }
  };

  const pollStatus = (id: string, progressInterval: ReturnType<typeof setInterval>) => {
    const maxAttempts = 90; // ~4.5 min
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(poll);
        clearInterval(progressInterval);
        alert('Hujjat yaratish uzoq davom etmoqda. Tayyor bo\'lganda Telegram\'ga yuboriladi.');
        navigate('/');
        return;
      }
      try {
        const doc = await api.getDocument(id);
        if (doc.status === 'completed') {
          clearInterval(poll);
          clearInterval(progressInterval);
          setProgress(100);
          haptic('success');
          setStep('done');
        } else if (doc.status === 'failed') {
          clearInterval(poll);
          clearInterval(progressInterval);
          alert('Hujjat yaratishda xatolik yuz berdi. Balansingiz qaytarildi.');
          navigate('/');
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  };

  const canProceed = step === 'topic' ? topic.trim().length >= 5 : true;
  const Icon = meta.icon;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${meta.iconFg}`} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{meta.title}</h1>
            <p className="text-sm text-gray-500">
              {step === 'topic' && 'Mavzuni kiriting'}
              {step === 'details' && "Ma'lumotlar"}
              {step === 'settings' && 'Hajm va narx'}
              {step === 'generating' && 'Yaratilmoqda...'}
              {step === 'done' && 'Tayyor!'}
            </p>
          </div>
        </div>

        {step !== 'done' && (
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full ${step !== 'topic' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step === 'settings' || step === 'generating' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step === 'generating' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence mode="wait">
          {/* Step 1: Topic */}
          {step === 'topic' && (
            <motion.div key="topic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              <div className="card p-4 bg-gradient-to-br from-gray-50 to-white">
                <p className="text-sm text-gray-600">{meta.desc}. Tayyor hujjat: titul varaq, mundarija, kirish, boblar, xulosa, adabiyotlar va rasmlar bilan.</p>
              </div>
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900 text-sm">Mavzu</h3>
                </div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Masalan: Sun'iy intellektning zamonaviy jamiyatga ta'siri"
                  className="w-full h-28 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{topic.length} belgi</span>
                  {topic.trim().length >= 5 && <span className="text-xs text-green-600 font-medium">✓ Tayyor</span>}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900 text-sm">O'quv muassasasi <span className="text-gray-400 font-normal">(ixtiyoriy)</span></h3>
                </div>
                <input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Masalan: Toshkent davlat universiteti"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900 text-sm">Bajardi <span className="text-gray-400 font-normal">(ixtiyoriy)</span></h3>
                </div>
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ism Familiya"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900 text-sm">Tekshirdi <span className="text-gray-400 font-normal">(ixtiyoriy)</span></h3>
                </div>
                <input
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ustoz F.I.Sh."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Settings */}
          {step === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              <div className="card p-3">
                <h3 className="font-medium text-gray-900 text-sm mb-3">Hajmni tanlang</h3>
                <div className="grid grid-cols-2 gap-2">
                  {meta.prices.map((p) => (
                    <button
                      key={p.pages}
                      onClick={() => { haptic('light'); setPageCount(p.pages); }}
                      className={`p-3 rounded-xl border-2 text-left transition-colors ${
                        pageCount === p.pages ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{p.pages} bet</div>
                      <div className="text-xs text-gray-500">{p.price.toLocaleString()} so'm</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-4 bg-gradient-to-br from-blue-50 to-emerald-50 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Jami narx</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{price.toLocaleString()} so'm</div>
                    <div className="text-xs text-gray-500">~{pageCount} bet</div>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-blue-200 text-xs text-gray-600 space-y-1">
                  {docType === 'insho' ? (
                    <>
                      <div>✓ Ravon, ta'sirchan insho matni</div>
                      <div>✓ Kirish — asosiy qism — xulosa</div>
                      <div>✓ Times New Roman 14, 1.5 interval — topshirishga tayyor</div>
                    </>
                  ) : (
                    <>
                      <div>✓ Titul varaq va mundarija</div>
                      <div>✓ Kirish, boblar, xulosa</div>
                      <div>✓ Rasmlar va adabiyotlar ro'yxati</div>
                      <div>✓ Times New Roman 14, 1.5 interval — topshirishga tayyor</div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center px-4">
                Tayyor hujjat Word (.docx) formatida Telegram'ga yuboriladi.
              </p>
            </motion.div>
          )}

          {/* Step 4: Generating */}
          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6 animate-pulse">
                <Icon className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{meta.title} yaratilmoqda...</h3>
              <p className="text-gray-500 mb-6 text-center">
                {docType === 'insho' ? 'AI insho matnini yozyapti.' : 'AI matn yozib, rasmlarni joylayapti.'}
                <br />Bu 2-4 daqiqa vaqt olishi mumkin.
              </p>
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-blue-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
              </div>
            </motion.div>
          )}

          {/* Step 5: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-11 h-11 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hujjat tayyor! 🎉</h3>
              <div className="flex items-center gap-2 text-gray-500 mb-8">
                <Send className="w-4 h-4" />
                <p className="text-center">Word (.docx) fayli Telegram chatingizga yuborildi.</p>
              </div>
              <button
                onClick={() => { haptic('light'); navigate('/'); }}
                className="w-full max-w-xs py-3 rounded-xl font-semibold bg-blue-600 text-white active:scale-[0.98] transition-all"
              >
                Bosh sahifaga qaytish
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer button */}
      {step !== 'generating' && step !== 'done' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              canProceed ? 'bg-blue-600 text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
