import { Send } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import Logo from './Logo';
import { BOT_URL, SUPPORT_URL, SUPPORT_HANDLE } from '../config';

export default function Footer() {
  const { t } = useI18n();
  const year = 2026;

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="section py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="text-white">
              <Logo />
            </div>
            <p className="mt-4 text-sm text-slate-400 max-w-xs">{t.footer.tagline}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.nav.features}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">{t.nav.features}</a></li>
              <li><a href="#how" className="hover:text-white transition-colors">{t.nav.how}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t.nav.pricing}</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">{t.nav.faq}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t.footer.support}</h4>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
            >
              <Send className="w-4 h-4" />
              {SUPPORT_HANDLE}
            </a>
            <div className="mt-5">
              <a href={BOT_URL} target="_blank" rel="noreferrer" className="btn btn-primary text-sm py-2">
                <Send className="w-4 h-4" />
                {t.nav.openBot}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <span>© {year} SliderAI.uz</span>
          <span>{t.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
