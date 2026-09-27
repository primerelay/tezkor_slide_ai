import { useEffect, useState } from 'react';
import { Menu, X, Send } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { BOT_URL, BRAND } from '../config';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

export default function Navbar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#features', label: t.nav.features },
    { href: '#how', label: t.nav.how },
    { href: '#pricing', label: t.nav.pricing },
    { href: '#faq', label: t.nav.faq },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-slate-100 shadow-sm' : 'bg-transparent'
      }`}
    >
      <nav className="section flex items-center justify-between h-16">
        <a href="#top" aria-label={BRAND}>
          <Logo />
        </a>

        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-primary-700 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <a href={BOT_URL} target="_blank" rel="noreferrer" className="btn btn-primary hidden sm:inline-flex text-sm py-2">
            <Send className="w-4 h-4" />
            {t.nav.openBot}
          </a>
          <button
            className="md:hidden p-2 text-slate-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <div className="section py-4 flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-slate-700 font-medium"
              >
                {l.label}
              </a>
            ))}
            <a href={BOT_URL} target="_blank" rel="noreferrer" className="btn btn-primary mt-2">
              <Send className="w-4 h-4" />
              {t.nav.openBot}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
