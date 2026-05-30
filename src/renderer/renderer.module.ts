import { Module } from '@nestjs/common';
import { RendererService } from './renderer.service';
import { HeroLayout } from './layouts/hero.layout';
import { BulletsLayout } from './layouts/bullets.layout';
import { TimelineLayout } from './layouts/timeline.layout';
import { ComparisonLayout } from './layouts/comparison.layout';
import { StatisticsLayout } from './layouts/statistics.layout';
import { QuoteLayout } from './layouts/quote.layout';
import { ConclusionLayout } from './layouts/conclusion.layout';
import { RejaLayout } from './layouts/reja.layout';
import { ChartLayout } from './layouts/chart.layout';
// Themes are data-driven (see themes/theme-catalog.ts) — no per-theme providers.

@Module({
  providers: [
    RendererService,
    HeroLayout,
    BulletsLayout,
    TimelineLayout,
    ComparisonLayout,
    StatisticsLayout,
    QuoteLayout,
    ConclusionLayout,
    RejaLayout,
    ChartLayout,
  ],
  exports: [RendererService],
})
export class RendererModule {}
