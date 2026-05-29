import { Injectable } from '@nestjs/common';
import { Theme, ThemeConfig } from './theme.interface';

/**
 * Editorial — a sophisticated, magazine-style academic theme.
 * Cream paper, ink text, serif display headings (Georgia is a safe,
 * universally-available serif). Ideal for literature, history, humanities.
 */
@Injectable()
export class EditorialSerifTheme implements Theme {
  readonly name = 'editorial_serif';

  getConfig(): ThemeConfig {
    return {
      name: this.name,
      colors: {
        primary: '1c1917',
        secondary: '44403c',
        accent: '9f1239',
        background: 'faf7f2',
        backgroundAlt: 'f0ece4',
        text: '1c1917',
        textMuted: '78716c',
        textInverse: 'faf7f2',
        border: 'e7e2d9',
        success: '15803d',
        warning: 'b45309',
        error: '9f1239',
      },
      fonts: {
        title: {
          face: 'Georgia',
          size: 46,
          bold: true,
          color: '1c1917',
        },
        subtitle: {
          face: 'Georgia',
          size: 22,
          bold: false,
          color: '78716c',
        },
        heading: {
          face: 'Georgia',
          size: 32,
          bold: true,
          color: '1c1917',
        },
        body: {
          face: 'Arial',
          size: 18,
          bold: false,
          color: '292524',
        },
        caption: {
          face: 'Arial',
          size: 13,
          bold: false,
          color: '78716c',
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
      gradient: { from: '1c1917', to: '44403c', angle: 135 },
      heroGradient: false,
    };
  }
}
