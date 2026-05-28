import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class BulletsLayout implements LayoutRenderer {
  readonly type = 'bullets';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
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

    if (slideData.bullets && slideData.bullets.length > 0) {
      const bulletTexts = slideData.bullets.map((bullet, index) => ({
        text: bullet,
        options: {
          fontSize: theme.fonts.body.size,
          fontFace: theme.fonts.body.face,
          color: theme.colors.text,
          bullet: { type: 'bullet' as const },
          paraSpaceBefore: index === 0 ? 0 : 8,
          paraSpaceAfter: 4,
        },
      }));

      slide.addText(bulletTexts, {
        x: 0.5,
        y: 1.3,
        w: 9,
        h: 3.8,
        valign: 'top',
      });
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
