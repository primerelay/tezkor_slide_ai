import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';

@Scene('generation')
export class GenerationScene {
  constructor(private readonly telegramService: TelegramService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(i18n.t('confirmGeneration'), {
      parse_mode: 'HTML',
      reply_markup: InlineKeyboards.confirmGeneration(i18n),
    });
  }

  @Action('confirm_generation')
  async onConfirm(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    if (user.credits < 1) {
      await ctx.answerCbQuery(i18n.t('insufficientCredits'), { show_alert: true });
      return;
    }

    const { topic, slideCount, theme, language } = ctx.session;

    if (!topic || !slideCount || !theme) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      return;
    }

    await this.telegramService.deductCredits(user.id, 1);

    const presentation = await this.telegramService.createPresentation({
      userId: user.id,
      topic,
      slideCount,
      theme,
      language: language || 'uz',
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('generationStarted'));

    await ctx.reply(
      i18n.t('generationQueued', { id: presentation.id.substring(0, 8) }),
      { parse_mode: 'HTML' },
    );

    ctx.session.topic = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;

    await ctx.scene.leave();
  }

  @Action('cancel_generation')
  async onCancel(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    ctx.session.topic = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('generationCancelled'));

    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.mainMenu(i18n),
    });

    await ctx.scene.leave();
  }
}
