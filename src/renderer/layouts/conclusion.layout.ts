import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class ConclusionLayout implements LayoutRenderer {
  readonly type = 'conclusion';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    presentationMeta?: PresentationMeta,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();
    const i18n = presentationMeta?.i18n;

    // Get translated thank you message
    const thankYouText = i18n?.t('presentation.thankYou') || "E'tiboringiz uchun rahmat!";

    // Full background with primary color
    slide.background = { color: theme.colors.primary };

    // Decorative corner shapes (matching hero layout style)
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

    // Right side decorative circles
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 7.5,
      y: -0.5,
      w: 3,
      h: 3,
      fill: {
        type: 'solid',
        color: theme.colors.secondary,
      },
    });

    slide.addShape(pptx.ShapeType.ellipse, {
      x: 8.5,
      y: 3,
      w: 2,
      h: 2,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
    });

    // Title with icon
    slide.addText('📝', {
      x: 3.5,
      y: 0.4,
      w: 0.8,
      h: 0.8,
      fontSize: 28,
      align: 'center',
      valign: 'middle',
    });

    slide.addText(slideData.title.toUpperCase(), {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 0.8,
      fontSize: theme.fonts.heading.size + 2,
      fontFace: theme.fonts.heading.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Decorative line under title
    slide.addShape(pptx.ShapeType.rect, {
      x: 3,
      y: 1.95,
      w: 4,
      h: 0.04,
      fill: {
        type: 'solid',
        color: theme.colors.textInverse,
      },
    });

    // Conclusion bullets with checkmark style
    if (slideData.bullets && slideData.bullets.length > 0) {
      const startY = 2.3;
      const itemHeight = 0.65;

      slideData.bullets.forEach((bullet, index) => {
        const y = startY + index * itemHeight;

        // Checkmark circle
        slide.addShape(pptx.ShapeType.ellipse, {
          x: 1.3,
          y: y + 0.05,
          w: 0.35,
          h: 0.35,
          fill: {
            type: 'solid',
            color: theme.colors.accent,
          },
        });

        slide.addText('✓', {
          x: 1.3,
          y: y + 0.05,
          w: 0.35,
          h: 0.35,
          fontSize: 14,
          color: theme.colors.textInverse,
          align: 'center',
          valign: 'middle',
          bold: true,
        });

        // Bullet text
        slide.addText(bullet, {
          x: 1.8,
          y: y,
          w: 6.5,
          h: 0.5,
          fontSize: theme.fonts.body.size,
          fontFace: theme.fonts.body.face,
          color: theme.colors.textInverse,
          align: 'left',
          valign: 'middle',
        });
      });
    }

    // Bottom section with darker background
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 4.5,
      w: '100%',
      h: 1,
      fill: {
        type: 'solid',
        color: this.darkenColor(theme.colors.primary, 25),
      },
    });

    // Thank you message with decorative elements
    slide.addText(thankYouText, {
      x: 0.5,
      y: 4.7,
      w: 9,
      h: 0.6,
      fontSize: theme.fonts.subtitle.size + 2,
      fontFace: theme.fonts.subtitle.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    return slide;
  }

  private darkenColor(hex: string, percent: number): string {
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
