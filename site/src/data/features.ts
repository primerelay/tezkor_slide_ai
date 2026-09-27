import {
  Presentation,
  FileText,
  Brain,
  Layers,
  BookOpen,
  Puzzle,
  IdCard,
  Languages,
  type LucideIcon,
} from 'lucide-react';

export interface FeatureMeta {
  id: string;
  emoji: string;
  icon: LucideIcon;
  // Tailwind gradient stops for the icon tile.
  gradient: string;
}

// Order = display order. Text (title/desc/price) lives in the translations,
// keyed by `id`, so the site stays fully trilingual.
export const FEATURES: FeatureMeta[] = [
  { id: 'slides', emoji: '📊', icon: Presentation, gradient: 'from-blue-600 to-indigo-700' },
  { id: 'docs', emoji: '📄', icon: FileText, gradient: 'from-indigo-600 to-violet-700' },
  { id: 'quiz', emoji: '🧠', icon: Brain, gradient: 'from-violet-600 to-purple-700' },
  { id: 'flashcards', emoji: '🎴', icon: Layers, gradient: 'from-sky-500 to-blue-600' },
  { id: 'glossary', emoji: '📖', icon: BookOpen, gradient: 'from-teal-500 to-emerald-600' },
  { id: 'crossword', emoji: '🧩', icon: Puzzle, gradient: 'from-cyan-500 to-sky-600' },
  { id: 'resume', emoji: '📇', icon: IdCard, gradient: 'from-slate-600 to-slate-800' },
  { id: 'translator', emoji: '🌍', icon: Languages, gradient: 'from-blue-500 to-cyan-600' },
];
