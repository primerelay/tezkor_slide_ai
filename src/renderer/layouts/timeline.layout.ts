import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class TimelineLayout implements LayoutRenderer {
  readonly type = 'timeline';

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

    if (slideData.timeline && slideData.timeline.length > 0) {
      const timeline = slideData.timeline;
      const itemCount = timeline.length;
      const lineY = 2.8;

      slide.addShape(pptx.ShapeType.line, {
        x: 0.5,
        y: lineY,
        w: 9,
        h: 0,
        line: {
          color: theme.colors.accent,
          width: 3,
        },
      });

      const spacing = 9 / (itemCount + 1);

      timeline.forEach((item, index) => {
        const x = 0.5 + spacing * (index + 1);

        slide.addShape(pptx.ShapeType.ellipse, {
          x: x - 0.15,
          y: lineY - 0.15,
          w: 0.3,
          h: 0.3,
          fill: {
            type: 'solid',
            color: theme.colors.primary,
          },
        });

        slide.addText(item.year, {
          x: x - 0.5,
          y: lineY - 0.8,
          w: 1,
          h: 0.4,
          fontSize: theme.fonts.body.size,
          fontFace: theme.fonts.body.face,
          color: theme.colors.primary,
          bold: true,
          align: 'center',
        });

        slide.addText(item.event, {
          x: x - 1,
          y: lineY + 0.3,
          w: 2,
          h: 1.2,
          fontSize: theme.fonts.caption.size + 2,
          fontFace: theme.fonts.caption.face,
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
