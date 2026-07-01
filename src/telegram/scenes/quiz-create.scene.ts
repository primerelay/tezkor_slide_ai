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
      '📝 <b>Quiz yaratish</b>\n\n' +
      'Test yaratish uchun darslik matnini yoki mavzuni yuboring.\n\n' +
      '💡 Masalan:\n' +
      '• Darslik matni\n' +
      '• PDF fayl\n' +
      '• Mavzu nomi\n\n' +
      '❌ Bekor qilish uchun /cancel ni bosing',
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

    // Check minimum length
    if (text.length < 50) {
      await ctx.reply('⚠️ Matn juda qisqa. Kamida 50 belgi kiriting.');
      return;
    }

    // Store content
    ctx.session.quizContent = text;

    // Ask for quiz type
    await ctx.reply(
      '✅ Matn qabul qilindi!\n\n' +
      '📋 Savol turini tanlang:',
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔘 Ko\'p tanlovli', 'quiz_type_multiple_choice')],
          [Markup.button.callback('✅ To\'g\'ri/Noto\'g\'ri', 'quiz_type_true_false')],
          [Markup.button.callback('🎲 Aralash', 'quiz_type_mixed')],
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

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '✅ Savol turi tanlandi!\n\n' +
      '📊 Qiyinlik darajasini tanlang:',
      {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🟢 Oson', 'quiz_diff_easy')],
          [Markup.button.callback('🟡 O\'rta', 'quiz_diff_medium')],
          [Markup.button.callback('🔴 Qiyin', 'quiz_diff_hard')],
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

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '✅ Qiyinlik tanlandi!\n\n' +
      '🔢 Savollar sonini tanlang:',
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
        `⚠️ Balans yetarli emas!\nKerak: ${price} so'm\nMavjud: ${user.credits} so'm`,
        { show_alert: true }
      );
      await ctx.reply(
        `💰 Balans to'ldirish uchun /start bosing va "Balans to'ldirish" tugmasini tanlang.`,
      );
      await ctx.scene.leave();
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '📋 <b>Quiz yaratish tasdiqlansinmi?</b>\n\n' +
      `📝 Savol turi: ${this.getQuizTypeName(ctx.session.quizType || '')}\n` +
      `📊 Qiyinlik: ${this.getDifficultyName(ctx.session.quizDifficulty || '')}\n` +
      `🔢 Savollar: ${numberOfQuestions} ta\n` +
      `💰 Narx: <b>${price.toLocaleString()} so'm</b>\n\n` +
      `💵 Sizning balansingiz: ${user.credits.toLocaleString()} so'm`,
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('✅ Tasdiqlash', 'quiz_confirm')],
          [Markup.button.callback('❌ Bekor qilish', 'quiz_cancel')],
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
      await ctx.answerCbQuery('⚠️ Ma\'lumotlar to\'liq emas!', { show_alert: true });
      await ctx.scene.leave();
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      '⏳ Quiz yaratilmoqda...\n\n' +
      'Bu 1-2 daqiqa vaqt olishi mumkin. Iltimos kuting...',
    );

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
        '✅ <b>Quiz yaratish boshlandi!</b>\n\n' +
        `🆔 Quiz ID: <code>${quiz.id}</code>\n` +
        `📝 Savollar: ${quizQuestionCount} ta\n\n` +
        '⏳ Jarayon tugagach sizga xabar beramiz.\n' +
        'Bu 1-2 daqiqa vaqt olishi mumkin.',
        {
          parse_mode: 'HTML',
          reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
        }
      );
    } catch (error) {
      await ctx.reply(
        '❌ Xatolik yuz berdi!\n\n' +
        error.message || 'Quiz yaratishda muammo bo\'ldi.',
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
    await ctx.editMessageText('❌ Quiz yaratish bekor qilindi.');
    await ctx.reply(
      'Bosh menyu:',
      {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      }
    );
    await ctx.scene.leave();
  }

  private getQuizTypeName(type: string): string {
    const names: Record<string, string> = {
      multiple_choice: 'Ko\'p tanlovli',
      true_false: 'To\'g\'ri/Noto\'g\'ri',
      mixed: 'Aralash',
    };
    return names[type] || type;
  }

  private getDifficultyName(difficulty: string): string {
    const names: Record<string, string> = {
      easy: 'Oson',
      medium: 'O\'rta',
      hard: 'Qiyin',
    };
    return names[difficulty] || difficulty;
  }
}
