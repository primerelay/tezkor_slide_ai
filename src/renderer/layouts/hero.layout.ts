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
    presentationMeta?: { studentName?: string; teacherName?: string },
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();

    slide.background = { color: theme.colors.primary };

    // Background shape
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

    // Bottom accent bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 4.2,
      w: '100%',
      h: 1.3,
      fill: {
        type: 'solid',
        color: theme.colors.secondary,
      },
    });

    // Main title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 1.2,
      fontSize: theme.fonts.title.size,
      fontFace: theme.fonts.title.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'center',
      valign: 'middle',
    });

    // Subtitle
    if (slideData.subtitle) {
      slide.addText(slideData.subtitle, {
        x: 0.5,
        y: 2.4,
        w: 9,
        h: 0.6,
        fontSize: theme.fonts.subtitle.size,
        fontFace: theme.fonts.subtitle.face,
        color: theme.colors.textInverse,
        bold: false,
        align: 'center',
        valign: 'middle',
      });
    }

    // Student info (Tayyorladi)
    if (presentationMeta?.studentName) {
      slide.addText(`Tayyorladi: ${presentationMeta.studentName}`, {
        x: 0.5,
        y: 4.35,
        w: 4.25,
        h: 0.4,
        fontSize: 14,
        fontFace: theme.fonts.body.face,
        color: theme.colors.textInverse,
        bold: false,
        align: 'left',
        valign: 'middle',
      });
    }

    // Teacher info (Tekshirdi)
    if (presentationMeta?.teacherName) {
      slide.addText(`Tekshirdi: ${presentationMeta.teacherName}`, {
        x: 5.25,
        y: 4.35,
        w: 4.25,
        h: 0.4,
        fontSize: 14,
        fontFace: theme.fonts.body.face,
        color: theme.colors.textInverse,
        bold: false,
        align: 'right',
        valign: 'middle',
      });
    }

    // Year
    slide.addText(new Date().getFullYear().toString(), {
      x: 0.5,
      y: 4.8,
      w: 9,
      h: 0.4,
      fontSize: 12,
      fontFace: theme.fonts.body.face,
      color: theme.colors.textInverse,
      bold: false,
      align: 'center',
      valign: 'middle',
    });

    return slide;
  }
}
