import { useI18n } from '../i18n/I18nContext';
import Reveal from './Reveal';

const stepGradients = [
  'from-blue-600 to-indigo-700',
  'from-indigo-600 to-violet-700',
  'from-violet-600 to-purple-700',
  'from-teal-500 to-emerald-600',
];

export default function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how" className="py-20 sm:py-28">
      <div className="section">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.how.heading}</h2>
          <p className="mt-4 text-lg text-slate-600">{t.how.sub}</p>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.how.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="relative h-full bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stepGradients[i]} flex items-center justify-center text-white text-xl font-extrabold shadow-lg`}
                >
                  {i + 1}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
