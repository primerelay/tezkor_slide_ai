import { Update, Ctx, Start, Command, On, Action, Hears } from 'nestjs-telegraf';
import { Context, Scenes, Markup } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { ReferralService } from './referral.service';
import { InlineKeyboards, ReplyKeyboards } from './keyboards/inline.keyboards';
import { JobEventsService } from '../queue/events/job.events';
import { SupportedLanguage } from '../common/i18n/i18n.service';
import {
  PresentationTheme,
  normalizeTheme,
} from '../renderer/themes/theme-registry';
import { FlashcardService } from '../flashcard/flashcard.service';
import { renderFlashcard } from './keyboards/flashcard.view';

interface SessionData extends Scenes.SceneSession {
  language?: SupportedLanguage;
  topic?: string;
  studentName?: string;
  teacherName?: string;
  includeReja?: boolean;
  slideCount?: number;
  theme?: PresentationTheme;
  userId?: number;
  step?: 'topic' | 'student_name' | 'teacher_name' | 'reja' | 'slides' | 'theme' | 'confirm';
  awaitingPaymentScreenshot?: boolean;
  adminApprovingUserId?: number;
  // Quiz properties
  quizContent?: string;
  quizType?: string;
  quizDifficulty?: string;
  quizQuestionCount?: number;
  // Document (mustaqil ish / referat) properties
  docType?: 'mustaqil_ish' | 'referat' | 'insho' | 'kurs_ishi' | 'maqola' | 'tezis';
  docStep?: 'topic' | 'institution' | 'student_name' | 'teacher_name' | 'pages';
  docTopic?: string;
  docInstitution?: string;
  docStudentName?: string;
  docTeacherName?: string;
  docPageCount?: number;
  // Flashcard properties
  flashcardContent?: string;
  flashcardCount?: number;
  // Glossary / crossword properties
  glossaryContent?: string;
  glossaryCount?: number;
  crosswordContent?: string;
  crosswordCount?: number;
  // Resume properties
  resumeStep?: 'name' | 'position' | 'contact' | 'background';
  resumeName?: string;
  resumePosition?: string;
  resumeContact?: string;
  resumeBackground?: string;
  resumeTemplate?: string;
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
    private readonly referralService: ReferralService,
    private readonly jobEventsService: JobEventsService,
    private readonly configService: ConfigService,
    private readonly flashcardService: FlashcardService,
  ) {
    this.miniAppUrl = this.configService.get<string>('MINI_APP_URL');
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    // Parse deep-link payload (e.g., /start ref_123_abc or /start fc_42)
    let referrerId: number | undefined;
    let referrerName: string | undefined;
    let sharedFlashcardId: number | undefined;

    if ('message' in ctx.update && 'text' in ctx.update.message) {
      const text = ctx.update.message.text;
      const parts = text.split(' ');
      if (parts.length > 1) {
        const startPayload = parts[1]; // Get the payload after /start
        if (startPayload && startPayload.startsWith('ref_')) {
          const referrer = await this.telegramService.getUserByReferralCode(startPayload);
          if (referrer) {
            referrerId = referrer.id;
            referrerName = referrer.firstName || referrer.username;
          }
        } else if (startPayload && startPayload.startsWith('fc_')) {
          const id = parseInt(startPayload.slice(3), 10);
          if (!isNaN(id)) sharedFlashcardId = id;
        }
      }
    }

    const user = await this.telegramService.findOrCreateUser(
      {
        id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      },
      referrerId,
    );

    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    ctx.session.step = undefined;

    const i18n = this.telegramService.getI18n(user.language);

    // If user was invited by someone, show special message
    if (referrerName && user.referredBy) {
      await ctx.reply(i18n.t('referral.invitedBy', { name: referrerName }), {
        parse_mode: 'HTML',
      });
    }

    // Send welcome message with inline keyboard showing all features
    await ctx.reply(i18n.t('welcome', { name: user.firstName || 'User' }), {
      parse_mode: 'HTML',
      reply_markup: InlineKeyboards.featuresMenu(i18n, this.miniAppUrl),
    });

    // Send reply keyboard (persistent buttons at bottom)
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: ReplyKeyboards.mainMenu(i18n, this.miniAppUrl),
    });

    // Opened via a shared flashcard link — show the deck interactively.
    if (sharedFlashcardId !== undefined) {
      try {
        const set = await this.flashcardService.getSet(sharedFlashcardId);
        await ctx.reply(
          i18n.t('flashcard.sharedIntro', { title: set.title, count: set.cards.length }),
          { parse_mode: 'HTML' },
        );
        const view = renderFlashcard(set, 0, 'front', i18n);
        await ctx.reply(view.text, { parse_mode: 'HTML', reply_markup: view.keyboard });
      } catch {
        await ctx.reply(i18n.t('flashcard.sharedNotFound'));
      }
    }
  }

  /**
   * Handler for chat member updates (when users join/leave channels)
   * This is used for the referral system to award bonuses
   */
  @On('chat_member')
  async onChatMember(@Ctx() ctx: any) {
    try {
      const update = ctx.update.chat_member;
      if (!update) return;

      const { chat, from, new_chat_member, old_chat_member } = update;

      // Only handle required channel updates
      const requiredChannel = this.telegramService.getRequiredChannel();
      if (!requiredChannel) return;

      const channelUsername = chat.username || requiredChannel.username.replace('@', '');

      // Skip if this is not the required channel
      if (channelUsername !== requiredChannel.username.replace('@', '')) {
        return;
      }

      // Get or create user
      const user = await this.telegramService.findOrCreateUser({
        id: from.id,
        username: from.username,
        first_name: from.first_name,
        last_name: from.last_name,
      });

      // Check status changes
      const oldStatus = old_chat_member.status;
      const newStatus = new_chat_member.status;

      // Membership changed — drop any cached result for this user.
      this.telegramService.invalidateMembership(from.id);

      // User joined the channel
      if (
        ['left', 'kicked'].includes(oldStatus) &&
        ['member', 'administrator', 'creator'].includes(newStatus)
      ) {
        await this.referralService.handleChannelJoin(user.id, channelUsername);
      }

      // User left the channel
      if (
        ['member', 'administrator', 'creator'].includes(oldStatus) &&
        ['left', 'kicked', 'banned'].includes(newStatus)
      ) {
        const status = newStatus === 'banned' ? 'banned' : newStatus === 'kicked' ? 'kicked' : 'left';
        await this.referralService.handleChannelLeave(user.id, channelUsername, status);
      }
    } catch (error) {
      console.error('Error handling chat_member update:', error);
    }
  }

  /**
   * Handler for "Open Mini App / Designer" button (🎨)
   */
  @Hears(/^🎨.+$/)
  async onOpenMiniAppButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    if (!this.miniAppUrl) {
      await ctx.reply('Mini App hozircha mavjud emas.');
      return;
    }

    // Send inline button to open Mini App (WebApp buttons only work in inline keyboards)
    await ctx.reply(i18n.t('miniApp.promo'), {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.webApp(i18n.t('miniApp.openButton'), this.miniAppUrl)],
      ]).reply_markup,
    });
  }

  /**
   * Handler for "New Presentation" button (📊)
   */
  @Hears(/^📊.+$/)
  async onNewPresentationButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    // Check channel membership
    const requiredChannel = this.telegramService.getRequiredChannel();
    if (requiredChannel) {
      const isMember = await this.telegramService.isChannelMember(telegramUser.id);
      if (!isMember) {
        await ctx.reply(
          i18n.t('channel.joinRequired', { channel: requiredChannel.username }),
          {
            parse_mode: 'HTML',
            reply_markup: InlineKeyboards.joinChannel(requiredChannel.url, requiredChannel.username),
          }
        );
        return;
      }
    }

    // Reset session and start new presentation flow
    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    ctx.session.topic = undefined;
    ctx.session.studentName = undefined;
    ctx.session.teacherName = undefined;
    ctx.session.includeReja = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
    ctx.session.step = 'topic';

    await ctx.reply(i18n.t('enterTopic'), { parse_mode: 'HTML' });
  }

  /**
   * Handler for "My Presentations" button (📑)
   */
  @Hears(/^📑.+$/)
  async onMyPresentationsButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const presentations = await this.telegramService.getUserPresentations(user.id);
    const i18n = this.telegramService.getI18n(user.language);

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

  /**
   * Handler for "Balance" button (💰)
   */
  @Hears(/^💰.+$/)
  async onBalanceButton(@Ctx() ctx: BotContext) {
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

  /**
   * Handler for "Add Balance" button (➕)
   */
  @Hears(/^➕.+$/)
  async onAddBalanceButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);
    ctx.session.awaitingPaymentScreenshot = true;

    const humoCard = this.configService.get<string>('HUMO_CARD_NUMBER') || '9860 0000 0000 0000';
    const humoOwner = this.configService.get<string>('HUMO_CARD_OWNER') || 'SliderAI UZ';
    const uzcardCard = this.configService.get<string>('UZCARD_CARD_NUMBER') || '8600 0000 0000 0000';
    const uzcardOwner = this.configService.get<string>('UZCARD_CARD_OWNER') || 'SliderAI UZ';

    await ctx.reply(i18n.t('paymentInstructions', { humoCard, humoOwner, uzcardCard, uzcardOwner }), { parse_mode: 'HTML' });
  }

  /**
   * Handler for "Quiz Bot" button (🤖) - starts quiz creation
   */
  @Hears(/^🤖.+$/)
  async onQuizBotButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    // Check channel membership
    const requiredChannel = this.telegramService.getRequiredChannel();
    if (requiredChannel) {
      const isMember = await this.telegramService.isChannelMember(telegramUser.id);
      if (!isMember) {
        const i18n = this.telegramService.getI18n(user.language);
        await ctx.reply(i18n.t('channel.joinRequired', { channel: requiredChannel.username }), {
          parse_mode: 'HTML',
          reply_markup: InlineKeyboards.joinChannel(requiredChannel.url, requiredChannel.username),
        });
        return;
      }
    }

    // Start quiz creation scene
    await ctx.scene.enter('quiz-create');
  }

  /**
   * Handler for "Mustaqil ish" button (📄)
   */
  @Hears(/^📄.+$/)
  async onMustaqilIshButton(@Ctx() ctx: BotContext) {
    await this.startDocumentFlow(ctx, 'mustaqil_ish');
  }

  /**
   * Handler for "Referat" button (📚)
   */
  @Hears(/^📚.+$/)
  async onReferatButton(@Ctx() ctx: BotContext) {
    await this.startDocumentFlow(ctx, 'referat');
  }

  /**
   * Handler for "Insho/Essey" button (✍️)
   */
  @Hears(/^✍️.+$/)
  async onInshoButton(@Ctx() ctx: BotContext) {
    await this.startDocumentFlow(ctx, 'insho');
  }

  @Action('doc_create_mustaqil_ish')
  async onDocCreateMustaqilIsh(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startDocumentFlow(ctx, 'mustaqil_ish');
  }

  @Action('doc_create_referat')
  async onDocCreateReferat(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startDocumentFlow(ctx, 'referat');
  }

  @Action('doc_create_insho')
  async onDocCreateInsho(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startDocumentFlow(ctx, 'insho');
  }

  @Hears(/^📘.+$/)
  async onKursIshiButton(@Ctx() ctx: BotContext) {
    await this.startDocumentFlow(ctx, 'kurs_ishi');
  }

  @Hears(/^📰.+$/)
  async onMaqolaButton(@Ctx() ctx: BotContext) {
    await this.startDocumentFlow(ctx, 'maqola');
  }

  @Hears(/^📃.+$/)
  async onTezisButton(@Ctx() ctx: BotContext) {
    await this.startDocumentFlow(ctx, 'tezis');
  }

  @Action('doc_create_kurs_ishi')
  async onDocCreateKursIshi(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startDocumentFlow(ctx, 'kurs_ishi');
  }

  @Action('doc_create_maqola')
  async onDocCreateMaqola(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startDocumentFlow(ctx, 'maqola');
  }

  @Action('doc_create_tezis')
  async onDocCreateTezis(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startDocumentFlow(ctx, 'tezis');
  }

  /**
   * Handler for "Flesh kartalar" button (🎴)
   */
  @Hears(/^🎴.+$/)
  async onFlashcardButton(@Ctx() ctx: BotContext) {
    await this.startFlashcardFlow(ctx);
  }

  @Hears(/^📖.+$/)
  async onGlossaryButton(@Ctx() ctx: BotContext) {
    await this.startSceneWithChannelCheck(ctx, 'glossary-create');
  }

  @Hears(/^🧩.+$/)
  async onCrosswordButton(@Ctx() ctx: BotContext) {
    await this.startSceneWithChannelCheck(ctx, 'crossword-create');
  }

  @Hears(/^📇.+$/)
  async onResumeButton(@Ctx() ctx: BotContext) {
    await this.startSceneWithChannelCheck(ctx, 'resume-create');
  }

  @Action('resume_create')
  async onResumeCreate(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startSceneWithChannelCheck(ctx, 'resume-create');
  }

  @Action('glossary_create')
  async onGlossaryCreate(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startSceneWithChannelCheck(ctx, 'glossary-create');
  }

  @Action('crossword_create')
  async onCrosswordCreate(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startSceneWithChannelCheck(ctx, 'crossword-create');
  }

  /** Enter a scene after resolving the user and enforcing channel membership. */
  private async startSceneWithChannelCheck(ctx: BotContext, scene: string) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;
    const user = await this.telegramService.getUserByTelegramId(telegramUser.id.toString());
    if (!user) return;

    const requiredChannel = this.telegramService.getRequiredChannel();
    if (requiredChannel) {
      const isMember = await this.telegramService.isChannelMember(telegramUser.id);
      if (!isMember) {
        const i18n = this.telegramService.getI18n(user.language);
        await ctx.reply(i18n.t('channel.joinRequired', { channel: requiredChannel.username }), {
          parse_mode: 'HTML',
          reply_markup: InlineKeyboards.joinChannel(requiredChannel.url, requiredChannel.username),
        });
        return;
      }
    }

    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    await ctx.scene.enter(scene);
  }

  @Action('flashcard_create')
  async onFlashcardCreate(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.startFlashcardFlow(ctx);
  }

  private async startFlashcardFlow(ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const requiredChannel = this.telegramService.getRequiredChannel();
    if (requiredChannel) {
      const isMember = await this.telegramService.isChannelMember(telegramUser.id);
      if (!isMember) {
        const i18n = this.telegramService.getI18n(user.language);
        await ctx.reply(
          i18n.t('channel.joinRequired', { channel: requiredChannel.username }),
          {
            parse_mode: 'HTML',
            reply_markup: InlineKeyboards.joinChannel(requiredChannel.url, requiredChannel.username),
          },
        );
        return;
      }
    }

    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    await ctx.scene.enter('flashcard-create');
  }

  /** Flashcard viewer: flip to the answer side. */
  @Action(/^fcflip_(\d+)_(\d+)$/)
  async onFlashcardFlip(@Ctx() ctx: BotContext) {
    await this.showFlashcard(ctx, 'back');
  }

  /** Flashcard viewer: navigate to a card's question side. */
  @Action(/^fcnav_(\d+)_(\d+)$/)
  async onFlashcardNav(@Ctx() ctx: BotContext) {
    await this.showFlashcard(ctx, 'front');
  }

  @Action('fc_noop')
  async onFlashcardNoop(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
  }

  private async showFlashcard(ctx: BotContext, side: 'front' | 'back') {
    const cbq = ctx.callbackQuery;
    if (!cbq || !('data' in cbq)) return;
    const match = cbq.data.match(/^fc(?:flip|nav)_(\d+)_(\d+)$/);
    if (!match) return;

    const setId = parseInt(match[1], 10);
    const index = parseInt(match[2], 10);

    try {
      const set = await this.flashcardService.getSet(setId);
      const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
      const view = renderFlashcard(set, index, side, i18n);
      await ctx.answerCbQuery();
      await ctx.editMessageText(view.text, {
        parse_mode: 'HTML',
        reply_markup: view.keyboard,
      });
    } catch {
      await ctx.answerCbQuery();
    }
  }

  private async startDocumentFlow(
    ctx: BotContext,
    docType: 'mustaqil_ish' | 'referat' | 'insho' | 'kurs_ishi' | 'maqola' | 'tezis',
  ) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    // Check channel membership
    const requiredChannel = this.telegramService.getRequiredChannel();
    if (requiredChannel) {
      const isMember = await this.telegramService.isChannelMember(telegramUser.id);
      if (!isMember) {
        const i18n = this.telegramService.getI18n(user.language);
        await ctx.reply(
          i18n.t('channel.joinRequired', { channel: requiredChannel.username }),
          {
            parse_mode: 'HTML',
            reply_markup: InlineKeyboards.joinChannel(requiredChannel.url, requiredChannel.username),
          },
        );
        return;
      }
    }

    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    ctx.session.docType = docType;

    await ctx.scene.enter('document-create');
  }

  /**
   * Handler for "Language" button (🌐)
   */
  @Hears(/^🌐.+$/)
  async onLanguageButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    await ctx.reply(i18n.t('selectLanguage'), {
      reply_markup: InlineKeyboards.languageSelection(),
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

    const language = callbackQuery.data.replace('lang_', '') as SupportedLanguage;
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

    // Update reply keyboard with new language
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: ReplyKeyboards.mainMenu(i18n, this.miniAppUrl),
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

    const i18n = this.telegramService.getI18n(user.language);

    // Check channel membership
    const requiredChannel = this.telegramService.getRequiredChannel();
    if (requiredChannel) {
      const isMember = await this.telegramService.isChannelMember(telegramUser.id);
      if (!isMember) {
        await ctx.answerCbQuery();
        await ctx.reply(
          i18n.t('channel.joinRequired', { channel: requiredChannel.username }),
          {
            parse_mode: 'HTML',
            reply_markup: InlineKeyboards.joinChannel(requiredChannel.url, requiredChannel.username),
          }
        );
        return;
      }
    }

    ctx.session.userId = user.id;
    ctx.session.language = user.language;
    ctx.session.topic = undefined;
    ctx.session.studentName = undefined;
    ctx.session.teacherName = undefined;
    ctx.session.includeReja = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
    ctx.session.step = 'topic';

    await ctx.answerCbQuery();
    await ctx.reply(i18n.t('enterTopic'), { parse_mode: 'HTML' });
  }

  @Action('check_channel_membership')
  async onCheckChannelMembership(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);
    const requiredChannel = this.telegramService.getRequiredChannel();

    if (!requiredChannel) {
      await ctx.answerCbQuery();
      return;
    }

    // The user just claims to have joined — bypass any stale cached result.
    this.telegramService.invalidateMembership(telegramUser.id);
    const isMember = await this.telegramService.isChannelMember(telegramUser.id);

    if (isMember) {
      await ctx.answerCbQuery(i18n.t('channel.joined'));

      // Award referral bonus if eligible
      const channelUsername = requiredChannel.username.replace('@', '');
      await this.referralService.handleChannelJoin(user.id, channelUsername);

      await ctx.editMessageText(i18n.t('channel.joined'), { parse_mode: 'HTML' });

      // Show reply keyboard
      await ctx.reply(i18n.t('mainMenuText'), {
        reply_markup: ReplyKeyboards.mainMenu(i18n, this.miniAppUrl),
      });
    } else {
      await ctx.answerCbQuery(
        i18n.t('channel.notJoined', { channel: requiredChannel.username }),
        { show_alert: true }
      );
    }
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

    const humoCard = this.configService.get<string>('HUMO_CARD_NUMBER') || '9860 0000 0000 0000';
    const humoOwner = this.configService.get<string>('HUMO_CARD_OWNER') || 'SliderAI UZ';
    const uzcardCard = this.configService.get<string>('UZCARD_CARD_NUMBER') || '8600 0000 0000 0000';
    const uzcardOwner = this.configService.get<string>('UZCARD_CARD_OWNER') || 'SliderAI UZ';

    await ctx.answerCbQuery();
    await ctx.reply(i18n.t('paymentInstructions', { humoCard, humoOwner, uzcardCard, uzcardOwner }), { parse_mode: 'HTML' });
  }

  /**
   * Handler for "Invite friends" reply-keyboard button (🎁)
   */
  @Hears(/^🎁.+$/)
  async onInviteFriendsButton(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    await this.sendReferralInfo(ctx, user);
  }

  @Action('share_referral')
  async onShareReferral(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    await ctx.answerCbQuery();
    await this.sendReferralInfo(ctx, user);
  }

  /** Shared referral share card — used by both the inline and reply buttons. */
  private async sendReferralInfo(ctx: BotContext, user: any) {
    const i18n = this.telegramService.getI18n(user.language);
    const referralLink = this.telegramService.getReferralLink(user);
    const stats = await this.telegramService.getReferralStats(user.id);

    const message = i18n.t('referral.shareTitle', {
      count: stats.referralCount.toString(),
      earned: stats.totalEarned.toLocaleString(),
    });

    await ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard([
        [
          Markup.button.url(
            i18n.t('referral.shareButton'),
            `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('🎁 Kanalga qo\'shiling va 1,000 so\'m bonus oling!')}`,
          ),
        ],
        [Markup.button.callback(i18n.t('buttons.backToMenu'), 'back_to_menu')],
      ]).reply_markup,
    });

    // Also send the link as copyable text
    await ctx.reply(i18n.t('referral.yourReferralLink', { link: referralLink }), {
      parse_mode: 'HTML',
    });
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

    const theme = normalizeTheme(callbackQuery.data.replace('theme_', ''));
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
    ctx.session.studentName = undefined;
    ctx.session.teacherName = undefined;
    ctx.session.includeReja = undefined;
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
    ctx.session.step = undefined;

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('generationCancelled'));

    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: ReplyKeyboards.mainMenu(i18n, this.miniAppUrl),
    });
  }

  @Action('quiz_create')
  async onQuizCreate(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    // Check channel membership
    const requiredChannel = this.telegramService.getRequiredChannel();
    if (requiredChannel) {
      const isMember = await this.telegramService.isChannelMember(telegramUser.id);
      if (!isMember) {
        await ctx.answerCbQuery();
        const i18n = this.telegramService.getI18n(user.language);
        await ctx.reply(
          i18n.t('channel.joinRequired', { channel: requiredChannel.username }),
          {
            parse_mode: 'HTML',
            reply_markup: InlineKeyboards.joinChannel(requiredChannel.url, requiredChannel.username),
          }
        );
        return;
      }
    }

    ctx.session.userId = user.id;
    ctx.session.language = user.language;

    await ctx.answerCbQuery();
    await ctx.scene.enter('quiz-create');
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
