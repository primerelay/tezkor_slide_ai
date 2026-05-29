import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

export interface ImageResult {
  url: string;
  localPath?: string;
  width: number;
  height: number;
  description?: string;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly storagePath: string;

  // Uzbek to English translation map for better image search
  private readonly uzbekToEnglish: Record<string, string> = {
    // Education
    "ta'lim": "education",
    "talim": "education",
    "maktab": "school",
    "universitet": "university",
    "o'qituvchi": "teacher",
    "talaba": "student",
    "kitob": "books",

    // History
    "tarix": "history ancient",
    "qadimgi": "ancient civilization",
    "temuriylar": "medieval asia",
    "amir temur": "medieval warrior",
    "samarqand": "samarkand architecture",
    "buxoro": "bukhara architecture",
    "ipak yo'li": "silk road trade",

    // Science
    "fan": "science research",
    "fizika": "physics laboratory",
    "kimyo": "chemistry laboratory",
    "biologiya": "biology nature",
    "matematika": "mathematics",
    "astronomiya": "astronomy stars",

    // Technology
    "texnologiya": "technology innovation",
    "kompyuter": "computer technology",
    "dasturlash": "programming code",
    "sun'iy intellekt": "artificial intelligence",
    "robototexnika": "robotics",
    "internet": "internet network",

    // Nature & Environment
    "tabiat": "nature landscape",
    "ekologiya": "ecology environment",
    "atrof-muhit": "environment green",
    "hayvonlar": "animals wildlife",
    "o'simliklar": "plants botanical",

    // Health
    "tibbiyot": "medicine health",
    "sog'liq": "health wellness",
    "shifoxona": "hospital medical",

    // Economy & Business
    "iqtisod": "economy business",
    "biznes": "business office",
    "moliya": "finance money",
    "savdo": "trade commerce",

    // Culture & Art
    "madaniyat": "culture tradition",
    "san'at": "art creative",
    "musiqa": "music instruments",
    "adabiyot": "literature books",
    "arxitektura": "architecture building",

    // Society
    "jamiyat": "society community",
    "oila": "family people",
    "sport": "sports athletics",
    "sayohat": "travel tourism",

    // O'zbekiston
    "o'zbekiston": "uzbekistan central asia",
    "toshkent": "tashkent city",
    "farg'ona": "fergana valley",
    "xorazm": "khiva architecture",
  };

  constructor(private readonly configService: ConfigService) {
    this.storagePath = this.configService.get<string>('storage.path') || './storage';
  }

  /**
   * Get image URL using free Unsplash Source API (no API key needed)
   */
  async getImageForTopic(topic: string, slideTitle: string): Promise<ImageResult | null> {
    try {
      const keywords = this.generateImageKeywords(topic, slideTitle);
      this.logger.log(`Searching free image for: ${keywords}`);

      // Use Unsplash Source - completely free, no API key
      const encodedKeywords = encodeURIComponent(keywords);
      const imageUrl = `https://source.unsplash.com/800x600/?${encodedKeywords}`;

      // Download the image
      const filename = `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const localPath = await this.downloadImage(imageUrl, filename);

      if (localPath) {
        return {
          url: imageUrl,
          localPath,
          width: 800,
          height: 600,
          description: keywords,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to get image: ${error}`);
      return null;
    }
  }

  /**
   * Get multiple images for slides
   */
  async getImagesForSlides(
    topic: string,
    slideTitles: string[],
    maxImages: number = 5,
  ): Promise<Map<number, ImageResult>> {
    const imageMap = new Map<number, ImageResult>();
    const limitedSlides = slideTitles.slice(0, maxImages);

    for (let i = 0; i < limitedSlides.length; i++) {
      try {
        // Add small delay to avoid rate limiting
        if (i > 0) {
          await this.delay(500);
        }

        const image = await this.getImageForTopic(topic, limitedSlides[i]);
        if (image) {
          imageMap.set(i, image);
          this.logger.log(`Image ${i + 1}/${limitedSlides.length} downloaded`);
        }
      } catch (error) {
        this.logger.warn(`Failed to get image for slide ${i}: ${error}`);
      }
    }

    return imageMap;
  }

  /**
   * Download image from URL to local storage
   */
  async downloadImage(imageUrl: string, filename: string): Promise<string | null> {
    const imagesDir = path.join(this.storagePath, 'images');

    // Ensure directory exists
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const localPath = path.join(imagesDir, filename);

    return new Promise((resolve) => {
      const downloadWithRedirect = (url: string, redirectCount: number = 0) => {
        if (redirectCount > 5) {
          this.logger.warn('Too many redirects');
          resolve(null);
          return;
        }

        const protocol = url.startsWith('https') ? https : require('http');

        protocol.get(url, (response: any) => {
          // Handle redirects (Unsplash Source uses redirects)
          if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
            const redirectUrl = response.headers.location;
            if (redirectUrl) {
              this.logger.debug(`Redirecting to: ${redirectUrl}`);
              downloadWithRedirect(redirectUrl, redirectCount + 1);
              return;
            }
          }

          if (response.statusCode !== 200) {
            this.logger.warn(`Failed to download image: HTTP ${response.statusCode}`);
            resolve(null);
            return;
          }

          const file = fs.createWriteStream(localPath);
          response.pipe(file);

          file.on('finish', () => {
            file.close();
            this.logger.log(`Downloaded image to: ${localPath}`);
            resolve(localPath);
          });

          file.on('error', (err: Error) => {
            fs.unlink(localPath, () => {});
            this.logger.error(`File write error: ${err.message}`);
            resolve(null);
          });
        }).on('error', (err: Error) => {
          this.logger.error(`Download error: ${err.message}`);
          resolve(null);
        });
      };

      downloadWithRedirect(imageUrl);
    });
  }

  /**
   * Generate search keywords from topic for better image results
   */
  generateImageKeywords(topic: string, slideTitle: string): string {
    // Combine topic and slide title
    const combined = `${topic} ${slideTitle}`.toLowerCase();

    // Find matching Uzbek words and translate to English
    const englishKeywords: string[] = [];

    for (const [uzbek, english] of Object.entries(this.uzbekToEnglish)) {
      if (combined.includes(uzbek)) {
        englishKeywords.push(english);
      }
    }

    // If we found translations, use them
    if (englishKeywords.length > 0) {
      return englishKeywords.slice(0, 3).join(',');
    }

    // Otherwise, extract meaningful words
    const stopWords = [
      "va", "yoki", "bu", "shu", "o'z", "bo'lgan", "uchun", "bilan",
      "ning", "dan", "ga", "da", "lar", "ni",
      "и", "или", "это", "для", "что", "как",
      "the", "a", "an", "is", "are", "was", "were", "for", "with"
    ];

    const words = combined
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 3);

    // Default to generic academic images if nothing found
    if (words.length === 0) {
      return 'education,academic,presentation';
    }

    return words.join(',');
  }

  /**
   * Get category-based fallback image
   */
  getCategoryImage(category: string): string {
    const categoryImages: Record<string, string> = {
      education: 'education,learning,school',
      technology: 'technology,computer,digital',
      business: 'business,office,corporate',
      science: 'science,laboratory,research',
      health: 'health,medicine,medical',
      environment: 'nature,environment,green',
      history: 'history,ancient,museum',
      culture: 'culture,art,tradition',
      default: 'presentation,abstract,minimal',
    };

    return categoryImages[category] || categoryImages.default;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
