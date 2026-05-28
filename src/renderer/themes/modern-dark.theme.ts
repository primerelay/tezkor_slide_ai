import { Injectable } from '@nestjs/common';
import { Theme, ThemeConfig } from './theme.interface';

@Injectable()
export class ModernDarkTheme implements Theme {
  readonly name = 'modern_dark';

  getConfig(): ThemeConfig {
    return {
      name: this.name,
      colors: {
        primary: '818cf8',
        secondary: '6366f1',
        accent: 'a5b4fc',
        background: '0f172a',
        backgroundAlt: '1e293b',
        text: 'f1f5f9',
        textMuted: '94a3b8',
        textInverse: '0f172a',
        border: '334155',
        success: '34d399',
        warning: 'fbbf24',
        error: 'f87171',
      },
      fonts: {
        title: {
          face: 'Arial',
          size: 44,
          bold: true,
          color: 'f1f5f9',
        },
        subtitle: {
          face: 'Arial',
          size: 24,
          bold: false,
          color: '94a3b8',
        },
        heading: {
          face: 'Arial',
          size: 32,
          bold: true,
          color: 'f1f5f9',
        },
        body: {
          face: 'Arial',
          size: 18,
          bold: false,
          color: 'e2e8f0',
        },
        caption: {
          face: 'Arial',
          size: 14,
          bold: false,
          color: '94a3b8',
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
    };
  }
}
