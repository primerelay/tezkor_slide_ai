import { Scene, SceneEnter, Ctx, On } from 'nestjs-telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';

@Scene('topic')
export class TopicScene {
  constructor(private readonly telegramService: TelegramService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(i18n.t('enterTopic'), { parse_mode: 'HTML' });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text;
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    if (text.startsWith('/')) {
      await ctx.scene.leave();
      return;
    }

    if (text.length < 5) {
      await ctx.reply(i18n.t('topicTooShort'));
      return;
    }

    if (text.length > 500) {
      await ctx.reply(i18n.t('topicTooLong'));
      return;
    }

    ctx.session.topic = text;

    await ctx.reply(i18n.t('topicReceived', { topic: text }), {
      parse_mode: 'HTML',
    });

    await ctx.reply(i18n.t('selectSlideCount'), {
      reply_markup: InlineKeyboards.slideCountSelection(i18n),
    });

    await ctx.scene.leave();
  }
}
