import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { GlossaryService, GLOSSARY_PRICES } from '../../study/glossary/glossary.service';

@Scene('glossary-create')
export class GlossaryCreateScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly glossaryService: GlossaryService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    ctx.session.glossaryContent = undefined;
    ctx.session.glossaryCount = undefined;
    await ctx.reply(i18n.t('glossary.enterContent'), { parse_mode: 'HTML' });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;
    const text = message.text;
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    if (text === '/cancel') {
      await ctx.reply(i18n.t('glossary.cancelled'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
      await ctx.scene.leave();
      return;
    }
    if (text.length < 10) {
      await ctx.reply(i18n.t('glossary.contentTooShort'));
      return;
    }

    ctx.session.glossaryContent = text;
    const word = i18n.t('glossary.termsShort');
    const rows = Object.entries(GLOSSARY_PRICES).map(([count, price]) => [
      Markup.button.callback(`${count} ${word} - ${Number(price).toLocaleString()} so'm`, `gl_count_${count}`),
    ]);
    await ctx.reply(i18n.t('glossary.selectCount'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(rows).reply_markup,
    });
  }

  @Action(/gl_count_(\d+)/)
  async onCount(@Ctx() ctx: any) {
    const user = await this.telegramService.getUserByTelegramId(ctx.from.id.toString());
    if (!user) return;
    const count = parseInt(ctx.match[1], 10);
    ctx.session.glossaryCount = count;
    const price = this.glossaryService.getPrice(count);
    const i18n = this.telegramService.getI18n(user.language);

    if (user.credits < price) {
      await ctx.answerCbQuery(i18n.t('quiz.insufficientBalance', { price, balance: user.credits }), { show_alert: true });
      await ctx.scene.leave();
      return;
    }
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('glossary.confirmCreation', { count, price: price.toLocaleString(), balance: user.credits.toLocaleString() }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(i18n.t('buttons.confirm'), 'gl_confirm')],
          [Markup.button.callback(i18n.t('buttons.cancel'), 'gl_cancel')],
        ]).reply_markup,
      },
    );
  }

  @Action('gl_confirm')
  async onConfirm(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;
    const user = await this.telegramService.getUserByTelegramId(telegramUser.id.toString());
    if (!user) return;
    const i18n = this.telegramService.getI18n(user.language);
    const { glossaryContent, glossaryCount } = ctx.session;

    if (!glossaryContent || !glossaryCount) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      await ctx.scene.leave();
      return;
    }
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('glossary.creating'));

    try {
      await this.glossaryService.createSet({
        userId: user.id,
        sourceContent: glossaryContent,
        termCount: glossaryCount,
        language: user.language || 'uz',
        telegramId: user.telegramId,
      });
      // The DOCX is delivered inside createSet.
      await ctx.reply(i18n.t('glossary.done'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
    } catch (error) {
      await ctx.reply(i18n.t('glossary.error', { error: error instanceof Error ? error.message : 'Error' }), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
    }
    ctx.session.glossaryContent = undefined;
    ctx.session.glossaryCount = undefined;
    await ctx.scene.leave();
  }

  @Action('gl_cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('glossary.cancelled'));
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
    });
    await ctx.scene.leave();
  }
}
