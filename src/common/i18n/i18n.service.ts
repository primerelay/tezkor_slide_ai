import { Injectable } from '@nestjs/common';
import uz from './uz.json';
import ru from './ru.json';
import en from './en.json';
import de from './de.json';
import tr from './tr.json';
import kk from './kk.json';
import ar from './ar.json';
import ko from './ko.json';
import uzc from './uzc.json';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;
type TranslationValue = string | Record<string, unknown>;
type TranslationDict = Record<string, TranslationValue>;

export type SupportedLanguage = 'uz' | 'ru' | 'en' | 'de' | 'tr' | 'kk' | 'ar' | 'ko' | 'uzc';

const translations: Record<SupportedLanguage, TranslationDict> = {
  uz: uz as TranslationDict,
  ru: ru as TranslationDict,
  en: en as TranslationDict,
  de: de as TranslationDict,
  tr: tr as TranslationDict,
  kk: kk as TranslationDict,
  ar: ar as TranslationDict,
  ko: ko as TranslationDict,
  uzc: uzc as TranslationDict,
};

@Injectable()
export class I18nService {
  private language: SupportedLanguage;

  constructor(language: SupportedLanguage = 'uz') {
    this.language = language;
  }

  /**
   * Create a new I18nService instance with the specified language
   */
  static create(language: SupportedLanguage = 'uz'): I18nService {
    return new I18nService(language);
  }

  /**
   * Set the current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.language = language;
  }

  /**
   * Get translation by key with optional parameter interpolation
   */
  t(key: TranslationKey, params?: TranslationParams): string {
    const keys = key.split('.');
    let value: unknown = translations[this.language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // Fallback to English
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

  getLanguage(): SupportedLanguage {
    return this.language;
  }

  /**
   * Get all supported languages
   */
  static getSupportedLanguages(): SupportedLanguage[] {
    return ['uz', 'uzc', 'ru', 'en', 'tr', 'kk', 'ar', 'ko', 'de'];
  }

  /**
   * Get language display names
   */
  static getLanguageNames(): Record<SupportedLanguage, string> {
    return {
      uz: "🇺🇿 O'zbekcha",
      uzc: '🇺🇿 Ўзбекча',
      ru: '🇷🇺 Русский',
      en: '🇬🇧 English',
      tr: '🇹🇷 Türkçe',
      kk: '🇰🇿 Қазақша',
      ar: '🇸🇦 العربية',
      ko: '🇰🇷 한국어',
      de: '🇩🇪 Deutsch',
    };
  }

  /**
   * Check if a language is supported
   */
  static isSupported(lang: string): lang is SupportedLanguage {
    return ['uz', 'uzc', 'ru', 'en', 'de', 'tr', 'kk', 'ar', 'ko'].includes(lang);
  }

  /**
   * Get progress message for a specific percentage
   */
  getProgressMessage(progress: number): { emoji: string; text: string } {
    const progressKey = progress.toString();
    const text = this.t(`progress.${progressKey}`);

    // Extract emoji from the beginning of the text
    const emojiMatch = text.match(/^(\p{Emoji})/u);
    const emoji = emojiMatch ? emojiMatch[1] : '⏳';
    const cleanText = text.replace(/^\p{Emoji}\s*/u, '');

    return { emoji, text: cleanText || text };
  }

  /**
   * Get presentation-specific translation
   */
  getPresentationText(key: string): string {
    return this.t(`presentation.${key}`);
  }
}

export default I18nService;
