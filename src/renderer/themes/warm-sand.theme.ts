import { Injectable } from '@nestjs/common';
import { Theme, ThemeConfig } from './theme.interface';

/**
 * Warm Sand — a warm terracotta/amber theme with a humanities feel.
 * Suits history, culture, art and literature topics.
 */
@Injectable()
export class WarmSandTheme implements Theme {
  readonly name = 'warm_sand';

  getConfig(): ThemeConfig {
    return {
      name: this.name,
      colors: {
        primary: 'b45309',
        secondary: 'c2410c',
        accent: 'ea580c',
        background: 'fffbf5',
        backgroundAlt: 'fef3e2',
        text: '431407',
        textMuted: '92766a',
        textInverse: 'fffbf5',
        border: 'f5e3cc',
        success: '4d7c0f',
        warning: 'd97706',
        error: 'b91c1c',
      },
      fonts: {
        title: {
          face: 'Georgia',
          size: 46,
          bold: true,
          color: 'b45309',
        },
        subtitle: {
          face: 'Arial',
          size: 23,
          bold: false,
          color: '92766a',
        },
        heading: {
          face: 'Georgia',
          size: 32,
          bold: true,
          color: 'b45309',
        },
        body: {
          face: 'Arial',
          size: 18,
          bold: false,
          color: '431407',
        },
        caption: {
          face: 'Arial',
          size: 14,
          bold: false,
          color: '92766a',
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
      decor: 'editorial',
      gradient: { from: '9a3412', to: 'ea580c', angle: 135 },
      heroGradient: true,
    };
  }
}
