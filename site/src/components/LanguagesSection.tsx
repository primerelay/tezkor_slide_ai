import { useI18n } from '../i18n/I18nContext';
import Reveal from './Reveal';

const LANGS = [
  { flag: '🇺🇿', name: "O'zbekcha" },
  { flag: '🇺🇿', name: "O'zbekcha (kirill)" },
  { flag: '🇷🇺', name: 'Русский' },
  { flag: '🇬🇧', name: 'English' },
  { flag: '🇹🇷', name: 'Türkçe' },
  { flag: '🇰🇿', name: 'Қазақша' },
  { flag: '🇩🇪', name: 'Deutsch' },
  { flag: '🇸🇦', name: 'العربية' },
  { flag: '🇰🇷', name: '한국어' },
];

export default function LanguagesSection() {
  const { t } = useI18n();

  return (
    <section className="py-20 sm:py-28">
      <div className="section text-center">
        <Reveal className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.langs.heading}</h2>
          <p className="mt-4 text-lg text-slate-600">{t.langs.sub}</p>
        </Reveal>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {LANGS.map((l, i) => (
            <Reveal key={l.name} delay={(i % 5) * 0.05}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-100 shadow-sm px-5 py-2.5 font-semibold text-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span className="text-xl">{l.flag}</span>
                {l.name}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
