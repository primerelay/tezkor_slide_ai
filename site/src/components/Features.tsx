import { useI18n } from '../i18n/I18nContext';
import { FEATURES } from '../data/features';
import Reveal from './Reveal';

export default function Features() {
  const { t } = useI18n();

  return (
    <section id="features" className="relative py-20 sm:py-28 bg-slate-50">
      <div className="section">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            {t.features.heading}
          </h2>
          <p className="mt-4 text-lg text-slate-600">{t.features.sub}</p>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => {
            const text = t.features.items[f.id];
            const Icon = f.icon;
            return (
              <Reveal key={f.id} delay={(i % 4) * 0.06}>
                <div className="group h-full bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{f.emoji}</span>
                    {text.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{text.desc}</p>
                  <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {text.price}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
