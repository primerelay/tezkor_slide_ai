import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { motion } from 'framer-motion';
import { Languages, ArrowRight, Loader2, Copy, Check } from 'lucide-react';
import { api } from '../api/api';
import { getTelegramUserId } from '../utils/telegram';

const PRICE = 500;
const MAX = 4000;

const LANGS: { code: string; label: string }[] = [
  { code: 'uz', label: "🇺🇿 O'zbekcha" },
  { code: 'ru', label: '🇷🇺 Ruscha' },
  { code: 'en', label: '🇬🇧 Inglizcha' },
  { code: 'de', label: '🇩🇪 Nemischa' },
];

export default function TranslatorPage() {
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton } = useTelegram();

  const [text, setText] = useState('');
  const [target, setTarget] = useState('en');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    showBackButton(() => { haptic('light'); navigate('/'); });
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, navigate, haptic]);

  const translate = async () => {
    const telegramId = getTelegramUserId();
    if (!telegramId) {
      alert('Telegram foydalanuvchi aniqlanmadi. Ilovani bot ichidagi tugma orqali oching.');
      return;
    }
    if (text.trim().length < 2) return;
    haptic('medium');
    setLoading(true);
    setResult('');
    try {
      const res = await api.translate({ telegramId, text: text.trim(), targetLang: target });
      setResult(res.translated);
      haptic('success');
    } catch (error: any) {
      haptic('error');
      alert(error.message || 'Tarjimada xatolik');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      haptic('success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-5 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <Languages className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Tarjimon</h1>
            <p className="text-sm text-gray-500">Akademik tarjima</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Target language */}
        <div className="card p-3">
          <h3 className="font-medium text-gray-900 text-sm mb-2">Tarjima tili</h3>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { haptic('light'); setTarget(l.code); }}
                className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                  target === l.code ? 'border-sky-500 bg-sky-50 text-gray-900' : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source text */}
        <div className="card p-3">
          <h3 className="font-medium text-gray-900 text-sm mb-2">Matn</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
            placeholder="Tarjima qilinadigan matnni kiriting..."
            className="w-full h-36 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{text.length} / {MAX}</div>
        </div>

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-3 bg-sky-50 border border-sky-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-sky-800 text-sm">Tarjima</h3>
              <button onClick={copy} className="flex items-center gap-1 text-xs text-sky-600 font-medium">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Nusxalandi' : 'Nusxalash'}
              </button>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result}</p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={translate}
          disabled={loading || text.trim().length < 2}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            !loading && text.trim().length >= 2 ? 'bg-sky-600 text-white active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          {loading ? 'Tarjima qilinmoqda...' : `${PRICE.toLocaleString()} so'm — Tarjima qilish`}
        </button>
      </div>
    </div>
  );
}
