import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { FlashcardService, FLASHCARD_PRICES } from '../../flashcard/flashcard.service';
import { renderFlashcard } from '../keyboards/flashcard.view';

@Scene('flashcard-create')
export class FlashcardCreateScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly flashcardService: FlashcardService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    ctx.session.flashcardContent = undefined;
    ctx.session.flashcardCount = undefined;
    await ctx.reply(i18n.t('flashcard.enterContent'), { parse_mode: 'HTML' });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;
    const text = message.text;
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    if (text === '/cancel') {
      await ctx.reply(i18n.t('flashcard.cancelled'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
      await ctx.scene.leave();
      return;
    }

    if (text.length < 10) {
      await ctx.reply(i18n.t('flashcard.contentTooShort'));
      return;
    }

    ctx.session.flashcardContent = text;

    const pagesWord = i18n.t('flashcard.cardsShort');
    const rows = Object.entries(FLASHCARD_PRICES).map(([count, price]) => [
      Markup.button.callback(
        `${count} ${pagesWord} - ${Number(price).toLocaleString()} so'm`,
        `fc_count_${count}`,
      ),
    ]);

    await ctx.reply(i18n.t('flashcard.selectCount'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(rows).reply_markup,
    });
  }

  @Action(/fc_count_(\d+)/)
  async onCount(@Ctx() ctx: any) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;
    const user = await this.telegramService.getUserByTelegramId(telegramUser.id.toString());
    if (!user) return;

    const count = parseInt(ctx.match[1], 10);
    ctx.session.flashcardCount = count;
    const price = this.flashcardService.getPrice(count);
    const i18n = this.telegramService.getI18n(user.language);

    if (user.credits < price) {
      await ctx.answerCbQuery(
        i18n.t('quiz.insufficientBalance', { price, balance: user.credits }),
        { show_alert: true },
      );
      await ctx.scene.leave();
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('flashcard.confirmCreation', {
        count,
        price: price.toLocaleString(),
        balance: user.credits.toLocaleString(),
      }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(i18n.t('buttons.confirm'), 'fc_confirm')],
          [Markup.button.callback(i18n.t('buttons.cancel'), 'fc_cancel')],
        ]).reply_markup,
      },
    );
  }

  @Action('fc_confirm')
  async onConfirm(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;
    const user = await this.telegramService.getUserByTelegramId(telegramUser.id.toString());
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);
    const { flashcardContent, flashcardCount } = ctx.session;

    if (!flashcardContent || !flashcardCount) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      await ctx.scene.leave();
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('flashcard.creating'));

    try {
      const set = await this.flashcardService.createSet({
        userId: user.id,
        sourceContent: flashcardContent,
        cardCount: flashcardCount,
        language: user.language || 'uz',
      });

      await ctx.reply(
        i18n.t('flashcard.ready', { title: set.title, count: set.cards.length }),
        { parse_mode: 'HTML' },
      );

      // Show the first card interactively.
      const view = renderFlashcard(set, 0, 'front', i18n);
      await ctx.reply(view.text, { parse_mode: 'HTML', reply_markup: view.keyboard });

      // Offer a shareable deep link so friends can study the same deck.
      const shareLink = this.telegramService.getFlashcardShareLink(set.id);
      await ctx.reply(i18n.t('flashcard.sharePrompt'), {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.url(
              i18n.t('flashcard.shareButton'),
              `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(i18n.t('flashcard.shareText', { title: set.title }))}`,
            ),
          ],
        ]).reply_markup,
      });
    } catch (error) {
      await ctx.reply(
        i18n.t('flashcard.error', {
          error: error instanceof Error ? error.message : 'Error',
        }),
        {
          reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
        },
      );
    }

    ctx.session.flashcardContent = undefined;
    ctx.session.flashcardCount = undefined;
    await ctx.scene.leave();
  }

  @Action('fc_cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('flashcard.cancelled'));
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
    });
    await ctx.scene.leave();
  }
}
