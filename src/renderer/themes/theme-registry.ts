import { THEME_SPECS } from './theme-catalog';

/**
 * Public theme API derived from the data catalog (theme-catalog.ts).
 * Everything (Telegram keyboard, mini-app, DTO validation, pipeline, renderer)
 * imports from here, so adding a theme = adding one spec to the catalog.
 */

export type PresentationTheme = string;

export const PRESENTATION_THEMES: string[] = THEME_SPECS.map((s) => s.key);

export const DEFAULT_THEME = 'academic_blue';

export function isValidTheme(value: unknown): value is PresentationTheme {
  return typeof value === 'string' && PRESENTATION_THEMES.includes(value);
}

export function normalizeTheme(value: unknown): PresentationTheme {
  return isValidTheme(value) ? value : DEFAULT_THEME;
}

export interface ThemeMeta {
  key: string;
  emoji: string;
  fallbackLabel: string;
}

/** Metadata for selection menus (label fallback + emoji). */
export const THEME_META: ThemeMeta[] = THEME_SPECS.map((s) => ({
  key: s.key,
  emoji: s.emoji,
  fallbackLabel: s.name,
}));
