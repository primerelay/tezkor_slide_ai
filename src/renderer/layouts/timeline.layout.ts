import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
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
    const hasImage = slideData.assets?.image?.localPath &&
                     fs.existsSync(slideData.assets.image.localPath);

    slide.background = { color: theme.colors.background };

    // Title bar with accent stripe
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

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 0.1,
      h: 1,
      fill: {
        type: 'solid',
        color: theme.colors.accent,
      },
    });

    // Timeline icon
    slide.addText('📅', {
      x: 0.4,
      y: 0.2,
      w: 0.6,
      h: 0.6,
      fontSize: 20,
      align: 'center',
      valign: 'middle',
    });

    slide.addText(slideData.title, {
      x: 1,
      y: 0.2,
      w: 8.5,
      h: 0.6,
      fontSize: theme.fonts.heading.size,
      fontFace: theme.fonts.heading.face,
      color: theme.colors.textInverse,
      bold: true,
      align: 'left',
      valign: 'middle',
    });

    // Content area with optional image
    const timelineWidth = hasImage ? 5.5 : 9;
    const timelineX = 0.5;

    if (slideData.timeline && slideData.timeline.length > 0) {
      const timeline = slideData.timeline;
      const itemCount = timeline.length;
      const lineY = 2.8;

      // Timeline line with gradient effect (using shapes)
      slide.addShape(pptx.ShapeType.rect, {
        x: timelineX,
        y: lineY - 0.02,
        w: timelineWidth,
        h: 0.04,
        fill: {
          type: 'solid',
          color: theme.colors.accent,
        },
      });

      // Arrow at the end
      slide.addShape(pptx.ShapeType.rightArrow, {
        x: timelineX + timelineWidth - 0.3,
        y: lineY - 0.15,
        w: 0.4,
        h: 0.3,
        fill: {
          type: 'solid',
          color: theme.colors.accent,
        },
      });

      const spacing = (timelineWidth - 0.5) / Math.max(itemCount, 1);

      timeline.forEach((item, index) => {
        const x = timelineX + 0.3 + spacing * index;

        // Timeline point with shadow effect
        slide.addShape(pptx.ShapeType.ellipse, {
          x: x - 0.22,
          y: lineY - 0.22,
          w: 0.44,
          h: 0.44,
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

        // Inner circle
        slide.addShape(pptx.ShapeType.ellipse, {
          x: x - 0.12,
          y: lineY - 0.12,
          w: 0.24,
          h: 0.24,
          fill: {
            type: 'solid',
            color: theme.colors.textInverse,
          },
        });

        // Year/date above the line
        slide.addText(item.year, {
          x: x - 0.6,
          y: lineY - 0.9,
          w: 1.2,
          h: 0.5,
          fontSize: theme.fonts.body.size - 2,
          fontFace: theme.fonts.body.face,
          color: theme.colors.primary,
          bold: true,
          align: 'center',
        });

        // Event text below the line
        slide.addText(item.event, {
          x: x - 0.8,
          y: lineY + 0.35,
          w: 1.6,
          h: 1.4,
          fontSize: theme.fonts.caption.size + 1,
          fontFace: theme.fonts.caption.face,
          color: theme.colors.text,
          align: 'center',
          valign: 'top',
        });
      });
    }

    // Image on right side if available
    if (hasImage && slideData.assets?.image?.localPath) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 6.05,
        y: 1.25,
        w: 3.6,
        h: 3.6,
        fill: {
          type: 'solid',
          color: theme.colors.primary,
        },
        shadow: {
          type: 'outer',
          blur: 5,
          offset: 2,
          angle: 45,
          color: '000000',
          opacity: 0.25,
        },
      });

      slide.addImage({
        path: slideData.assets.image.localPath,
        x: 6.1,
        y: 1.3,
        w: 3.5,
        h: 3.5,
      });
    }

    // Slide number
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

    // Bottom accent line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 5.4,
      w: '100%',
      h: 0.1,
      fill: {
        type: 'solid',
        color: theme.colors.primary,
      },
    });

    return slide;
  }
}
