import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class ComparisonLayout implements LayoutRenderer {
  readonly type = 'comparison';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    _presentationMeta?: PresentationMeta,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();

    slide.background = { color: theme.colors.background };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 1,
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.6,
      fontSize: theme.fonts.heading.size,
      fontFace: theme.fonts.heading.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'left',
      valign: 'middle',
    });

    if (slideData.comparison) {
      const { leftTitle, rightTitle, leftItems, rightItems } =
        slideData.comparison;

      slide.addShape(pptx.ShapeType.rect, {
        x: 0.3,
        y: 1.2,
        w: 4.5,
        h: 3.8,
        fill: {
          type: 'solid',
          color: theme.colors.backgroundAlt,
        },
        line: {
          color: theme.colors.primary,
          width: 2,
        },
      });

      slide.addText(leftTitle, {
        x: 0.5,
        y: 1.3,
        w: 4.1,
        h: 0.5,
        fontSize: theme.fonts.body.size + 2,
        fontFace: theme.fonts.body.face,
        color: theme.colors.primary,
        bold: true,
        align: 'center',
      });

      if (leftItems.length > 0) {
        const leftBullets = leftItems.map((item, index) => ({
          text: item,
          options: {
            fontSize: theme.fonts.body.size - 2,
            fontFace: theme.fonts.body.face,
            color: theme.colors.text,
            bullet: { type: 'bullet' as const },
            paraSpaceBefore: index === 0 ? 0 : 4,
          },
        }));

        slide.addText(leftBullets, {
          x: 0.5,
          y: 1.9,
          w: 4.1,
          h: 2.9,
          valign: 'top',
          fit: 'shrink',
          shrinkText: true,
        });
      }

      slide.addShape(pptx.ShapeType.rect, {
        x: 5.2,
        y: 1.2,
        w: 4.5,
        h: 3.8,
        fill: {
          type: 'solid',
          color: theme.colors.backgroundAlt,
        },
        line: {
          color: theme.colors.secondary,
          width: 2,
        },
      });

      slide.addText(rightTitle, {
        x: 5.4,
        y: 1.3,
        w: 4.1,
        h: 0.5,
        fontSize: theme.fonts.body.size + 2,
        fontFace: theme.fonts.body.face,
        color: theme.colors.secondary,
        bold: true,
        align: 'center',
      });

      if (rightItems.length > 0) {
        const rightBullets = rightItems.map((item, index) => ({
          text: item,
          options: {
            fontSize: theme.fonts.body.size - 2,
            fontFace: theme.fonts.body.face,
            color: theme.colors.text,
            bullet: { type: 'bullet' as const },
            paraSpaceBefore: index === 0 ? 0 : 4,
          },
        }));

        slide.addText(rightBullets, {
          x: 5.4,
          y: 1.9,
          w: 4.1,
          h: 2.9,
          valign: 'top',
          fit: 'shrink',
          shrinkText: true,
        });
      }
    }

    const slideNumber = slideData.slideNumber.toString();
    slide.addText(slideNumber, {
      x: 9,
      y: 5.1,
      w: 0.5,
      h: 0.4,
      fontSize: theme.fonts.caption.size,
      fontFace: theme.fonts.caption.face,
      color: theme.colors.textMuted,
      align: 'right',
    });

    return slide;
  }
}
