import { Update, Ctx, Start, Command, On, Action, Hears } from 'nestjs-telegraf';
import { Context, Scenes, Markup } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { InlineKeyboards } from './keyboards/inline.keyboards';
import { JobEventsService } from '../queue/events/job.events';
import { SupportedLanguage } from '../common/i18n/i18n.service';

interface SessionData extends Scenes.SceneSession {
  language?: SupportedLanguage;
  topic?: string;
  studentName?: string;
  teacherName?: string;
  includeReja?: boolean;
  slideCount?: number;
  theme?: 'academic_blue' | 'minimal_white' | 'modern_dark';
  userId?: number;
  step?: 'topic' | 'student_name' | 'teacher_name' | 'reja' | 'slides' | 'theme' | 'confirm';
  awaitingPaymentScreenshot?: boolean;
  adminApprovingUserId?: number;
}

export interface BotContext extends Context {
  session: SessionData;
  scene: Scenes.SceneContextScene<BotContext>;
}

@Update()
export class TelegramUpdate {
  private readonly miniAppUrl: string | undefined;

  constructor(
    private readonly telegramService: TelegramService,
    private readonly jobEventsService: JobEventsService,
    private readonly configService: ConfigService,
  ) {
    this.miniAppUrl = this.configService.get<string>('MINI_APP_URL');
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.findOrCreateUser({
      id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
    });

    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    ctx.session.step = undefined;

    const i18n = this.telegramService.getI18n(user.language);

    // Set persistent menu button
    await ctx.reply(i18n.t('welcome', { name: user.firstName || 'User' }), {
      parse_mode: 'HTML',
      reply_markup: Markup.keyboard([
        ['📋 Menu']
      ]).resize().reply_markup,
    });

    // Show inline menu
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.mainMenu(i18n, this.miniAppUrl),
    });
  }

  @Hears('📋 Menu')
  async onMenuButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    // Reset session state
    ctx.session.step = undefined;
    ctx.session.topic = undefined;
    ctx.session.studentName = undefined;
    ctx.session.teacherName = undefined;
    ctx.session.includeReja = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
    ctx.session.awaitingPaymentScreenshot = undefined;

    const i18n = this.telegramService.getI18n(user.language);

    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.mainMenu(i18n, this.miniAppUrl),
    });
  }

  @Command('language')
  async onLanguage(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(i18n.t('selectLanguage'), {
      reply_markup: InlineKeyboards.languageSelection(),
    });
  }

  @Command('add_balance')
  async onAddBalanceCommand(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    // Check if admin
    if (!this.telegramService.isAdmin(telegramUser.id.toString())) {
      await ctx.reply('❌ Sizda ruxsat yo\'q!');
      return;
    }

    const message = ctx.message;
    if (!message || !('text' in message)) return;

    // Parse command: /add_balance @username 5000 or /add_balance 1234567890 5000
    const parts = message.text.split(' ').filter(p => p.trim());

    if (parts.length < 3) {
      await ctx.reply(
        '📝 <b>Foydalanish:</b>\n\n' +
        '<code>/add_balance @username 5000</code>\n' +
        '<code>/add_balance telegram_id 5000</code>\n\n' +
        'Misol:\n' +
        '<code>/add_balance @joe_devv 5000</code>\n' +
        '<code>/add_balance 1357290180 10000</code>',
        { parse_mode: 'HTML' }
      );
      return;
    }

    const identifier = parts[1].replace('@', '');
    const amount = parseInt(parts[2], 10);

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Noto\'g\'ri summa. Musbat raqam kiriting.');
      return;
    }

    // Try to find user by username or telegram ID
    const user = await this.telegramService.findUserByUsernameOrTelegramId(identifier);

    if (!user) {
      await ctx.reply(`❌ User topilmadi: ${identifier}`);
      return;
    }

    // Add balance
    await this.telegramService.addCreditsById(user.id, amount);

    await ctx.reply(
      `✅ <b>Balans to'ldirildi!</b>\n\n` +
      `👤 User: ${user.firstName || 'N/A'} (@${user.username || 'N/A'})\n` +
      `🆔 ID: ${user.telegramId}\n` +
      `💰 Qo'shildi: +${amount.toLocaleString()} so'm\n` +
      `💳 Yangi balans: ${user.credits + amount} so'm`,
      { parse_mode: 'HTML' }
    );
  }

  @Command('help')
  async onHelp(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(i18n.t('help'), { parse_mode: 'HTML' });
  }

  @Command('balance')
  async onBalance(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);
    await ctx.reply(i18n.t('balance', { credits: user.credits }), {
      parse_mode: 'HTML',
    });
  }

  @Command('new')
  async onNew(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    ctx.session.userId = user.id;
    ctx.session.language = user.language;

    const i18n = this.telegramService.getI18n(user.language);
    await ctx.reply(i18n.t('enterTopic'), { parse_mode: 'HTML' });
    ctx.session.topic = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
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
      reply_markup: InlineKeyboards.mainMenu(i18n, this.miniAppUrl),
    });
  }

  @Action('new_presentation')
  async onNewPresentation(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    ctx.session.topic = undefined;
    ctx.session.studentName = undefined;
    ctx.session.teacherName = undefined;
    ctx.session.includeReja = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
    ctx.session.step = 'topic';

    const i18n = this.telegramService.getI18n(user.language);

    await ctx.answerCbQuery();
    await ctx.reply(i18n.t('enterTopic'), { parse_mode: 'HTML' });
  }

  @Action('add_balance')
  async onAddBalance(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);
    ctx.session.awaitingPaymentScreenshot = true;

    await ctx.answerCbQuery();
    await ctx.reply(i18n.t('paymentInstructions'), { parse_mode: 'HTML' });
  }

  @Action(/^reja_(yes|no)$/)
  async onRejaSelect(@Ctx() ctx: BotContext) {
    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const includeReja = callbackQuery.data === 'reja_yes';
    ctx.session.includeReja = includeReja;
    ctx.session.step = 'slides';

    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      includeReja ? i18n.t('rejaYes') : i18n.t('rejaNo'),
    );

    await ctx.reply(i18n.t('selectSlideCount'), {
      reply_markup: InlineKeyboards.slideCountSelection(i18n),
    });
  }

  @Action('my_presentations')
  async onMyPresentations(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const presentations = await this.telegramService.getUserPresentations(
      user.id,
    );
    const i18n = this.telegramService.getI18n(user.language);

    await ctx.answerCbQuery();

    if (presentations.length === 0) {
      await ctx.reply(i18n.t('noPresentations'));
      return;
    }

    let message = i18n.t('yourPresentations') + '\n\n';
    presentations.forEach((p, index) => {
      const status = i18n.t(`status.${p.status}`);
      message += `${index + 1}. ${p.topic.substring(0, 50)}...\n`;
      message += `   📊 ${status}\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'HTML' });
  }

  @Action('check_balance')
  async onCheckBalance(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.onBalance(ctx);
  }

  @Action('change_language')
  async onChangeLanguage(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.onLanguage(ctx);
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

    const theme = callbackQuery.data.replace('theme_', '') as
      | 'academic_blue'
      | 'minimal_white'
      | 'modern_dark';
    ctx.session.theme = theme;

    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('themeSelected', { theme: i18n.t(`themes.${theme}`) }));

    await ctx.reply(i18n.t('confirmGeneration'), {
      parse_mode: 'HTML',
      reply_markup: InlineKeyboards.confirmGeneration(i18n),
    });
  }

  @Action('confirm_generation')
  async onConfirmGeneration(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    const { topic, slideCount, theme, language, studentName, teacherName, includeReja } = ctx.session;

    if (!topic || !slideCount || !theme) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      return;
    }

    // Check price
    const price = this.telegramService.getPriceForSlideCount(slideCount);
    if (user.credits < price) {
      await ctx.answerCbQuery(
        i18n.t('insufficientCredits') + ` (${price} so'm kerak, ${user.credits} so'm bor)`,
        { show_alert: true }
      );
      return;
    }

    await this.telegramService.deductCredits(user.id, price);

    const presentation = await this.telegramService.createPresentation({
      userId: user.id,
      topic,
      studentName: studentName || '',
      teacherName: teacherName || '',
      includeReja: includeReja || false,
      slideCount,
      theme,
      language: language || 'uz',
    });

    await this.jobEventsService.addPresentationJob({
      presentationId: presentation.id,
      userId: user.id,
      topic,
      studentName: studentName || '',
      teacherName: teacherName || '',
      includeReja: includeReja || false,
      slideCount,
      theme,
      language: language || 'uz',
      telegramChatId: ctx.chat?.id.toString(),
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('generationStarted'));

    await ctx.reply(
      i18n.t('generationQueued', { id: presentation.id.substring(0, 8) }),
      { parse_mode: 'HTML' },
    );

    ctx.session.topic = undefined;
    ctx.session.studentName = undefined;
    ctx.session.teacherName = undefined;
    ctx.session.includeReja = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
    ctx.session.step = undefined;
  }

  @Action(/^approve_payment_(\d+)_(\d+)$/)
  async onApprovePayment(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    // Check if admin
    if (!this.telegramService.isAdmin(telegramUser.id.toString())) {
      await ctx.answerCbQuery('Sizda ruxsat yo\'q!', { show_alert: true });
      return;
    }

    const callbackQuery = ctx.callbackQuery;
    if (!callbackQuery || !('data' in callbackQuery)) return;

    const match = callbackQuery.data.match(/^approve_payment_(\d+)_(\d+)$/);
    if (!match) return;

    const userId = parseInt(match[1], 10);

    // Ask for amount
    await ctx.answerCbQuery();
    await ctx.reply(
      `💰 Qancha so'm qo'shmoqchisiz? (User ID: ${userId})\n\nMiqdorni yozing (masalan: 5000):`,
      { parse_mode: 'HTML' }
    );

    // Store admin state
    ctx.session.adminApprovingUserId = userId;
  }

  @Action(/^reject_payment_(\d+)$/)
  async onRejectPayment(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    if (!this.telegramService.isAdmin(telegramUser.id.toString())) {
      await ctx.answerCbQuery('Sizda ruxsat yo\'q!', { show_alert: true });
      return;
    }

    await ctx.answerCbQuery('❌ Rad etildi');
    await ctx.editMessageCaption('❌ <b>Rad etildi</b>', { parse_mode: 'HTML' });
  }

  @Action('cancel_generation')
  async onCancelGeneration(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    ctx.session.topic = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('generationCancelled'));

    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.mainMenu(i18n, this.miniAppUrl),
    });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text;

    if (text.startsWith('/')) return;

    const telegramUser = ctx.from;
    if (!telegramUser) return;

    // Admin handling payment approval amount - check BEFORE user lookup
    // because admin might not be in users table
    if (ctx.session.adminApprovingUserId && this.telegramService.isAdmin(telegramUser.id.toString())) {
      const amount = parseInt(text.replace(/\D/g, ''), 10);
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('❌ Noto\'g\'ri miqdor. Raqam kiriting.');
        return;
      }

      const targetUserId = ctx.session.adminApprovingUserId;
      const updatedUser = await this.telegramService.addCreditsById(targetUserId, amount);

      if (updatedUser) {
        await ctx.reply(
          `✅ <b>Balans to'ldirildi!</b>\n\n` +
          `👤 User: ${updatedUser.firstName || 'N/A'} (@${updatedUser.username || 'N/A'})\n` +
          `🆔 ID: ${targetUserId}\n` +
          `💰 Qo'shildi: +${amount.toLocaleString()} so'm\n` +
          `💳 Yangi balans: ${updatedUser.credits.toLocaleString()} so'm`,
          { parse_mode: 'HTML' }
        );
      } else {
        await ctx.reply(`❌ User topilmadi (ID: ${targetUserId})`);
      }

      ctx.session.adminApprovingUserId = undefined;
      return;
    }

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);
    const step = ctx.session.step || 'topic';

    // Step 1: Topic
    if (step === 'topic' && !ctx.session.topic) {
      if (text.length < 5) {
        await ctx.reply(i18n.t('topicTooShort'));
        return;
      }

      if (text.length > 500) {
        await ctx.reply(i18n.t('topicTooLong'));
        return;
      }

      ctx.session.topic = text;
      ctx.session.language = user.language;
      ctx.session.userId = user.id;
      ctx.session.step = 'student_name';

      await ctx.reply(i18n.t('topicReceived', { topic: text }), {
        parse_mode: 'HTML',
      });

      await ctx.reply(i18n.t('enterStudentName'), { parse_mode: 'HTML' });
      return;
    }

    // Step 2: Student Name
    if (step === 'student_name') {
      if (text.length < 2) {
        await ctx.reply(i18n.t('nameTooShort'));
        return;
      }

      ctx.session.studentName = text;
      ctx.session.step = 'teacher_name';

      await ctx.reply(i18n.t('studentNameReceived', { name: text }), {
        parse_mode: 'HTML',
      });

      await ctx.reply(i18n.t('enterTeacherName'), { parse_mode: 'HTML' });
      return;
    }

    // Step 3: Teacher Name
    if (step === 'teacher_name') {
      if (text.length < 2) {
        await ctx.reply(i18n.t('nameTooShort'));
        return;
      }

      ctx.session.teacherName = text;
      ctx.session.step = 'reja';

      await ctx.reply(i18n.t('teacherNameReceived', { name: text }), {
        parse_mode: 'HTML',
      });

      await ctx.reply(i18n.t('askReja'), {
        parse_mode: 'HTML',
        reply_markup: InlineKeyboards.rejaSelection(i18n),
      });
      return;
    }
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    if (ctx.session.awaitingPaymentScreenshot) {
      // Forward to admin
      await this.telegramService.forwardPaymentToAdmin(ctx, user);
      ctx.session.awaitingPaymentScreenshot = false;

      await ctx.reply(i18n.t('paymentReceived'), { parse_mode: 'HTML' });
    }
  }
}
