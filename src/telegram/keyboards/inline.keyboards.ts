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
        Markup.button.callback(i18n.t('buttons.language'), 'change_language'),
      ],
    ]).reply_markup;
  }

  static slideCountSelection(i18n: I18nService) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('6 ' + i18n.t('slides'), 'slides_6'),
        Markup.button.callback('8 ' + i18n.t('slides'), 'slides_8'),
      ],
      [
        Markup.button.callback('10 ' + i18n.t('slides'), 'slides_10'),
        Markup.button.callback('12 ' + i18n.t('slides'), 'slides_12'),
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
}
