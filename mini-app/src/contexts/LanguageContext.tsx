import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, Translations, getTranslations } from '../i18n/translations';
import { getTelegramUserId } from '../utils/telegram';

const SUPPORTED: SupportedLanguage[] = ['uz', 'uzc', 'ru', 'en', 'de', 'tr', 'kk', 'ar', 'ko'];

interface LanguageContextType {
  language: SupportedLanguage;
  t: Translations;
  setLanguage: (lang: SupportedLanguage) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>('uz');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserLanguage = async () => {
      try {
        // 1. Language passed in the web-app URL by the bot (?lang=xx). Most
        //    reliable and instant — reflects the user's current bot language
        //    and changes the URL when they switch, forcing a fresh load.
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang && SUPPORTED.includes(urlLang as SupportedLanguage)) {
          setLanguage(urlLang as SupportedLanguage);
          setIsLoading(false);
          return;
        }

        const tg = window.Telegram?.WebApp;
        // 2. Robust telegram id resolution → fetch the saved language from DB.
        const telegramId = getTelegramUserId();

        if (telegramId) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch(`/api/mini-app/user/${telegramId}`, {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) {
              const user = await response.json();
              if (user.language && SUPPORTED.includes(user.language)) {
                setLanguage(user.language as SupportedLanguage);
              }
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            // Ignore timeout/abort errors, just use default language
          }
        } else {
          // 3. Fall back to the Telegram device language.
          const langCode = tg?.initDataUnsafe?.user?.language_code;
          const langMap: Record<string, SupportedLanguage> = {
            uz: 'uz', ru: 'ru', en: 'en', de: 'de',
            tr: 'tr', kk: 'kk', ar: 'ar', ko: 'ko',
            uk: 'ru', // Ukrainian users often prefer Russian
          };
          if (langCode && langMap[langCode]) {
            setLanguage(langMap[langCode]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLanguage();

    // Fallback: ensure loading state is cleared after 5 seconds max
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Arabic is right-to-left.
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = getTranslations(language);

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
