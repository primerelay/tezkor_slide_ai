import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  Length,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type SlideType =
  | 'hero'
  | 'bullets'
  | 'timeline'
  | 'comparison'
  | 'statistics'
  | 'quote'
  | 'conclusion';

export type PresentationTheme =
  | 'academic_blue'
  | 'minimal_white'
  | 'modern_dark';

export type PresentationLanguage = 'uz' | 'ru' | 'en';

export class TimelineItemDto {
  @IsString()
  year: string;

  @IsString()
  event: string;
}

export class ComparisonDataDto {
  @IsString()
  leftTitle: string;

  @IsString()
  rightTitle: string;

  @IsArray()
  @IsString({ each: true })
  leftItems: string[];

  @IsArray()
  @IsString({ each: true })
  rightItems: string[];
}

export class StatisticItemDto {
  @IsString()
  value: string;

  @IsString()
  label: string;
}

export class QuoteDataDto {
  @IsString()
  text: string;

  @IsString()
  author: string;
}

export class SlideDto {
  @IsNumber()
  slideNumber: number;

  @IsEnum([
    'hero',
    'bullets',
    'timeline',
    'comparison',
    'statistics',
    'quote',
    'conclusion',
  ])
  type: SlideType;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bullets?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineItemDto)
  @IsOptional()
  timeline?: TimelineItemDto[];

  @ValidateNested()
  @Type(() => ComparisonDataDto)
  @IsOptional()
  comparison?: ComparisonDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatisticItemDto)
  @IsOptional()
  statistics?: StatisticItemDto[];

  @ValidateNested()
  @Type(() => QuoteDataDto)
  @IsOptional()
  quote?: QuoteDataDto;

  @IsString()
  @IsOptional()
  speakerNotes?: string;
}

export class CreatePresentationDto {
  @IsString()
  @Length(5, 500)
  topic: string;

  @IsNumber()
  @Min(4)
  @Max(20)
  slideCount: number;

  @IsEnum(['academic_blue', 'minimal_white', 'modern_dark'])
  theme: PresentationTheme;

  @IsEnum(['uz', 'ru', 'en'])
  language: PresentationLanguage;
}

export class PresentationOutputDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  subtitle: string;

  @IsEnum(['academic_blue', 'minimal_white', 'modern_dark'])
  theme: PresentationTheme;

  @IsEnum(['uz', 'ru', 'en'])
  language: PresentationLanguage;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideDto)
  slides: SlideDto[];
}
