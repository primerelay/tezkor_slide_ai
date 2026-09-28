// Single source of truth for the public price list shown in the bot and the
// Mini App ("Narxlar" screen). Numbers mirror the real per-feature pricing.

export interface PriceItem {
  key: string;
  icon: string;
  name: { uz: string; ru: string; en: string };
  detail: { uz: string; ru: string; en: string };
  min: number;
  max: number;
}

export const PRICE_CATALOG: PriceItem[] = [
  {
    key: 'presentation', icon: '📊',
    name: { uz: 'Taqdimot (slaydlar)', ru: 'Презентация (слайды)', en: 'Presentation (slides)' },
    detail: { uz: '6–18 slayd', ru: '6–18 слайдов', en: '6–18 slides' },
    min: 1000, max: 2500,
  },
  {
    key: 'referat', icon: '📄',
    name: { uz: 'Referat / Mustaqil ish', ru: 'Реферат / Самост. работа', en: 'Essay / Independent work' },
    detail: { uz: '10–25 bet', ru: '10–25 стр.', en: '10–25 pages' },
    min: 2500, max: 5500,
  },
  {
    key: 'kurs_ishi', icon: '🎓',
    name: { uz: 'Kurs ishi', ru: 'Курсовая работа', en: 'Coursework' },
    detail: { uz: '25–50 bet', ru: '25–50 стр.', en: '25–50 pages' },
    min: 6000, max: 11000,
  },
  {
    key: 'insho', icon: '✍️',
    name: { uz: 'Insho', ru: 'Эссе', en: 'Essay' },
    detail: { uz: '2–5 bet', ru: '2–5 стр.', en: '2–5 pages' },
    min: 1500, max: 2500,
  },
  {
    key: 'maqola', icon: '📰',
    name: { uz: 'Maqola', ru: 'Статья', en: 'Article' },
    detail: { uz: '5–10 bet', ru: '5–10 стр.', en: '5–10 pages' },
    min: 3000, max: 5000,
  },
  {
    key: 'tezis', icon: '📃',
    name: { uz: 'Tezis', ru: 'Тезис', en: 'Thesis' },
    detail: { uz: '2–3 bet', ru: '2–3 стр.', en: '2–3 pages' },
    min: 2000, max: 2500,
  },
  {
    key: 'quiz', icon: '🧠',
    name: { uz: 'Test', ru: 'Тест', en: 'Quiz' },
    detail: { uz: '5–30 savol', ru: '5–30 вопросов', en: '5–30 questions' },
    min: 500, max: 2000,
  },
  {
    key: 'flashcard', icon: '🎴',
    name: { uz: 'Fleshkarta', ru: 'Флешкарты', en: 'Flashcards' },
    detail: { uz: '10–30 karta', ru: '10–30 карт', en: '10–30 cards' },
    min: 500, max: 1000,
  },
  {
    key: 'glossary', icon: '📖',
    name: { uz: 'Glossariy', ru: 'Глоссарий', en: 'Glossary' },
    detail: { uz: '20–50 atama', ru: '20–50 терминов', en: '20–50 terms' },
    min: 500, max: 1200,
  },
  {
    key: 'crossword', icon: '🧩',
    name: { uz: 'Krossvord', ru: 'Кроссворд', en: 'Crossword' },
    detail: { uz: '10–20 so‘z', ru: '10–20 слов', en: '10–20 words' },
    min: 800, max: 1200,
  },
  {
    key: 'resume', icon: '📇',
    name: { uz: 'Rezyume', ru: 'Резюме', en: 'Resume' },
    detail: { uz: '1 fayl', ru: '1 файл', en: '1 file' },
    min: 2500, max: 2500,
  },
  {
    key: 'translator', icon: '🌍',
    name: { uz: 'Tarjimon', ru: 'Переводчик', en: 'Translator' },
    detail: { uz: 'matn', ru: 'текст', en: 'text' },
    min: 500, max: 500,
  },
];

export const PRICE_TEXT = {
  uz: { title: 'Narxlar', subtitle: "To'lov faqat hajmga bog'liq — yashirin to'lov yo'q.", som: "so'm", free: 'Bepul', balance: 'Hisobingiz', topUp: "Hisobni to'ldirish" },
  ru: { title: 'Цены', subtitle: 'Оплата зависит только от объёма — скрытых платежей нет.', som: 'сум', free: 'Бесплатно', balance: 'Ваш баланс', topUp: 'Пополнить счёт' },
  en: { title: 'Pricing', subtitle: 'You pay only for size — no hidden fees.', som: 'UZS', free: 'Free', balance: 'Your balance', topUp: 'Top up balance' },
};

export type PriceLang = keyof typeof PRICE_TEXT;

export function priceLang(lang: string): PriceLang {
  return (lang in PRICE_TEXT ? lang : 'uz') as PriceLang;
}

export function formatSom(n: number): string {
  return n.toLocaleString('en-US').replace(/,/g, ' ');
}
