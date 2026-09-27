export type Lang = 'uz' | 'ru' | 'en';

interface FeatureText {
  title: string;
  desc: string;
  price: string;
}

const uz = {
  code: 'UZ',
  nav: {
    features: 'Imkoniyatlar',
    how: 'Qanday ishlaydi',
    pricing: 'Narxlar',
    faq: 'Savollar',
    openBot: 'Botni ochish',
  },
  hero: {
    badge: 'AI bilan ishlaydigan Telegram bot',
    title: 'Sekundlarda professional prezentatsiya va hujjatlar',
    subtitle:
      'Mavzuni yuboring — AI siz uchun slayd, referat, test, fleshkarta va rezyume tayyorlaydi. Hammasi Telegram ichida, tez va arzon.',
    ctaPrimary: 'Telegramda boshlash',
    ctaSecondary: 'Imkoniyatlarni ko‘rish',
    trust: 'Talabalar va o‘qituvchilar ishonadigan bot',
  },
  stats: {
    services: 'Xizmat turi',
    languages: 'Til',
    speed: 'Tayyor bo‘lish vaqti',
    support: 'Qo‘llab-quvvatlash',
    speedValue: '<60 son',
    supportValue: '24/7',
  },
  features: {
    heading: 'Bitta botda — barcha o‘quv ishlaringiz',
    sub: 'Prezentatsiyadan rezyumegача — hammasi bir joyda, professional sifatda.',
    items: {
      slides: { title: 'Prezentatsiya (Slaydlar)', desc: 'Mavzu bo‘yicha professional PPTX — dizayn, rasm va aniq tuzilma bilan.', price: '1 000 – 2 500 so‘m' },
      docs: { title: 'Hujjatlar', desc: 'Referat, mustaqil ish, kurs ishi, insho, maqola, tezis — DOCX formatda.', price: '1 500 – 11 000 so‘m' },
      quiz: { title: 'Testlar', desc: 'Har qanday mavzudan test/quiz — Telegram poll ko‘rinishida.', price: '500 – 2 000 so‘m' },
      flashcards: { title: 'Fleshkartalar', desc: 'Yodlash uchun savol-javob kartalari, ulashish havolasi bilan.', price: '500 – 1 000 so‘m' },
      glossary: { title: 'Glossariy', desc: 'Atamalar va ta’riflar lug‘ati — tayyor DOCX.', price: '500 – 1 200 so‘m' },
      crossword: { title: 'Krossvord', desc: 'Mavzu bo‘yicha krossvord — o‘yin va takrorlash uchun.', price: '800 – 1 200 so‘m' },
      resume: { title: 'Rezyume', desc: 'Professional CV/rezyume — bir necha soniyada.', price: '2 500 so‘m' },
      translator: { title: 'Tarjimon', desc: 'Matnni 9 tilga tez tarjima — navbatsiz, real vaqtda.', price: '500 so‘m' },
    } as Record<string, FeatureText>,
  },
  how: {
    heading: 'Qanday ishlaydi',
    sub: 'To‘rt oddiy qadamda tayyor natija.',
    steps: [
      { title: 'Telegramга kiring', desc: 'Botni oching va /start bosing.' },
      { title: 'Xizmatni tanlang', desc: 'Prezentatsiya, referat, test yoki boshqasini tanlang.' },
      { title: 'Mavzuni yuboring', desc: 'Mavzu yoki matnni yozing va sozlamalarni tanlang.' },
      { title: 'Natijani oling', desc: 'AI tayyorlaydi va faylni Telegram orqali yuboradi.' },
    ],
  },
  pricing: {
    heading: 'Oddiy va shaffof narxlar',
    sub: 'Obuna yo‘q — faqat ishlatganingiz uchun to‘laysiz. Yangi foydalanuvchilar bepul balans bilan boshlaydi.',
    points: [
      'Bepul boshlang‘ich balans',
      'Do‘st taklif qiling — bonus oling',
      'Humo / Uzcard orqali to‘ldirish',
      'Kanalga a’zo bo‘lib bonus oling',
    ],
    cta: 'Bepul boshlash',
  },
  priceTable: {
    heading: 'Narxlar',
    sub: 'Har bir xizmat uchun aniq narx — obunasiz, faqat ishlatganingizga to‘laysiz.',
    service: 'Xizmat',
    price: 'Narx',
    note: '💡 Yangi foydalanuvchilar bepul balans oladi. Balansni Humo yoki Uzcard orqali to‘ldirasiz.',
    popular: 'Ommabop',
  },
  langs: {
    heading: '9 tilda ishlaydi',
    sub: 'O‘zbekistonu CIS talabalari uchun — o‘z tilingizda.',
  },
  why: {
    heading: 'Nega SliderAI.uz?',
    items: [
      { title: 'Tez', desc: '60 soniyagacha tayyor natija.' },
      { title: 'Arzon', desc: 'Talabalar uchun hamyonbop narxlar.' },
      { title: 'Sifatli', desc: 'Professional dizayn va aniq tuzilma.' },
      { title: 'Telegram-native', desc: 'Ilova o‘rnatish shart emas — hammasi Telegram ichida.' },
    ],
  },
  faq: {
    heading: 'Ko‘p beriladigan savollar',
    items: [
      { q: 'SliderAI.uz qanday ishlaydi?', a: 'Telegram botini ochasiz, xizmat va mavzuni tanlaysiz — AI natijani tayyorlab, tayyor faylni sizga yuboradi.' },
      { q: 'To‘lov qanday amalga oshiriladi?', a: 'Humo yoki Uzcard orqali balans to‘ldirasiz, admin tasdiqlagach kreditlaringiz qo‘shiladi.' },
      { q: 'Qaysi formatlar beriladi?', a: 'Prezentatsiya — PPTX, hujjatlar — DOCX, testlar — Telegram poll ko‘rinishida.' },
      { q: 'Bepul sinab ko‘rsam bo‘ladimi?', a: 'Ha, yangi foydalanuvchilar bepul boshlang‘ich balans oladi.' },
      { q: 'Qaysi tillarda ishlaydi?', a: 'Bot 9 tilda ishlaydi: o‘zbek (lotin/kirill), rus, ingliz, turk, qozoq, nemis, arab va koreys.' },
    ],
  },
  finalCta: {
    title: 'Birgalikda yanada zo‘r natijalarga erishamiz!',
    sub: 'Hoziroq Telegramда boshланг — bir necha soniyada birinchi ishingizni yarating.',
    button: 'Telegramда ochish',
  },
  footer: {
    tagline: 'AI yordamida slaydlar va hujjatlar — Telegram ichida.',
    support: 'Savollar va takliflar',
    rights: 'Barcha huquqlar himoyalangan.',
  },
}

type Dict = typeof uz

const ru: Dict = {
  code: 'RU',
  nav: {
    features: 'Возможности',
    how: 'Как это работает',
    pricing: 'Цены',
    faq: 'Вопросы',
    openBot: 'Открыть бота',
  },
  hero: {
    badge: 'Telegram-бот на базе ИИ',
    title: 'Профессиональные презентации и документы за секунды',
    subtitle:
      'Отправьте тему — ИИ подготовит слайды, реферат, тест, флешкарты и резюме. Всё внутри Telegram, быстро и недорого.',
    ctaPrimary: 'Начать в Telegram',
    ctaSecondary: 'Смотреть возможности',
    trust: 'Боту доверяют студенты и преподаватели',
  },
  stats: {
    services: 'Сервисов',
    languages: 'Языков',
    speed: 'Время готовности',
    support: 'Поддержка',
    speedValue: '<60 сек',
    supportValue: '24/7',
  },
  features: {
    heading: 'Один бот — все учебные работы',
    sub: 'От презентации до резюме — всё в одном месте и профессионального качества.',
    items: {
      slides: { title: 'Презентация (Слайды)', desc: 'Профессиональный PPTX по теме — с дизайном, изображениями и структурой.', price: '1 000 – 2 500 сум' },
      docs: { title: 'Документы', desc: 'Реферат, самостоятельная и курсовая работа, эссе, статья, тезис — в DOCX.', price: '1 500 – 11 000 сум' },
      quiz: { title: 'Тесты', desc: 'Тест/квиз по любой теме — в виде Telegram-опроса.', price: '500 – 2 000 сум' },
      flashcards: { title: 'Флешкарты', desc: 'Карточки вопрос-ответ для запоминания, со ссылкой для обмена.', price: '500 – 1 000 сум' },
      glossary: { title: 'Глоссарий', desc: 'Словарь терминов и определений — готовый DOCX.', price: '500 – 1 200 сум' },
      crossword: { title: 'Кроссворд', desc: 'Кроссворд по теме — для игры и повторения.', price: '800 – 1 200 сум' },
      resume: { title: 'Резюме', desc: 'Профессиональное CV/резюме за несколько секунд.', price: '2 500 сум' },
      translator: { title: 'Переводчик', desc: 'Быстрый перевод текста на 9 языков — без очереди, в реальном времени.', price: '500 сум' },
    },
  },
  how: {
    heading: 'Как это работает',
    sub: 'Готовый результат за четыре простых шага.',
    steps: [
      { title: 'Зайдите в Telegram', desc: 'Откройте бота и нажмите /start.' },
      { title: 'Выберите сервис', desc: 'Презентация, реферат, тест или другое.' },
      { title: 'Отправьте тему', desc: 'Введите тему или текст и выберите настройки.' },
      { title: 'Получите результат', desc: 'ИИ подготовит и пришлёт файл в Telegram.' },
    ],
  },
  pricing: {
    heading: 'Простые и прозрачные цены',
    sub: 'Без подписки — платите только за то, что используете. Новые пользователи начинают с бесплатным балансом.',
    points: [
      'Бесплатный стартовый баланс',
      'Пригласите друга — получите бонус',
      'Пополнение через Humo / Uzcard',
      'Бонус за подписку на канал',
    ],
    cta: 'Начать бесплатно',
  },
  priceTable: {
    heading: 'Цены',
    sub: 'Чёткая цена за каждый сервис — без подписки, платите только за использование.',
    service: 'Сервис',
    price: 'Цена',
    note: '💡 Новые пользователи получают бесплатный баланс. Пополнение через Humo или Uzcard.',
    popular: 'Популярно',
  },
  langs: {
    heading: 'Работает на 9 языках',
    sub: 'Для студентов Узбекистана и СНГ — на вашем языке.',
  },
  why: {
    heading: 'Почему SliderAI.uz?',
    items: [
      { title: 'Быстро', desc: 'Готовый результат до 60 секунд.' },
      { title: 'Недорого', desc: 'Доступные цены для студентов.' },
      { title: 'Качественно', desc: 'Профессиональный дизайн и чёткая структура.' },
      { title: 'Внутри Telegram', desc: 'Не нужно ставить приложение — всё в Telegram.' },
    ],
  },
  faq: {
    heading: 'Частые вопросы',
    items: [
      { q: 'Как работает SliderAI.uz?', a: 'Открываете бота, выбираете сервис и тему — ИИ готовит результат и присылает готовый файл.' },
      { q: 'Как происходит оплата?', a: 'Пополняете баланс через Humo или Uzcard, после подтверждения администратором зачисляются кредиты.' },
      { q: 'Какие форматы выдаются?', a: 'Презентации — PPTX, документы — DOCX, тесты — в виде Telegram-опроса.' },
      { q: 'Можно попробовать бесплатно?', a: 'Да, новые пользователи получают бесплатный стартовый баланс.' },
      { q: 'На каких языках работает?', a: 'Бот работает на 9 языках: узбекский (латиница/кириллица), русский, английский, турецкий, казахский, немецкий, арабский и корейский.' },
    ],
  },
  finalCta: {
    title: 'Вместе добьёмся ещё лучших результатов!',
    sub: 'Начните прямо сейчас в Telegram — создайте первую работу за секунды.',
    button: 'Открыть в Telegram',
  },
  footer: {
    tagline: 'Слайды и документы с помощью ИИ — внутри Telegram.',
    support: 'Вопросы и предложения',
    rights: 'Все права защищены.',
  },
}

const en: Dict = {
  code: 'EN',
  nav: {
    features: 'Features',
    how: 'How it works',
    pricing: 'Pricing',
    faq: 'FAQ',
    openBot: 'Open the bot',
  },
  hero: {
    badge: 'AI-powered Telegram bot',
    title: 'Professional presentations and documents in seconds',
    subtitle:
      'Send a topic — AI prepares slides, essays, quizzes, flashcards and resumes for you. All inside Telegram, fast and affordable.',
    ctaPrimary: 'Start on Telegram',
    ctaSecondary: 'See features',
    trust: 'Trusted by students and teachers',
  },
  stats: {
    services: 'Services',
    languages: 'Languages',
    speed: 'Turnaround',
    support: 'Support',
    speedValue: '<60 sec',
    supportValue: '24/7',
  },
  features: {
    heading: 'One bot — all your study work',
    sub: 'From a presentation to a resume — all in one place, at professional quality.',
    items: {
      slides: { title: 'Presentations (Slides)', desc: 'A professional PPTX on your topic — with design, images and clear structure.', price: '1,000 – 2,500 UZS' },
      docs: { title: 'Documents', desc: 'Essays, coursework, term papers, articles and theses — in DOCX.', price: '1,500 – 11,000 UZS' },
      quiz: { title: 'Quizzes', desc: 'A quiz on any topic — delivered as a Telegram poll.', price: '500 – 2,000 UZS' },
      flashcards: { title: 'Flashcards', desc: 'Question-answer cards for memorizing, with a share link.', price: '500 – 1,000 UZS' },
      glossary: { title: 'Glossary', desc: 'A glossary of terms and definitions — ready DOCX.', price: '500 – 1,200 UZS' },
      crossword: { title: 'Crossword', desc: 'A crossword on your topic — for play and revision.', price: '800 – 1,200 UZS' },
      resume: { title: 'Resume', desc: 'A professional CV/resume in a few seconds.', price: '2,500 UZS' },
      translator: { title: 'Translator', desc: 'Fast text translation into 9 languages — no queue, real time.', price: '500 UZS' },
    },
  },
  how: {
    heading: 'How it works',
    sub: 'A ready result in four simple steps.',
    steps: [
      { title: 'Open Telegram', desc: 'Open the bot and press /start.' },
      { title: 'Pick a service', desc: 'Presentation, essay, quiz or anything else.' },
      { title: 'Send your topic', desc: 'Type the topic or text and choose the options.' },
      { title: 'Get the result', desc: 'AI prepares it and sends the file via Telegram.' },
    ],
  },
  pricing: {
    heading: 'Simple, transparent pricing',
    sub: 'No subscription — pay only for what you use. New users start with a free balance.',
    points: [
      'Free starting balance',
      'Invite a friend — earn a bonus',
      'Top up via Humo / Uzcard',
      'Bonus for joining the channel',
    ],
    cta: 'Start for free',
  },
  priceTable: {
    heading: 'Pricing',
    sub: 'A clear price for each service — no subscription, pay only for what you use.',
    service: 'Service',
    price: 'Price',
    note: '💡 New users get a free balance. Top up via Humo or Uzcard.',
    popular: 'Popular',
  },
  langs: {
    heading: 'Works in 9 languages',
    sub: 'For students across Uzbekistan and the CIS — in your language.',
  },
  why: {
    heading: 'Why SliderAI.uz?',
    items: [
      { title: 'Fast', desc: 'A ready result in up to 60 seconds.' },
      { title: 'Affordable', desc: 'Student-friendly prices.' },
      { title: 'High quality', desc: 'Professional design and clear structure.' },
      { title: 'Telegram-native', desc: 'No app to install — everything inside Telegram.' },
    ],
  },
  faq: {
    heading: 'Frequently asked questions',
    items: [
      { q: 'How does SliderAI.uz work?', a: 'Open the Telegram bot, choose a service and topic — AI prepares the result and sends you the ready file.' },
      { q: 'How does payment work?', a: 'Top up your balance via Humo or Uzcard; once an admin confirms, credits are added to your account.' },
      { q: 'What formats do I get?', a: 'Presentations as PPTX, documents as DOCX, quizzes as Telegram polls.' },
      { q: 'Can I try it for free?', a: 'Yes, new users get a free starting balance.' },
      { q: 'Which languages are supported?', a: 'The bot works in 9 languages: Uzbek (Latin/Cyrillic), Russian, English, Turkish, Kazakh, German, Arabic and Korean.' },
    ],
  },
  finalCta: {
    title: 'Let’s achieve even greater results together!',
    sub: 'Start on Telegram right now — create your first work in seconds.',
    button: 'Open in Telegram',
  },
  footer: {
    tagline: 'AI-made slides and documents — inside Telegram.',
    support: 'Questions and suggestions',
    rights: 'All rights reserved.',
  },
}

export const translations: Record<Lang, Dict> = { uz, ru, en }
