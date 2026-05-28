import { Update, Ctx, Start, Command, On, Action } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';
import { TelegramService } from './telegram.service';
import { InlineKeyboards } from './keyboards/inline.keyboards';
import { JobEventsService } from '../queue/events/job.events';

interface SessionData extends Scenes.SceneSession {
  language?: 'uz' | 'ru' | 'en';
  topic?: string;
  slideCount?: number;
  theme?: 'academic_blue' | 'minimal_white' | 'modern_dark';
  userId?: number;
}

export interface BotContext extends Context {
  session: SessionData;
  scene: Scenes.SceneContextScene<BotContext>;
}

@Update()
export class TelegramUpdate {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly jobEventsService: JobEventsService,
  ) {}

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

    const i18n = this.telegramService.getI18n(user.language);

    await ctx.reply(i18n.t('welcome', { name: user.firstName || 'User' }), {
      parse_mode: 'HTML',
      reply_markup: InlineKeyboards.mainMenu(i18n),
    });
  }

  @Command('language')
  async onLanguage(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.reply(i18n.t('selectLanguage'), {
      reply_markup: InlineKeyboards.languageSelection(),
    });
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
      reply_markup: InlineKeyboards.mainMenu(i18n),
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
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;

    const i18n = this.telegramService.getI18n(user.language);

    await ctx.answerCbQuery();
    await ctx.reply(i18n.t('enterTopic'), { parse_mode: 'HTML' });
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

    if (user.credits < 1) {
      await ctx.answerCbQuery(i18n.t('insufficientCredits'), { show_alert: true });
      return;
    }

    const { topic, slideCount, theme, language } = ctx.session;

    if (!topic || !slideCount || !theme) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      return;
    }

    await this.telegramService.deductCredits(user.id, 1);

    const presentation = await this.telegramService.createPresentation({
      userId: user.id,
      topic,
      slideCount,
      theme,
      language: language || 'uz',
    });

    await this.jobEventsService.addPresentationJob({
      presentationId: presentation.id,
      userId: user.id,
      topic,
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
    ctx.session.slideCount = undefined;
    ctx.session.theme = undefined;
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
      reply_markup: InlineKeyboards.mainMenu(i18n),
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

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);

    if (!ctx.session.topic) {
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

      await ctx.reply(i18n.t('topicReceived', { topic: text }), {
        parse_mode: 'HTML',
      });

      await ctx.reply(i18n.t('selectSlideCount'), {
        reply_markup: InlineKeyboards.slideCountSelection(i18n),
      });
    }
  }
}
