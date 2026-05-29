import { Injectable } from '@nestjs/common';
import { Theme, ThemeConfig } from './theme.interface';

/**
 * Gradient Violet — a modern, vibrant theme inspired by contemporary
 * product decks. Light, readable content slides with violet headers and
 * a bold violet→fuchsia gradient on title/closing slides.
 */
@Injectable()
export class GradientVioletTheme implements Theme {
  readonly name = 'gradient_violet';

  getConfig(): ThemeConfig {
    return {
      name: this.name,
      colors: {
        primary: '7c3aed',
        secondary: 'a78bfa',
        accent: 'db2777',
        background: 'ffffff',
        backgroundAlt: 'f5f3ff',
        text: '1e1b2e',
        textMuted: '6b7280',
        textInverse: 'ffffff',
        border: 'ede9fe',
        success: '16a34a',
        warning: 'f59e0b',
        error: 'e11d48',
      },
      fonts: {
        title: {
          face: 'Arial',
          size: 48,
          bold: true,
          color: '7c3aed',
        },
        subtitle: {
          face: 'Arial',
          size: 24,
          bold: false,
          color: '6b7280',
        },
        heading: {
          face: 'Arial',
          size: 32,
          bold: true,
          color: '7c3aed',
        },
        body: {
          face: 'Arial',
          size: 18,
          bold: false,
          color: '1e1b2e',
        },
        caption: {
          face: 'Arial',
          size: 14,
          bold: false,
          color: '6b7280',
        },
      },
      slideWidth: 10,
      slideHeight: 5.625,
      margin: {
        top: 0.5,
        right: 0.5,
        bottom: 0.5,
        left: 0.5,
      },
      gridUnit: 0.125,
      mode: 'light',
      decor: 'geometric',
      gradient: { from: '7c3aed', to: 'db2777', angle: 135 },
      heroGradient: true,
    };
  }
}
