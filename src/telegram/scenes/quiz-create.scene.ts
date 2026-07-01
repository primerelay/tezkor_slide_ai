import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { Markup } from 'telegraf';
import { QuizType, QuizDifficulty } from '../../database/entities/quiz.entity';

@Scene('quiz-create')
export class QuizCreateScene {
  constructor(private readonly telegramService: TelegramService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(
      i18n.t('quiz.enterContent'),
      { parse_mode: 'HTML' }
    );
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text;

    // Handle cancel
    if (text === '/cancel') {
      const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
      await ctx.reply(i18n.t('cancelled'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
      await ctx.scene.leave();
      return;
    }

    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    // Check minimum length
    if (text.length < 10) {
      await ctx.reply(i18n.t('quiz.contentTooShort'));
      return;
    }

    // Store content
    ctx.session.quizContent = text;

    // Ask for quiz type
    await ctx.reply(
      i18n.t('quiz.contentReceived'),
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(`🔘 ${i18n.t('quiz.types.multiple_choice')}`, 'quiz_type_multiple_choice')],
          [Markup.button.callback(`✅ ${i18n.t('quiz.types.true_false')}`, 'quiz_type_true_false')],
          [Markup.button.callback(`🎲 ${i18n.t('quiz.types.mixed')}`, 'quiz_type_mixed')],
        ]).reply_markup,
      }
    );
  }

  @Action(/quiz_type_(.+)/)
  async onQuizType(@Ctx() ctx: any) {
    const match = ctx.match;
    if (!match) return;

    const quizType = match[1]; // multiple_choice, true_false, or mixed
    ctx.session.quizType = quizType;

    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('quiz.selectDifficulty'),
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(`🟢 ${i18n.t('quiz.difficulties.easy')}`, 'quiz_diff_easy')],
          [Markup.button.callback(`🟡 ${i18n.t('quiz.difficulties.medium')}`, 'quiz_diff_medium')],
          [Markup.button.callback(`🔴 ${i18n.t('quiz.difficulties.hard')}`, 'quiz_diff_hard')],
        ]).reply_markup,
      }
    );
  }

  @Action(/quiz_diff_(.+)/)
  async onDifficulty(@Ctx() ctx: any) {
    const match = ctx.match;
    if (!match) return;

    const difficulty = match[1]; // easy, medium, or hard
    ctx.session.quizDifficulty = difficulty;

    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('quiz.selectQuestionCount'),
      {
        reply_markup: Markup.inlineKeyboard([
          [
            Markup.button.callback('5 - 500 so\'m', 'quiz_count_5'),
            Markup.button.callback('10 - 800 so\'m', 'quiz_count_10'),
          ],
          [
            Markup.button.callback('15 - 1,200 so\'m', 'quiz_count_15'),
            Markup.button.callback('20 - 1,500 so\'m', 'quiz_count_20'),
          ],
          [
            Markup.button.callback('30 - 2,000 so\'m', 'quiz_count_30'),
          ],
        ]).reply_markup,
      }
    );
  }

  @Action(/quiz_count_(\d+)/)
  async onQuestionCount(@Ctx() ctx: any) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const match = ctx.match;
    if (!match) return;

    const numberOfQuestions = parseInt(match[1]);
    ctx.session.quizQuestionCount = numberOfQuestions;

    // Calculate price
    const priceMap: Record<number, number> = {
      5: 500,
      10: 800,
      15: 1200,
      20: 1500,
      30: 2000,
    };
    const price = priceMap[numberOfQuestions] || 2000;

    const i18n = this.telegramService.getI18n(user.language);

    // Check if user has enough credits
    if (user.credits < price) {
      await ctx.answerCbQuery(
        i18n.t('quiz.insufficientBalance', { price, balance: user.credits }),
        { show_alert: true }
      );
      await ctx.reply(i18n.t('quiz.topupInstruction'));
      await ctx.scene.leave();
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('quiz.confirmCreation', {
        type: this.getQuizTypeName(ctx.session.quizType || '', i18n),
        difficulty: this.getDifficultyName(ctx.session.quizDifficulty || '', i18n),
        count: numberOfQuestions,
        price: price.toLocaleString(),
        balance: user.credits.toLocaleString()
      }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(i18n.t('buttons.confirm'), 'quiz_confirm')],
          [Markup.button.callback(i18n.t('buttons.cancel'), 'quiz_cancel')],
        ]).reply_markup,
      }
    );
  }

  @Action('quiz_confirm')
  async onConfirm(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    const { quizContent, quizType, quizDifficulty, quizQuestionCount } = ctx.session;

    if (!quizContent || !quizType || !quizDifficulty || !quizQuestionCount) {
      await ctx.answerCbQuery(i18n.t('quiz.dataIncomplete'), { show_alert: true });
      await ctx.scene.leave();
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('quiz.creating'));

    try {
      // Map string values to enum values
      const quizTypeMap: Record<string, QuizType> = {
        'multiple_choice': QuizType.MULTIPLE_CHOICE,
        'true_false': QuizType.TRUE_FALSE,
        'mixed': QuizType.MIXED,
      };

      const difficultyMap: Record<string, QuizDifficulty> = {
        'easy': QuizDifficulty.EASY,
        'medium': QuizDifficulty.MEDIUM,
        'hard': QuizDifficulty.HARD,
      };

      // Create quiz via API
      const quiz = await this.telegramService.createQuiz({
        userId: user.id,
        title: quizContent.substring(0, 100) + '...',
        sourceContent: quizContent,
        quizType: quizTypeMap[quizType],
        difficulty: difficultyMap[quizDifficulty],
        numberOfQuestions: quizQuestionCount,
        language: user.language || 'uz',
      });

      await ctx.reply(
        i18n.t('quiz.creationStarted', { id: quiz.id, count: quizQuestionCount }),
        {
          parse_mode: 'HTML',
          reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
        }
      );
    } catch (error) {
      await ctx.reply(
        i18n.t('quiz.creationError', { error: error.message || 'Quiz yaratishda muammo bo\'ldi.' }),
        {
          reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
        }
      );
    }

    await ctx.scene.leave();
  }

  @Action('quiz_cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('quiz.cancelled'));
    await ctx.reply(
      i18n.t('mainMenuText'),
      {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      }
    );
    await ctx.scene.leave();
  }

  private getQuizTypeName(type: string, i18n: any): string {
    return i18n.t(`quiz.types.${type}`) || type;
  }

  private getDifficultyName(difficulty: string, i18n: any): string {
    return i18n.t(`quiz.difficulties.${difficulty}`) || difficulty;
  }
}
