import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { TranslatorService, TRANSLATE_MAX_CHARS } from '../../translator/translator.service';

const LANG_BUTTONS: { code: string; label: string }[] = [
  { code: 'uz', label: "🇺🇿 O'zbekcha" },
  { code: 'ru', label: '🇷🇺 Ruscha' },
  { code: 'en', label: '🇬🇧 Inglizcha' },
  { code: 'de', label: '🇩🇪 Nemischa' },
];

@Scene('translator-create')
export class TranslatorCreateScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly translatorService: TranslatorService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    ctx.session.translateTarget = undefined;
    await ctx.reply(i18n.t('translator.selectTarget'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(
        LANG_BUTTONS.map((l) => [Markup.button.callback(l.label, `tr_lang_${l.code}`)]),
      ).reply_markup,
    });
  }

  @Action(/tr_lang_(\w+)/)
  async onLang(@Ctx() ctx: any) {
    const code = ctx.match[1];
    ctx.session.translateTarget = code;
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('translator.enterText', { max: TRANSLATE_MAX_CHARS, price: this.translatorService.getPrice().toLocaleString() }),
      { parse_mode: 'HTML' },
    );
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;
    const text = message.text;
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    if (text === '/cancel') {
      await ctx.reply(i18n.t('translator.cancelled'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
      await ctx.scene.leave();
      return;
    }

    if (!ctx.session.translateTarget) {
      await ctx.reply(i18n.t('translator.selectTarget'), {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard(
          LANG_BUTTONS.map((l) => [Markup.button.callback(l.label, `tr_lang_${l.code}`)]),
        ).reply_markup,
      });
      return;
    }

    const telegramUser = ctx.from;
    if (!telegramUser) return;
    const user = await this.telegramService.getUserByTelegramId(telegramUser.id.toString());
    if (!user) return;

    if (text.length > TRANSLATE_MAX_CHARS) {
      await ctx.reply(i18n.t('translator.tooLong', { max: TRANSLATE_MAX_CHARS }));
      return;
    }

    const thinking = await ctx.reply(i18n.t('translator.translating'));

    try {
      const translated = await this.translatorService.translate(user.id, text, ctx.session.translateTarget);
      try {
        await ctx.telegram.deleteMessage(thinking.chat.id, thinking.message_id);
      } catch {
        /* ignore */
      }
      // Telegram messages cap at 4096 chars — send in chunks if needed.
      for (const chunk of this.chunk(translated, 3900)) {
        await ctx.reply(chunk);
      }
      await ctx.reply(i18n.t('translator.again'), {
        reply_markup: Markup.inlineKeyboard(
          LANG_BUTTONS.map((l) => [Markup.button.callback(l.label, `tr_lang_${l.code}`)]),
        ).reply_markup,
      });
    } catch (error) {
      await ctx.reply(
        i18n.t('translator.error', { error: error instanceof Error ? error.message : 'Error' }),
        { reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()) },
      );
      await ctx.scene.leave();
    }
  }

  private chunk(text: string, size: number): string[] {
    if (text.length <= size) return [text];
    const parts: string[] = [];
    let rest = text;
    while (rest.length > size) {
      let cut = rest.lastIndexOf('\n', size);
      if (cut < size * 0.5) cut = rest.lastIndexOf(' ', size);
      if (cut < size * 0.5) cut = size;
      parts.push(rest.slice(0, cut));
      rest = rest.slice(cut).trimStart();
    }
    if (rest) parts.push(rest);
    return parts;
  }
}
