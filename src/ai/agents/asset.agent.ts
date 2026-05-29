import { Injectable, Logger } from '@nestjs/common';
import { SlideContent } from './content.agent';
import { SlideLayout } from './layout.agent';
import { ImageService, ImageResult } from '../services/image.service';

export interface SlideWithAssets extends SlideContent {
  layout: SlideLayout;
  assets: {
    iconName?: string;
    iconColor?: string;
    backgroundPattern?: string;
    accentColor?: string;
    image?: ImageResult;
  };
}

@Injectable()
export class AssetAgent {
  private readonly logger = new Logger(AssetAgent.name);

  constructor(private readonly imageService: ImageService) {}

  private readonly iconMap: Record<string, string[]> = {
    education: ['book', 'graduation-cap', 'school', 'pencil'],
    technology: ['laptop', 'code', 'database', 'cloud'],
    business: ['briefcase', 'chart', 'money', 'building'],
    science: ['flask', 'atom', 'microscope', 'dna'],
    health: ['heart', 'hospital', 'medicine', 'stethoscope'],
    environment: ['leaf', 'globe', 'tree', 'water'],
    social: ['users', 'handshake', 'community', 'network'],
    history: ['scroll', 'castle', 'monument', 'crown'],
    default: ['star', 'lightbulb', 'target', 'rocket'],
  };

  async selectAssets(
    slides: SlideContent[],
    layouts: SlideLayout[],
    theme: 'academic_blue' | 'minimal_white' | 'modern_dark',
    topic: string,
  ): Promise<SlideWithAssets[]> {
    this.logger.log(`Selecting assets for ${slides.length} slides`);

    const topicCategory = this.detectTopicCategory(slides);
    const icons = this.iconMap[topicCategory] || this.iconMap.default;

    // Get slides that need images (not hero, reja, or conclusion)
    const contentSlides = slides.filter(
      (s) => !['hero', 'reja', 'conclusion'].includes(s.type)
    );

    // Fetch images for content slides (max 5 to avoid rate limiting)
    const slideTitles = contentSlides.map(s => s.title);
    const imageMap = await this.fetchImagesForSlides(topic, contentSlides);

    return slides.map((slide, index) => {
      const layout = layouts.find((l) => l.slideNumber === slide.slideNumber);

      if (!layout) {
        throw new Error(`Layout not found for slide ${slide.slideNumber}`);
      }

      // Find image for this slide if it's a content slide
      const slideImage = imageMap.get(slide.slideNumber);

      const slideWithAssets: SlideWithAssets = {
        ...slide,
        layout,
        assets: {
          iconName: layout.hasIcon ? icons[index % icons.length] : undefined,
          iconColor: this.getIconColor(theme),
          backgroundPattern: this.getBackgroundPattern(slide.type, theme),
          accentColor: this.getAccentColor(theme),
          image: slideImage,
        },
      };

      return slideWithAssets;
    });
  }

  private async fetchImagesForSlides(
    topic: string,
    slides: SlideContent[],
  ): Promise<Map<number, ImageResult>> {
    const imageMap = new Map<number, ImageResult>();

    // Limit to 5 images to avoid rate limiting
    const slidesToProcess = slides.slice(0, 5);

    this.logger.log(`Fetching ${slidesToProcess.length} images from free sources...`);

    for (const slide of slidesToProcess) {
      try {
        const image = await this.imageService.getImageForTopic(topic, slide.title);

        if (image) {
          imageMap.set(slide.slideNumber, image);
          this.logger.log(`✓ Image found for slide ${slide.slideNumber}: ${slide.title}`);
        }

        // Small delay between requests
        await this.delay(300);
      } catch (error) {
        this.logger.warn(`Failed to fetch image for slide ${slide.slideNumber}: ${error}`);
      }
    }

    this.logger.log(`Total images fetched: ${imageMap.size}`);
    return imageMap;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      education: ['education', 'learning', 'student', 'university', 'school', "ta'lim", 'talim', 'maktab', 'образование'],
      technology: ['technology', 'software', 'computer', 'digital', 'texnologiya', 'технология', 'kompyuter', 'dastur'],
      business: ['business', 'company', 'market', 'finance', 'biznes', 'бизнес', 'moliya', 'iqtisod'],
      science: ['science', 'research', 'experiment', 'fan', 'наука', 'tadqiqot', 'fizika', 'kimyo'],
      health: ["health", "medicine", "medical", "sog'liq", "здоровье", "tibbiyot", "shifoxona"],
      environment: ['environment', 'climate', 'nature', 'atrof-muhit', 'экология', 'tabiat', 'ekologiya'],
      history: ['tarix', 'history', 'qadimgi', 'temur', 'история', 'ancient', 'civilization'],
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
