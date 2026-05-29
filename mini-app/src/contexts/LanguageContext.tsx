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
          const response = await fetch(`/api/mini-app/user/${telegramId}`);
          if (response.ok) {
            const user = await response.json();
            if (user.language && ['uz', 'ru', 'en', 'de'].includes(user.language)) {
              setLanguage(user.language as SupportedLanguage);
            }
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
