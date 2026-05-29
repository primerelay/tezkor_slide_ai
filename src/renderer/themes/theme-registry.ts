/**
 * Single source of truth for the set of presentation themes the platform
 * supports. Every layer (Telegram keyboard, mini-app, DTO validation,
 * pipeline, renderer) imports from here so adding a theme is a one-line change.
 */

export const PRESENTATION_THEMES = [
  'academic_blue',
  'minimal_white',
  'modern_dark',
  'editorial_serif',
  'gradient_violet',
  'scholar_green',
  'warm_sand',
] as const;

export type PresentationTheme = (typeof PRESENTATION_THEMES)[number];

export const DEFAULT_THEME: PresentationTheme = 'academic_blue';

export function isValidTheme(value: unknown): value is PresentationTheme {
  return (
    typeof value === 'string' &&
    (PRESENTATION_THEMES as readonly string[]).includes(value)
  );
}

export function normalizeTheme(value: unknown): PresentationTheme {
  return isValidTheme(value) ? value : DEFAULT_THEME;
}

/**
 * Metadata used to render selection menus. The label is an i18n key under
 * `themes.*`; `emoji` is a fallback prefix used when a JSON label is missing.
 */
export interface ThemeMeta {
  key: PresentationTheme;
  emoji: string;
  /** Short, hard-coded fallback label (Uzbek) if i18n key is missing. */
  fallbackLabel: string;
}

export const THEME_META: ThemeMeta[] = [
  { key: 'academic_blue', emoji: '🎓', fallbackLabel: "Akademik ko'k" },
  { key: 'editorial_serif', emoji: '📰', fallbackLabel: 'Editorial (serif)' },
  { key: 'gradient_violet', emoji: '🌌', fallbackLabel: 'Gradient binafsha' },
  { key: 'scholar_green', emoji: '🌿', fallbackLabel: 'Ilmiy yashil' },
  { key: 'warm_sand', emoji: '🏛️', fallbackLabel: 'Iliq qum' },
  { key: 'minimal_white', emoji: '⚪', fallbackLabel: 'Minimal oq' },
  { key: 'modern_dark', emoji: '🌙', fallbackLabel: "Zamonaviy qorong'i" },
];
