import { Zap, Wallet, Sparkles, MessageCircle, type LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import Reveal from './Reveal';

const icons: LucideIcon[] = [Zap, Wallet, Sparkles, MessageCircle];
const tints = [
  'bg-indigo-100 text-indigo-600',
  'bg-blue-100 text-blue-600',
  'bg-violet-100 text-violet-600',
  'bg-teal-100 text-teal-600',
];

export default function WhyUs() {
  const { t } = useI18n();

  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="section">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.why.heading}</h2>
        </Reveal>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.why.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={item.title} delay={i * 0.07}>
                <div className="h-full bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
                  <div className={`w-14 h-14 rounded-2xl ${tints[i]} flex items-center justify-center mx-auto`}>
                    <Icon className="w-7 h-7" strokeWidth={2.2} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
