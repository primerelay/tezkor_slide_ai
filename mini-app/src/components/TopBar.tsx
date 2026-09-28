import { useState } from 'react';
import { Sun, Moon, ChevronLeft, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { SupportedLanguage } from '../i18n/translations';

const LANGS: { code: SupportedLanguage; flag: string; label: string }[] = [
  { code: 'uz', flag: '🇺🇿', label: "O'zbekcha" },
  { code: 'uzc', flag: '🇺🇿', label: 'Ўзбекча' },
  { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { code: 'kk', flag: '🇰🇿', label: 'Қазақша' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'ar', flag: '🇸🇦', label: 'العربية' },
  { code: 'ko', flag: '🇰🇷', label: '한국어' },
];

const circleBtn =
  'w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-transform';

export default function TopBar({ onBack }: { onBack?: () => void }) {
  const { theme, toggle } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === language) ?? LANGS[0];

  return (
    <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
      <div>
        {onBack && (
          <button onClick={onBack} className={circleBtn} aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Language */}
        <button onClick={() => setOpen((v) => !v)} className={circleBtn} aria-label="Language">
          <span className="text-lg leading-none">{current.flag}</span>
        </button>
        {/* Theme */}
        <button onClick={toggle} className={circleBtn} aria-label="Theme">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-14 z-50 w-48 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                >
                  <span className="text-lg">{l.flag}</span>
                  <span className="flex-1 text-left">{l.label}</span>
                  {l.code === language && <Check className="w-4 h-4 text-purple-500" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
