import { ThemeConfig } from './theme.interface';

/**
 * Data-driven catalog of all presentation themes. Each theme is an original
 * design (palette + typography + gradient/decoration). This scales to dozens
 * of themes without one NestJS class per theme.
 *
 * Colors are 6-digit hex WITHOUT '#', matching pptxgenjs conventions.
 */
export interface ThemeSpec {
  key: string;
  name: string;
  emoji: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  bgAlt: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  gradFrom: string;
  gradTo: string;
  mode: 'light' | 'dark';
  decor: 'geometric' | 'editorial' | 'minimal';
  heroGradient: boolean;
  heroImage: boolean;
  serif: boolean;
}

type Opts = Partial<
  Pick<
    ThemeSpec,
    | 'secondary' | 'bg' | 'bgAlt' | 'text' | 'textMuted' | 'textInverse'
    | 'border' | 'mode' | 'decor' | 'heroGradient' | 'heroImage' | 'serif'
  >
>;

function mk(
  key: string,
  name: string,
  emoji: string,
  primary: string,
  accent: string,
  gradFrom: string,
  gradTo: string,
  opts: Opts = {},
): ThemeSpec {
  return {
    key,
    name,
    emoji,
    primary,
    accent,
    gradFrom,
    gradTo,
    secondary: opts.secondary ?? accent,
    bg: opts.bg ?? 'ffffff',
    bgAlt: opts.bgAlt ?? 'f5f7fb',
    text: opts.text ?? '1e293b',
    textMuted: opts.textMuted ?? '64748b',
    textInverse: opts.textInverse ?? 'ffffff',
    border: opts.border ?? 'e2e8f0',
    mode: opts.mode ?? 'light',
    decor: opts.decor ?? 'geometric',
    heroGradient: opts.heroGradient ?? true,
    heroImage: opts.heroImage ?? false,
    serif: opts.serif ?? false,
  };
}

// Common option presets to keep specs compact.
const SERIF: Opts = { serif: true, decor: 'editorial', bg: 'faf7f2', bgAlt: 'f0ece4', text: '2b2622', textMuted: '7c736b' };
// Dark themes: white text everywhere (textInverse white for hero/title bars too).
const dark = (bg: string, bgAlt: string, text = 'f1f5f9', textMuted = '94a3b8'): Opts => ({ mode: 'dark', bg, bgAlt, text, textMuted, textInverse: 'f8fafc' });

export const THEME_SPECS: ThemeSpec[] = [
  // ── Academic / education ───────────────────────────────────────────────
  mk('academic_blue', 'Akademik koʻk', '🎓', '1e40af', '60a5fa', '1e40af', '3b82f6'),
  mk('scholar_green', 'Ilmiy yashil', '🌿', '047857', '10b981', '047857', '0d9488', { bgAlt: 'f0fdf4', text: '14342b' }),
  mk('royal_indigo', 'Qirol indigo', '🔷', '4338ca', '818cf8', '4338ca', '6366f1', { bgAlt: 'eef2ff' }),
  mk('crimson_scholar', 'Qirmizi', '🎯', 'be123c', 'fb7185', 'be123c', 'e11d48', { bgAlt: 'fff1f2' }),
  mk('teal_campus', 'Kampus teal', '🧪', '0f766e', '2dd4bf', '0f766e', '14b8a6', { bgAlt: 'f0fdfa' }),
  mk('ocean_blue', 'Okean koʻk', '🌊', '0369a1', '38bdf8', '0369a1', '0ea5e9', { bgAlt: 'f0f9ff' }),

  // ── Editorial / serif (humanities, history, literature) ────────────────
  mk('editorial_serif', 'Editorial', '📰', '1c1917', '9f1239', '1c1917', '44403c', { ...SERIF, heroGradient: false, textInverse: 'faf7f2' }),
  mk('warm_sand', 'Iliq qum', '🏛️', 'b45309', 'ea580c', '9a3412', 'ea580c', { ...SERIF, bg: 'fffbf5', bgAlt: 'fef3e2', text: '431407', textMuted: '92766a', textInverse: 'fffbf5' }),
  mk('bronze_classic', 'Bronza klassik', '📜', '78350f', 'd97706', '78350f', 'b45309', { ...SERIF, bg: 'fdf8f3', text: '3f2d1a', textMuted: '8a6d52' }),
  mk('burgundy_press', 'Burgundiya', '🍷', '7f1d1d', 'dc2626', '7f1d1d', 'b91c1c', { ...SERIF, bg: 'fdf6f6', text: '3f1d1d', textMuted: '8a5a5a' }),

  // ── Vibrant gradient (modern, bright) ──────────────────────────────────
  mk('gradient_violet', 'Gradient binafsha', '🌌', '7c3aed', 'db2777', '7c3aed', 'db2777', { bgAlt: 'f5f3ff', text: '1e1b2e' }),
  mk('sunset_coral', 'Quyosh botishi', '🌇', 'ea580c', 'f59e0b', 'f97316', 'ec4899', { bgAlt: 'fff7ed' }),
  mk('ocean_breeze', 'Dengiz shabadasi', '💧', '0891b2', '22d3ee', '06b6d4', '3b82f6', { bgAlt: 'ecfeff' }),
  mk('magenta_pop', 'Magenta', '💜', 'c026d3', 'f0abfc', 'c026d3', '7c3aed', { bgAlt: 'fdf4ff' }),
  mk('electric_blue', 'Elektr koʻk', '⚡', '2563eb', '22d3ee', '2563eb', '06b6d4', { bgAlt: 'eff6ff' }),
  mk('cosmic_purple', 'Kosmik siyohrang', '🪐', '6d28d9', 'a78bfa', '4c1d95', '7c3aed', { bgAlt: 'f5f3ff' }),
  mk('flamingo', 'Flamingo', '🦩', 'db2777', 'fb7185', 'ec4899', 'f43f5e', { bgAlt: 'fff1f5' }),
  mk('lime_punch', 'Yashil zarba', '🍃', '4d7c0f', 'a3e635', '65a30d', '16a34a', { bgAlt: 'f7fee7' }),
  mk('peach_gold', 'Shaftoli oltin', '🍑', 'd97706', 'fcd34d', 'f59e0b', 'fb7185', { bgAlt: 'fffbeb' }),
  mk('aurora', 'Aurora', '🌈', '0d9488', '34d399', '0d9488', '6366f1', { bgAlt: 'f0fdfa' }),
  mk('grape_soda', 'Uzum', '🍇', '7e22ce', 'e879f9', '7e22ce', 'db2777', { bgAlt: 'faf5ff' }),

  // ── Dark ───────────────────────────────────────────────────────────────
  mk('modern_dark', 'Zamonaviy qorongʻi', '🌙', '818cf8', 'a5b4fc', '312e81', '4f46e5', dark('0f172a', '1e293b')),
  mk('midnight_navy', 'Yarim tun', '🌃', '60a5fa', '38bdf8', '0b1f44', '1e40af', dark('0b1220', '13203a', 'e2e8f0')),
  mk('carbon_neon', 'Karbon neon', '🟢', '22d3ee', 'a3e635', '0a0a0a', '1f2937', dark('0a0a0a', '18181b', 'fafafa', 'a1a1aa')),

  // ── Minimal ──────────────────────────────────────────────────────────��─
  mk('minimal_white', 'Minimal oq', '⚪', '111827', '6b7280', '111827', '374151', { decor: 'minimal', heroGradient: false, bgAlt: 'f9fafb', text: '111827', textMuted: '6b7280' }),
  mk('swiss_red', 'Shveytsariya', '🔺', '111827', 'dc2626', '111827', '374151', { decor: 'minimal', heroGradient: false, bgAlt: 'f8fafc', text: '111827' }),

  // ── Photo backgrounds (heroImage) ──────────────────────────────────────
  mk('photo_focus', 'Foto fokus', '🖼️', '0f172a', '38bdf8', '0f172a', '1e293b', { heroImage: true }),
  mk('photo_editorial', 'Foto editorial', '📷', '1c1917', 'f59e0b', '1c1917', '44403c', { ...SERIF, heroImage: true, textInverse: 'ffffff' }),
  mk('photo_vibrant', 'Foto yorqin', '🌅', '7c3aed', 'f0abfc', '7c3aed', 'db2777', { heroImage: true }),
  mk('nature_canvas', 'Tabiat', '🍀', '166534', '4ade80', '166534', '15803d', { heroImage: true, bgAlt: 'f0fdf4' }),
];

function toConfig(s: ThemeSpec): ThemeConfig {
  const titleFace = s.serif ? 'Georgia' : 'Arial';
  return {
    name: s.key,
    colors: {
      primary: s.primary,
      secondary: s.secondary,
      accent: s.accent,
      background: s.bg,
      backgroundAlt: s.bgAlt,
      text: s.text,
      textMuted: s.textMuted,
      textInverse: s.textInverse,
      border: s.border,
      success: '16a34a',
      warning: 'd97706',
      error: 'dc2626',
    },
    fonts: {
      title: { face: titleFace, size: 46, bold: true, color: s.primary },
      subtitle: { face: titleFace, size: 23, bold: false, color: s.textMuted },
      heading: { face: titleFace, size: 32, bold: true, color: s.primary },
      body: { face: 'Arial', size: 18, bold: false, color: s.text },
      caption: { face: 'Arial', size: 14, bold: false, color: s.textMuted },
    },
    slideWidth: 10,
    slideHeight: 5.625,
    margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    gridUnit: 0.125,
    mode: s.mode,
    decor: s.decor,
    gradient: { from: s.gradFrom, to: s.gradTo, angle: 135 },
    heroGradient: s.heroGradient,
    heroImage: s.heroImage,
  };
}

/** Map of theme key -> full ThemeConfig, consumed by the renderer. */
export const THEME_CATALOG: Record<string, ThemeConfig> = Object.fromEntries(
  THEME_SPECS.map((s) => [s.key, toConfig(s)]),
);

/** Set of theme keys that use a full-bleed photo background on hero/closing. */
export const HERO_IMAGE_THEMES = new Set(
  THEME_SPECS.filter((s) => s.heroImage).map((s) => s.key),
);
