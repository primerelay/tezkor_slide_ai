import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { ResumeService } from '../../resume/resume.service';

@Scene('resume-create')
export class ResumeCreateScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly resumeService: ResumeService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    ctx.session.resumeStep = 'name';
    ctx.session.resumeName = undefined;
    ctx.session.resumePosition = undefined;
    ctx.session.resumeContact = undefined;
    ctx.session.resumeBackground = undefined;
    await ctx.reply(i18n.t('resume.enterName'), { parse_mode: 'HTML' });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;
    const text = message.text.trim();
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');

    if (text === '/cancel') {
      await ctx.reply(i18n.t('resume.cancelled'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
      await ctx.scene.leave();
      return;
    }

    const step = ctx.session.resumeStep;

    if (step === 'name') {
      if (text.length < 3) {
        await ctx.reply(i18n.t('nameTooShort'));
        return;
      }
      ctx.session.resumeName = text;
      ctx.session.resumeStep = 'position';
      await ctx.reply(i18n.t('resume.enterPosition'), { parse_mode: 'HTML' });
      return;
    }

    if (step === 'position') {
      if (text.length < 2) return;
      ctx.session.resumePosition = text;
      ctx.session.resumeStep = 'contact';
      await ctx.reply(i18n.t('resume.enterContact'), { parse_mode: 'HTML' });
      return;
    }

    if (step === 'contact') {
      ctx.session.resumeContact = text === '-' ? '' : text;
      ctx.session.resumeStep = 'background';
      await ctx.reply(i18n.t('resume.enterBackground'), { parse_mode: 'HTML' });
      return;
    }

    if (step === 'background') {
      if (text.length < 15) {
        await ctx.reply(i18n.t('resume.enterBackground'), { parse_mode: 'HTML' });
        return;
      }
      ctx.session.resumeBackground = text;

      const user = await this.telegramService.getUserByTelegramId(ctx.from!.id.toString());
      if (!user) return;
      const price = this.resumeService.getPrice();

      if (user.credits < price) {
        await ctx.reply(i18n.t('quiz.insufficientBalance', { price, balance: user.credits }));
        await ctx.scene.leave();
        return;
      }

      await ctx.reply(
        i18n.t('resume.confirmCreation', {
          name: ctx.session.resumeName || '',
          position: ctx.session.resumePosition || '',
          price: price.toLocaleString(),
          balance: user.credits.toLocaleString(),
        }),
        {
          parse_mode: 'HTML',
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback(i18n.t('buttons.confirm'), 'resume_confirm')],
            [Markup.button.callback(i18n.t('buttons.cancel'), 'resume_cancel')],
          ]).reply_markup,
        },
      );
      return;
    }
  }

  @Action('resume_confirm')
  async onConfirm(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;
    const user = await this.telegramService.getUserByTelegramId(telegramUser.id.toString());
    if (!user) return;
    const i18n = this.telegramService.getI18n(user.language);

    const { resumeName, resumePosition, resumeContact, resumeBackground } = ctx.session;
    if (!resumeName || !resumePosition || !resumeBackground) {
      await ctx.answerCbQuery(i18n.t('missingData'), { show_alert: true });
      await ctx.scene.leave();
      return;
    }

    // Split the free-form contact line into phone / email / location.
    const parts = (resumeContact || '').split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    const email = parts.find((p) => p.includes('@'));
    const phone = parts.find((p) => /[+\d]{6,}/.test(p) && !p.includes('@'));
    const location = parts.find((p) => p !== email && p !== phone);

    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('resume.creating'));

    try {
      await this.resumeService.create(
        user.id,
        {
          fullName: resumeName,
          position: resumePosition,
          phone,
          email,
          location,
          rawBackground: resumeBackground,
          language: user.language || 'uz',
        },
        user.telegramId,
      );
      await ctx.reply(i18n.t('resume.done'), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
    } catch (error) {
      await ctx.reply(i18n.t('resume.error', { error: error instanceof Error ? error.message : 'Error' }), {
        reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
      });
    }

    ctx.session.resumeStep = undefined;
    ctx.session.resumeName = undefined;
    ctx.session.resumePosition = undefined;
    ctx.session.resumeContact = undefined;
    ctx.session.resumeBackground = undefined;
    await ctx.scene.leave();
  }

  @Action('resume_cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    const i18n = this.telegramService.getI18n(ctx.session.language || 'uz');
    await ctx.answerCbQuery();
    await ctx.editMessageText(i18n.t('resume.cancelled'));
    await ctx.reply(i18n.t('mainMenuText'), {
      reply_markup: InlineKeyboards.featuresMenu(i18n, this.telegramService.getMiniAppUrl()),
    });
    await ctx.scene.leave();
  }
}
