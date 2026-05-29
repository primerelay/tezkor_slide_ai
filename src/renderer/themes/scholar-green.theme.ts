import { Injectable } from '@nestjs/common';
import { Theme, ThemeConfig } from './theme.interface';

/**
 * Scholar Green — a calm, academic emerald theme. Great for natural
 * sciences (biology, ecology, chemistry) and general study decks that
 * want a fresher alternative to blue.
 */
@Injectable()
export class ScholarGreenTheme implements Theme {
  readonly name = 'scholar_green';

  getConfig(): ThemeConfig {
    return {
      name: this.name,
      colors: {
        primary: '047857',
        secondary: '0d9488',
        accent: '10b981',
        background: 'ffffff',
        backgroundAlt: 'f0fdf4',
        text: '14342b',
        textMuted: '5f6b64',
        textInverse: 'ffffff',
        border: 'd1fae5',
        success: '16a34a',
        warning: 'd97706',
        error: 'dc2626',
      },
      fonts: {
        title: {
          face: 'Arial',
          size: 46,
          bold: true,
          color: '047857',
        },
        subtitle: {
          face: 'Arial',
          size: 24,
          bold: false,
          color: '5f6b64',
        },
        heading: {
          face: 'Arial',
          size: 32,
          bold: true,
          color: '047857',
        },
        body: {
          face: 'Arial',
          size: 18,
          bold: false,
          color: '14342b',
        },
        caption: {
          face: 'Arial',
          size: 14,
          bold: false,
          color: '5f6b64',
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
      gradient: { from: '047857', to: '0d9488', angle: 135 },
      heroGradient: true,
    };
  }
}
