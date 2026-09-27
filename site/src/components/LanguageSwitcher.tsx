import { useI18n } from '../i18n/I18nContext';
import type { Lang } from '../i18n/translations';

const OPTIONS: { code: Lang; label: string }[] = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-slate-100 p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          onClick={() => setLang(o.code)}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
            lang === o.code
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label={o.label}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
