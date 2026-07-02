import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { DocumentService, priceTableFor } from '../../document/document.service';
import { DocumentType } from '../../database/entities/document.entity';

@Scene('document-create')
export class DocumentCreateScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly documentService: DocumentService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    // docType is set by the entry handler before entering the scene.
    const docType = ctx.session.docType || 'mustaqil_ish';

    ctx.session.docStep = 'topic';
    ctx.session.docTopic = undefined;
    ctx.session.docInstitution = undefined;
    ctx.session.docStudentName = undefined;
    ctx.session.docTeacherName = undefined;
    ctx.session.docPageCount = undefined;

    await ctx.reply(
      i18n.t('document.enterTopic', { type: i18n.t(`document.typeNames.${docType}`) }),
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
      await ctx.reply(i18n.t('document.cancelled'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
      await ctx.scene.leave();
      return;
    }

    const step = ctx.session.docStep;

    if (step === 'topic') {
      if (text.length < 5) {
        await ctx.reply(i18n.t('topicTooShort'));
        return;
      }
      if (text.length > 500) {
        await ctx.reply(i18n.t('topicTooLong'));
        return;
      }

      ctx.session.docTopic = text;
      const dType = ctx.session.docType || 'mustaqil_ish';

      // Essays are pure prose — skip straight to length.
      if (dType === 'insho') {
        ctx.session.docStep = 'pages';
        await ctx.reply(i18n.t('document.selectPageCount'), {
          parse_mode: 'HTML',
          reply_markup: this.pageCountKeyboard(i18n, 'insho'),
        });
        return;
      }

      // Articles/theses need only an author name, not institution/teacher.
      if (dType === 'maqola' || dType === 'tezis') {
        ctx.session.docStep = 'student_name';
        await ctx.reply(i18n.t('enterStudentName'), { parse_mode: 'HTML' });
        return;
      }

      ctx.session.docStep = 'institution';
      await ctx.reply(i18n.t('document.enterInstitution'), {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(i18n.t('document.skipButton'), 'doc_skip_institution')],
        ]).reply_markup,
      });
      return;
    }

    if (step === 'institution') {
      ctx.session.docInstitution = text.length >= 3 ? text : undefined;
      ctx.session.docStep = 'student_name';
      await ctx.reply(i18n.t('enterStudentName'), { parse_mode: 'HTML' });
      return;
    }

    if (step === 'student_name') {
      if (text.length < 2) {
        await ctx.reply(i18n.t('nameTooShort'));
        return;
      }
      ctx.session.docStudentName = text;

      // Articles/theses go straight to length after the author name.
      const dType = ctx.session.docType || 'mustaqil_ish';
      if (dType === 'maqola' || dType === 'tezis') {
        ctx.session.docStep = 'pages';
        await ctx.reply(i18n.t('document.selectPageCount'), {
          parse_mode: 'HTML',
          reply_markup: this.pageCountKeyboard(i18n, dType),
        });
        return;
      }

      ctx.session.docStep = 'teacher_name';
      await ctx.reply(i18n.t('enterTeacherName'), { parse_mode: 'HTML' });
      return;
    }

    if (step === 'teacher_name') {
      if (text.length < 2) {
        await ctx.reply(i18n.t('nameTooShort'));
        return;
      }
      ctx.session.docTeacherName = text;
      ctx.session.docStep = 'pages';

      await ctx.reply(i18n.t('document.selectPageCount'), {
        parse_mode: 'HTML',
        reply_markup: this.pageCountKeyboard(i18n, ctx.session.docType || 'mustaqil_ish'),
      });
      return;
    }
  }

  private pageCountKeyboard(
    i18n: ReturnType<TelegramService['getI18n']>,
    docType: DocumentType,
  ) {
    const pagesWord = i18n.t('document.pagesShort');
    const entries = Object.entries(priceTableFor(docType));
    const rows = [];
    for (let i = 0; i < entries.length; i += 2) {
      rows.push(
        entries.slice(i, i + 2).map(([pages, price]) =>
          Markup.button.callback(
            `${pages} ${pagesWord} - ${Number(price).toLocaleString()}`,
            `doc_pages_${pages}`,
          ),
        ),
      );
    }
    return Markup.inlineKeyboard(rows).reply_markup;
  }

  @Action('doc_skip_institution')
  async onSkipInstitution(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    ctx.session.docInstitution = undefined;
    ctx.session.docStep = 'student_name';

    await ctx.answerCbQuery();
    await ctx.reply(i18n.t('enterStudentName'), { parse_mode: 'HTML' });
  }

  @Action(/doc_pages_(\d+)/)
  async onPageCount(@Ctx() ctx: any) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const match = ctx.match;
    if (!match) return;

    const pageCount = parseInt(match[1], 10);
    ctx.session.docPageCount = pageCount;

    const docType = ctx.session.docType || 'mustaqil_ish';
    const price = this.documentService.getPrice(docType, pageCount);
    const i18n = this.telegramService.getI18n(user.language);

    if (user.credits < price) {
      await ctx.answerCbQuery(
        i18n.t('quiz.insufficientBalance', { price, balance: user.credits }),
        { show_alert: true },
      );
      await ctx.reply(i18n.t('quiz.topupInstruction'));
      await ctx.scene.leave();
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      i18n.t('document.confirmCreation', {
        type: i18n.t(`document.typeNames.${docType}`),
        topic: ctx.session.docTopic || '',
        pages: pageCount,
        price: price.toLocaleString(),
        balance: user.credits.toLocaleString(),
      }),
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(i18n.t('buttons.confirm'), 'doc_confirm')],
          [Markup.button.callback(i18n.t('buttons.cancel'), 'doc_cancel')],
        ]).reply_markup,
      },
    );
  }

  @Action('doc_confirm')
  async onConfirm(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.getUserByTelegramId(
      telegramUser.id.toString(),
    );
    if (!user) return;

    const i18n = this.telegramService.getI18n(user.language);
    const { docType, docTopic, docPageCount } = ctx.session;

    if (!docType || !docTopic || !docPageCount) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      await ctx.scene.leave();
      return;
    }

    const price = this.documentService.getPrice(docType as DocumentType, docPageCount);

    const deducted = await this.telegramService.deductCredits(user.id, price);
    if (!deducted) {
      await ctx.answerCbQuery(i18n.t('insufficientCredits'), { show_alert: true });
      await ctx.scene.leave();
      return;
    }

    try {
      const document = await this.documentService.createDocument({
        userId: user.id,
        topic: docTopic,
        docType: docType as DocumentType,
        pageCount: docPageCount,
        language: user.language || 'uz',
        institution: ctx.session.docInstitution,
        studentName: ctx.session.docStudentName,
        teacherName: ctx.session.docTeacherName,
        price,
        telegramChatId: ctx.chat?.id.toString(),
      });

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        i18n.t('document.creationStarted', { id: document.id.substring(0, 8) }),
        { parse_mode: 'HTML' },
      );
    } catch (error) {
      // Queueing failed before any work started — give the money back.
      await this.telegramService.addCredits(user.id, price);
      await ctx.reply(
        i18n.t('quiz.creationError', {
          error: error instanceof Error ? error.message : 'Error',
        }),
        {
          reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
        },
      );
    }

    ctx.session.docType = undefined;
    ctx.session.docTopic = undefined;
    ctx.session.docInstitution = undefined;
    ctx.session.docStudentName = undefined;
    ctx.session.docTeacherName = undefined;
    ctx.session.docPageCount = undefined;
    ctx.session.docStep = undefined;

    await ctx.scene.leave();
  }

  @Action('doc_cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('document.cancelled'));
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
    });
    await ctx.scene.leave();
  }
}
