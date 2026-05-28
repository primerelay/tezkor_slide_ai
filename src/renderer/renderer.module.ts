import { Module } from '@nestjs/common';
import { RendererService } from './renderer.service';
import { HeroLayout } from './layouts/hero.layout';
import { BulletsLayout } from './layouts/bullets.layout';
import { TimelineLayout } from './layouts/timeline.layout';
import { ComparisonLayout } from './layouts/comparison.layout';
import { StatisticsLayout } from './layouts/statistics.layout';
import { QuoteLayout } from './layouts/quote.layout';
import { ConclusionLayout } from './layouts/conclusion.layout';
import { AcademicBlueTheme } from './themes/academic-blue.theme';
import { MinimalWhiteTheme } from './themes/minimal-white.theme';
import { ModernDarkTheme } from './themes/modern-dark.theme';

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
    AcademicBlueTheme,
    MinimalWhiteTheme,
    ModernDarkTheme,
  ],
  exports: [RendererService],
})
export class RendererModule {}
