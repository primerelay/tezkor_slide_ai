import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import Reveal from './Reveal';

export default function FAQ() {
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-slate-50">
      <div className="section max-w-3xl">
        <Reveal className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{t.faq.heading}</h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {t.faq.items.map((item, i) => {
            const open = openIdx === i;
            return (
              <Reveal key={item.q} delay={i * 0.04}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-900">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-primary-600 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-slate-600 leading-relaxed">{item.a}</p>
                    </div>
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
