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

    slide.background = { color: theme.colors.background };

    // Title bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 1.2,
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    // Title
    slide.addText(slideData.title || 'Reja', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: theme.fonts.title.size - 4,
      fontFace: theme.fonts.title.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Content area - numbered list
    const bullets = slideData.bullets || [];

    if (bullets.length > 0) {
      const textItems = bullets.map((item: string, index: number) => ({
        text: `${index + 1}. ${item}`,
        options: {
          fontSize: 18,
          fontFace: theme.fonts.body.face,
          color: theme.colors.text,
          bullet: false,
          paraSpaceBefore: 8,
          paraSpaceAfter: 8,
        },
      }));

      slide.addText(textItems, {
        x: 0.8,
        y: 1.5,
        w: 8.4,
        h: 3.8,
        valign: 'top',
        lineSpacing: 28,
      });
    }

    // Footer line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 5.2,
      w: 9,
      h: 0.02,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
    });

    return slide;
  }
}
