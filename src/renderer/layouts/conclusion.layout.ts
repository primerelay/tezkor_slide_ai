import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';
import {
  SLIDE_W,
  SLIDE_H,
  applyHeroBackground,
  darkenColor,
  lightenColor,
} from './layout.helpers';

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
    const editorial = theme.decor === 'editorial';

    const thankYouText =
      i18n?.t('presentation.thankYou') || "E'tiboringiz uchun rahmat!";

    // Full-bleed premium background (gradient or solid).
    applyHeroBackground(slide, pptx, theme);

    if (!editorial) {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 7.6,
        y: -0.8,
        w: 3.4,
        h: 3.4,
        fill: { type: 'solid', color: lightenColor(theme.colors.primary, 12), transparency: 55 },
        line: { type: 'none' },
      });
    }

    // Top-left accent marker.
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 0.55,
      w: editorial ? 1.4 : 0.7,
      h: editorial ? 0.04 : 0.12,
      fill: { type: 'solid', color: editorial ? theme.colors.accent : theme.colors.textInverse },
      line: { type: 'none' },
    });

    // Title.
    slide.addText(editorial ? slideData.title : slideData.title.toUpperCase(), {
      x: 0.6,
      y: 1.0,
      w: SLIDE_W - 1.2,
      h: 0.9,
      fontSize: theme.fonts.heading.size + 4,
      fontFace: theme.fonts.heading.face,
      color: theme.colors.textInverse,
      bold: true,
      align: editorial ? 'left' : 'center',
      valign: 'middle',
    });

    // Checkmark takeaways.
    if (slideData.bullets && slideData.bullets.length > 0) {
      const items = slideData.bullets.slice(0, 4);
      const startY = 2.25;
      const itemHeight = 0.62;

      items.forEach((bullet, index) => {
        const y = startY + index * itemHeight;

        slide.addShape(pptx.ShapeType.ellipse, {
          x: editorial ? 0.62 : 1.3,
          y: y + 0.04,
          w: 0.36,
          h: 0.36,
          fill: { type: 'solid', color: theme.colors.accent },
          line: { type: 'none' },
        });
        slide.addText('✓', {
          x: editorial ? 0.62 : 1.3,
          y: y + 0.04,
          w: 0.36,
          h: 0.36,
          fontSize: 14,
          color: theme.colors.textInverse,
          align: 'center',
          valign: 'middle',
          bold: true,
        });
        slide.addText(bullet, {
          x: editorial ? 1.15 : 1.85,
          y: y,
          w: 7.2,
          h: 0.46,
          fontSize: theme.fonts.body.size,
          fontFace: theme.fonts.body.face,
          color: theme.colors.textInverse,
          align: 'left',
          valign: 'middle',
        });
      });
    }

    // Bottom thank-you bar.
    const barColor =
      theme.heroGradient && theme.gradient
        ? darkenColor(theme.gradient.to, 30)
        : darkenColor(theme.colors.primary, 25);

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: SLIDE_H - 1,
      w: SLIDE_W,
      h: 1,
      fill: { type: 'solid', color: barColor },
      line: { type: 'none' },
    });

    slide.addText(thankYouText, {
      x: 0.5,
      y: SLIDE_H - 0.85,
      w: SLIDE_W - 1,
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
}
