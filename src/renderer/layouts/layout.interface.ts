import PptxGenJS from 'pptxgenjs';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';

export interface PresentationMeta {
  studentName?: string;
  teacherName?: string;
}

export interface LayoutRenderer {
  readonly type: string;
  render(
    pptx: PptxGenJS,
    slide: SlideWithAssets,
    theme: ThemeConfig,
    presentationMeta?: PresentationMeta,
  ): PptxGenJS.Slide;
}

export interface TextOptions {
  x: number | string;
  y: number | string;
  w: number | string;
  h: number | string;
  fontSize: number;
  fontFace: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  bullet?: boolean | { type: string; code: string };
  breakLine?: boolean;
  lineSpacing?: number;
  paraSpaceBefore?: number;
  paraSpaceAfter?: number;
}
