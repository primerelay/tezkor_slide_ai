import { Scene, SceneEnter, Ctx, On, Action } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import axios from 'axios';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';
import { FileToolsService } from '../../file-tools/file-tools.service';

type L = 'uz' | 'ru' | 'en';
const lang = (l?: string): L => (l === 'ru' || l === 'en' ? l : 'uz') as L;

const MULTI = new Set(['images_to_pdf', 'merge_pdf', 'zip']);
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB (Telegram bot download limit)

const OPS: { key: string; label: Record<L, string> }[] = [
  { key: 'images_to_pdf', label: { uz: '🖼 Rasmlardan PDF', ru: '🖼 Фото в PDF', en: '🖼 Images to PDF' } },
  { key: 'merge_pdf', label: { uz: '🔗 PDF larni birlashtirish', ru: '🔗 Объединить PDF', en: '🔗 Merge PDFs' } },
  { key: 'extract_pages', label: { uz: '✂️ Betlarni ajratib olish', ru: '✂️ Извлечь страницы', en: '✂️ Extract pages' } },
  { key: 'delete_pages', label: { uz: "❌ Keraksiz betlarni o'chirish", ru: '❌ Удалить страницы', en: '❌ Delete pages' } },
  { key: 'rotate', label: { uz: '🔄 Betlarni aylantirish', ru: '🔄 Повернуть страницы', en: '🔄 Rotate pages' } },
  { key: 'compress_image', label: { uz: '🗜 Rasmni siqish', ru: '🗜 Сжать фото', en: '🗜 Compress image' } },
  { key: 'zip', label: { uz: '🗂 ZIP arxiv', ru: '🗂 ZIP архив', en: '🗂 ZIP archive' } },
];

const M: Record<L, any> = {
  uz: {
    header: '🧰 <b>Fayl vositalari</b>\n\n<b>Bepul · cheksiz.</b> Kerakli amalni tanlang, keyin faylni yuboring (bittasi 20 MB gacha).',
    sendImages: '🖼 Rasmlarni yuboring (bir nechta bo‘lishi mumkin). Tugatgach «Tayyor» bosing.',
    sendPdfs: '🔗 PDF fayllarni yuboring (ketma-ket). Tugatgach «Tayyor» bosing.',
    sendPdf: '📄 PDF faylni yuboring.',
    sendImage: '🖼 Rasmni yuboring.',
    sendFiles: '🗂 Fayllarni yuboring. Tugatgach «Tayyor» bosing.',
    done: '✅ Tayyor',
    received: 'ta fayl qabul qilindi',
    tooBig: '⚠️ Fayl juda katta (20 MB dan oshmasin).',
    wrongPdf: '⚠️ Iltimos, PDF fayl yuboring.',
    wrongImage: '⚠️ Iltimos, rasm yuboring.',
    needFiles: '⚠️ Avval fayl yuboring.',
    pagesExtract: (n: number) => `📄 Jami ${n} bet. Qaysi betlarni olib qolamiz? Masalan: 1,3,5-7`,
    pagesDelete: (n: number) => `📄 Jami ${n} bet. Qaysi betlarni o‘chiramiz? Masalan: 2,5-7`,
    badPages: '⚠️ Betlarni to‘g‘ri kiriting. Masalan: 1,3,5-7',
    rotateAsk: 'Qaysi tomonga aylantiramiz?',
    left: '⟲ 90° chapga',
    right: '⟳ 90° o‘ngga',
    flip: '180°',
    processing: '⏳ Ishlanmoqda…',
    resultCaption: '✅ Tayyor · SliderAI.uz',
    error: '⚠️ Xatolik. Faylни tekshirib, qayta urinib ko‘ring.',
    cancelled: 'Bekor qilindi.',
  },
  ru: {
    header: '🧰 <b>Файл-инструменты</b>\n\n<b>Бесплатно · без лимита.</b> Выберите действие, затем отправьте файл (до 20 МБ).',
    sendImages: '🖼 Отправьте фото (можно несколько). Затем нажмите «Готово».',
    sendPdfs: '🔗 Отправьте PDF файлы. Затем нажмите «Готово».',
    sendPdf: '📄 Отправьте PDF файл.',
    sendImage: '🖼 Отправьте фото.',
    sendFiles: '🗂 Отправьте файлы. Затем нажмите «Готово».',
    done: '✅ Готово',
    received: 'файл(ов) получено',
    tooBig: '⚠️ Файл слишком большой (до 20 МБ).',
    wrongPdf: '⚠️ Отправьте, пожалуйста, PDF.',
    wrongImage: '⚠️ Отправьте, пожалуйста, изображение.',
    needFiles: '⚠️ Сначала отправьте файл.',
    pagesExtract: (n: number) => `📄 Всего ${n} стр. Какие оставить? Например: 1,3,5-7`,
    pagesDelete: (n: number) => `📄 Всего ${n} стр. Какие удалить? Например: 2,5-7`,
    badPages: '⚠️ Укажите страницы верно. Например: 1,3,5-7',
    rotateAsk: 'В какую сторону повернуть?',
    left: '⟲ 90° влево',
    right: '⟳ 90° вправо',
    flip: '180°',
    processing: '⏳ Обработка…',
    resultCaption: '✅ Готово · SliderAI.uz',
    error: '⚠️ Ошибка. Проверьте файл и попробуйте снова.',
    cancelled: 'Отменено.',
  },
  en: {
    header: '🧰 <b>File tools</b>\n\n<b>Free · unlimited.</b> Choose an action, then send the file (up to 20 MB).',
    sendImages: '🖼 Send images (several allowed). Then tap “Done”.',
    sendPdfs: '🔗 Send PDF files. Then tap “Done”.',
    sendPdf: '📄 Send the PDF file.',
    sendImage: '🖼 Send the image.',
    sendFiles: '🗂 Send the files. Then tap “Done”.',
    done: '✅ Done',
    received: 'file(s) received',
    tooBig: '⚠️ File is too big (max 20 MB).',
    wrongPdf: '⚠️ Please send a PDF file.',
    wrongImage: '⚠️ Please send an image.',
    needFiles: '⚠️ Send a file first.',
    pagesExtract: (n: number) => `📄 ${n} pages total. Which to keep? e.g. 1,3,5-7`,
    pagesDelete: (n: number) => `📄 ${n} pages total. Which to delete? e.g. 2,5-7`,
    badPages: '⚠️ Enter pages correctly. e.g. 1,3,5-7',
    rotateAsk: 'Which way to rotate?',
    left: '⟲ 90° left',
    right: '⟳ 90° right',
    flip: '180°',
    processing: '⏳ Processing…',
    resultCaption: '✅ Done · SliderAI.uz',
    error: '⚠️ Error. Check the file and try again.',
    cancelled: 'Cancelled.',
  },
};

@Scene('file-tools')
export class FileToolsScene {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly fileTools: FileToolsService,
  ) {}

  private menu(L: L) {
    return Markup.inlineKeyboard(OPS.map((o) => [Markup.button.callback(o.label[L], `ft_op_${o.key}`)])).reply_markup;
  }

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const L = lang(ctx.session.language);
    ctx.session.fileTool = { files: [] };
    await ctx.reply(M[L].header, { parse_mode: 'HTML', reply_markup: this.menu(L) });
  }

  @Action(/^ft_op_(.+)$/)
  async onOp(@Ctx() ctx: any) {
    const L = lang(ctx.session.language);
    const op = ctx.match[1] as string;
    ctx.session.fileTool = { op, files: [] };
    await ctx.answerCbQuery();
    const prompt =
      op === 'images_to_pdf' ? M[L].sendImages :
      op === 'merge_pdf' ? M[L].sendPdfs :
      op === 'zip' ? M[L].sendFiles :
      op === 'compress_image' ? M[L].sendImage :
      M[L].sendPdf;
    await ctx.editMessageText(prompt).catch(() => ctx.reply(prompt));
  }

  private doneButton(L: L) {
    return Markup.inlineKeyboard([[Markup.button.callback(M[L].done, 'ft_done')]]).reply_markup;
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: any) {
    const L = lang(ctx.session.language);
    const st = ctx.session.fileTool;
    if (!st?.op) return;
    if (!['images_to_pdf', 'compress_image', 'zip'].includes(st.op)) {
      await ctx.reply(M[L].wrongImage);
      return;
    }
    const photos = ctx.message.photo;
    const largest = photos[photos.length - 1];
    if (largest.file_size && largest.file_size > MAX_BYTES) { await ctx.reply(M[L].tooBig); return; }
    await this.addFile(ctx, largest.file_id, `image_${(st.files?.length || 0) + 1}.jpg`);
  }

  @On('document')
  async onDocument(@Ctx() ctx: any) {
    const L = lang(ctx.session.language);
    const st = ctx.session.fileTool;
    if (!st?.op) return;
    const doc = ctx.message.document;
    if (doc.file_size && doc.file_size > MAX_BYTES) { await ctx.reply(M[L].tooBig); return; }
    const mime = doc.mime_type || '';
    const isPdf = mime === 'application/pdf' || (doc.file_name || '').toLowerCase().endsWith('.pdf');
    const isImage = mime.startsWith('image/');

    if (['merge_pdf', 'extract_pages', 'delete_pages', 'rotate'].includes(st.op) && !isPdf) {
      await ctx.reply(M[L].wrongPdf); return;
    }
    if (st.op === 'compress_image' && !isImage) { await ctx.reply(M[L].wrongImage); return; }

    await this.addFile(ctx, doc.file_id, doc.file_name || 'file');
  }

  /** Route an incoming file into the current operation. */
  private async addFile(ctx: any, fileId: string, name: string) {
    const L = lang(ctx.session.language);
    const st = ctx.session.fileTool;

    // Multi-file operations: collect, show progress + Done.
    if (MULTI.has(st.op)) {
      st.files = st.files || [];
      st.files.push({ fileId, name });
      await ctx.reply(`📎 ${st.files.length} ${M[L].received}`, { reply_markup: this.doneButton(L) });
      return;
    }

    // Single-file operations.
    if (st.op === 'compress_image') {
      await ctx.reply(M[lang(ctx.session.language)].processing);
      await this.processCompress(ctx, fileId);
      return;
    }
    if (st.op === 'rotate') {
      st.pdfFileId = fileId;
      await ctx.reply(M[L].rotateAsk, {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback(M[L].left, 'ft_rot_270'), Markup.button.callback(M[L].right, 'ft_rot_90')],
          [Markup.button.callback(M[L].flip, 'ft_rot_180')],
        ]).reply_markup,
      });
      return;
    }
    if (st.op === 'extract_pages' || st.op === 'delete_pages') {
      try {
        const buf = await this.downloadCtx(ctx, fileId);
        const count = await this.fileTools.pdfPageCount(buf);
        st.pdfFileId = fileId;
        st.pdfPageCount = count;
        st.awaiting = st.op === 'extract_pages' ? 'pages_extract' : 'pages_delete';
        await ctx.reply(
          st.op === 'extract_pages' ? M[L].pagesExtract(count) : M[L].pagesDelete(count),
        );
      } catch {
        await ctx.reply(M[L].error);
      }
      return;
    }
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const message = ctx.message;
    if (!message || !('text' in message)) return;
    const text = message.text.trim();
    const L = lang(ctx.session.language);
    const st = ctx.session.fileTool;

    if (text === '/cancel' || text === '/bekor') {
      ctx.session.fileTool = undefined;
      await ctx.reply(M[L].cancelled, {
        reply_markup: InlineKeyboards.featuresMenu(
          this.telegramService.getI18n(ctx.session.language || 'uz'),
          this.telegramService.getMiniAppUrl(),
        ),
      });
      await ctx.scene.leave();
      return;
    }

    if (!st?.awaiting || !st.pdfFileId || !st.pdfPageCount) return;

    const pages = this.fileTools.parsePages(text, st.pdfPageCount);
    if (!pages.length) { await ctx.reply(M[L].badPages); return; }

    await ctx.reply(M[L].processing);
    try {
      const buf = await this.downloadCtx(ctx, st.pdfFileId);
      const out =
        st.awaiting === 'pages_extract'
          ? await this.fileTools.extractPages(buf, pages)
          : await this.fileTools.deletePages(buf, pages);
      await ctx.replyWithDocument({ source: out, filename: 'edited.pdf' }, { caption: M[L].resultCaption });
      await this.finish(ctx);
    } catch {
      await ctx.reply(M[L].error);
    }
  }

  @Action(/^ft_rot_(\d+)$/)
  async onRotate(@Ctx() ctx: any) {
    const L = lang(ctx.session.language);
    const st = ctx.session.fileTool;
    if (!st?.pdfFileId) { await ctx.answerCbQuery(); return; }
    const deg = parseInt(ctx.match[1], 10);
    await ctx.answerCbQuery();
    await ctx.reply(M[L].processing);
    try {
      const buf = await this.downloadCtx(ctx, st.pdfFileId);
      const out = await this.fileTools.rotatePages(buf, deg);
      await ctx.replyWithDocument({ source: out, filename: 'rotated.pdf' }, { caption: M[L].resultCaption });
      await this.finish(ctx);
    } catch {
      await ctx.reply(M[L].error);
    }
  }

  @Action('ft_done')
  async onDone(@Ctx() ctx: any) {
    const L = lang(ctx.session.language);
    const st = ctx.session.fileTool;
    await ctx.answerCbQuery();
    if (!st?.op || !st.files?.length) { await ctx.reply(M[L].needFiles); return; }
    await ctx.reply(M[L].processing);
    try {
      const buffers = await Promise.all(st.files.map((f: any) => this.downloadCtx(ctx, f.fileId)));
      let out: Buffer;
      let filename: string;
      if (st.op === 'images_to_pdf') { out = await this.fileTools.imagesToPdf(buffers); filename = 'images.pdf'; }
      else if (st.op === 'merge_pdf') { out = await this.fileTools.mergePdfs(buffers); filename = 'merged.pdf'; }
      else {
        out = await this.fileTools.zipFiles(st.files.map((f: any, i: number) => ({ name: f.name || `file_${i + 1}`, buffer: buffers[i] })));
        filename = 'archive.zip';
      }
      await ctx.replyWithDocument({ source: out, filename }, { caption: M[L].resultCaption });
      await this.finish(ctx);
    } catch {
      await ctx.reply(M[L].error);
    }
  }

  private async processCompress(ctx: any, fileId: string) {
    const L = lang(ctx.session.language);
    try {
      const buf = await this.downloadCtx(ctx, fileId);
      const out = await this.fileTools.compressImage(buf);
      await ctx.replyWithDocument({ source: out, filename: 'compressed.jpg' }, { caption: M[L].resultCaption });
      await this.finish(ctx);
    } catch {
      await ctx.reply(M[L].error);
    }
  }

  private async downloadCtx(ctx: any, fileId: string): Promise<Buffer> {
    const link = await ctx.telegram.getFileLink(fileId);
    const res = await axios.get((link as URL).href || String(link), {
      responseType: 'arraybuffer',
      timeout: 60000,
    });
    return Buffer.from(res.data);
  }

  private async finish(ctx: any) {
    const L = lang(ctx.session.language);
    ctx.session.fileTool = undefined;
    await ctx.reply(M[L].header, { parse_mode: 'HTML', reply_markup: this.menu(L) });
  }
}
