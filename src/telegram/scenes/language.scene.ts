import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';

@Scene('language')
export class LanguageScene {
  constructor(private readonly telegramService: TelegramService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(i18n.t('selectLanguage'), {
      reply_markup: InlineKeyboards.languageSelection(),
    });
  }

  @Action(/^lang_(.+)$/)
  async onLanguageSelect(@Ctx() ctx: BotContext) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const language = callbackQuery.data.replace('lang_', '') as
      | 'uz'
      | 'ru'
      | 'en';
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    await this.telegramService.updateUserLanguage(
      telegramUser.id.toString(),
      language,
    );
    ctx.session.language = language;

    const i18n = this.telegramService.getI18n(language);

    await ctx.answerCbQuery(i18n.t('languageChanged'));
    await ctx.editMessageText(i18n.t('languageSet'), { parse_mode: 'HTML' });

    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.mainMenu(i18n),
    });

    await ctx.scene.leave();
  }
}
