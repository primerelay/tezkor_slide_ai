import { Injectable } from '@nestjs/common';
import PptxGenJS from 'pptxgenjs';
import { LayoutRenderer, PresentationMeta } from './layout.interface';
import { ThemeConfig } from '../themes/theme.interface';
import { SlideWithAssets } from '../../ai/agents/asset.agent';
import { SLIDE_W, addContentHeader, addSlideNumber, lightenColor } from './layout.helpers';

interface ChartData {
  data?: { label: string; value: number }[];
  chartType?: 'bar' | 'pie' | 'line';
}

@Injectable()
export class ChartLayout implements LayoutRenderer {
  readonly type = 'chart';

  render(
    pptx: PptxGenJS,
    slideData: SlideWithAssets,
    theme: ThemeConfig,
    _presentationMeta?: PresentationMeta,
  ): PptxGenJS.Slide {
    const slide = pptx.addSlide();
    slide.background = { color: theme.colors.background };

    const bodyY = addContentHeader(slide, pptx, theme, slideData.title);

    const chart = ((slideData as unknown) as { chart?: ChartData }).chart || {};
    const points = (chart.data || []).filter((d) => d && d.label !== undefined);

    if (points.length === 0) {
      slide.addText('—', {
        x: 0.6,
        y: bodyY,
        w: SLIDE_W - 1.2,
        h: 1,
        fontSize: theme.fonts.body.size,
        color: theme.colors.textMuted,
        align: 'center',
      });
      addSlideNumber(slide, theme, slideData.slideNumber);
      return slide;
    }

    const labels = points.map((d) => String(d.label));
    const values = points.map((d) => Number(d.value) || 0);

    const typeMap = {
      bar: pptx.ChartType.bar,
      pie: pptx.ChartType.pie,
      line: pptx.ChartType.line,
    } as const;
    const chartType = typeMap[chart.chartType || 'bar'];

    const palette = [
      theme.colors.primary,
      theme.colors.accent,
      theme.colors.secondary,
      lightenColor(theme.colors.primary, 25),
      lightenColor(theme.colors.accent, 20),
      theme.colors.success,
    ];

    slide.addChart(
      chartType,
      [{ name: slideData.title || 'Data', labels, values }],
      {
        x: 0.6,
        y: bodyY,
        w: SLIDE_W - 1.2,
        h: 4.9 - bodyY,
        chartColors: palette,
        showLegend: chart.chartType === 'pie',
        legendPos: 'b',
        legendColor: theme.colors.text,
        showValue: chart.chartType !== 'pie',
        dataLabelColor: chart.chartType === 'pie' ? theme.colors.textInverse : theme.colors.text,
        dataLabelFontFace: theme.fonts.body.face,
        dataLabelFontSize: 11,
        showTitle: false,
        catAxisLabelColor: theme.colors.text,
        valAxisLabelColor: theme.colors.textMuted,
        catAxisLabelFontFace: theme.fonts.body.face,
        valAxisLabelFontFace: theme.fonts.body.face,
        catAxisLabelFontSize: 11,
        valAxisLabelFontSize: 10,
        barDir: 'col',
      },
    );

    addSlideNumber(slide, theme, slideData.slideNumber);
    return slide;
  }
}
