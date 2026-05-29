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

/** A search hit before download — `key` is a stable id used for dedup. */
interface ImageCandidate {
  key: string;
  url: string;
  width: number;
  height: number;
  description: string;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly storagePath: string;
  private readonly unsplashAccessKey?: string;
  private readonly pexelsApiKey?: string;
  private readonly openrouterApiKey?: string;
  private readonly openrouterImagesEnabled: boolean;
  private readonly generateModel: string;

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
    "dars": "classroom lesson",

    // Academic subjects
    "she'r": "poetry book",
    "shoir": "poet writing",
    "roman": "novel literature",
    "til": "language learning",
    "grammatika": "language study",
    "algebra": "mathematics equations",
    "geometriya": "geometry shapes",
    "geografiya": "geography map world",
    "rassom": "painting art",

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
    this.unsplashAccessKey = this.configService.get<string>('images.unsplashAccessKey');
    this.pexelsApiKey = this.configService.get<string>('images.pexelsApiKey');
    this.openrouterApiKey = this.configService.get<string>('images.openrouterApiKey');
    this.openrouterImagesEnabled =
      this.configService.get<boolean>('images.openrouterEnabled') ?? true;
    this.generateModel =
      this.configService.get<string>('images.generateModel') ||
      'google/gemini-2.5-flash-image';
  }

  /** Whether the paid OpenRouter image-generation fallback is usable. */
  private get openrouterFallbackReady(): boolean {
    return this.openrouterImagesEnabled && !!this.openrouterApiKey;
  }

  /**
   * Find a relevant image for a slide. Hybrid strategy:
   *   1. Free stock search — Unsplash, then Pexels (cost: $0).
   *   2. Fallback — generate an image via OpenRouter (paid, ~per-image cost)
   *      only if no stock key matched and the fallback is enabled.
   * Returns null if nothing is configured / found, in which case the slide
   * renders with gradient/solid backgrounds instead.
   *
   * NOTE: the old `source.unsplash.com` endpoint was retired in 2024.
   */
  async getImageForTopic(
    topic: string,
    slideTitle: string,
    used: Set<string> = new Set(),
  ): Promise<ImageResult | null> {
    const query = this.generateImageKeywords(topic, slideTitle).replace(/,/g, ' ');

    if (!this.unsplashAccessKey && !this.pexelsApiKey && !this.openrouterFallbackReady) {
      this.logger.debug('No image source configured; skipping image fetch.');
      return null;
    }

    // Download the first candidate that hasn't been used in this deck yet,
    // so every slide gets a DISTINCT image even for identical queries.
    const pickUnused = async (
      candidates: ImageCandidate[],
    ): Promise<ImageResult | null> => {
      for (const c of candidates) {
        if (used.has(c.key)) continue;
        const localPath = await this.downloadImage(c.url, this.makeFilename());
        if (!localPath) continue;
        used.add(c.key);
        return {
          url: c.url,
          localPath,
          width: c.width,
          height: c.height,
          description: c.description,
        };
      }
      return null;
    };

    // 1. Free stock first (keeps per-deck cost at zero when keys exist).
    try {
      if (this.unsplashAccessKey) {
        this.logger.log(`Searching Unsplash for: "${query}"`);
        const picked = await pickUnused(await this.searchUnsplash(query));
        if (picked) return picked;
      }
      if (this.pexelsApiKey) {
        this.logger.log(`Searching Pexels for: "${query}"`);
        const picked = await pickUnused(await this.searchPexels(query));
        if (picked) return picked;
      }
    } catch (error) {
      this.logger.warn(`Stock image search failed: ${error}`);
    }

    // 2. Paid OpenRouter generation as a last resort (always unique).
    if (this.openrouterFallbackReady) {
      try {
        this.logger.log(`Generating image via OpenRouter for: "${query}"`);
        const result = await this.generateWithOpenRouter(query, topic, slideTitle);
        if (result) {
          if (result.localPath) used.add(result.localPath);
          return result;
        }
      } catch (error) {
        this.logger.warn(`OpenRouter image generation failed: ${error}`);
      }
    }

    return null;
  }

  /**
   * Generate an academic illustration via OpenRouter's image-capable models
   * (e.g. google/gemini-2.5-flash-image). The image is returned as a base64
   * data URL at choices[0].message.images[0].image_url.url.
   */
  private async generateWithOpenRouter(
    query: string,
    topic: string,
    slideTitle: string,
  ): Promise<ImageResult | null> {
    const prompt =
      `A clean, professional, minimalist educational illustration for an academic ` +
      `presentation slide. Topic: "${topic}". Slide: "${slideTitle}". ` +
      `Subject keywords: ${query}. Flat modern style, soft colors, no text, no words, ` +
      `landscape 16:9, suitable as a slide visual.`;

    const json = await this.httpPostJson(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        Authorization: `Bearer ${this.openrouterApiKey}`,
        'HTTP-Referer': 'https://sliderai.uz',
        'X-Title': 'SliderAI UZ',
      },
      {
        model: this.generateModel,
        modalities: ['image', 'text'],
        messages: [{ role: 'user', content: prompt }],
      },
    );

    const dataUrl: string | undefined =
      json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      this.logger.warn('OpenRouter returned no image data');
      return null;
    }

    const localPath = this.saveDataUrl(dataUrl);
    if (!localPath) return null;

    return {
      url: dataUrl.substring(0, 64) + '...',
      localPath,
      width: 1024,
      height: 576,
      description: `AI: ${query}`,
    };
  }

  /** Decode a base64 data URL and write it to the images directory. */
  private saveDataUrl(dataUrl: string): string | null {
    try {
      const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
      if (!match) return null;
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');

      const imagesDir = path.join(this.storagePath, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      const localPath = path.join(
        imagesDir,
        `gen_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.${ext}`,
      );
      fs.writeFileSync(localPath, buffer);
      this.logger.log(`Saved generated image to: ${localPath}`);
      return localPath;
    } catch (error) {
      this.logger.error(`Failed to save generated image: ${error}`);
      return null;
    }
  }

  /** Search Unsplash (official API) — returns a pool of landscape candidates. */
  private async searchUnsplash(query: string): Promise<ImageCandidate[]> {
    const url =
      `https://api.unsplash.com/search/photos?per_page=15&orientation=landscape` +
      `&content_filter=high&query=${encodeURIComponent(query)}`;

    const json = await this.httpGetJson(url, {
      Authorization: `Client-ID ${this.unsplashAccessKey}`,
      'Accept-Version': 'v1',
    });

    const results: any[] = Array.isArray(json?.results) ? json.results : [];
    return results
      .filter((p) => p?.urls?.regular)
      .map((p) => ({
        key: `unsplash:${p.id}`,
        url: p.urls.regular,
        width: p.width || 1080,
        height: p.height || 720,
        description: p.alt_description || query,
      }));
  }

  /** Search Pexels (official API) — returns a pool of landscape candidates. */
  private async searchPexels(query: string): Promise<ImageCandidate[]> {
    const url =
      `https://api.pexels.com/v1/search?per_page=15&orientation=landscape` +
      `&query=${encodeURIComponent(query)}`;

    const json = await this.httpGetJson(url, {
      Authorization: this.pexelsApiKey as string,
    });

    const photos: any[] = Array.isArray(json?.photos) ? json.photos : [];
    return photos
      .filter((p) => p?.src?.large || p?.src?.medium)
      .map((p) => ({
        key: `pexels:${p.id}`,
        url: p.src.large || p.src.medium,
        width: p.width || 1080,
        height: p.height || 720,
        description: p.alt || query,
      }));
  }

  private makeFilename(): string {
    return `slide_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.jpg`;
  }

  /** Minimal HTTPS GET returning parsed JSON, with auth headers. */
  private httpGetJson(url: string, headers: Record<string, string>): Promise<any> {
    return new Promise((resolve, reject) => {
      https
        .get(url, { headers }, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode} for ${url}`));
              return;
            }
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch (err) {
              reject(err);
            }
          });
        })
        .on('error', reject);
    });
  }

  /** Minimal HTTPS POST with a JSON body, returning parsed JSON. */
  private httpPostJson(
    url: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<any> {
    const payload = JSON.stringify(body);
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const req = https.request(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            ...headers,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            if (res.statusCode && res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 200)}`));
              return;
            }
            try {
              resolve(JSON.parse(text));
            } catch (err) {
              reject(err);
            }
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
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
    const used = new Set<string>();

    for (let i = 0; i < limitedSlides.length; i++) {
      try {
        // Add small delay to avoid rate limiting
        if (i > 0) {
          await this.delay(500);
        }

        const image = await this.getImageForTopic(topic, limitedSlides[i], used);
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
