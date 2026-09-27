import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { translations, type Lang } from './translations';

type Dict = (typeof translations)['uz'];

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = 'sliderai_lang';

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'uz';
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && saved in translations) return saved;
  const nav = window.navigator.language.slice(0, 2).toLowerCase();
  if (nav === 'ru') return 'ru';
  if (nav === 'en') return 'en';
  return 'uz';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  };

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
