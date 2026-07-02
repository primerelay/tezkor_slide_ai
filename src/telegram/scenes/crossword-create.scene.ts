import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { CrosswordService, CROSSWORD_PRICES } from '../../study/crossword/crossword.service';

@Scene('crossword-create')
export class CrosswordCreateScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly crosswordService: CrosswordService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    ctx.session.crosswordContent = undefined;
    ctx.session.crosswordCount = undefined;
    await ctx.reply(i18n.t('crossword.enterContent'), { parse_mode: 'HTML' });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;
    const text = message.text;
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    if (text === '/cancel') {
      await ctx.reply(i18n.t('crossword.cancelled'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
      await ctx.scene.leave();
      return;
    }
    if (text.length < 10) {
      await ctx.reply(i18n.t('crossword.contentTooShort'));
      return;
    }

    ctx.session.crosswordContent = text;
    const word = i18n.t('crossword.wordsShort');
    const rows = Object.entries(CROSSWORD_PRICES).map(([count, price]) => [
      Markup.button.callback(`${count} ${word} - ${Number(price).toLocaleString()} so'm`, `cw_count_${count}`),
    ]);
    await ctx.reply(i18n.t('crossword.selectCount'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(rows).reply_markup,
    });
  }

  @Action(/cw_count_(\d+)/)
  async onCount(@Ctx() ctx: any) {
    const user = await this.telegramService.getUserByTelegramId(ctx.from.id.toString());
    if (!user) return;
    const count = parseInt(ctx.match[1], 10);
    ctx.session.crosswordCount = count;
    const price = this.crosswordService.getPrice(count);
    const i18n = this.telegramService.getI18n(user.language);

    if (user.credits < price) {
      await ctx.answerCbQuery(i18n.t('quiz.insufficientBalance', { price, balance: user.credits }), { show_alert: true });
      await ctx.scene.leave();
      return;
    }
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('crossword.confirmCreation', { count, price: price.toLocaleString(), balance: user.credits.toLocaleString() }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(i18n.t('buttons.confirm'), 'cw_confirm')],
          [Markup.button.callback(i18n.t('buttons.cancel'), 'cw_cancel')],
        ]).reply_markup,
      },
    );
  }

  @Action('cw_confirm')
  async onConfirm(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;
    const user = await this.telegramService.getUserByTelegramId(telegramUser.id.toString());
    if (!user) return;
    const i18n = this.telegramService.getI18n(user.language);
    const { crosswordContent, crosswordCount } = ctx.session;

    if (!crosswordContent || !crosswordCount) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      await ctx.scene.leave();
      return;
    }
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('crossword.creating'));

    try {
      await this.crosswordService.createSet({
        userId: user.id,
        sourceContent: crosswordContent,
        wordCount: crosswordCount,
        language: user.language || 'uz',
        telegramId: user.telegramId,
      });
      await ctx.reply(i18n.t('crossword.done'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
    } catch (error) {
      await ctx.reply(i18n.t('crossword.error', { error: error instanceof Error ? error.message : 'Error' }), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
    }
    ctx.session.crosswordContent = undefined;
    ctx.session.crosswordCount = undefined;
    await ctx.scene.leave();
  }

  @Action('cw_cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('crossword.cancelled'));
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
    });
    await ctx.scene.leave();
  }
}
