import { Markup } from 'telegraf';
import { I18nService } from '../../common/i18n/i18n.service';
import { FlashcardSet } from '../../database/entities/flashcard-set.entity';

export type CardSide = 'front' | 'back';

/** Escape user/AI text for Telegram HTML parse mode. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render one flashcard as an interactive Telegram message. The user flips to
 * reveal the answer and navigates with prev/next (wrapping around the deck).
 */
export function renderFlashcard(
  set: FlashcardSet,
  index: number,
  side: CardSide,
  i18n: I18nService,
): { text: string; keyboard: ReturnType<typeof Markup.inlineKeyboard>['reply_markup'] } {
  const total = set.cards.length;
  const safeIndex = ((index % total) + total) % total;
  const card = set.cards[safeIndex];

  const header = `🎴 <b>${esc(set.title)}</b>  <i>(${safeIndex + 1}/${total})</i>`;
  const front = `❓ <b>${esc(card.front)}</b>`;

  const prev = ((safeIndex - 1 + total) % total);
  const next = ((safeIndex + 1) % total);
  const navRow = [
    Markup.button.callback('⬅️', `fcnav_${set.id}_${prev}`),
    Markup.button.callback(`${safeIndex + 1}/${total}`, 'fc_noop'),
    Markup.button.callback('➡️', `fcnav_${set.id}_${next}`),
  ];

  if (side === 'back') {
    const text = `${header}\n\n${front}\n\n💡 ${esc(card.back)}`;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(i18n.t('flashcard.showQuestion'), `fcnav_${set.id}_${safeIndex}`)],
      navRow,
    ]).reply_markup;
    return { text, keyboard };
  }

  const text = `${header}\n\n${front}\n\n<i>${i18n.t('flashcard.tapToReveal')}</i>`;
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback(i18n.t('flashcard.showAnswer'), `fcflip_${set.id}_${safeIndex}`)],
    navRow,
  ]).reply_markup;
  return { text, keyboard };
}
