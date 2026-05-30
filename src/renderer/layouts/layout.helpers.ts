import PptxGenJS from 'pptxgenjs';
import { ThemeConfig } from '../themes/theme.interface';

/** Slide canvas size for LAYOUT_16x9 (inches). */
export const SLIDE_W = 10;
export const SLIDE_H = 5.625;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `${h(r)}${h(g)}${h(b)}`;
}

/** Linear interpolation between two hex colors. t in [0,1]. */
export function mixColor(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

export function darkenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 - percent / 100;
  return rgbToHex({ r: r * f, g: g * f, b: b * f });
}

export function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const f = percent / 100;
  return rgbToHex({
    r: r + (255 - r) * f,
    g: g + (255 - g) * f,
    b: b + (255 - b) * f,
  });
}

/**
 * Paint a smooth linear gradient by laying down many thin strips.
 * pptxgenjs has no native gradient fill, so this approximates one.
 * Vertical strips read as a left→right gradient (premium, clean).
 */
export function paintGradientBackground(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  from: string,
  to: string,
  opts: { steps?: number; vertical?: boolean } = {},
): void {
  const steps = opts.steps ?? 60;
  const vertical = opts.vertical ?? false; // false = left→right bands

  if (vertical) {
    const bandH = SLIDE_H / steps;
    for (let i = 0; i < steps; i++) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: i * bandH,
        w: SLIDE_W,
        h: bandH + 0.02,
        fill: { type: 'solid', color: mixColor(from, to, i / (steps - 1)) },
        line: { type: 'none' },
      });
    }
  } else {
    const bandW = SLIDE_W / steps;
    for (let i = 0; i < steps; i++) {
      slide.addShape(pptx.ShapeType.rect, {
        x: i * bandW,
        y: 0,
        w: bandW + 0.02,
        h: SLIDE_H,
        fill: { type: 'solid', color: mixColor(from, to, i / (steps - 1)) },
        line: { type: 'none' },
      });
    }
  }
}

/**
 * Apply the full-bleed background for title/closing slides.
 * Uses the theme gradient when `heroGradient` is on, otherwise solid primary.
 */
export function applyHeroBackground(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  theme: ThemeConfig,
): void {
  if (theme.heroGradient && theme.gradient) {
    slide.background = { color: theme.gradient.from };
    paintGradientBackground(slide, pptx, theme.gradient.from, theme.gradient.to);
  } else {
    slide.background = { color: theme.colors.primary };
  }
}

/**
 * Full-bleed photo background with a dark overlay for legible text.
 * Used by hero/conclusion when the theme opts into `heroImage`.
 */
export function applyPhotoBackground(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  theme: ThemeConfig,
  imagePath: string,
): void {
  slide.background = { color: theme.gradient?.from || theme.colors.primary };
  slide.addImage({
    path: imagePath,
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    sizing: { type: 'cover', w: SLIDE_W, h: SLIDE_H },
  });
  // Overall darkening for contrast.
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { type: 'solid', color: '000000', transparency: 52 },
    line: { type: 'none' },
  });
  // Brand-tinted wash so photos feel on-theme.
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { type: 'solid', color: theme.colors.primary, transparency: 70 },
    line: { type: 'none' },
  });
}

export interface SlideElement {
  kind: 'rect' | 'ellipse' | 'line' | 'text';
  x: number; // 0..1 fraction of slide width
  y: number; // 0..1 fraction of slide height
  w: number;
  h: number;
  color?: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
}

/** Render free-form elements (shapes/text) on top of any slide. */
export function renderElements(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  theme: ThemeConfig,
  elements: SlideElement[],
): void {
  for (const el of elements || []) {
    const x = (el.x || 0) * SLIDE_W;
    const y = (el.y || 0) * SLIDE_H;
    const w = Math.max(0.1, (el.w || 0.2) * SLIDE_W);
    const h = Math.max(0.1, (el.h || 0.15) * SLIDE_H);
    const color = (el.color || theme.colors.accent).replace('#', '');
    if (el.kind === 'rect') {
      slide.addShape(pptx.ShapeType.rect, { x, y, w, h, fill: { type: 'solid', color }, line: { type: 'none' } });
    } else if (el.kind === 'ellipse') {
      slide.addShape(pptx.ShapeType.ellipse, { x, y, w, h, fill: { type: 'solid', color }, line: { type: 'none' } });
    } else if (el.kind === 'line') {
      slide.addShape(pptx.ShapeType.line, { x, y, w, h, line: { color, width: 2 } });
    } else if (el.kind === 'text') {
      slide.addText(el.text || '', {
        x, y, w, h,
        fontSize: el.fontSize || 18,
        color: (el.fontColor || theme.colors.text).replace('#', ''),
        fontFace: theme.fonts.body.face,
        align: el.align || 'left',
        valign: 'middle',
        bold: el.bold ?? false,
        italic: el.italic ?? false,
        fit: 'shrink',
      });
    }
  }
}

/**
 * Title-bar fill + text color. Dark themes get a dark bar with light text
 * (so text is always readable/white); light themes get a colored primary bar.
 */
export function headerBarColors(theme: ThemeConfig): { fill: string; text: string } {
  if (theme.mode === 'dark') {
    return { fill: theme.colors.backgroundAlt, text: theme.colors.text };
  }
  return { fill: theme.colors.primary, text: theme.colors.textInverse };
}

/** Consistent slide-number footer used by content layouts. */
export function addSlideNumber(
  slide: PptxGenJS.Slide,
  theme: ThemeConfig,
  n: number,
): void {
  slide.addText(n.toString(), {
    x: SLIDE_W - 0.9,
    y: SLIDE_H - 0.5,
    w: 0.5,
    h: 0.35,
    fontSize: theme.fonts.caption.size,
    fontFace: theme.fonts.caption.face,
    color: theme.colors.textMuted,
    align: 'right',
    valign: 'middle',
  });
}

/**
 * Standard content-slide header: a clean title with a short accent rule
 * beneath it (editorial decor) or a filled bar (geometric decor).
 * Returns the y offset where body content can begin.
 */
export function addContentHeader(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  theme: ThemeConfig,
  title: string,
): number {
  const editorial = theme.decor === 'editorial';

  if (editorial) {
    // Title in ink, thin accent rule beneath — magazine style.
    slide.addText(title, {
      x: 0.6,
      y: 0.45,
      w: SLIDE_W - 1.2,
      h: 0.75,
      fontSize: theme.fonts.heading.size,
      fontFace: theme.fonts.heading.face,
      color: theme.colors.primary,
      bold: true,
      align: 'left',
      valign: 'middle',
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.62,
      y: 1.22,
      w: 1.1,
      h: 0.045,
      fill: { type: 'solid', color: theme.colors.accent },
      line: { type: 'none' },
    });
    return 1.55;
  }

  // Geometric: filled top bar with a left accent stripe.
  const bar = headerBarColors(theme);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 1,
    fill: { type: 'solid', color: bar.fill },
    line: { type: 'none' },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.12,
    h: 1,
    fill: { type: 'solid', color: theme.colors.accent },
    line: { type: 'none' },
  });
  slide.addText(title, {
    x: 0.5,
    y: 0.18,
    w: SLIDE_W - 1,
    h: 0.64,
    fontSize: theme.fonts.heading.size,
    fontFace: theme.fonts.heading.face,
    color: bar.text,
    bold: true,
    align: 'left',
    valign: 'middle',
    fit: 'shrink',
    shrinkText: true,
  });
  return 1.35;
}
