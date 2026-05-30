// Visual definitions for all presentation themes — mirror the backend
// renderer catalog (src/renderer/themes/theme-catalog.ts) so the mini-app
// preview matches the real PPTX output. Display names live here (no i18n).

export interface ThemeVisual {
  id: string;
  name: string;
  emoji: string;
  /** Full-bleed background for title/closing slides (gradient or solid). */
  heroBg: string;
  /** Text color used on the hero background. */
  heroText: string;
  /** Solid brand color used for content title bars. */
  primary: string;
  /** Accent color for stripes, bullets, markers. */
  accent: string;
  /** Content slide background. */
  contentBg: string;
  /** Content slide text color. */
  contentText: string;
  /** Whether titles use a serif face (editorial themes). */
  serif: boolean;
  /** Whether the title/closing slide uses a photo background. */
  photo: boolean;
}

const grad = (from: string, to: string) =>
  `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

function v(
  id: string,
  name: string,
  emoji: string,
  heroBg: string,
  heroText: string,
  primary: string,
  accent: string,
  contentBg: string,
  contentText: string,
  serif = false,
  photo = false,
): ThemeVisual {
  return { id, name, emoji, heroBg, heroText, primary, accent, contentBg, contentText, serif, photo };
}

export const THEME_VISUALS: ThemeVisual[] = [
  // Academic / education
  v('academic_blue', 'Akademik koʻk', '🎓', grad('#1e40af', '#3b82f6'), '#fff', '#1e40af', '#60a5fa', '#ffffff', '#1e293b'),
  v('scholar_green', 'Ilmiy yashil', '🌿', grad('#047857', '#0d9488'), '#fff', '#047857', '#10b981', '#ffffff', '#14342b'),
  v('royal_indigo', 'Qirol indigo', '🔷', grad('#4338ca', '#6366f1'), '#fff', '#4338ca', '#818cf8', '#ffffff', '#1e293b'),
  v('crimson_scholar', 'Qirmizi', '🎯', grad('#be123c', '#e11d48'), '#fff', '#be123c', '#fb7185', '#ffffff', '#1e293b'),
  v('teal_campus', 'Kampus teal', '🧪', grad('#0f766e', '#14b8a6'), '#fff', '#0f766e', '#2dd4bf', '#ffffff', '#1e293b'),
  v('ocean_blue', 'Okean koʻk', '🌊', grad('#0369a1', '#0ea5e9'), '#fff', '#0369a1', '#38bdf8', '#ffffff', '#1e293b'),
  // Editorial / serif
  v('editorial_serif', 'Editorial', '📰', '#1c1917', '#faf7f2', '#1c1917', '#9f1239', '#faf7f2', '#2b2622', true),
  v('warm_sand', 'Iliq qum', '🏛️', grad('#9a3412', '#ea580c'), '#fffbf5', '#b45309', '#ea580c', '#fffbf5', '#431407', true),
  v('bronze_classic', 'Bronza klassik', '📜', grad('#78350f', '#b45309'), '#fff', '#78350f', '#d97706', '#fdf8f3', '#3f2d1a', true),
  v('burgundy_press', 'Burgundiya', '🍷', grad('#7f1d1d', '#b91c1c'), '#fff', '#7f1d1d', '#dc2626', '#fdf6f6', '#3f1d1d', true),
  // Vibrant gradient
  v('gradient_violet', 'Gradient binafsha', '🌌', grad('#7c3aed', '#db2777'), '#fff', '#7c3aed', '#db2777', '#ffffff', '#1e1b2e'),
  v('sunset_coral', 'Quyosh botishi', '🌇', grad('#f97316', '#ec4899'), '#fff', '#ea580c', '#f59e0b', '#ffffff', '#1e293b'),
  v('ocean_breeze', 'Dengiz shabadasi', '💧', grad('#06b6d4', '#3b82f6'), '#fff', '#0891b2', '#22d3ee', '#ffffff', '#1e293b'),
  v('magenta_pop', 'Magenta', '💜', grad('#c026d3', '#7c3aed'), '#fff', '#c026d3', '#f0abfc', '#ffffff', '#1e293b'),
  v('electric_blue', 'Elektr koʻk', '⚡', grad('#2563eb', '#06b6d4'), '#fff', '#2563eb', '#22d3ee', '#ffffff', '#1e293b'),
  v('cosmic_purple', 'Kosmik', '🪐', grad('#4c1d95', '#7c3aed'), '#fff', '#6d28d9', '#a78bfa', '#ffffff', '#1e293b'),
  v('flamingo', 'Flamingo', '🦩', grad('#ec4899', '#f43f5e'), '#fff', '#db2777', '#fb7185', '#ffffff', '#1e293b'),
  v('lime_punch', 'Yashil zarba', '🍃', grad('#65a30d', '#16a34a'), '#fff', '#4d7c0f', '#a3e635', '#ffffff', '#1e293b'),
  v('peach_gold', 'Shaftoli oltin', '🍑', grad('#f59e0b', '#fb7185'), '#fff', '#d97706', '#fcd34d', '#ffffff', '#1e293b'),
  v('aurora', 'Aurora', '🌈', grad('#0d9488', '#6366f1'), '#fff', '#0d9488', '#34d399', '#ffffff', '#1e293b'),
  v('grape_soda', 'Uzum', '🍇', grad('#7e22ce', '#db2777'), '#fff', '#7e22ce', '#e879f9', '#ffffff', '#1e293b'),
  // Dark
  v('modern_dark', 'Zamonaviy qorongʻi', '🌙', grad('#4f46e5', '#818cf8'), '#fff', '#818cf8', '#a5b4fc', '#0f172a', '#f1f5f9'),
  v('midnight_navy', 'Yarim tun', '🌃', grad('#1e3a8a', '#0ea5e9'), '#fff', '#60a5fa', '#38bdf8', '#0b1220', '#e2e8f0'),
  v('carbon_neon', 'Karbon neon', '🟢', grad('#0a0a0a', '#1f2937'), '#fff', '#22d3ee', '#a3e635', '#0a0a0a', '#fafafa'),
  // Minimal
  v('minimal_white', 'Minimal oq', '⚪', '#111827', '#fff', '#111827', '#6b7280', '#ffffff', '#111827'),
  v('swiss_red', 'Shveytsariya', '🔺', '#111827', '#fff', '#111827', '#dc2626', '#ffffff', '#111827'),
  // Photo backgrounds
  v('photo_focus', 'Foto fokus', '🖼️', grad('#0f172a', '#1e293b'), '#fff', '#0f172a', '#38bdf8', '#ffffff', '#1e293b', false, true),
  v('photo_editorial', 'Foto editorial', '📷', '#1c1917', '#fff', '#1c1917', '#f59e0b', '#faf7f2', '#2b2622', true, true),
  v('photo_vibrant', 'Foto yorqin', '🌅', grad('#7c3aed', '#db2777'), '#fff', '#7c3aed', '#f0abfc', '#ffffff', '#1e293b', false, true),
  v('nature_canvas', 'Tabiat', '🍀', grad('#166534', '#15803d'), '#fff', '#166534', '#4ade80', '#ffffff', '#14342b', false, true),
];

export function getThemeVisual(id: string): ThemeVisual {
  return THEME_VISUALS.find((t) => t.id === id) || THEME_VISUALS[0];
}
