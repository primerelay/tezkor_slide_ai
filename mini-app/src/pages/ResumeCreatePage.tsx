import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, IdCard, Sparkles, CheckCircle2, Send } from 'lucide-react';
import { api } from '../api/api';
import { getTelegramUserId } from '../utils/telegram';

type Step = 'personal' | 'details' | 'generating' | 'done';

const PRICE = 2500;

export default function ResumeCreatePage() {
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton } = useTelegram();
  const { language } = useLanguage();

  const [step, setStep] = useState<Step>('personal');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    showBackButton(() => {
      haptic('light');
      if (step === 'personal') navigate('/');
      else if (step === 'details') setStep('personal');
    });
    return () => hideBackButton();
  }, [step, showBackButton, hideBackButton, navigate, haptic]);

  const handleNext = () => {
    haptic('light');
    if (step === 'personal' && fullName.trim().length >= 3 && position.trim().length >= 2) {
      setStep('details');
    } else if (step === 'details') {
      handleGenerate();
    }
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
    }, 600);

    try {
      const rawBackground = [
        experience.trim() ? `Ish tajribasi: ${experience.trim()}` : '',
        education.trim() ? `Ta'lim: ${education.trim()}` : '',
      ].filter(Boolean).join('\n');

      await api.createResume({
        telegramId,
        fullName: fullName.trim(),
        position: position.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        location: location.trim() || undefined,
        rawBackground: rawBackground || undefined,
        skills: skills.trim() ? skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        languages: languages.trim() ? languages.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        language: (language as string) || 'uz',
      });
      clearInterval(progressInterval);
      setProgress(100);
      haptic('success');
      setStep('done');
    } catch (error: any) {
      clearInterval(progressInterval);
      alert(error.message || 'Rezyume yaratishda xatolik yuz berdi');
      navigate('/');
    }
  };

  const canProceed =
    step === 'personal'
      ? fullName.trim().length >= 3 && position.trim().length >= 2
      : experience.trim().length > 0 || education.trim().length > 0;

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string, optional = false) => (
    <div className="card p-3">
      <h3 className="font-medium text-gray-900 text-sm mb-2">
        {label} {optional && <span className="text-gray-400 font-normal">(ixtiyoriy)</span>}
      </h3>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  const area = (label: string, value: string, set: (v: string) => void, placeholder: string, optional = false) => (
    <div className="card p-3">
      <h3 className="font-medium text-gray-900 text-sm mb-2">
        {label} {optional && <span className="text-gray-400 font-normal">(ixtiyoriy)</span>}
      </h3>
      <textarea
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className="w-full h-24 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <IdCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Rezyume (CV)</h1>
            <p className="text-sm text-gray-500">
              {step === 'personal' && 'Shaxsiy ma\'lumotlar'}
              {step === 'details' && 'Tajriba va ta\'lim'}
              {step === 'generating' && 'Tayyorlanmoqda...'}
              {step === 'done' && 'Tayyor!'}
            </p>
          </div>
        </div>
        {step !== 'done' && (
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full ${step !== 'personal' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-1 rounded-full ${step === 'generating' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence mode="wait">
          {step === 'personal' && (
            <motion.div key="p" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              {field('To\'liq ism-familiya', fullName, setFullName, 'Aliyev Jasur')}
              {field('Lavozim / kasb', position, setPosition, 'Frontend dasturchi')}
              {field('Telefon', phone, setPhone, '+998 90 123 45 67', true)}
              {field('Email', email, setEmail, 'ism@mail.com', true)}
              {field('Shahar', location, setLocation, 'Toshkent', true)}
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="d" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 space-y-3">
              {area('Ish tajribasi', experience, setExperience, 'Qayerda, qachon, qanday ishlagansiz — erkin yozing. AI professional qilib beradi.')}
              {area('Ta\'lim', education, setEducation, 'Qaysi universitet/kollej, yo\'nalish, yillar', true)}
              {field('Ko\'nikmalar', skills, setSkills, 'JavaScript, React, Git (vergul bilan)', true)}
              {field('Tillar', languages, setLanguages, 'O\'zbek, Rus, Ingliz - B2', true)}

              <div className="card p-4 bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Narx</h3>
                  <div className="text-xl font-bold text-blue-600">{PRICE.toLocaleString()} so'm</div>
                </div>
                <p className="text-xs text-gray-600 mt-2">✨ AI ma'lumotlaringizni professional CV (Word .docx) formatida tayyorlaydi va Telegram'ga yuboradi.</p>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div key="g" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6 animate-pulse">
                <IdCard className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rezyume tayyorlanmoqda...</h3>
              <p className="text-gray-500 mb-6 text-center">AI ma'lumotlaringizni professional formatga soladi.</p>
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-blue-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Rezyume tayyor! 🎉</h3>
              <div className="flex items-center gap-2 text-gray-500 mb-8">
                <Send className="w-4 h-4" />
                <p className="text-center">CV Word (.docx) formatida Telegram'ga yuborildi.</p>
              </div>
              <button onClick={() => { haptic('light'); navigate('/'); }} className="w-full max-w-xs py-3 rounded-xl font-semibold bg-blue-600 text-white active:scale-[0.98] transition-all">
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
              canProceed ? 'bg-blue-600 text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === 'details' ? (
              <>
                <Sparkles className="w-5 h-5" />
                {PRICE.toLocaleString()} so'm — Yaratish
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
