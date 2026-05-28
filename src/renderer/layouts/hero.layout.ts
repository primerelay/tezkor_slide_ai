import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class HeroLayout implements LayoutRenderer {
  readonly type = 'hero';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();

    slide.background = { color: theme.colors.primary };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 4.5,
      w: '100%',
      h: 1.125,
      fill: {
        type: 'solid',
        color: theme.colors.secondary,
      },
    });

    slide.addText(slideData.title, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: theme.fonts.title.size,
      fontFace: theme.fonts.title.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    if (slideData.subtitle) {
      slide.addText(slideData.subtitle, {
        x: 0.5,
        y: 3,
        w: 9,
        h: 0.8,
        fontSize: theme.fonts.subtitle.size,
        fontFace: theme.fonts.subtitle.face,
        color: theme.colors.textInverse,
        bold: false,
        align: 'center',
        valign: 'middle',
      });
    }

    return slide;
  }
}
