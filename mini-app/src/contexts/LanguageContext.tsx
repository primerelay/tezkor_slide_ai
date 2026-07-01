import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, Translations, getTranslations } from '../i18n/translations';

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
        const tg = window.Telegram?.WebApp;
        const telegramId = tg?.initDataUnsafe?.user?.id;

        if (telegramId) {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          try {
            const response = await fetch(`/api/mini-app/user/${telegramId}`, {
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const user = await response.json();
              if (user.language && ['uz', 'ru', 'en', 'de'].includes(user.language)) {
                setLanguage(user.language as SupportedLanguage);
              }
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            // Ignore timeout/abort errors, just use default language
          }
        } else {
          // Try to get language from Telegram WebApp
          const langCode = tg?.initDataUnsafe?.user?.language_code;
          if (langCode) {
            // Map common language codes
            const langMap: Record<string, SupportedLanguage> = {
              'uz': 'uz',
              'ru': 'ru',
              'en': 'en',
              'de': 'de',
              'uk': 'ru', // Ukrainian users often prefer Russian
            };
            if (langMap[langCode]) {
              setLanguage(langMap[langCode]);
            }
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
