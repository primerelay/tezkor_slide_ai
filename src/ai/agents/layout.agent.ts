import { Injectable, Logger } from '@nestjs/common';
import { SlideContent } from './content.agent';

export interface SlideLayout {
  slideNumber: number;
  type: string;
  layoutVariant: 'centered' | 'left-aligned' | 'split' | 'grid';
  hasIcon: boolean;
  iconPosition?: 'left' | 'right' | 'top';
  contentAlignment: 'center' | 'left' | 'right';
  emphasisStyle: 'none' | 'highlight' | 'underline' | 'box';
}

@Injectable()
export class LayoutAgent {
  private readonly logger = new Logger(LayoutAgent.name);

  classifyLayouts(slides: SlideContent[]): SlideLayout[] {
    this.logger.log(`Classifying layouts for ${slides.length} slides`);

    return slides.map((slide) => this.classifySlideLayout(slide));
  }

  private classifySlideLayout(slide: SlideContent): SlideLayout {
    const layout: SlideLayout = {
      slideNumber: slide.slideNumber,
      type: slide.type,
      layoutVariant: 'centered',
      hasIcon: false,
      contentAlignment: 'center',
      emphasisStyle: 'none',
    };

    switch (slide.type) {
      case 'hero':
        layout.layoutVariant = 'centered';
        layout.contentAlignment = 'center';
        layout.emphasisStyle = 'none';
        break;

      case 'bullets':
        layout.layoutVariant = 'left-aligned';
        layout.contentAlignment = 'left';
        layout.hasIcon = true;
        layout.iconPosition = 'left';
        layout.emphasisStyle = 'highlight';
        break;

      case 'timeline':
        layout.layoutVariant = 'centered';
        layout.contentAlignment = 'center';
        layout.hasIcon = true;
        layout.iconPosition = 'left';
        break;

      case 'comparison':
        layout.layoutVariant = 'split';
        layout.contentAlignment = 'center';
        layout.emphasisStyle = 'box';
        break;

      case 'statistics':
        layout.layoutVariant = 'grid';
        layout.contentAlignment = 'center';
        layout.emphasisStyle = 'highlight';
        break;

      case 'quote':
        layout.layoutVariant = 'centered';
        layout.contentAlignment = 'center';
        layout.emphasisStyle = 'none';
        break;

      case 'conclusion':
        layout.layoutVariant = 'centered';
        layout.contentAlignment = 'center';
        layout.hasIcon = true;
        layout.iconPosition = 'top';
        break;

      default:
        layout.layoutVariant = 'left-aligned';
        layout.contentAlignment = 'left';
    }

    return layout;
  }
}
