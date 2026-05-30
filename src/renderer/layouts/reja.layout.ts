import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class RejaLayout implements LayoutRenderer {
  readonly type = 'reja';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    presentationMeta?: PresentationMeta,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();
    const i18n = presentationMeta?.i18n;

    // Get translated title (Plan/Outline)
    const planTitle = i18n?.t('presentation.plan') || 'Reja';

    slide.background = { color: theme.colors.background };

    // Left accent bar - full height
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.12,
      h: '100%',
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    // Top decorative shape
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.12,
      y: 0,
      w: 3.5,
      h: 0.08,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
    });

    // Title with icon-like number indicator
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 0.4,
      w: 0.6,
      h: 0.6,
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    slide.addText('📋', {
      x: 0.5,
      y: 0.4,
      w: 0.6,
      h: 0.6,
      fontSize: 20,
      align: 'center',
      valign: 'middle',
    });

    // Title text - use translated or slide title
    const displayTitle = slideData.title || planTitle.toUpperCase();
    slide.addText(displayTitle, {
      x: 1.3,
      y: 0.4,
      w: 8,
      h: 0.6,
      fontSize: theme.fonts.title.size - 2,
      fontFace: theme.fonts.title.face,
      color: theme.colors.primary,
      bold: true,
      align: 'left',
      valign: 'middle',
    });

    // Decorative line under title
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 0.03,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
    });

    // Content area - professional numbered list with boxes
    const bullets = slideData.bullets || [];

    if (bullets.length > 0) {
      const startY = 1.4;
      const itemHeight = 0.65;
      const maxItems = Math.min(bullets.length, 8);

      for (let i = 0; i < maxItems; i++) {
        const y = startY + i * itemHeight;
        const item = bullets[i];

        // Number box with gradient-like effect
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.5,
          y: y,
          w: 0.5,
          h: 0.5,
          fill: {
            type: 'solid',
            color: theme.colors.primary,
          },
          shadow: {
            type: 'outer',
            blur: 3,
            offset: 1,
            angle: 45,
            color: '000000',
            opacity: 0.2,
          },
        });

        // Number text
        slide.addText((i + 1).toString(), {
          x: 0.5,
          y: y,
          w: 0.5,
          h: 0.5,
          fontSize: 14,
          fontFace: theme.fonts.body.face,
          color: theme.colors.textInverse,
          bold: true,
          align: 'center',
          valign: 'middle',
        });

        // Item text with subtle background (theme-aware so dark themes stay readable)
        slide.addShape(pptx.ShapeType.rect, {
          x: 1.1,
          y: y,
          w: 8.4,
          h: 0.5,
          fill: {
            type: 'solid',
            color: i % 2 === 0 ? theme.colors.backgroundAlt : theme.colors.background,
          },
          line: {
            color: theme.colors.border,
            width: 0.5,
          },
        });

        slide.addText(item, {
          x: 1.3,
          y: y,
          w: 8,
          h: 0.5,
          fontSize: 15,
          fontFace: theme.fonts.body.face,
          color: theme.colors.text,
          bold: false,
          align: 'left',
          valign: 'middle',
          fit: 'shrink',
          shrinkText: true,
        });
      }
    }

    // Footer with subtle design
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 5.35,
      w: '100%',
      h: 0.15,
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    // Page indicator
    slide.addText('2', {
      x: 9,
      y: 5.1,
      w: 0.5,
      h: 0.3,
      fontSize: 10,
      fontFace: theme.fonts.caption.face,
      color: theme.colors.textMuted,
      align: 'right',
    });

    return slide;
  }
}
