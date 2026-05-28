import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class StatisticsLayout implements LayoutRenderer {
  readonly type = 'statistics';

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

    if (slideData.statistics && slideData.statistics.length > 0) {
      const stats = slideData.statistics;
      const itemCount = Math.min(stats.length, 4);
      const boxWidth = (9 - (itemCount - 1) * 0.3) / itemCount;

      stats.slice(0, 4).forEach((stat, index) => {
        const x = 0.5 + index * (boxWidth + 0.3);

        slide.addShape(pptx.ShapeType.rect, {
          x,
          y: 1.5,
          w: boxWidth,
          h: 3,
          fill: {
            type: 'solid',
            color: theme.colors.backgroundAlt,
          },
          line: {
            color: theme.colors.primary,
            width: 2,
          },
          shadow: {
            type: 'outer',
            blur: 4,
            offset: 2,
            angle: 45,
            color: '000000',
            opacity: 0.1,
          },
        });

        slide.addText(stat.value, {
          x,
          y: 1.8,
          w: boxWidth,
          h: 1.2,
          fontSize: 36,
          fontFace: theme.fonts.title.face,
          color: theme.colors.primary,
          bold: true,
          align: 'center',
          valign: 'middle',
        });

        slide.addText(stat.label, {
          x,
          y: 3.0,
          w: boxWidth,
          h: 1.2,
          fontSize: theme.fonts.body.size - 2,
          fontFace: theme.fonts.body.face,
          color: theme.colors.text,
          align: 'center',
          valign: 'top',
        });
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
