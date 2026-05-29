import { Injectable } from '@nestjs/common';
import { Theme, ThemeConfig } from './theme.interface';

@Injectable()
export class MinimalWhiteTheme implements Theme {
  readonly name = 'minimal_white';

  getConfig(): ThemeConfig {
    return {
      name: this.name,
      colors: {
        primary: '111827',
        secondary: '374151',
        accent: '6b7280',
        background: 'ffffff',
        backgroundAlt: 'f9fafb',
        text: '111827',
        textMuted: '6b7280',
        textInverse: 'ffffff',
        border: 'e5e7eb',
        success: '10b981',
        warning: 'f59e0b',
        error: 'ef4444',
      },
      fonts: {
        title: {
          face: 'Arial',
          size: 44,
          bold: true,
          color: '111827',
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
          color: '111827',
        },
        body: {
          face: 'Arial',
          size: 18,
          bold: false,
          color: '374151',
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
      decor: 'minimal',
      gradient: { from: '111827', to: '374151', angle: 135 },
      heroGradient: false,
    };
  }
}
