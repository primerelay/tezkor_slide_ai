// Single source of truth for the "Yo'riqnoma" (Guide) shown in the bot and the
// Mini App. Localized uz/ru/en (other languages fall back to uz).

export interface GuideSection {
  icon: string;
  title: { uz: string; ru: string; en: string };
  body: { uz: string; ru: string; en: string };
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    icon: '🚀',
    title: { uz: 'Boshlash', ru: 'Начало', en: 'Getting started' },
    body: {
      uz: "Xizmatni tanlang, mavzu yoki matn yuboring — AI tayyorlaydi va tayyor faylni yuboradi. Prezentatsiya (PPTX), hujjatlar (DOCX), test, fleshkarta, glossariy, krossvord, rezyume va tarjima.",
      ru: 'Выберите сервис, отправьте тему или текст — ИИ подготовит и пришлёт готовый файл. Презентации (PPTX), документы (DOCX), тесты, флешкарты, глоссарий, кроссворд, резюме и перевод.',
      en: 'Pick a service, send a topic or text — AI prepares and sends the ready file. Presentations (PPTX), documents (DOCX), quizzes, flashcards, glossary, crossword, resume and translation.',
    },
  },
  {
    icon: '🎨',
    title: { uz: 'Mini App (Dizayner)', ru: 'Mini App (Дизайнер)', en: 'Mini App (Designer)' },
    body: {
      uz: "Mini App orqali slaydlarni ko'rib chiqib, tahrirlashingiz mumkin — matn, rasm, tartib. Tahrirlash mutlaqo BEPUL.",
      ru: 'В Mini App можно просмотреть и отредактировать слайды — текст, картинки, порядок. Редактирование полностью БЕСПЛАТНО.',
      en: 'In the Mini App you can review and edit slides — text, images, order. Editing is completely FREE.',
    },
  },
  {
    icon: '💳',
    title: { uz: 'Balans va to‘lov', ru: 'Баланс и оплата', en: 'Balance & payment' },
    body: {
      uz: "Yangi foydalanuvchi bepul balans oladi. To‘ldirish uchun Humo yoki Uzcard'ga o‘tkazib, chek rasmini botga yuboring — admin tasdiqlaydi va balans oshadi.",
      ru: 'Новые пользователи получают бесплатный баланс. Для пополнения переведите на Humo или Uzcard и отправьте боту фото чека — администратор подтвердит.',
      en: 'New users get a free balance. To top up, transfer to Humo or Uzcard and send the receipt photo to the bot — an admin confirms it.',
    },
  },
  {
    icon: '🎁',
    title: { uz: 'Bepul ballar', ru: 'Бесплатные баллы', en: 'Free credits' },
    body: {
      uz: "Har kuni «Kunlik sovg‘a»ni oching (500–5000 so‘m). Do‘st taklif qiling — bonus. Kanalga a‘zo bo‘ling — bonus.",
      ru: 'Открывайте «Ежедневный подарок» каждый день (500–5000 сум). Пригласите друга — бонус. Подпишитесь на канал — бонус.',
      en: 'Open the “Daily gift” every day (500–5000 UZS). Invite a friend — bonus. Join the channel — bonus.',
    },
  },
  {
    icon: '🧰',
    title: { uz: 'Bepul vositalar', ru: 'Бесплатные инструменты', en: 'Free tools' },
    body: {
      uz: "«Titul varag‘i» va «Fayl vositalari» (PDF birlashtirish, rasm↔PDF va h.k.) — mutlaqo bepul.",
      ru: '«Титульный лист» и «Файл-инструменты» (объединение PDF, фото↔PDF и т.д.) — полностью бесплатно.',
      en: '“Title page” and “File tools” (merge PDF, image↔PDF, etc.) — completely free.',
    },
  },
];

export const GUIDE_TEXT = {
  uz: { title: "Yo'riqnoma", subtitle: 'Bir daqiqada hammasini tushunasiz.', support: 'Savol bo‘lsa yozing', supportHandle: '@fast_admin_1' },
  ru: { title: 'Инструкция', subtitle: 'Разберётесь за одну минуту.', support: 'Есть вопрос? Пишите', supportHandle: '@fast_admin_1' },
  en: { title: 'Guide', subtitle: "You'll get it in a minute.", support: 'Questions? Write to', supportHandle: '@fast_admin_1' },
};

export type GuideLang = keyof typeof GUIDE_TEXT;
export function guideLang(lang: string): GuideLang {
  return (lang in GUIDE_TEXT ? lang : 'uz') as GuideLang;
}
