import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

@Injectable()
export class BulletsLayout implements LayoutRenderer {
  readonly type = 'bullets';

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

    // Title bar
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

    // Left accent stripe
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

    // Title text
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

    // Content layout depends on whether we have an image
    if (hasImage) {
      // Two-column layout: bullets on left, image on right
      this.renderWithImage(slide, slideData, theme, pptx);
    } else {
      // Full-width bullets
      this.renderBulletsOnly(slide, slideData, theme);
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

  private renderWithImage(
    slide: PptxGenJS.Slide,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    pptx: PptxGenJS,
  ): void {
    // Bullets on left side (narrower)
    if (slideData.bullets && slideData.bullets.length > 0) {
      const bulletTexts = slideData.bullets.map((bullet, index) => ({
        text: bullet,
        options: {
          fontSize: theme.fonts.body.size - 2, // Slightly smaller for two-column
          fontFace: theme.fonts.body.face,
          color: theme.colors.text,
          bullet: { type: 'bullet' as const, color: theme.colors.accent },
          paraSpaceBefore: index === 0 ? 0 : 6,
          paraSpaceAfter: 3,
        },
      }));

      slide.addText(bulletTexts, {
        x: 0.4,
        y: 1.2,
        w: 5,
        h: 4,
        valign: 'top',
      });
    }

    // Image on right side with frame effect
    if (slideData.assets?.image?.localPath) {
      // Shadow/frame for image
      slide.addShape(pptx.ShapeType.rect, {
        x: 5.55,
        y: 1.25,
        w: 4.1,
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
          opacity: 0.3,
        },
      });

      // Image
      slide.addImage({
        path: slideData.assets.image.localPath,
        x: 5.6,
        y: 1.3,
        w: 4,
        h: 3.5,
      });

      // Image caption if available
      if (slideData.assets.image.description) {
        slide.addText(slideData.assets.image.description.substring(0, 50), {
          x: 5.6,
          y: 4.85,
          w: 4,
          h: 0.3,
          fontSize: 8,
          fontFace: theme.fonts.caption.face,
          color: theme.colors.textMuted,
          align: 'center',
          italic: true,
        });
      }
    }
  }

  private renderBulletsOnly(
    slide: PptxGenJS.Slide,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
  ): void {
    if (slideData.bullets && slideData.bullets.length > 0) {
      const bulletTexts = slideData.bullets.map((bullet, index) => ({
        text: bullet,
        options: {
          fontSize: theme.fonts.body.size,
          fontFace: theme.fonts.body.face,
          color: theme.colors.text,
          bullet: { type: 'bullet' as const, color: theme.colors.accent },
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
  }
}
