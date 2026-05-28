import { Injectable } from '@nestjs/common';
import { Theme, ThemeConfig } from './theme.interface';

@Injectable()
export class AcademicBlueTheme implements Theme {
  readonly name = 'academic_blue';

  getConfig(): ThemeConfig {
    return {
      name: this.name,
      colors: {
        primary: '1e40af',
        secondary: '3b82f6',
        accent: '60a5fa',
        background: 'ffffff',
        backgroundAlt: 'f1f5f9',
        text: '1e293b',
        textMuted: '64748b',
        textInverse: 'ffffff',
        border: 'e2e8f0',
        success: '22c55e',
        warning: 'f59e0b',
        error: 'ef4444',
      },
      fonts: {
        title: {
          face: 'Arial',
          size: 44,
          bold: true,
          color: '1e40af',
        },
        subtitle: {
          face: 'Arial',
          size: 24,
          bold: false,
          color: '64748b',
        },
        heading: {
          face: 'Arial',
          size: 32,
          bold: true,
          color: '1e40af',
        },
        body: {
          face: 'Arial',
          size: 18,
          bold: false,
          color: '1e293b',
        },
        caption: {
          face: 'Arial',
          size: 14,
          bold: false,
          color: '64748b',
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
