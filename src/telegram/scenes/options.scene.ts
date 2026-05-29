import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { normalizeTheme } from '../../renderer/themes/theme-registry';

@Scene('options')
export class OptionsScene {
  constructor(private readonly telegramService: TelegramService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(i18n.t('selectSlideCount'), {
      reply_markup: InlineKeyboards.slideCountSelection(i18n),
    });
  }

  @Action(/^slides_(\d+)$/)
  async onSlideCount(@Ctx() ctx: BotContext) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const slideCount = parseInt(callbackQuery.data.replace('slides_', ''), 10);
    ctx.session.slideCount = slideCount;

    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('slideCountSelected', { count: slideCount }),
    );

    await ctx.reply(i18n.t('selectTheme'), {
      reply_markup: InlineKeyboards.themeSelection(i18n),
    });
  }

  @Action(/^theme_(.+)$/)
  async onThemeSelect(@Ctx() ctx: BotContext) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const theme = normalizeTheme(callbackQuery.data.replace('theme_', ''));
    ctx.session.theme = theme;

    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('themeSelected', { theme: i18n.t(`themes.${theme}`) }));

    await ctx.reply(i18n.t('confirmGeneration'), {
      parse_mode: 'HTML',
      reply_markup: InlineKeyboards.confirmGeneration(i18n),
    });

    await ctx.scene.leave();
  }
}
