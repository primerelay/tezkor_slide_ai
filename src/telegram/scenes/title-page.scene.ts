import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { TitlePageService } from '../../title-page/title-page.service';

type L = 'uz' | 'ru' | 'en';

const WORK_TYPES: { key: string; label: Record<L, string> }[] = [
  { key: 'mustaqil_ish', label: { uz: 'Mustaqil ish', ru: 'Самост. работа', en: 'Independent work' } },
  { key: 'referat', label: { uz: 'Referat', ru: 'Реферат', en: 'Essay' } },
  { key: 'kurs_ishi', label: { uz: 'Kurs ishi', ru: 'Курсовая', en: 'Coursework' } },
  { key: 'insho', label: { uz: 'Insho', ru: 'Эссе', en: 'Essay' } },
  { key: 'maqola', label: { uz: 'Maqola', ru: 'Статья', en: 'Article' } },
  { key: 'tezis', label: { uz: 'Tezis', ru: 'Тезис', en: 'Thesis' } },
  { key: 'laboratoriya', label: { uz: 'Laboratoriya ishi', ru: 'Лаб. работа', en: 'Lab work' } },
  { key: 'amaliy', label: { uz: 'Amaliy ish', ru: 'Практ. работа', en: 'Practical work' } },
];

const P: Record<L, Record<string, string>> = {
  uz: {
    chooseType: "📄 <b>Titul varag'i</b>\n\nIsh turini tanlang:",
    other: 'Boshqa…',
    typeCustom: 'Ish turini yozing:',
    topic: 'Mavzuni kiriting:',
    author: "Bajaruvchi ism-familiyasi:\n<i>(o'tkazish uchun «-» yuboring)</i>",
    group: "Guruh:\n<i>(o'tkazish uchun «-»)</i>",
    university: "Universitet nomi:\n<i>(o'tkazish uchun «-»)</i>",
    advisor: "Qabul qildi / Ilmiy rahbar:\n<i>(o'tkazish uchun «-»)</i>",
    city: 'Shahar (masalan: Toshkent):',
    creating: "⏳ Titul varag'i tayyorlanmoqda…",
    done: "✅ Titul varag'i tayyor!",
    caption: "📄 Titul varag'i · SliderAI.uz",
    cancelled: 'Bekor qilindi.',
    error: 'Xatolik yuz berdi. Qayta urinib ko‘ring.',
  },
  ru: {
    chooseType: '📄 <b>Титульный лист</b>\n\nВыберите тип работы:',
    other: 'Другое…',
    typeCustom: 'Введите тип работы:',
    topic: 'Введите тему:',
    author: 'ФИО исполнителя:\n<i>(«-» чтобы пропустить)</i>',
    group: 'Группа:\n<i>(«-» чтобы пропустить)</i>',
    university: 'Название университета:\n<i>(«-» чтобы пропустить)</i>',
    advisor: 'Принял / Науч. руководитель:\n<i>(«-» чтобы пропустить)</i>',
    city: 'Город (например: Ташкент):',
    creating: '⏳ Готовим титульный лист…',
    done: '✅ Титульный лист готов!',
    caption: '📄 Титульный лист · SliderAI.uz',
    cancelled: 'Отменено.',
    error: 'Произошла ошибка. Попробуйте снова.',
  },
  en: {
    chooseType: '📄 <b>Title page</b>\n\nChoose the work type:',
    other: 'Other…',
    typeCustom: 'Type the work type:',
    topic: 'Enter the topic:',
    author: 'Author full name:\n<i>(send «-» to skip)</i>',
    group: 'Group:\n<i>(send «-» to skip)</i>',
    university: 'University name:\n<i>(send «-» to skip)</i>',
    advisor: 'Accepted by / Advisor:\n<i>(send «-» to skip)</i>',
    city: 'City (e.g. Tashkent):',
    creating: '⏳ Preparing the title page…',
    done: '✅ Title page is ready!',
    caption: '📄 Title page · SliderAI.uz',
    cancelled: 'Cancelled.',
    error: 'Something went wrong. Please try again.',
  },
};

function lang(l?: string): L {
  return (l === 'ru' || l === 'en' ? l : 'uz') as L;
}

@Scene('title-page')
export class TitlePageScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly titlePageService: TitlePageService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const L = lang(ctx.session.language);
    ctx.session.titul = undefined;
    const rows = WORK_TYPES.map((w) => [Markup.button.callback(w.label[L], `titw_${w.key}`)]);
    rows.push([Markup.button.callback(P[L].other, 'titw_other')]);
    await ctx.reply(P[L].chooseType, {
      parse_mode: 'HTML',
      reply_markup: Markup.inlineKeyboard(rows).reply_markup,
    });
  }

  @Action(/^titw_(.+)$/)
  async onWorkType(@Ctx() ctx: any) {
    const L = lang(ctx.session.language);
    const key = ctx.match[1] as string;
    await ctx.answerCbQuery();
    if (key === 'other') {
      ctx.session.titul = { step: 'workTypeCustom' };
      await ctx.editMessageText(P[L].typeCustom);
      return;
    }
    const wt = WORK_TYPES.find((w) => w.key === key);
    ctx.session.titul = { step: 'topic', workType: wt ? wt.label[L] : key };
    await ctx.editMessageText(P[L].topic);
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;
    const text = message.text.trim();
    const L = lang(ctx.session.language);
    const s = ctx.session.titul;
    if (!s) return;

    if (text === '/cancel' || text === '/bekor') {
      ctx.session.titul = undefined;
      await ctx.reply(P[L].cancelled, {
        reply_markup: InlineKeyboards.featuresMenu(
          this.telegramService.getI18n(ctx.session.language || 'uz'),
          this.telegramService.getMiniAppUrl(),
        ),
      });
      await ctx.scene.leave();
      return;
    }

    const skip = text === '-';

    switch (s.step) {
      case 'workTypeCustom':
        s.workType = text;
        s.step = 'topic';
        await ctx.reply(P[L].topic);
        return;
      case 'topic':
        s.topic = text;
        s.step = 'author';
        await ctx.reply(P[L].author, { parse_mode: 'HTML' });
        return;
      case 'author':
        if (!skip) s.author = text;
        s.step = 'group';
        await ctx.reply(P[L].group, { parse_mode: 'HTML' });
        return;
      case 'group':
        if (!skip) s.group = text;
        s.step = 'university';
        await ctx.reply(P[L].university, { parse_mode: 'HTML' });
        return;
      case 'university':
        if (!skip) s.university = text;
        s.step = 'advisor';
        await ctx.reply(P[L].advisor, { parse_mode: 'HTML' });
        return;
      case 'advisor':
        if (!skip) s.advisor = text;
        s.step = 'city';
        await ctx.reply(P[L].city);
        return;
      case 'city': {
        if (!skip) s.city = text;
        await this.generate(ctx);
        return;
      }
    }
  }

  private async generate(ctx: BotContext) {
    const L = lang(ctx.session.language);
    const s = ctx.session.titul;
    if (!s) return;
    await ctx.reply(P[L].creating);
    try {
      const buffer = await this.titlePageService.renderDocx({
        language: ctx.session.language,
        workType: s.workType || 'Mustaqil ish',
        topic: s.topic,
        author: s.author,
        group: s.group,
        university: s.university,
        advisor: s.advisor,
        city: s.city,
      });
      await ctx.replyWithDocument(
        { source: buffer, filename: 'titul.docx' },
        { caption: P[L].caption },
      );
      await ctx.reply(P[L].done, {
        reply_markup: InlineKeyboards.featuresMenu(
          this.telegramService.getI18n(ctx.session.language || 'uz'),
          this.telegramService.getMiniAppUrl(),
        ),
      });
    } catch {
      await ctx.reply(P[L].error);
    }
    ctx.session.titul = undefined;
    await ctx.scene.leave();
  }
}
