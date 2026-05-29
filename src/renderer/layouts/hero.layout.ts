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
    const editorial = theme.decor === 'editorial';

    const preparedByLabel = i18n?.t('presentation.preparedBy') || 'Tayyorladi';
    const checkedByLabel = i18n?.t('presentation.checkedBy') || 'Tekshirdi';

    // Full-bleed premium background (gradient or solid).
    applyHeroBackground(slide, pptx, theme);

    // Soft decorative circles for geometric themes (skipped for editorial).
    if (!editorial) {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 6.7,
        y: -1.4,
        w: 4.6,
        h: 4.6,
        fill: { type: 'solid', color: lightenColor(theme.colors.primary, 14), transparency: 55 },
        line: { type: 'none' },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 8.2,
        y: 2.6,
        w: 2.6,
        h: 2.6,
        fill: { type: 'solid', color: lightenColor(theme.colors.accent, 10), transparency: 45 },
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

    // Main title — large, high-impact.
    const titleText = editorial ? slideData.title : slideData.title.toUpperCase();
    slide.addText(titleText, {
      x: 0.6,
      y: 1.5,
      w: SLIDE_W - 1.2,
      h: 1.9,
      fontSize: theme.fonts.title.size + 8,
      fontFace: theme.fonts.title.face,
      color: theme.colors.textInverse,
      bold: true,
      align: editorial ? 'left' : 'center',
      valign: 'middle',
      lineSpacingMultiple: 0.95,
    });

    // Subtitle.
    if (slideData.subtitle) {
      slide.addText(slideData.subtitle, {
        x: editorial ? 0.62 : 1.5,
        y: 3.5,
        w: editorial ? SLIDE_W - 2.4 : SLIDE_W - 3,
        h: 0.7,
        fontSize: theme.fonts.subtitle.size,
        fontFace: theme.fonts.subtitle.face,
        color: theme.colors.textInverse,
        bold: false,
        align: editorial ? 'left' : 'center',
        valign: 'middle',
      });
    }

    // Bottom info bar.
    const barColor = theme.heroGradient && theme.gradient
      ? darkenColor(theme.gradient.to, 28)
      : darkenColor(theme.colors.primary, 22);

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: SLIDE_H - 1,
      w: SLIDE_W,
      h: 1,
      fill: { type: 'solid', color: barColor },
      line: { type: 'none' },
    });

    const infoY = SLIDE_H - 0.86;

    if (presentationMeta?.studentName) {
      slide.addText(`${preparedByLabel}:`, {
        x: 5.3,
        y: infoY,
        w: 1.7,
        h: 0.35,
        fontSize: 11,
        fontFace: theme.fonts.body.face,
        color: theme.colors.accent,
        bold: true,
        align: 'right',
        valign: 'middle',
      });
      slide.addText(presentationMeta.studentName, {
        x: 7.1,
        y: infoY,
        w: 2.4,
        h: 0.35,
        fontSize: 12,
        fontFace: theme.fonts.body.face,
        color: theme.colors.textInverse,
        align: 'left',
        valign: 'middle',
      });
    }

    if (presentationMeta?.teacherName) {
      slide.addText(`${checkedByLabel}:`, {
        x: 5.3,
        y: infoY + 0.35,
        w: 1.7,
        h: 0.35,
        fontSize: 11,
        fontFace: theme.fonts.body.face,
        color: theme.colors.accent,
        bold: true,
        align: 'right',
        valign: 'middle',
      });
      slide.addText(presentationMeta.teacherName, {
        x: 7.1,
        y: infoY + 0.35,
        w: 2.4,
        h: 0.35,
        fontSize: 12,
        fontFace: theme.fonts.body.face,
        color: theme.colors.textInverse,
        align: 'left',
        valign: 'middle',
      });
    }

    // Year — bottom left.
    slide.addText(new Date().getFullYear().toString(), {
      x: 0.6,
      y: infoY + 0.15,
      w: 1.2,
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
}
