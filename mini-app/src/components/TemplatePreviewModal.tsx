import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { ThemeVisual } from '../data/themes';
import { Translations } from '../i18n/translations';
import SlideMockup from './SlideMockup';

interface Props {
  theme: ThemeVisual;
  topic: string;
  t: Translations;
  onClose: () => void;
  onUse: () => void;
}

/**
 * Full-screen preview: shows how a deck looks in the chosen theme before
 * the user commits — three representative slides (title, content, closing).
 */
export default function TemplatePreviewModal({ theme, topic, t, onClose, onUse }: Props) {
  const title = topic.trim() || t.title;
  const name = theme.name;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="mt-auto bg-white rounded-t-3xl flex flex-col max-h-[92%]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">{theme.emoji}</span>
            <span className="font-bold text-gray-900">{name}</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* sample slides — horizontal snap scroll */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 px-5 py-4 snap-x snap-mandatory">
            {(['hero', 'content', 'conclusion'] as const).map((variant) => (
              <div key={variant} className="snap-center shrink-0 w-[78vw] max-w-md">
                <SlideMockup
                  theme={theme}
                  variant={variant}
                  title={title}
                  className="rounded-xl shadow-lg ring-1 ring-black/5"
                />
                <p className="text-center text-xs text-gray-400 mt-2 capitalize">{variant}</p>
              </div>
            ))}
          </div>
        </div>

        {/* use button */}
        <div className="p-5 border-t border-gray-100">
          <button onClick={onUse} className="btn btn-primary w-full">
            <Check className="w-5 h-5" />
            {t.useThisTemplate}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
