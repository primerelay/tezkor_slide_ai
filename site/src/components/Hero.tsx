import { motion } from 'framer-motion';
import { Send, Sparkles as SparkIcon, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { BOT_URL } from '../config';
import Sparkles from './Sparkles';
import { useCountUp } from '../hooks/useCountUp';

const orbitChips = ['📊', '📄', '🧠', '🎴', '📖', '🧩', '📇', '🌍'];

function StatCounter({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const { value, ref } = useCountUp(end);
  return (
    <div ref={ref} className="glass rounded-2xl px-4 py-5 text-center shadow-sm">
      <div className="text-2xl sm:text-3xl font-extrabold gradient-text-anim">
        {value}
        {suffix}
      </div>
      <div className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
}

function StaticStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass rounded-2xl px-4 py-5 text-center shadow-sm">
      <div className="text-2xl sm:text-3xl font-extrabold gradient-text-anim">{value}</div>
      <div className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
}

export default function Hero() {
  const { t } = useI18n();

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      {/* Aurora gradient background */}
      <div className="aurora">
        <div className="blob w-[36rem] h-[36rem] -top-48 -left-40 bg-indigo-300 animate-pulse-glow" />
        <div className="blob w-[30rem] h-[30rem] top-0 -right-32 bg-violet-300 animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="blob w-[26rem] h-[26rem] bottom-0 left-1/3 bg-sky-200 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>
      <Sparkles />

      <div className="section relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
        {/* Left: copy */}
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur text-primary-700 px-4 py-1.5 text-sm font-semibold ring-1 ring-primary-100 shadow-sm"
          >
            <SparkIcon className="w-4 h-4" />
            {t.hero.badge}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight text-slate-900"
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start"
          >
            <a href={BOT_URL} target="_blank" rel="noreferrer" className="btn btn-primary text-base">
              <Send className="w-5 h-5" />
              {t.hero.ctaPrimary}
            </a>
            <a href="#pricing" className="btn btn-light text-base">
              {t.nav.pricing}
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>

          <p className="mt-5 text-sm text-slate-500">💜 {t.hero.trust}</p>
        </div>

        {/* Right: logo centerpiece + orbit */}
        <div className="relative flex justify-center items-center min-h-[22rem] sm:min-h-[26rem]">
          {/* glow */}
          <div className="absolute w-[22rem] h-[22rem] rounded-full bg-gradient-to-br from-indigo-400/25 via-violet-400/25 to-sky-400/25 blur-3xl" />

          {/* orbit ring */}
          <div className="absolute w-[24rem] h-[24rem] sm:w-[28rem] sm:h-[28rem] animate-spin-slow">
            <svg viewBox="0 0 400 400" className="w-full h-full opacity-40">
              <circle cx="200" cy="200" r="190" fill="none" stroke="url(#og)" strokeWidth="2" strokeDasharray="6 10" />
              <defs>
                <linearGradient id="og" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* orbiting chips (counter-rotate so emojis stay upright) */}
          <div className="absolute w-[24rem] h-[24rem] sm:w-[28rem] sm:h-[28rem] animate-spin-slow">
            {orbitChips.map((c, i) => {
              const angle = (i / orbitChips.length) * 2 * Math.PI;
              const r = 47; // percent radius
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);
              return (
                <div
                  key={c}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="animate-spin-slow-rev glass rounded-2xl w-11 h-11 flex items-center justify-center text-xl shadow-lg">
                    {c}
                  </div>
                </div>
              );
            })}
          </div>

          {/* logo */}
          <motion.img
            src="/logo.jpg"
            alt="SliderAI.uz"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 w-56 sm:w-72 rounded-3xl shadow-2xl animate-float"
          />

          {/* paper plane */}
          <motion.div
            className="absolute z-20 top-6 right-6 sm:top-4 sm:right-10 text-sky-500 animate-float-slow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Send className="w-8 h-8 rotate-12 drop-shadow" />
          </motion.div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="section relative z-10 mt-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCounter end={8} label={t.stats.services} />
          <StatCounter end={9} label={t.stats.languages} />
          <StaticStat value={t.stats.speedValue} label={t.stats.speed} />
          <StaticStat value={t.stats.supportValue} label={t.stats.support} />
        </div>
      </div>
    </section>
  );
}
