import { useI18n } from '../i18n/I18nContext';
import { FEATURES } from '../data/features';

export default function Marquee() {
  const { t } = useI18n();
  const items = FEATURES.map((f) => ({ emoji: f.emoji, title: t.features.items[f.id].title }));
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden py-5 bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800">
      <div className="flex w-max animate-marquee gap-4">
        {loop.map((it, i) => (
          <div
            key={i}
            className="flex items-center gap-2 whitespace-nowrap text-white/95 font-semibold px-4"
          >
            <span className="text-xl">{it.emoji}</span>
            {it.title}
            <span className="text-white/40 ml-2">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
