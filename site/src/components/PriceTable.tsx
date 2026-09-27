import { Send } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { FEATURES } from '../data/features';
import { BOT_URL } from '../config';
import Reveal from './Reveal';

// Highlighted (most popular) services.
const POPULAR = new Set(['slides', 'docs']);

export default function PriceTable() {
  const { t } = useI18n();

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-slate-50">
      <div className="section">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.priceTable.heading}</h2>
          <p className="mt-4 text-lg text-slate-600">{t.priceTable.sub}</p>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => {
            const text = t.features.items[f.id];
            const popular = POPULAR.has(f.id);
            return (
              <Reveal key={f.id} delay={(i % 4) * 0.06}>
                <div
                  className={`relative h-full rounded-3xl p-6 border shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                    popular
                      ? 'bg-gradient-to-br from-indigo-700 to-violet-800 text-white border-transparent'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shadow">
                      ⭐ {t.priceTable.popular}
                    </span>
                  )}
                  <div className="text-3xl">{f.emoji}</div>
                  <h3 className={`mt-3 text-base font-bold ${popular ? 'text-white' : 'text-slate-900'}`}>
                    {text.title}
                  </h3>
                  <div className={`mt-4 text-xl font-extrabold ${popular ? 'text-white' : 'gradient-text'}`}>
                    {text.price}
                  </div>
                  <p className={`mt-3 text-xs leading-relaxed ${popular ? 'text-white/80' : 'text-slate-500'}`}>
                    {text.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-col items-center gap-5 text-center">
            <p className="text-slate-600 max-w-2xl">{t.priceTable.note}</p>
            <a href={BOT_URL} target="_blank" rel="noreferrer" className="btn btn-primary text-base">
              <Send className="w-5 h-5" />
              {t.pricing.cta}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
