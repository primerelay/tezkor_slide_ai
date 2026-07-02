import { Markup } from 'telegraf';
import { I18nService } from '../../common/i18n/i18n.service';
import { THEME_META } from '../../renderer/themes/theme-registry';

export class ReplyKeyboards {
  /**
   * Persistent main menu keyboard (always visible at bottom)
   */
  static mainMenu(i18n: I18nService, webAppUrl?: string) {
    const keyboard: any[] = [];

    // Web App opener at the top (only works when an HTTPS URL is configured).
    if (webAppUrl) {
      keyboard.push([Markup.button.webApp(i18n.t('buttons.openWebApp'), webAppUrl)]);
    }

    keyboard.push(
      [i18n.t('buttons.newPresentation'), i18n.t('buttons.myPresentations')],
      [i18n.t('buttons.mustaqilIsh'), i18n.t('buttons.referat')],
      [i18n.t('buttons.kursIshi'), i18n.t('buttons.maqola')],
      [i18n.t('buttons.tezis'), i18n.t('buttons.insho')],
      [i18n.t('buttons.flashcard'), i18n.t('buttons.quizBot')],
      [i18n.t('buttons.glossary'), i18n.t('buttons.crossword')],
      [i18n.t('buttons.resume'), i18n.t('buttons.inviteFriends')],
      [i18n.t('buttons.balance'), i18n.t('buttons.addBalance')],
      [i18n.t('buttons.language')],
    );

    return Markup.keyboard(keyboard).resize().reply_markup;
  }
}

export class InlineKeyboards {
  static languageSelection() {
    return Markup.inlineKeyboard([
      [Markup.button.callback("🇺🇿 O'zbekcha", 'lang_uz')],
      [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
      [Markup.button.callback('🇬🇧 English', 'lang_en')],
      [Markup.button.callback('🇩🇪 Deutsch', 'lang_de')],
    ]).reply_markup;
  }

  static mainMenu(i18n: I18nService, miniAppUrl?: string) {
    const buttons: any[] = [
      [Markup.button.callback(i18n.t('buttons.newPresentation'), 'new_presentation')],
    ];

    // Add Mini App button if URL is provided
    if (miniAppUrl) {
      buttons.push([
        Markup.button.webApp('🎨 Dizayner (Mini App)', miniAppUrl),
      ]);
    }

    buttons.push(
      [Markup.button.callback(i18n.t('buttons.myPresentations'), 'my_presentations')],
      [
        Markup.button.callback(i18n.t('buttons.balance'), 'check_balance'),
        Markup.button.callback(i18n.t('buttons.addBalance'), 'add_balance'),
      ],
      [Markup.button.callback(i18n.t('buttons.language'), 'change_language')],
    );

    return Markup.inlineKeyboard(buttons).reply_markup;
  }

  static rejaSelection(i18n: I18nService) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(i18n.t('buttons.yes'), 'reja_yes'),
        Markup.button.callback(i18n.t('buttons.no'), 'reja_no'),
      ],
    ]).reply_markup;
  }

  static slideCountSelection(i18n: I18nService) {
    const slidesWord = i18n.t('slides');
    // Prices: 6=1000, 8=1500, 10=1700, 12=2000, 14=2200, 16=2400, 18=2500
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(`6 ${slidesWord} - 1,000`, 'slides_6'),
        Markup.button.callback(`8 ${slidesWord} - 1,500`, 'slides_8'),
      ],
      [
        Markup.button.callback(`10 ${slidesWord} - 1,700`, 'slides_10'),
        Markup.button.callback(`12 ${slidesWord} - 2,000`, 'slides_12'),
      ],
      [
        Markup.button.callback(`14 ${slidesWord} - 2,200`, 'slides_14'),
        Markup.button.callback(`16 ${slidesWord} - 2,400`, 'slides_16'),
      ],
      [
        Markup.button.callback(`18 ${slidesWord} - 2,500`, 'slides_18'),
      ],
    ]).reply_markup;
  }

  static themeSelection(i18n: I18nService) {
    const rows = THEME_META.map((meta) => {
      const label = i18n.t(`themes.${meta.key}`);
      // Fall back to emoji + hard-coded label if the i18n key is missing.
      const text = label === `themes.${meta.key}`
        ? `${meta.emoji} ${meta.fallbackLabel}`
        : label;
      return [Markup.button.callback(text, `theme_${meta.key}`)];
    });
    return Markup.inlineKeyboard(rows).reply_markup;
  }

  static confirmGeneration(i18n: I18nService) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(i18n.t('buttons.confirm'), 'confirm_generation')],
      [Markup.button.callback(i18n.t('buttons.cancel'), 'cancel_generation')],
    ]).reply_markup;
  }

  static downloadPresentation(
    i18n: I18nService,
    presentationId: string,
    hasPdf: boolean = false,
  ) {
    const buttons = [
      [Markup.button.callback(i18n.t('buttons.downloadPptx'), `download_pptx_${presentationId}`)],
    ];

    if (hasPdf) {
      buttons.push([
        Markup.button.callback(i18n.t('buttons.downloadPdf'), `download_pdf_${presentationId}`),
      ]);
    }

    buttons.push([Markup.button.callback(i18n.t('buttons.backToMenu'), 'back_to_menu')]);

    return Markup.inlineKeyboard(buttons).reply_markup;
  }

  static adminMenu(i18n: I18nService) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(i18n.t('admin.pendingPayments'), 'admin_pending_payments')],
      [Markup.button.callback(i18n.t('admin.stats'), 'admin_stats')],
      [Markup.button.callback(i18n.t('admin.broadcast'), 'admin_broadcast')],
    ]).reply_markup;
  }

  static adminApprovePayment(userId: number, amount: number) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(`✅ Tasdiqlash (+${amount} so'm)`, `approve_payment_${userId}_${amount}`),
      ],
      [
        Markup.button.callback('❌ Rad etish', `reject_payment_${userId}`),
      ],
    ]).reply_markup;
  }

  static paymentAmountSelection() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('1,000', 'pay_amount_1000'),
        Markup.button.callback('2,000', 'pay_amount_2000'),
      ],
      [
        Markup.button.callback('5,000', 'pay_amount_5000'),
        Markup.button.callback('10,000', 'pay_amount_10000'),
      ],
    ]).reply_markup;
  }

  static joinChannel(channelUrl: string, channelUsername: string) {
    return Markup.inlineKeyboard([
      [Markup.button.url(`📢 @${channelUsername} kanalga qo'shilish`, channelUrl)],
      [Markup.button.callback("✅ Qo'shildim, tekshirish", 'check_channel_membership')],
    ]).reply_markup;
  }

  static featuresMenu(i18n: I18nService, webAppUrl?: string) {
    const buttons: any[] = [];

    // Main "Open Web App" button at the top (opens home page)
    if (webAppUrl) {
      buttons.push([
        Markup.button.webApp(i18n.t('buttons.openWebApp'), webAppUrl),
      ]);
    }

    // Feature buttons below
    buttons.push(
      [
        Markup.button.callback(i18n.t('buttons.mustaqilIsh'), 'doc_create_mustaqil_ish'),
        Markup.button.callback(i18n.t('buttons.referat'), 'doc_create_referat'),
      ],
      [
        Markup.button.callback(i18n.t('buttons.kursIshi'), 'doc_create_kurs_ishi'),
        Markup.button.callback(i18n.t('buttons.maqola'), 'doc_create_maqola'),
      ],
      [
        Markup.button.callback(i18n.t('buttons.tezis'), 'doc_create_tezis'),
        Markup.button.callback(i18n.t('buttons.insho'), 'doc_create_insho'),
      ],
      [
        Markup.button.callback(i18n.t('buttons.flashcard'), 'flashcard_create'),
        Markup.button.callback(i18n.t('buttons.quizCreate'), 'quiz_create'),
      ],
      [
        Markup.button.callback(i18n.t('buttons.glossary'), 'glossary_create'),
        Markup.button.callback(i18n.t('buttons.crossword'), 'crossword_create'),
      ],
      [Markup.button.callback(i18n.t('buttons.resume'), 'resume_create')],
      [
        Markup.button.callback(i18n.t('buttons.balance'), 'check_balance'),
        Markup.button.callback(i18n.t('buttons.addBalance'), 'add_balance'),
      ],
      [
        Markup.button.callback(i18n.t('buttons.inviteFriends'), 'share_referral'),
        Markup.button.callback(i18n.t('buttons.language'), 'change_language'),
      ],
      [
        Markup.button.callback(i18n.t('buttons.start'), 'run_start'),
      ],
    );

    return Markup.inlineKeyboard(buttons).reply_markup;
  }
}
