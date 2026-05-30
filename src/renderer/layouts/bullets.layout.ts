import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';
import { SLIDE_W, addContentHeader, addSlideNumber } from './layout.helpers';

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
    const hasImage =
      !!slideData.assets?.image?.localPath &&
      fs.existsSync(slideData.assets.image.localPath);

    slide.background = { color: theme.colors.background };

    const bodyY = addContentHeader(slide, pptx, theme, slideData.title);

    if (hasImage) {
      this.renderWithImage(slide, slideData, theme, pptx, bodyY);
    } else {
      this.renderBulletsOnly(slide, slideData, theme, bodyY);
    }

    addSlideNumber(slide, theme, slideData.slideNumber);
    return slide;
  }

  private renderBulletList(
    slide: PptxGenJS.Slide,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    box: { x: number; y: number; w: number; h: number; fontSize: number },
  ): void {
    if (!slideData.bullets || slideData.bullets.length === 0) return;

    // Cap bullets so a slide never tries to show a wall of text.
    const bullets = slideData.bullets.slice(0, 6);
    // Tighten spacing/size as the bullet count grows to avoid overflow.
    const dense = bullets.length >= 5;
    const fontSize = dense ? box.fontSize - 2 : box.fontSize;

    const bulletTexts = bullets.map((bullet, index) => ({
      text: bullet,
      options: {
        fontSize,
        fontFace: theme.fonts.body.face,
        color: theme.colors.text,
        bullet: { type: 'bullet' as const, color: theme.colors.accent },
        paraSpaceBefore: index === 0 ? 0 : dense ? 6 : 9,
        paraSpaceAfter: 3,
        lineSpacingMultiple: 1.02,
      },
    }));

    slide.addText(bulletTexts, {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      valign: 'top',
      // PowerPoint shrinks the text to fit the box if it still overflows.
      fit: 'shrink',
      shrinkText: true,
    });
  }

  private renderWithImage(
    slide: PptxGenJS.Slide,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    pptx: PptxGenJS,
    bodyY: number,
  ): void {
    this.renderBulletList(slide, slideData, theme, {
      x: 0.55,
      y: bodyY,
      w: 4.95,
      h: 4.95 - bodyY,
      fontSize: theme.fonts.body.size - 1,
    });

    if (slideData.assets?.image?.localPath) {
      const frameX = 5.65;
      const frameY = bodyY;
      const frameW = 3.85;
      const frameH = Math.min(3.4, 4.85 - bodyY);

      slide.addShape(pptx.ShapeType.rect, {
        x: frameX - 0.05,
        y: frameY - 0.05,
        w: frameW + 0.1,
        h: frameH + 0.1,
        fill: { type: 'solid', color: theme.colors.primary },
        line: { type: 'none' },
        shadow: {
          type: 'outer',
          blur: 6,
          offset: 3,
          angle: 45,
          color: '000000',
          opacity: 0.25,
        },
      });
      slide.addImage({
        path: slideData.assets.image.localPath,
        x: frameX,
        y: frameY,
        w: frameW,
        h: frameH,
      });
    }
  }

  private renderBulletsOnly(
    slide: PptxGenJS.Slide,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    bodyY: number,
  ): void {
    this.renderBulletList(slide, slideData, theme, {
      x: 0.6,
      y: bodyY,
      w: SLIDE_W - 1.2,
      h: 4.9 - bodyY,
      fontSize: theme.fonts.body.size + 1,
    });
  }
}
