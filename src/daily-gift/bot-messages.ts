// Localized strings for the in-bot Daily Gift flow (uz/ru/en; others → uz).

export interface BotGiftMessages {
  button: string; // menu / balance button label
  prompt: (day: number, min: number, max: number, jackpot: number) => string;
  boxLabel: (i: number) => string;
  claimed: string;
  claimedToast: string;
  won: (reward: number, balance: number) => string;
  jackpot: (reward: number, balance: number) => string;
  openToast: string;
}

const num = (n: number) => n.toLocaleString('en-US').replace(/,/g, ' ');

const uz: BotGiftMessages = {
  button: "🎁 Kunlik sovg'a",
  prompt: (day, min, max, jackpot) =>
    `🎁 <b>Kunlik sovg'a</b> — ${day}-kun\n\n` +
    `Qutilardan birini tanlang — ichida <b>${num(min)}–${num(max)} so'm</b>!\n` +
    `💎 Omad kulsa — <b>${num(jackpot)} so'm JACKPOT</b>`,
  boxLabel: (i) => `🎁 ${i + 1}`,
  claimed: "🎁 Bugungi sovg'a allaqachon olingan ✅\n\nErtaga qaytib keling — seriyani davom ettiring!",
  claimedToast: "Bugungi sovg'a olingan",
  won: (reward, balance) =>
    `🎉 <b>Tabriklaymiz!</b>\n\nSiz <b>${num(reward)} so'm</b> yutdingiz!\n💰 Balans: <b>${num(balance)} so'm</b>`,
  jackpot: (reward, balance) =>
    `💎 <b>JACKPOT!</b>\n\nSiz <b>${num(reward)} so'm</b> yutdingiz!\n💰 Balans: <b>${num(balance)} so'm</b>`,
  openToast: 'Omad tilaymiz! 🍀',
};

const ru: BotGiftMessages = {
  button: '🎁 Ежедневный подарок',
  prompt: (day, min, max, jackpot) =>
    `🎁 <b>Ежедневный подарок</b> — день ${day}\n\n` +
    `Выберите одну из коробок — внутри <b>${num(min)}–${num(max)} сум</b>!\n` +
    `💎 Если повезёт — <b>${num(jackpot)} сум ДЖЕКПОТ</b>`,
  boxLabel: (i) => `🎁 ${i + 1}`,
  claimed: '🎁 Сегодняшний подарок уже получен ✅\n\nВозвращайтесь завтра — продолжите серию!',
  claimedToast: 'Подарок уже получен',
  won: (reward, balance) =>
    `🎉 <b>Поздравляем!</b>\n\nВы выиграли <b>${num(reward)} сум</b>!\n💰 Баланс: <b>${num(balance)} сум</b>`,
  jackpot: (reward, balance) =>
    `💎 <b>ДЖЕКПОТ!</b>\n\nВы выиграли <b>${num(reward)} сум</b>!\n💰 Баланс: <b>${num(balance)} сум</b>`,
  openToast: 'Удачи! 🍀',
};

const en: BotGiftMessages = {
  button: '🎁 Daily gift',
  prompt: (day, min, max, jackpot) =>
    `🎁 <b>Daily gift</b> — day ${day}\n\n` +
    `Pick one of the boxes — inside <b>${num(min)}–${num(max)} UZS</b>!\n` +
    `💎 If you're lucky — <b>${num(jackpot)} UZS JACKPOT</b>`,
  boxLabel: (i) => `🎁 ${i + 1}`,
  claimed: "🎁 Today's gift is already claimed ✅\n\nCome back tomorrow to keep your streak!",
  claimedToast: 'Already claimed today',
  won: (reward, balance) =>
    `🎉 <b>Congratulations!</b>\n\nYou won <b>${num(reward)} UZS</b>!\n💰 Balance: <b>${num(balance)} UZS</b>`,
  jackpot: (reward, balance) =>
    `💎 <b>JACKPOT!</b>\n\nYou won <b>${num(reward)} UZS</b>!\n💰 Balance: <b>${num(balance)} UZS</b>`,
  openToast: 'Good luck! 🍀',
};

const DICT: Record<string, BotGiftMessages> = { uz, ru, en };

export function getBotGift(lang: string): BotGiftMessages {
  return DICT[lang] ?? uz;
}
