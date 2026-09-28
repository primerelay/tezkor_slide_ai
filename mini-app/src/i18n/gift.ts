// Local strings for the redesigned Home header + Daily Gift screens, kept
// separate from the main translations file. Covers uz/ru/en; other languages
// fall back to Uzbek.

export interface GiftStrings {
  role: string;
  balanceLabel: string;
  topUp: string;
  som: string;
  dailyGift: string;
  openBox: string;
  todayBadge: string; // shown when a gift is available today
  services: string;
  // Daily gift screen
  title: string;
  streak: (day: number) => string;
  chooseBox: (min: number, max: number) => string;
  jackpotHint: (jackpot: number) => string;
  footer: string;
  claimedTitle: string;
  comeBackTomorrow: string;
  tapToOpen: string;
  youWon: string;
  jackpotWon: string;
  great: string;
  // "Other" section on the home
  other: string;
  pricesTitle: string;
  pricesSub: string;
  guideTitle: string;
  guideSub: string;
  titlePageTitle: string;
  titlePageSub: string;
  fileToolsTitle: string;
  fileToolsSub: string;
}

const uz: GiftStrings = {
  role: "O'quvchi",
  balanceLabel: 'BALANS',
  topUp: "Hisobni to'ldirish",
  som: "so'm",
  dailyGift: "Kunlik sovg'a",
  openBox: 'Qutini ochish',
  todayBadge: 'Bugun tayyor',
  services: 'Xizmatlar',
  title: "Kunlik sovg'a",
  streak: (d) => `Bugun seriyangizning ${d}-kuni`,
  chooseBox: (min, max) => `Qutilardan birini tanlang — ichida ${min.toLocaleString()}–${max.toLocaleString()} so'm!`,
  jackpotHint: (j) => `💎 Omad kulsa — ${j.toLocaleString()} so'm JACKPOT`,
  footer: "Har kuni kiring: summa kun sayin oshadi, 7-kuni katta sandiq. O'tkazib yuborsangiz — 1-kundan.",
  claimedTitle: 'Bugungi sovg\'a olingan ✅',
  comeBackTomorrow: 'Ertaga qaytib keling — seriyani davom ettiring!',
  tapToOpen: 'Qutini tanlang',
  youWon: 'Siz yutdingiz!',
  jackpotWon: 'JACKPOT! 🎉',
  great: 'Ajoyib!',
  other: 'Boshqa',
  pricesTitle: 'Narxlar',
  pricesSub: 'Barcha xizmatlar narxi',
  guideTitle: "Yo'riqnoma",
  guideSub: 'Qanday ishlatish',
  titlePageTitle: "Titul varag'i",
  titlePageSub: 'Bepul',
  fileToolsTitle: 'Fayl vositalari',
  fileToolsSub: 'PDF · Word · rasm',
};

const ru: GiftStrings = {
  role: 'Студент',
  balanceLabel: 'БАЛАНС',
  topUp: 'Пополнить счёт',
  som: 'сум',
  dailyGift: 'Ежедневный подарок',
  openBox: 'Открыть коробку',
  todayBadge: 'Доступно',
  services: 'Сервисы',
  title: 'Ежедневный подарок',
  streak: (d) => `Сегодня ${d}-й день вашей серии`,
  chooseBox: (min, max) => `Выберите одну из коробок — внутри ${min.toLocaleString()}–${max.toLocaleString()} сум!`,
  jackpotHint: (j) => `💎 Если повезёт — ${j.toLocaleString()} сум ДЖЕКПОТ`,
  footer: 'Заходите каждый день: сумма растёт, на 7-й день большой сундук. Пропустите — с 1-го дня.',
  claimedTitle: 'Сегодняшний подарок получен ✅',
  comeBackTomorrow: 'Возвращайтесь завтра — продолжите серию!',
  tapToOpen: 'Выберите коробку',
  youWon: 'Вы выиграли!',
  jackpotWon: 'ДЖЕКПОТ! 🎉',
  great: 'Отлично!',
  other: 'Другое',
  pricesTitle: 'Цены',
  pricesSub: 'Цены на все сервисы',
  guideTitle: 'Инструкция',
  guideSub: 'Как пользоваться',
  titlePageTitle: 'Титульный лист',
  titlePageSub: 'Бесплатно',
  fileToolsTitle: 'Файл-инструменты',
  fileToolsSub: 'PDF · Word · фото',
};

const en: GiftStrings = {
  role: 'Student',
  balanceLabel: 'BALANCE',
  topUp: 'Top up balance',
  som: 'UZS',
  dailyGift: 'Daily gift',
  openBox: 'Open the box',
  todayBadge: 'Available',
  services: 'Services',
  title: 'Daily gift',
  streak: (d) => `Today is day ${d} of your streak`,
  chooseBox: (min, max) => `Pick one of the boxes — inside ${min.toLocaleString()}–${max.toLocaleString()} UZS!`,
  jackpotHint: (j) => `💎 If you're lucky — ${j.toLocaleString()} UZS JACKPOT`,
  footer: 'Come back daily: the amount grows, day 7 is a big chest. Miss a day — back to day 1.',
  claimedTitle: "Today's gift claimed ✅",
  comeBackTomorrow: 'Come back tomorrow to keep your streak!',
  tapToOpen: 'Choose a box',
  youWon: 'You won!',
  jackpotWon: 'JACKPOT! 🎉',
  great: 'Great!',
  other: 'Other',
  pricesTitle: 'Pricing',
  pricesSub: 'All service prices',
  guideTitle: 'Guide',
  guideSub: 'How to use',
  titlePageTitle: 'Title page',
  titlePageSub: 'Free',
  fileToolsTitle: 'File tools',
  fileToolsSub: 'PDF · Word · image',
};

const DICT: Record<string, GiftStrings> = { uz, ru, en };

export function getGift(lang: string): GiftStrings {
  return DICT[lang] ?? uz;
}
