import { Send } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { BOT_URL } from '../config';
import Reveal from './Reveal';

export default function FinalCTA() {
  const { t } = useI18n();

  return (
    <section className="py-20 sm:py-28">
      <div className="section">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-14 sm:px-14 sm:py-20 text-center text-white">
            <div className="blob w-96 h-96 -top-24 -left-16 bg-indigo-500/40 animate-pulse-glow" />
            <div className="blob w-96 h-96 -bottom-24 -right-16 bg-violet-500/40 animate-pulse-glow" />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-extrabold max-w-3xl mx-auto leading-tight">
                {t.finalCta.title}
              </h2>
              <p className="mt-5 text-lg text-white/80 max-w-xl mx-auto">{t.finalCta.sub}</p>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary text-base mt-9"
              >
                <Send className="w-5 h-5" />
                {t.finalCta.button}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
