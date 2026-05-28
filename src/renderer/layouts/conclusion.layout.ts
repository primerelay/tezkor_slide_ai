import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class ConclusionLayout implements LayoutRenderer {
  readonly type = 'conclusion';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();

    slide.background = { color: theme.colors.primary };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 4.625,
      w: '100%',
      h: 1,
      fill: {
        type: 'solid',
        color: theme.colors.secondary,
      },
    });

    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.8,
      fontSize: theme.fonts.heading.size,
      fontFace: theme.fonts.heading.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    if (slideData.bullets && slideData.bullets.length > 0) {
      const bulletTexts = slideData.bullets.map((bullet, index) => ({
        text: bullet,
        options: {
          fontSize: theme.fonts.body.size + 2,
          fontFace: theme.fonts.body.face,
          color: theme.colors.textInverse,
          bullet: {
            type: 'number' as const,
          },
          paraSpaceBefore: index === 0 ? 0 : 12,
          paraSpaceAfter: 6,
        },
      }));

      slide.addText(bulletTexts, {
        x: 1.5,
        y: 1.5,
        w: 7,
        h: 2.8,
        valign: 'top',
      });
    }

    slide.addText("E'tiboringiz uchun rahmat!", {
      x: 0.5,
      y: 4.75,
      w: 9,
      h: 0.6,
      fontSize: theme.fonts.subtitle.size,
      fontFace: theme.fonts.subtitle.face,
      color: theme.colors.textInverse,
      align: 'center',
      valign: 'middle',
    });

    return slide;
  }
}
