export type SupportedLanguage = 'uz' | 'ru' | 'en' | 'de';

export interface Translations {
  // Common
  loading: string;
  continue: string;
  create: string;
  back: string;

  // Dashboard
  greeting: string;
  createProfessional: string;
  newPresentation: string;
  createWithAI: string;
  recentWorks: string;
  slides: string;
  noPresentation: string;
  createNew: string;
  features: string;
  templates: string;
  fast: string;
  convenient: string;
  mobile: string;

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

  greeting: 'Salom',
  createProfessional: 'Professional prezentatsiyalar yarating',
  newPresentation: 'Yangi prezentatsiya',
  createWithAI: 'AI yordamida yarating',
  recentWorks: "So'nggi ishlar",
  slides: 'slayd',
  noPresentation: "Hali prezentatsiya yo'q",
  createNew: 'Yangi prezentatsiya yarating',
  features: 'Imkoniyatlar',
  templates: 'Shablonlar',
  fast: 'Tezkor',
  convenient: 'Qulay',
  mobile: 'Mobil',

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

  greeting: 'Привет',
  createProfessional: 'Создавайте профессиональные презентации',
  newPresentation: 'Новая презентация',
  createWithAI: 'Создайте с помощью AI',
  recentWorks: 'Последние работы',
  slides: 'слайдов',
  noPresentation: 'Презентаций пока нет',
  createNew: 'Создайте новую презентацию',
  features: 'Возможности',
  templates: 'Шаблоны',
  fast: 'Быстро',
  convenient: 'Удобно',
  mobile: 'Мобильно',

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

  greeting: 'Hello',
  createProfessional: 'Create professional presentations',
  newPresentation: 'New presentation',
  createWithAI: 'Create with AI',
  recentWorks: 'Recent works',
  slides: 'slides',
  noPresentation: 'No presentations yet',
  createNew: 'Create a new presentation',
  features: 'Features',
  templates: 'Templates',
  fast: 'Fast',
  convenient: 'Convenient',
  mobile: 'Mobile',

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

  greeting: 'Hallo',
  createProfessional: 'Erstellen Sie professionelle Präsentationen',
  newPresentation: 'Neue Präsentation',
  createWithAI: 'Mit KI erstellen',
  recentWorks: 'Letzte Arbeiten',
  slides: 'Folien',
  noPresentation: 'Noch keine Präsentationen',
  createNew: 'Erstellen Sie eine neue Präsentation',
  features: 'Funktionen',
  templates: 'Vorlagen',
  fast: 'Schnell',
  convenient: 'Praktisch',
  mobile: 'Mobil',

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
