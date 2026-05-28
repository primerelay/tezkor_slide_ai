import { Injectable } from '@nestjs/common';
import uz from './uz.json';
import ru from './ru.json';
import en from './en.json';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;
type TranslationValue = string | Record<string, unknown>;
type TranslationDict = Record<string, TranslationValue>;

const translations: Record<string, TranslationDict> = {
  uz: uz as TranslationDict,
  ru: ru as TranslationDict,
  en: en as TranslationDict,
};

@Injectable()
export class I18nService {
  private readonly language: string;

  constructor(language: string = 'uz') {
    this.language = language;
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    const keys = key.split('.');
    let value: unknown = translations[this.language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = translations['en'];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = (value as Record<string, unknown>)[fallbackKey];
          } else {
            return key;
          }
        }
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }

  private interpolate(template: string, params: TranslationParams): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() ?? match;
    });
  }

  getLanguage(): string {
    return this.language;
  }

  static getSupportedLanguages(): string[] {
    return ['uz', 'ru', 'en'];
  }
}

export default I18nService;
