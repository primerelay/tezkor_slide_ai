export type SupportedLanguage = 'uz' | 'ru' | 'en' | 'de';

// Pricing data - centralized
export const PRICING = [
  { slides: 6, price: 1000 },
  { slides: 8, price: 1500 },
  { slides: 10, price: 1700 },
  { slides: 12, price: 2000 },
  { slides: 14, price: 2200 },
  { slides: 16, price: 2400 },
  { slides: 18, price: 2500 },
];

export interface Translations {
  // Common
  loading: string;
  continue: string;
  create: string;
  back: string;

  // Slide editor placeholders
  placeholderTitle: string;
  placeholderSubtitle: string;
  placeholderText: string;
  placeholderConclusion: string;
  placeholderQuote: string;
  placeholderAuthor: string;
  placeholderPlan: string;
  placeholderYear: string;
  placeholderEvent: string;
  placeholderNote: string;
  placeholderName: string;

  // Dashboard
  greeting: string;
  createProfessional: string;
  newPresentation: string;
  createWithAI: string;
  createQuiz: string;
  testQuestions: string;
  recentWorks: string;
  slides: string;
  noPresentation: string;
  createNew: string;
  features: string;
  templates: string;
  fast: string;
  convenient: string;
  mobile: string;

  // Balance & Pricing
  yourBalance: string;
  uzs: string;
  pricing: string;
  slidesCount: string;
  freeEditing: string;
  freeEditingDesc: string;
  giftBalance: string;

  // Time
  hoursAgo: string;
  yesterday: string;

  // Create page
  enterTopic: string;
  aiWillCreate: string;
  presentationTopic: string;
  topicPlaceholder: string;
  suggestions: string;
  ecology: string;
  health: string;
  technology: string;
  art: string;

  selectTemplate: string;
  chooseFromProfessional: string;
  previewLabel: string;
  useThisTemplate: string;
  buildingDeck: string;
  downloadDeck: string;
  deckSent: string;
  deleteSlide: string;
  addBullet: string;
  bulletPlaceholder: string;
  addImage: string;
  imageSearchPlaceholder: string;
  removeImage: string;
  addSlide: string;
  addChart: string;
  addShape: string;

  settings: string;
  enterDetails: string;
  slideCount: string;
  studentName: string;
  studentNameOptional: string;
  teacherName: string;
  teacherNameOptional: string;
  namePlaceholder: string;

  // Templates (new - matching backend)
  academicBlue: string;
  editorialSerif: string;
  gradientViolet: string;
  scholarGreen: string;
  warmSand: string;
  minimalWhite: string;
  modernDark: string;
  // Legacy
  modern: string;
  academic: string;
  minimalist: string;
  nature: string;
  sunset: string;
  elegant: string;
  title: string;

  // Generation
  starting: string;
  analyzingTopic: string;
  creatingContent: string;
  preparingSlides: string;
  applyingDesign: string;
  ready: string;
  percentReady: string;
  willBeSentToTelegram: string;

  // Alerts
  presentationCreating: string;
  willBeSentToChat: string;
  errorOccurred: string;
  tryAgain: string;
}

const uz: Translations = {
  loading: 'Yuklanmoqda...',
  continue: 'Davom etish',
  create: 'Yaratish',
  back: 'Orqaga',

  // Slide editor placeholders
  placeholderTitle: 'Sarlavha',
  placeholderSubtitle: 'Quyi sarlavha',
  placeholderText: 'Matn',
  placeholderConclusion: 'Xulosa',
  placeholderQuote: 'Iqtibos matni',
  placeholderAuthor: 'Muallif',
  placeholderPlan: 'Reja',
  placeholderYear: 'Yil',
  placeholderEvent: 'Voqea',
  placeholderNote: 'Izoh',
  placeholderName: 'Nom',

  greeting: 'Salom',
  createProfessional: 'Professional prezentatsiyalar yarating',
  newPresentation: 'Yangi prezentatsiya',
  createWithAI: 'AI yordamida yarating',
  createQuiz: 'Quiz yaratish',
  testQuestions: 'Test savollar',
  recentWorks: "So'nggi ishlar",
  slides: 'slayd',
  noPresentation: "Hali prezentatsiya yo'q",
  createNew: 'Yangi prezentatsiya yarating',
  features: 'Imkoniyatlar',
  templates: 'Shablonlar',
  fast: 'Tezkor',
  convenient: 'Qulay',
  mobile: 'Mobil',

  // Balance & Pricing
  yourBalance: 'Sizning balansingiz',
  uzs: "so'm",
  pricing: 'Narxlar',
  slidesCount: '{count} slayd',
  freeEditing: 'Tahrirlash BEPUL!',
  freeEditingDesc: "Redaktorda slayd qo'shish, o'zgartirish va tahrirlash qo'shimcha pul talab qilmaydi",
  giftBalance: 'Sovg\'a balans',

  hoursAgo: 'soat oldin',
  yesterday: 'Kecha',

  enterTopic: 'Mavzuni kiriting',
  aiWillCreate: "AI sizning mavzuingiz bo'yicha professional prezentatsiya yaratadi",
  presentationTopic: 'Prezentatsiya mavzusi',
  topicPlaceholder: "Masalan: O'zbekiston tarixi",
  suggestions: 'Maslahatlar:',
  ecology: 'Ekologiya',
  health: "Sog'liq",
  technology: 'Texnologiya',
  art: "San'at",

  selectTemplate: 'Shablon tanlang',
  chooseFromProfessional: 'Professional dizaynlar orasidan tanlang',
  previewLabel: "Ko'rish",
  useThisTemplate: 'Shu shablonni tanlash',
  buildingDeck: 'Prezentatsiya tayyorlanmoqda...',
  downloadDeck: 'Yuklab olish',
  deckSent: 'Telegramga yuborildi',
  deleteSlide: "Slaydni o'chirish",
  addBullet: "Punkt qo'shish",
  bulletPlaceholder: 'Matn kiriting...',
  addImage: 'Rasm',
  imageSearchPlaceholder: 'Rasm qidirish...',
  removeImage: 'Rasmni olib tashlash',
  addSlide: 'Slayd',
  addChart: 'Grafik',
  addShape: 'Shakl',

  settings: 'Sozlamalar',
  enterDetails: 'Prezentatsiya tafsilotlarini kiriting',
  slideCount: 'Slaydlar soni',
  studentName: 'Talaba ismi',
  studentNameOptional: 'Talaba ismi (ixtiyoriy)',
  teacherName: "O'qituvchi ismi",
  teacherNameOptional: "O'qituvchi ismi (ixtiyoriy)",
  namePlaceholder: 'Ism familiya',

  // New templates
  academicBlue: "Akademik ko'k",
  editorialSerif: 'Editorial (serif)',
  gradientViolet: 'Gradient binafsha',
  scholarGreen: 'Ilmiy yashil',
  warmSand: 'Iliq qum',
  minimalWhite: 'Minimal oq',
  modernDark: "Zamonaviy qorong'i",
  // Legacy
  modern: 'Zamonaviy',
  academic: 'Akademik',
  minimalist: 'Minimalist',
  nature: 'Tabiat',
  sunset: 'Quyosh',
  elegant: 'Elegant',
  title: 'Sarlavha',

  starting: 'Boshlanmoqda...',
  analyzingTopic: 'Mavzu tahlil qilinmoqda',
  creatingContent: 'Kontent yaratilmoqda',
  preparingSlides: 'Slaydlar tayyorlanmoqda',
  applyingDesign: "Dizayn qo'llanmoqda",
  ready: 'Tayyor!',
  percentReady: 'tayyor',
  willBeSentToTelegram: 'Telegram chatga yuboriladi',

  presentationCreating: 'Prezentatsiya yaratilmoqda!',
  willBeSentToChat: 'Telegram chatga yuboriladi.',
  errorOccurred: 'Xatolik yuz berdi',
  tryAgain: "Qaytadan urinib ko'ring.",
};

const ru: Translations = {
  loading: 'Загрузка...',
  continue: 'Продолжить',
  create: 'Создать',
  back: 'Назад',

  // Slide editor placeholders
  placeholderTitle: 'Заголовок',
  placeholderSubtitle: 'Подзаголовок',
  placeholderText: 'Текст',
  placeholderConclusion: 'Заключение',
  placeholderQuote: 'Текст цитаты',
  placeholderAuthor: 'Автор',
  placeholderPlan: 'План',
  placeholderYear: 'Год',
  placeholderEvent: 'Событие',
  placeholderNote: 'Примечание',
  placeholderName: 'Название',

  greeting: 'Привет',
  createProfessional: 'Создавайте профессиональные презентации',
  newPresentation: 'Новая презентация',
  createWithAI: 'Создайте с помощью AI',
  createQuiz: 'Создать тест',
  testQuestions: 'Тестовые вопросы',
  recentWorks: 'Последние работы',
  slides: 'слайдов',
  noPresentation: 'Презентаций пока нет',
  createNew: 'Создайте новую презентацию',
  features: 'Возможности',
  templates: 'Шаблоны',
  fast: 'Быстро',
  convenient: 'Удобно',
  mobile: 'Мобильно',

  // Balance & Pricing
  yourBalance: 'Ваш баланс',
  uzs: 'сум',
  pricing: 'Цены',
  slidesCount: '{count} слайдов',
  freeEditing: 'Редактирование БЕСПЛАТНО!',
  freeEditingDesc: 'Добавление, изменение и редактирование слайдов в редакторе не требует дополнительной оплаты',
  giftBalance: 'Подарочный баланс',

  hoursAgo: 'часов назад',
  yesterday: 'Вчера',

  enterTopic: 'Введите тему',
  aiWillCreate: 'AI создаст профессиональную презентацию по вашей теме',
  presentationTopic: 'Тема презентации',
  topicPlaceholder: 'Например: История Узбекистана',
  suggestions: 'Предложения:',
  ecology: 'Экология',
  health: 'Здоровье',
  technology: 'Технологии',
  art: 'Искусство',

  selectTemplate: 'Выберите шаблон',
  chooseFromProfessional: 'Выберите из профессиональных дизайнов',
  previewLabel: 'Просмотр',
  useThisTemplate: 'Выбрать этот шаблон',
  buildingDeck: 'Презентация готовится...',
  downloadDeck: 'Скачать',
  deckSent: 'Отправлено в Telegram',
  deleteSlide: 'Удалить слайд',
  addBullet: 'Добавить пункт',
  bulletPlaceholder: 'Введите текст...',
  addImage: 'Картинка',
  imageSearchPlaceholder: 'Поиск картинок...',
  removeImage: 'Удалить картинку',
  addSlide: 'Слайд',
  addChart: 'График',
  addShape: 'Фигура',

  settings: 'Настройки',
  enterDetails: 'Введите детали презентации',
  slideCount: 'Количество слайдов',
  studentName: 'Имя студента',
  studentNameOptional: 'Имя студента (необязательно)',
  teacherName: 'Имя преподавателя',
  teacherNameOptional: 'Имя преподавателя (необязательно)',
  namePlaceholder: 'Имя фамилия',

  // New templates
  academicBlue: 'Академический синий',
  editorialSerif: 'Редакционный (serif)',
  gradientViolet: 'Градиент фиолетовый',
  scholarGreen: 'Научный зелёный',
  warmSand: 'Тёплый песок',
  minimalWhite: 'Минимал белый',
  modernDark: 'Современный тёмный',
  // Legacy
  modern: 'Современный',
  academic: 'Академический',
  minimalist: 'Минималистичный',
  nature: 'Природа',
  sunset: 'Закат',
  elegant: 'Элегантный',
  title: 'Заголовок',

  starting: 'Начинаем...',
  analyzingTopic: 'Анализируем тему',
  creatingContent: 'Создаём контент',
  preparingSlides: 'Готовим слайды',
  applyingDesign: 'Применяем дизайн',
  ready: 'Готово!',
  percentReady: 'готово',
  willBeSentToTelegram: 'Будет отправлено в Telegram чат',

  presentationCreating: 'Презентация создаётся!',
  willBeSentToChat: 'Будет отправлена в Telegram чат.',
  errorOccurred: 'Произошла ошибка',
  tryAgain: 'Попробуйте ещё раз.',
};

const en: Translations = {
  loading: 'Loading...',
  continue: 'Continue',
  create: 'Create',
  back: 'Back',

  // Slide editor placeholders
  placeholderTitle: 'Title',
  placeholderSubtitle: 'Subtitle',
  placeholderText: 'Text',
  placeholderConclusion: 'Conclusion',
  placeholderQuote: 'Quote text',
  placeholderAuthor: 'Author',
  placeholderPlan: 'Plan',
  placeholderYear: 'Year',
  placeholderEvent: 'Event',
  placeholderNote: 'Note',
  placeholderName: 'Name',

  greeting: 'Hello',
  createProfessional: 'Create professional presentations',
  newPresentation: 'New presentation',
  createWithAI: 'Create with AI',
  createQuiz: 'Create Quiz',
  testQuestions: 'Test questions',
  recentWorks: 'Recent works',
  slides: 'slides',
  noPresentation: 'No presentations yet',
  createNew: 'Create a new presentation',
  features: 'Features',
  templates: 'Templates',
  fast: 'Fast',
  convenient: 'Convenient',
  mobile: 'Mobile',

  // Balance & Pricing
  yourBalance: 'Your balance',
  uzs: 'UZS',
  pricing: 'Pricing',
  slidesCount: '{count} slides',
  freeEditing: 'Editing is FREE!',
  freeEditingDesc: 'Adding, changing, and editing slides in the editor does not require additional payment',
  giftBalance: 'Gift balance',

  hoursAgo: 'hours ago',
  yesterday: 'Yesterday',

  enterTopic: 'Enter topic',
  aiWillCreate: 'AI will create a professional presentation on your topic',
  presentationTopic: 'Presentation topic',
  topicPlaceholder: 'For example: History of Uzbekistan',
  suggestions: 'Suggestions:',
  ecology: 'Ecology',
  health: 'Health',
  technology: 'Technology',
  art: 'Art',

  selectTemplate: 'Select template',
  chooseFromProfessional: 'Choose from professional designs',
  previewLabel: 'Preview',
  useThisTemplate: 'Use this template',
  buildingDeck: 'Building your presentation...',
  downloadDeck: 'Download',
  deckSent: 'Sent to Telegram',
  deleteSlide: 'Delete slide',
  addBullet: 'Add point',
  bulletPlaceholder: 'Enter text...',
  addImage: 'Image',
  imageSearchPlaceholder: 'Search images...',
  removeImage: 'Remove image',
  addSlide: 'Slide',
  addChart: 'Chart',
  addShape: 'Shape',

  settings: 'Settings',
  enterDetails: 'Enter presentation details',
  slideCount: 'Number of slides',
  studentName: 'Student name',
  studentNameOptional: 'Student name (optional)',
  teacherName: 'Teacher name',
  teacherNameOptional: 'Teacher name (optional)',
  namePlaceholder: 'Full name',

  // New templates
  academicBlue: 'Academic Blue',
  editorialSerif: 'Editorial (serif)',
  gradientViolet: 'Gradient Violet',
  scholarGreen: 'Scholar Green',
  warmSand: 'Warm Sand',
  minimalWhite: 'Minimal White',
  modernDark: 'Modern Dark',
  // Legacy
  modern: 'Modern',
  academic: 'Academic',
  minimalist: 'Minimalist',
  nature: 'Nature',
  sunset: 'Sunset',
  elegant: 'Elegant',
  title: 'Title',

  starting: 'Starting...',
  analyzingTopic: 'Analyzing topic',
  creatingContent: 'Creating content',
  preparingSlides: 'Preparing slides',
  applyingDesign: 'Applying design',
  ready: 'Ready!',
  percentReady: 'ready',
  willBeSentToTelegram: 'Will be sent to Telegram chat',

  presentationCreating: 'Presentation is being created!',
  willBeSentToChat: 'Will be sent to Telegram chat.',
  errorOccurred: 'An error occurred',
  tryAgain: 'Please try again.',
};

const de: Translations = {
  loading: 'Wird geladen...',
  continue: 'Weiter',
  create: 'Erstellen',
  back: 'Zurück',

  // Slide editor placeholders
  placeholderTitle: 'Titel',
  placeholderSubtitle: 'Untertitel',
  placeholderText: 'Text',
  placeholderConclusion: 'Fazit',
  placeholderQuote: 'Zitat-Text',
  placeholderAuthor: 'Autor',
  placeholderPlan: 'Gliederung',
  placeholderYear: 'Jahr',
  placeholderEvent: 'Ereignis',
  placeholderNote: 'Anmerkung',
  placeholderName: 'Name',

  greeting: 'Hallo',
  createProfessional: 'Erstellen Sie professionelle Präsentationen',
  newPresentation: 'Neue Präsentation',
  createWithAI: 'Mit KI erstellen',
  createQuiz: 'Quiz erstellen',
  testQuestions: 'Testfragen',
  recentWorks: 'Letzte Arbeiten',
  slides: 'Folien',
  noPresentation: 'Noch keine Präsentationen',
  createNew: 'Erstellen Sie eine neue Präsentation',
  features: 'Funktionen',
  templates: 'Vorlagen',
  fast: 'Schnell',
  convenient: 'Praktisch',
  mobile: 'Mobil',

  // Balance & Pricing
  yourBalance: 'Ihr Guthaben',
  uzs: 'UZS',
  pricing: 'Preise',
  slidesCount: '{count} Folien',
  freeEditing: 'Bearbeitung ist KOSTENLOS!',
  freeEditingDesc: 'Das Hinzufügen, Ändern und Bearbeiten von Folien im Editor erfordert keine zusätzliche Zahlung',
  giftBalance: 'Geschenkguthaben',

  hoursAgo: 'Stunden her',
  yesterday: 'Gestern',

  enterTopic: 'Thema eingeben',
  aiWillCreate: 'KI erstellt eine professionelle Präsentation zu Ihrem Thema',
  presentationTopic: 'Präsentationsthema',
  topicPlaceholder: 'Zum Beispiel: Geschichte Usbekistans',
  suggestions: 'Vorschläge:',
  ecology: 'Ökologie',
  health: 'Gesundheit',
  technology: 'Technologie',
  art: 'Kunst',

  selectTemplate: 'Vorlage auswählen',
  chooseFromProfessional: 'Wählen Sie aus professionellen Designs',
  previewLabel: 'Vorschau',
  useThisTemplate: 'Diese Vorlage verwenden',
  buildingDeck: 'Präsentation wird erstellt...',
  downloadDeck: 'Herunterladen',
  deckSent: 'An Telegram gesendet',
  deleteSlide: 'Folie löschen',
  addBullet: 'Punkt hinzufügen',
  bulletPlaceholder: 'Text eingeben...',
  addImage: 'Bild',
  imageSearchPlaceholder: 'Bilder suchen...',
  removeImage: 'Bild entfernen',
  addSlide: 'Folie',
  addChart: 'Diagramm',
  addShape: 'Form',

  settings: 'Einstellungen',
  enterDetails: 'Präsentationsdetails eingeben',
  slideCount: 'Anzahl der Folien',
  studentName: 'Studentenname',
  studentNameOptional: 'Studentenname (optional)',
  teacherName: 'Lehrername',
  teacherNameOptional: 'Lehrername (optional)',
  namePlaceholder: 'Vollständiger Name',

  // New templates
  academicBlue: 'Akademisch Blau',
  editorialSerif: 'Editorial (Serif)',
  gradientViolet: 'Gradient Violett',
  scholarGreen: 'Wissenschaft Grün',
  warmSand: 'Warmer Sand',
  minimalWhite: 'Minimal Weiß',
  modernDark: 'Modern Dunkel',
  // Legacy
  modern: 'Modern',
  academic: 'Akademisch',
  minimalist: 'Minimalistisch',
  nature: 'Natur',
  sunset: 'Sonnenuntergang',
  elegant: 'Elegant',
  title: 'Titel',

  starting: 'Startet...',
  analyzingTopic: 'Thema wird analysiert',
  creatingContent: 'Inhalt wird erstellt',
  preparingSlides: 'Folien werden vorbereitet',
  applyingDesign: 'Design wird angewendet',
  ready: 'Fertig!',
  percentReady: 'fertig',
  willBeSentToTelegram: 'Wird an Telegram-Chat gesendet',

  presentationCreating: 'Präsentation wird erstellt!',
  willBeSentToChat: 'Wird an Telegram-Chat gesendet.',
  errorOccurred: 'Ein Fehler ist aufgetreten',
  tryAgain: 'Bitte versuchen Sie es erneut.',
};

export const translations: Record<SupportedLanguage, Translations> = {
  uz,
  ru,
  en,
  de,
};

export function getTranslations(lang: SupportedLanguage): Translations {
  return translations[lang] || translations.uz;
}
