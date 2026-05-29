import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class HeroLayout implements LayoutRenderer {
  readonly type = 'hero';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    presentationMeta?: PresentationMeta,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();
    const i18n = presentationMeta?.i18n;

    // Get translated labels
    const preparedByLabel = i18n?.t('presentation.preparedBy') || 'Tayyorladi';
    const checkedByLabel = i18n?.t('presentation.checkedBy') || 'Tekshirdi';

    // Full background with primary color
    slide.background = { color: theme.colors.primary };

    // Decorative top-left corner shape
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.15,
      h: 2.5,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
    });

    // Decorative horizontal line at top
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 3,
      h: 0.08,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
    });

    // Large decorative circle (semi-transparent effect via lighter color)
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 6.5,
      y: -1,
      w: 4,
      h: 4,
      fill: {
        type: 'solid',
        color: theme.colors.secondary,
      },
      line: { color: theme.colors.secondary, width: 0 },
    });

    // Smaller decorative circle
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 8,
      y: 2.5,
      w: 2.5,
      h: 2.5,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
      line: { color: theme.colors.accent, width: 0 },
    });

    // Main title - centered with emphasis (positioned higher)
    slide.addText(slideData.title.toUpperCase(), {
      x: 0.5,
      y: 0.8,
      w: 9,
      h: 1.5,
      fontSize: theme.fonts.title.size + 4,
      fontFace: theme.fonts.title.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Subtitle with decorative lines (positioned below title with gap)
    if (slideData.subtitle) {
      // Left decorative line
      slide.addShape(pptx.ShapeType.rect, {
        x: 1.5,
        y: 2.7,
        w: 1.2,
        h: 0.03,
        fill: {
          type: 'solid',
          color: theme.colors.textInverse,
        },
      });

      // Subtitle text - wider area for longer text
      slide.addText(slideData.subtitle, {
        x: 2.7,
        y: 2.4,
        w: 4.6,
        h: 0.8,
        fontSize: theme.fonts.subtitle.size,
        fontFace: theme.fonts.subtitle.face,
        color: theme.colors.textInverse,
        bold: false,
        align: 'center',
        valign: 'middle',
      });

      // Right decorative line
      slide.addShape(pptx.ShapeType.rect, {
        x: 7.3,
        y: 2.7,
        w: 1.2,
        h: 0.03,
        fill: {
          type: 'solid',
          color: theme.colors.textInverse,
        },
      });
    }

    // Bottom info section - right aligned
    // Background bar for info section
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 4.5,
      w: '100%',
      h: 1,
      fill: {
        type: 'solid',
        color: this.darkenColor(theme.colors.primary, 20),
      },
    });

    // Student and Teacher info - RIGHT BOTTOM aligned
    const infoY = 4.65;

    if (presentationMeta?.studentName) {
      slide.addText(`${preparedByLabel}:`, {
        x: 5.5,
        y: infoY,
        w: 1.5,
        h: 0.35,
        fontSize: 11,
        fontFace: theme.fonts.body.face,
        color: theme.colors.accent,
        bold: true,
        align: 'right',
        valign: 'middle',
      });

      slide.addText(presentationMeta.studentName, {
        x: 7,
        y: infoY,
        w: 2.5,
        h: 0.35,
        fontSize: 12,
        fontFace: theme.fonts.body.face,
        color: theme.colors.textInverse,
        bold: false,
        align: 'left',
        valign: 'middle',
      });
    }

    if (presentationMeta?.teacherName) {
      slide.addText(`${checkedByLabel}:`, {
        x: 5.5,
        y: infoY + 0.35,
        w: 1.5,
        h: 0.35,
        fontSize: 11,
        fontFace: theme.fonts.body.face,
        color: theme.colors.accent,
        bold: true,
        align: 'right',
        valign: 'middle',
      });

      slide.addText(presentationMeta.teacherName, {
        x: 7,
        y: infoY + 0.35,
        w: 2.5,
        h: 0.35,
        fontSize: 12,
        fontFace: theme.fonts.body.face,
        color: theme.colors.textInverse,
        bold: false,
        align: 'left',
        valign: 'middle',
      });
    }

    // Year - left bottom
    slide.addText(new Date().getFullYear().toString(), {
      x: 0.5,
      y: infoY + 0.15,
      w: 1,
      h: 0.4,
      fontSize: 14,
      fontFace: theme.fonts.body.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'left',
      valign: 'middle',
    });

    return slide;
  }

  private darkenColor(hex: string, percent: number): string {
    // Remove # if present
    const color = hex.replace('#', '');

    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const darkenedR = Math.max(0, Math.floor(r * (1 - percent / 100)));
    const darkenedG = Math.max(0, Math.floor(g * (1 - percent / 100)));
    const darkenedB = Math.max(0, Math.floor(b * (1 - percent / 100)));

    return `${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
  }
}
