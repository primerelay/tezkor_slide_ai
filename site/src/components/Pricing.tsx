import { Check, Send } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { BOT_URL } from '../config';
import Reveal from './Reveal';

export default function Pricing() {
  const { t } = useI18n();

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="section">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 p-8 sm:p-14 text-white shadow-2xl">
          <div className="blob w-80 h-80 -top-20 -right-10 bg-white/15" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <Reveal>
              <h2 className="text-3xl sm:text-4xl font-extrabold">{t.pricing.heading}</h2>
              <p className="mt-4 text-white/85 text-lg">{t.pricing.sub}</p>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-light text-base mt-8 text-primary-700"
              >
                <Send className="w-5 h-5" />
                {t.pricing.cta}
              </a>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="glass rounded-3xl p-6 sm:p-8 text-slate-800">
                <ul className="space-y-4">
                  {t.pricing.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </span>
                      <span className="font-medium">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
