import { Injectable, Logger } from '@nestjs/common';
import { SlideContent } from './content.agent';
import { SlideLayout } from './layout.agent';

export interface SlideWithAssets extends SlideContent {
  layout: SlideLayout;
  assets: {
    iconName?: string;
    iconColor?: string;
    backgroundPattern?: string;
    accentColor?: string;
  };
}

@Injectable()
export class AssetAgent {
  private readonly logger = new Logger(AssetAgent.name);

  private readonly iconMap: Record<string, string[]> = {
    education: ['book', 'graduation-cap', 'school', 'pencil'],
    technology: ['laptop', 'code', 'database', 'cloud'],
    business: ['briefcase', 'chart', 'money', 'building'],
    science: ['flask', 'atom', 'microscope', 'dna'],
    health: ['heart', 'hospital', 'medicine', 'stethoscope'],
    environment: ['leaf', 'globe', 'tree', 'water'],
    social: ['users', 'handshake', 'community', 'network'],
    default: ['star', 'lightbulb', 'target', 'rocket'],
  };

  selectAssets(
    slides: SlideContent[],
    layouts: SlideLayout[],
    theme: 'academic_blue' | 'minimal_white' | 'modern_dark',
  ): SlideWithAssets[] {
    this.logger.log(`Selecting assets for ${slides.length} slides`);

    const topicCategory = this.detectTopicCategory(slides);
    const icons = this.iconMap[topicCategory] || this.iconMap.default;

    return slides.map((slide, index) => {
      const layout = layouts.find((l) => l.slideNumber === slide.slideNumber);

      if (!layout) {
        throw new Error(`Layout not found for slide ${slide.slideNumber}`);
      }

      const slideWithAssets: SlideWithAssets = {
        ...slide,
        layout,
        assets: {
          iconName: layout.hasIcon ? icons[index % icons.length] : undefined,
          iconColor: this.getIconColor(theme),
          backgroundPattern: this.getBackgroundPattern(slide.type, theme),
          accentColor: this.getAccentColor(theme),
        },
      };

      return slideWithAssets;
    });
  }

  private detectTopicCategory(slides: SlideContent[]): string {
    const allText = slides
      .map((s) => {
        const parts = [s.title];
        if (s.bullets) parts.push(...s.bullets);
        if (s.subtitle) parts.push(s.subtitle);
        return parts.join(' ');
      })
      .join(' ')
      .toLowerCase();

    const categories: Record<string, string[]> = {
      education: ['education', 'learning', 'student', 'university', 'school', "ta'lim", 'talim', 'образование'],
      technology: ['technology', 'software', 'computer', 'digital', 'texnologiya', 'технология', 'kompyuter'],
      business: ['business', 'company', 'market', 'finance', 'biznes', 'бизнес', 'moliya'],
      science: ['science', 'research', 'experiment', 'fan', 'наука', 'tadqiqot'],
      health: ["health", "medicine", "medical", "sog'liq", "здоровье", "tibbiyot"],
      environment: ['environment', 'climate', 'nature', 'atrof-muhit', 'экология', 'tabiat'],
      social: ['social', 'society', 'community', 'ijtimoiy', 'социальный', 'jamiyat'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => allText.includes(kw))) {
        return category;
      }
    }

    return 'default';
  }

  private getIconColor(theme: string): string {
    switch (theme) {
      case 'academic_blue':
        return '#1e40af';
      case 'minimal_white':
        return '#374151';
      case 'modern_dark':
        return '#60a5fa';
      default:
        return '#1e40af';
    }
  }

  private getBackgroundPattern(type: string, theme: string): string {
    if (type === 'hero') return 'gradient';
    if (type === 'conclusion') return 'gradient';
    return 'solid';
  }

  private getAccentColor(theme: string): string {
    switch (theme) {
      case 'academic_blue':
        return '#3b82f6';
      case 'minimal_white':
        return '#6b7280';
      case 'modern_dark':
        return '#818cf8';
      default:
        return '#3b82f6';
    }
  }
}
