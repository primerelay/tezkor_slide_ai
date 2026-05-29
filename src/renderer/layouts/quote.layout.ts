import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class QuoteLayout implements LayoutRenderer {
  readonly type = 'quote';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    _presentationMeta?: PresentationMeta,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();

    slide.background = { color: theme.colors.backgroundAlt };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.3,
      y: 0.3,
      w: 0.1,
      h: 5,
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    slide.addText('"', {
      x: 0.5,
      y: 0.8,
      w: 1,
      h: 1,
      fontSize: 72,
      fontFace: 'Georgia',
      color: theme.colors.accent,
      bold: true,
    });

    if (slideData.quote) {
      slide.addText(slideData.quote.text, {
        x: 1,
        y: 1.5,
        w: 8,
        h: 2.5,
        fontSize: theme.fonts.subtitle.size + 4,
        fontFace: 'Georgia',
        color: theme.colors.text,
        italic: true,
        align: 'left',
        valign: 'middle',
      });

      slide.addText(`— ${slideData.quote.author}`, {
        x: 1,
        y: 4.2,
        w: 8,
        h: 0.6,
        fontSize: theme.fonts.body.size,
        fontFace: theme.fonts.body.face,
        color: theme.colors.primary,
        bold: true,
        align: 'right',
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
