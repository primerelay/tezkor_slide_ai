import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OutlineAgent } from './agents/outline.agent';
import { ContentAgent } from './agents/content.agent';
import { LayoutAgent } from './agents/layout.agent';
import { AssetAgent } from './agents/asset.agent';
import { ImageService } from './services/image.service';
import { PresentationPipeline } from './pipeline/presentation.pipeline';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiProvider,
    OpenRouterProvider,
    AnthropicProvider,
    OutlineAgent,
    ContentAgent,
    LayoutAgent,
    AssetAgent,
    ImageService,
    PresentationPipeline,
  ],
  exports: [PresentationPipeline, GeminiProvider, ImageService],
})
export class AiModule {}
