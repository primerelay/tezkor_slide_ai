import { Markup } from 'telegraf';
import { I18nService } from '../../common/i18n/i18n.service';

export class InlineKeyboards {
  static languageSelection() {
    return Markup.inlineKeyboard([
      [Markup.button.callback("🇺🇿 O'zbekcha", 'lang_uz')],
      [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
      [Markup.button.callback('🇬🇧 English', 'lang_en')],
    ]).reply_markup;
  }

  static mainMenu(i18n: I18nService) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(i18n.t('buttons.newPresentation'), 'new_presentation')],
      [Markup.button.callback(i18n.t('buttons.myPresentations'), 'my_presentations')],
      [
        Markup.button.callback(i18n.t('buttons.balance'), 'check_balance'),
        Markup.button.callback(i18n.t('buttons.addBalance'), 'add_balance'),
      ],
      [Markup.button.callback(i18n.t('buttons.language'), 'change_language')],
    ]).reply_markup;
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
    // Prices: 6=1000, 8=1500, 10=1700, 12=2000, 14=2200, 16=2400, 18=2500
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('6 bet - 1,000 so\'m', 'slides_6'),
        Markup.button.callback('8 bet - 1,500 so\'m', 'slides_8'),
      ],
      [
        Markup.button.callback('10 bet - 1,700 so\'m', 'slides_10'),
        Markup.button.callback('12 bet - 2,000 so\'m', 'slides_12'),
      ],
      [
        Markup.button.callback('14 bet - 2,200 so\'m', 'slides_14'),
        Markup.button.callback('16 bet - 2,400 so\'m', 'slides_16'),
      ],
      [
        Markup.button.callback('18 bet - 2,500 so\'m', 'slides_18'),
      ],
    ]).reply_markup;
  }

  static themeSelection(i18n: I18nService) {
    return Markup.inlineKeyboard([
      [Markup.button.callback(i18n.t('themes.academic_blue'), 'theme_academic_blue')],
      [Markup.button.callback(i18n.t('themes.minimal_white'), 'theme_minimal_white')],
      [Markup.button.callback(i18n.t('themes.modern_dark'), 'theme_modern_dark')],
    ]).reply_markup;
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
        Markup.button.callback('1,000 so\'m', 'pay_amount_1000'),
        Markup.button.callback('2,000 so\'m', 'pay_amount_2000'),
      ],
      [
        Markup.button.callback('5,000 so\'m', 'pay_amount_5000'),
        Markup.button.callback('10,000 so\'m', 'pay_amount_10000'),
      ],
    ]).reply_markup;
  }
}
