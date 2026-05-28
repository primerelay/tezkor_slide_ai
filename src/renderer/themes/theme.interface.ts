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
}

export interface Theme {
  readonly name: string;
  getConfig(): ThemeConfig;
}
