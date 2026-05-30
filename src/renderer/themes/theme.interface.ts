export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeFonts {
  title: {
    face: string;
    size: number;
    bold: boolean;
    color: string;
  };
  subtitle: {
    face: string;
    size: number;
    bold: boolean;
    color: string;
  };
  heading: {
    face: string;
    size: number;
    bold: boolean;
    color: string;
  };
  body: {
    face: string;
    size: number;
    bold: boolean;
    color: string;
  };
  caption: {
    face: string;
    size: number;
    bold: boolean;
    color: string;
  };
}

/** Optional linear-gradient definition used for premium full-bleed backgrounds. */
export interface ThemeGradient {
  from: string;
  to: string;
  /** Gradient angle in degrees (0 = left→right, 90 = top→bottom). */
  angle?: number;
}

export interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  slideWidth: number;
  slideHeight: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  gridUnit: number;

  /**
   * Premium presentation fields (all optional so legacy themes keep working).
   */
  /** Light themes use dark text on white; dark themes invert. Defaults to 'light'. */
  mode?: 'light' | 'dark';
  /** Decoration language used by layouts: bold geometry, editorial rules, or sparse. */
  decor?: 'geometric' | 'editorial' | 'minimal';
  /** Gradient for hero/conclusion full-bleed slides. Falls back to solid primary. */
  gradient?: ThemeGradient;
  /** Whether title/closing slides should use the gradient (vs. flat primary). */
  heroGradient?: boolean;
  /** Whether title/closing slides use a full-bleed photo + overlay (when an image is available). */
  heroImage?: boolean;
}

export interface Theme {
  readonly name: string;
  getConfig(): ThemeConfig;
}
