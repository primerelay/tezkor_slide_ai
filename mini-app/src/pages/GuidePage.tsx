import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const SUPPORT_URL = 'https://t.me/fast_admin_1';

interface GuideSection {
  icon: string;
  title: Record<string, string>;
  body: Record<string, string>;
}
interface GuideText {
  title: string;
  subtitle: string;
  support: string;
  supportHandle: string;
}

export default function GuidePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const L = (['uz', 'ru', 'en'].includes(language) ? language : 'uz') as 'uz' | 'ru' | 'en';

  const [sections, setSections] = useState<GuideSection[]>([]);
  const [text, setText] = useState<Record<string, GuideText> | null>(null);

  useEffect(() => {
    fetch('/api/mini-app/guide')
      .then((r) => r.json())
      .then((d) => { setSections(d.sections || []); setText(d.text || null); })
      .catch(() => {});
  }, []);

  const T = text?.[L];

  return (
    <div className={theme === 'dark' ? 'dark flex-1 flex flex-col overflow-hidden' : 'flex-1 flex flex-col overflow-hidden'}>
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#0b0f14] text-slate-900 dark:text-slate-100">
        <div className="flex items-center px-5 pt-5 pb-1">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95"
            aria-label="Back"
          >
            <span className="text-xl leading-none">‹</span>
          </button>
        </div>

        <div className="px-5 pb-12">
          <h1 className="text-3xl font-extrabold mt-2">❓ {T?.title || "Yo'riqnoma"}</h1>
          {T && <p className="text-slate-500 dark:text-slate-400 mt-1">{T.subtitle}</p>}

          <div className="mt-6 space-y-3">
            {sections.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl p-4 bg-white dark:bg-slate-800/70 border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-xl">{s.icon}</span>
                  {s.title[L]}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.body[L]}</p>
              </motion.div>
            ))}
          </div>

          {T && (
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold active:scale-95 transition-transform"
            >
              <Send className="w-4 h-4" />
              {T.support}: {T.supportHandle}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
