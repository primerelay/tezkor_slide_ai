import { tr } from './locales/tr';
import { kk } from './locales/kk';
import { ar } from './locales/ar';
import { ko } from './locales/ko';
import { uzc } from './locales/uzc';

export type SupportedLanguage = 'uz' | 'ru' | 'en' | 'de' | 'tr' | 'kk' | 'ar' | 'ko' | 'uzc';

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
  allFeatures: string;
  createSlide: string;
  withAI: string;
  wordDocument: string;
  docMustaqilIsh: string;
  docReferat: string;
  docInsho: string;
  inshoSubtitle: string;
  docKursIshi: string;
  docMaqola: string;
  scientificArticle: string;
  docTezis: string;
  conference: string;
  flashcards: string;
  quickMemorization: string;
  docGlossary: string;
  glossarySubtitle: string;
  docCrossword: string;
  crosswordSubtitle: string;
  docResume: string;
  forWork: string;
  docTranslator: string;
  academicTranslation: string;
  creating: string;
  beingCreated: string;
  next: string;
  characters: string;
  readyShort: string;
  optional: string;
  totalPrice: string;
  pages: string;
  backToHome: string;
  wordSentToChat: string;
  telegramUserNotDetected: string;
  enterText: string;
  textOrTopic: string;
  detailsStep: string;
  sizeAndPrice: string;
  descMustaqilIsh: string;
  descReferat: string;
  descInsho: string;
  descKursIshi: string;
  descMaqola: string;
  descTezis: string;
  readyDocIncludes: string;
  topic: string;
  docTopicPlaceholder: string;
  institution: string;
  institutionPlaceholder: string;
  preparedBy: string;
  fullNamePlaceholder: string;
  checkedBy: string;
  teacherNamePlaceholder: string;
  selectSize: string;
  featEssayText: string;
  featIntroBodyConclusion: string;
  featFontReady: string;
  featAbstractKeywords: string;
  featIntroSectionsConclusion: string;
  featReferences: string;
  featTitleToc: string;
  featIntroChaptersConclusion: string;
  featImagesReferences: string;
  docSentAsWord: string;
  aiWritingPlacingImages: string;
  aiWritingText: string;
  mayTake2to4min: string;
  documentReady: string;
  telegramUserNotDetectedLong: string;
  docCreateError: string;
  docTakingLong: string;
  docCreateFailedRefund: string;
  glossaryHint: string;
  crosswordHint: string;
  unitTerm: string;
  unitWord: string;
  featAlphabeticalTerms: string;
  featAcademicDefinitions: string;
  featWordPrintReady: string;
  featIntersectingCells: string;
  featQuestionsHV: string;
  featWithAnswerKey: string;
  contentPlaceholder10: string;
  selectTermCount: string;
  selectWordCount: string;
  readyWordFileSent: string;
  takesFewSeconds: string;
  readyEmoji: string;
  tplClassic: string;
  tplMinimal: string;
  tplBold: string;
  tplTwoTone: string;
  tplExecutive: string;
  personalInfo: string;
  experienceEducation: string;
  chooseTemplate: string;
  preparing: string;
  fullNameLabel: string;
  fullNameSample: string;
  positionLabel: string;
  positionPlaceholder: string;
  phoneLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  experienceLabel: string;
  experiencePlaceholder: string;
  educationLabel: string;
  educationPlaceholder: string;
  skillsLabel: string;
  skillsPlaceholder: string;
  languagesLabel: string;
  languagesPlaceholder: string;
  chooseDesignYouLike: string;
  priceLabel: string;
  resumeTemplateNote: string;
  resumeBeingPrepared: string;
  aiFormatsInfo: string;
  resumeReady: string;
  cvSentToTelegram: string;
  resumeCreateError: string;
  langUzbek: string;
  langRussian: string;
  langEnglish: string;
  langGerman: string;
  translationLanguage: string;
  translateTextPlaceholder: string;
  translationResult: string;
  copied: string;
  copy: string;
  translating: string;
  translateAction: string;
  translationError: string;
  cardCount: string;
  flashcardContentPlaceholder: string;
  selectCardCount: string;
  cardsUnit: string;
  featCardQA: string;
  featFlipReview: string;
  featOpenInTelegram: string;
  cardsBeingCreated: string;
  aiSelectingKeyPoints: string;
  flashcardCreateError: string;
  cardsNotFound: string;
  home: string;
  question: string;
  tapForAnswer: string;
  answer: string;
  tapToReturn: string;
  flip: string;
  flashcardShareText: string;
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
  quizCreateError: string;
  quizTakingLong: string;
  quizGenerating: string;
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
  allFeatures: "Barcha funksiyalar",
  createSlide: "Slide yaratish",
  withAI: "AI yordamida",
  wordDocument: "Word hujjat",
  docMustaqilIsh: "Mustaqil ish",
  docReferat: "Referat",
  docInsho: "Insho",
  inshoSubtitle: "Insho / Essey",
  docKursIshi: "Kurs ishi",
  docMaqola: "Maqola",
  scientificArticle: "Ilmiy maqola",
  docTezis: "Tezis",
  conference: "Konferensiya",
  flashcards: "Flesh kartalar",
  quickMemorization: "Tez yodlash",
  docGlossary: "Glossary",
  glossarySubtitle: "Izohli lug'at",
  docCrossword: "Krossvord",
  crosswordSubtitle: "O'yin-mashq",
  docResume: "Rezyume (CV)",
  forWork: "Ish uchun",
  docTranslator: "Tarjimon",
  academicTranslation: "Akademik tarjima",
  creating: "Yaratilmoqda...",
  beingCreated: "yaratilmoqda...",
  next: "Keyingisi",
  characters: "belgi",
  readyShort: "Tayyor",
  optional: "(ixtiyoriy)",
  totalPrice: "Jami narx",
  pages: "bet",
  backToHome: "Bosh sahifaga qaytish",
  wordSentToChat: "Word (.docx) fayli Telegram chatingizga yuborildi.",
  telegramUserNotDetected: "Telegram foydalanuvchi aniqlanmadi. Ilovani bot ichidagi tugma orqali oching.",
  enterText: "Matn kiriting",
  textOrTopic: "Matn yoki mavzu",
  detailsStep: "Ma'lumotlar",
  sizeAndPrice: "Hajm va narx",
  descMustaqilIsh: "AI professional mustaqil ish tayyorlaydi",
  descReferat: "AI professional referat tayyorlaydi",
  descInsho: "AI ravon, professional insho yozadi",
  descKursIshi: "AI to'liq kurs ishi tayyorlaydi",
  descMaqola: "AI ilmiy maqola yozadi (annotatsiya + kalit so'zlar)",
  descTezis: "AI konferensiya tezisini yozadi",
  readyDocIncludes: "Tayyor hujjat: titul varaq, mundarija, kirish, boblar, xulosa, adabiyotlar va rasmlar bilan.",
  topic: "Mavzu",
  docTopicPlaceholder: "Masalan: Sun'iy intellektning zamonaviy jamiyatga ta'siri",
  institution: "O'quv muassasasi",
  institutionPlaceholder: "Masalan: Toshkent davlat universiteti",
  preparedBy: "Bajardi",
  fullNamePlaceholder: "Ism Familiya",
  checkedBy: "Tekshirdi",
  teacherNamePlaceholder: "Ustoz F.I.Sh.",
  selectSize: "Hajmni tanlang",
  featEssayText: "Ravon, ta'sirchan insho matni",
  featIntroBodyConclusion: "Kirish — asosiy qism — xulosa",
  featFontReady: "Times New Roman 14, 1.5 interval — topshirishga tayyor",
  featAbstractKeywords: "Annotatsiya va kalit so'zlar",
  featIntroSectionsConclusion: "Kirish, asosiy bo'limlar, xulosa",
  featReferences: "Adabiyotlar ro'yxati",
  featTitleToc: "Titul varaq va mundarija",
  featIntroChaptersConclusion: "Kirish, boblar, xulosa",
  featImagesReferences: "Rasmlar va adabiyotlar ro'yxati",
  docSentAsWord: "Tayyor hujjat Word (.docx) formatida Telegram'ga yuboriladi.",
  aiWritingPlacingImages: "AI matn yozib, rasmlarni joylayapti.",
  aiWritingText: "AI matn yozyapti.",
  mayTake2to4min: "Bu 2-4 daqiqa vaqt olishi mumkin.",
  documentReady: "Hujjat tayyor! 🎉",
  telegramUserNotDetectedLong: "Telegram foydalanuvchi aniqlanmadi. Iltimos, ilovani bot ichidagi \"🚀 Web ilovani ochish\" tugmasi orqali oching (brauzerda emas).",
  docCreateError: "Hujjat yaratishda xatolik yuz berdi",
  docTakingLong: "Hujjat yaratish uzoq davom etmoqda. Tayyor bo'lganda Telegram'ga yuboriladi.",
  docCreateFailedRefund: "Hujjat yaratishda xatolik yuz berdi. Balansingiz qaytarildi.",
  glossaryHint: "AI muhim atamalarni ta'riflari bilan alfavit tartibda tayyorlaydi.",
  crosswordHint: "AI so'zlarni tanlab, ularni bir-biriga kesishtirib krossvord tuzadi.",
  unitTerm: "atama",
  unitWord: "so'z",
  featAlphabeticalTerms: "Alfavit tartibda atamalar",
  featAcademicDefinitions: "Aniq akademik ta'riflar",
  featWordPrintReady: "Word (.docx) — chop etishga tayyor",
  featIntersectingCells: "Kesishgan katakchalar",
  featQuestionsHV: "Savollar (gorizontal/vertikal)",
  featWithAnswerKey: "Javoblar kaliti bilan",
  contentPlaceholder10: "Darslik matni yoki mavzuni kiriting... (kamida 10 belgi)",
  selectTermCount: "Atamalar sonini tanlang",
  selectWordCount: "So'zlar sonini tanlang",
  readyWordFileSent: "Tayyor Word (.docx) fayli Telegram'ga yuboriladi.",
  takesFewSeconds: "Bu bir necha soniya vaqt oladi.",
  readyEmoji: "Tayyor! 🎉",
  tplClassic: "Klassik",
  tplMinimal: "Minimal",
  tplBold: "Jasur",
  tplTwoTone: "Ikki rang",
  tplExecutive: "Ijrochi",
  personalInfo: "Shaxsiy ma'lumotlar",
  experienceEducation: "Tajriba va ta'lim",
  chooseTemplate: "Shablonni tanlang",
  preparing: "Tayyorlanmoqda...",
  fullNameLabel: "To'liq ism-familiya",
  fullNameSample: "Aliyev Jasur",
  positionLabel: "Lavozim / kasb",
  positionPlaceholder: "Frontend dasturchi",
  phoneLabel: "Telefon",
  emailLabel: "Email",
  emailPlaceholder: "ism@mail.com",
  cityLabel: "Shahar",
  cityPlaceholder: "Toshkent",
  experienceLabel: "Ish tajribasi",
  experiencePlaceholder: "Qayerda, qachon, qanday ishlagansiz — erkin yozing. AI professional qilib beradi.",
  educationLabel: "Ta'lim",
  educationPlaceholder: "Qaysi universitet/kollej, yo'nalish, yillar",
  skillsLabel: "Ko'nikmalar",
  skillsPlaceholder: "JavaScript, React, Git (vergul bilan)",
  languagesLabel: "Tillar",
  languagesPlaceholder: "O'zbek, Rus, Ingliz - B2",
  chooseDesignYouLike: "Yoqqan dizaynni tanlang:",
  priceLabel: "Narx",
  resumeTemplateNote: "✨ Tanlangan shablonда professional CV (Word .docx) Telegram'ga yuboriladi.",
  resumeBeingPrepared: "Rezyume tayyorlanmoqda...",
  aiFormatsInfo: "AI ma'lumotlaringizni professional formatga soladi.",
  resumeReady: "Rezyume tayyor! 🎉",
  cvSentToTelegram: "CV Word (.docx) formatida Telegram'ga yuborildi.",
  resumeCreateError: "Rezyume yaratishda xatolik yuz berdi",
  langUzbek: "🇺🇿 O'zbekcha",
  langRussian: "🇷🇺 Ruscha",
  langEnglish: "🇬🇧 Inglizcha",
  langGerman: "🇩🇪 Nemischa",
  translationLanguage: "Tarjima tili",
  translateTextPlaceholder: "Tarjima qilinadigan matnni kiriting...",
  translationResult: "Tarjima",
  copied: "Nusxalandi",
  copy: "Nusxalash",
  translating: "Tarjima qilinmoqda...",
  translateAction: "Tarjima qilish",
  translationError: "Tarjimada xatolik",
  cardCount: "Kartalar soni",
  flashcardContentPlaceholder: "Kartalar yaratish uchun darslik matni yoki mavzuni kiriting... (kamida 10 belgi)",
  selectCardCount: "Kartalar sonini tanlang",
  cardsUnit: "ta karta",
  featCardQA: "Har karta: savol/tushuncha + javob/ta'rif",
  featFlipReview: "Kartani ag'darib takrorlash",
  featOpenInTelegram: "Telegram'da ham ochish mumkin",
  cardsBeingCreated: "Kartalar yaratilmoqda...",
  aiSelectingKeyPoints: "AI eng muhim nuqtalarni tanlayapti",
  flashcardCreateError: "Flesh kartalar yaratishda xatolik yuz berdi",
  cardsNotFound: "Kartalar topilmadi",
  home: "Bosh sahifa",
  question: "Savol",
  tapForAnswer: "Javob uchun bosing",
  answer: "Javob",
  tapToReturn: "Savolga qaytish uchun bosing",
  flip: "Ag'darish",
  flashcardShareText: "flesh kartalar bilan tez yodlab ol!",
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
  quizCreateError: "Quiz yaratishda xatolik yuz berdi",
  quizTakingLong: "Quiz yaratish juda uzoq davom etmoqda. Iltimos, keyinroq tekshiring.",
  quizGenerating: "AI test savollarini yaratyapti",
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
  allFeatures: "Все функции",
  createSlide: "Создать слайд",
  withAI: "С помощью ИИ",
  wordDocument: "Документ Word",
  docMustaqilIsh: "Самостоятельная работа",
  docReferat: "Реферат",
  docInsho: "Сочинение",
  inshoSubtitle: "Сочинение",
  docKursIshi: "Курсовая работа",
  docMaqola: "Статья",
  scientificArticle: "Научная статья",
  docTezis: "Тезисы",
  conference: "Конференция",
  flashcards: "Карточки",
  quickMemorization: "Быстрое запоминание",
  docGlossary: "Глоссарий",
  glossarySubtitle: "Толковый словарь",
  docCrossword: "Кроссворд",
  crosswordSubtitle: "Игровое упражнение",
  docResume: "Резюме (CV)",
  forWork: "Для работы",
  docTranslator: "Переводчик",
  academicTranslation: "Академический перевод",
  creating: "Создание...",
  beingCreated: "создаётся...",
  next: "Далее",
  characters: "символов",
  readyShort: "Готово",
  optional: "(необязательно)",
  totalPrice: "Итоговая цена",
  pages: "страниц",
  backToHome: "На главную",
  wordSentToChat: "Файл Word (.docx) отправлен в ваш чат Telegram.",
  telegramUserNotDetected: "Пользователь Telegram не определён. Пожалуйста, откройте приложение через кнопку внутри бота.",
  enterText: "Введите текст",
  textOrTopic: "Текст или тема",
  detailsStep: "Детали",
  sizeAndPrice: "Размер и цена",
  descMustaqilIsh: "ИИ подготовит профессиональную самостоятельную работу",
  descReferat: "ИИ подготовит профессиональный реферат",
  descInsho: "ИИ напишет плавное, профессиональное сочинение",
  descKursIshi: "ИИ подготовит полную курсовую работу",
  descMaqola: "ИИ напишет научную статью (аннотация + ключевые слова)",
  descTezis: "ИИ напишет тезисы для конференции",
  readyDocIncludes: "Готовый документ: с титульным листом, оглавлением, введением, главами, заключением, списком литературы и изображениями.",
  topic: "Тема",
  docTopicPlaceholder: "Например: Влияние искусственного интеллекта на современное общество",
  institution: "Учебное заведение",
  institutionPlaceholder: "Например: Ташкентский государственный университет",
  preparedBy: "Подготовил",
  fullNamePlaceholder: "Имя Фамилия",
  checkedBy: "Проверил",
  teacherNamePlaceholder: "ФИО преподавателя",
  selectSize: "Выберите размер",
  featEssayText: "Плавный, выразительный текст сочинения",
  featIntroBodyConclusion: "Введение — основная часть — заключение",
  featFontReady: "Times New Roman 14, интервал 1.5 — готово к сдаче",
  featAbstractKeywords: "Аннотация и ключевые слова",
  featIntroSectionsConclusion: "Введение, основные разделы, заключение",
  featReferences: "Список литературы",
  featTitleToc: "Титульный лист и оглавление",
  featIntroChaptersConclusion: "Введение, главы, заключение",
  featImagesReferences: "Изображения и список литературы",
  docSentAsWord: "Готовый документ будет отправлен в Telegram в формате Word (.docx).",
  aiWritingPlacingImages: "ИИ пишет текст и размещает изображения.",
  aiWritingText: "ИИ пишет текст.",
  mayTake2to4min: "Это может занять 2-4 минуты.",
  documentReady: "Документ готов! 🎉",
  telegramUserNotDetectedLong: "Пользователь Telegram не определён. Пожалуйста, откройте приложение через кнопку \"🚀 Open web app\" внутри бота (а не в браузере).",
  docCreateError: "Произошла ошибка при создании документа",
  docTakingLong: "Создание документа занимает некоторое время. Он будет отправлен в Telegram, когда будет готов.",
  docCreateFailedRefund: "Произошла ошибка при создании документа. Ваш баланс был возвращён.",
  glossaryHint: "ИИ подготовит важные термины с их определениями в алфавитном порядке.",
  crosswordHint: "ИИ подбирает слова и строит кроссворд, пересекая их.",
  unitTerm: "терминов",
  unitWord: "слов",
  featAlphabeticalTerms: "Термины в алфавитном порядке",
  featAcademicDefinitions: "Точные академические определения",
  featWordPrintReady: "Word (.docx) — готово к печати",
  featIntersectingCells: "Пересекающиеся клетки",
  featQuestionsHV: "Вопросы (по горизонтали/вертикали)",
  featWithAnswerKey: "С ключом ответов",
  contentPlaceholder10: "Введите текст учебника или тему... (минимум 10 символов)",
  selectTermCount: "Выберите количество терминов",
  selectWordCount: "Выберите количество слов",
  readyWordFileSent: "Готовый файл Word (.docx) будет отправлен в Telegram.",
  takesFewSeconds: "Это займёт несколько секунд.",
  readyEmoji: "Готово! 🎉",
  tplClassic: "Классический",
  tplMinimal: "Минимальный",
  tplBold: "Смелый",
  tplTwoTone: "Двухцветный",
  tplExecutive: "Деловой",
  personalInfo: "Личная информация",
  experienceEducation: "Опыт и образование",
  chooseTemplate: "Выберите шаблон",
  preparing: "Подготовка...",
  fullNameLabel: "Полное имя",
  fullNameSample: "Иван Иванов",
  positionLabel: "Должность / профессия",
  positionPlaceholder: "Frontend-разработчик",
  phoneLabel: "Телефон",
  emailLabel: "Эл. почта",
  emailPlaceholder: "name@mail.com",
  cityLabel: "Город",
  cityPlaceholder: "Ташкент",
  experienceLabel: "Опыт работы",
  experiencePlaceholder: "Где, когда и как вы работали — пишите свободно. ИИ сделает текст профессиональным.",
  educationLabel: "Образование",
  educationPlaceholder: "Какой университет/колледж, специальность, годы",
  skillsLabel: "Навыки",
  skillsPlaceholder: "JavaScript, React, Git (через запятую)",
  languagesLabel: "Языки",
  languagesPlaceholder: "Узбекский, русский, английский - B2",
  chooseDesignYouLike: "Выберите понравившийся дизайн:",
  priceLabel: "Цена",
  resumeTemplateNote: "✨ Профессиональное резюме (Word .docx) в выбранном шаблоне будет отправлено в Telegram.",
  resumeBeingPrepared: "Резюме готовится...",
  aiFormatsInfo: "ИИ оформит вашу информацию в профессиональном виде.",
  resumeReady: "Резюме готово! 🎉",
  cvSentToTelegram: "Резюме отправлено в Telegram в формате Word (.docx).",
  resumeCreateError: "Произошла ошибка при создании резюме",
  langUzbek: "🇺🇿 Узбекский",
  langRussian: "🇷🇺 Русский",
  langEnglish: "🇬🇧 Английский",
  langGerman: "🇩🇪 Немецкий",
  translationLanguage: "Язык перевода",
  translateTextPlaceholder: "Введите текст для перевода...",
  translationResult: "Перевод",
  copied: "Скопировано",
  copy: "Копировать",
  translating: "Перевод...",
  translateAction: "Перевести",
  translationError: "Ошибка перевода",
  cardCount: "Количество карточек",
  flashcardContentPlaceholder: "Введите текст из учебника или тему для создания карточек... (не менее 10 символов)",
  selectCardCount: "Выберите количество карточек",
  cardsUnit: "карточек",
  featCardQA: "Каждая карточка: вопрос/понятие + ответ/определение",
  featFlipReview: "Переверните карточку для повторения",
  featOpenInTelegram: "Также можно открыть в Telegram",
  cardsBeingCreated: "Карточки создаются...",
  aiSelectingKeyPoints: "ИИ выбирает самые важные моменты",
  flashcardCreateError: "Произошла ошибка при создании карточек",
  cardsNotFound: "Карточки не найдены",
  home: "Главная",
  question: "Вопрос",
  tapForAnswer: "Нажмите, чтобы увидеть ответ",
  answer: "Ответ",
  tapToReturn: "Нажмите, чтобы вернуться к вопросу",
  flip: "Перевернуть",
  flashcardShareText: "запоминайте быстро с помощью карточек!",
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
  quizCreateError: "Произошла ошибка при создании теста",
  quizTakingLong: "Создание теста занимает слишком много времени. Пожалуйста, проверьте позже.",
  quizGenerating: "ИИ создаёт тестовые вопросы",
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
  allFeatures: "All features",
  createSlide: "Create slide",
  withAI: "With AI",
  wordDocument: "Word document",
  docMustaqilIsh: "Independent work",
  docReferat: "Report",
  docInsho: "Essay",
  inshoSubtitle: "Essay",
  docKursIshi: "Coursework",
  docMaqola: "Article",
  scientificArticle: "Scientific article",
  docTezis: "Thesis",
  conference: "Conference",
  flashcards: "Flashcards",
  quickMemorization: "Quick memorization",
  docGlossary: "Glossary",
  glossarySubtitle: "Explanatory dictionary",
  docCrossword: "Crossword",
  crosswordSubtitle: "Game exercise",
  docResume: "Resume (CV)",
  forWork: "For work",
  docTranslator: "Translator",
  academicTranslation: "Academic translation",
  creating: "Creating...",
  beingCreated: "is being created...",
  next: "Next",
  characters: "characters",
  readyShort: "Ready",
  optional: "(optional)",
  totalPrice: "Total price",
  pages: "pages",
  backToHome: "Back to home",
  wordSentToChat: "The Word (.docx) file has been sent to your Telegram chat.",
  telegramUserNotDetected: "Telegram user not detected. Please open the app via the button inside the bot.",
  enterText: "Enter text",
  textOrTopic: "Text or topic",
  detailsStep: "Details",
  sizeAndPrice: "Size and price",
  descMustaqilIsh: "AI prepares a professional independent work",
  descReferat: "AI prepares a professional report",
  descInsho: "AI writes a fluent, professional essay",
  descKursIshi: "AI prepares a complete coursework",
  descMaqola: "AI writes a scientific article (abstract + keywords)",
  descTezis: "AI writes a conference thesis",
  readyDocIncludes: "Ready document: with title page, table of contents, introduction, chapters, conclusion, references and images.",
  topic: "Topic",
  docTopicPlaceholder: "For example: The impact of artificial intelligence on modern society",
  institution: "Educational institution",
  institutionPlaceholder: "For example: Tashkent State University",
  preparedBy: "Prepared by",
  fullNamePlaceholder: "First name Last name",
  checkedBy: "Checked by",
  teacherNamePlaceholder: "Teacher's full name",
  selectSize: "Select size",
  featEssayText: "Fluent, expressive essay text",
  featIntroBodyConclusion: "Introduction — main body — conclusion",
  featFontReady: "Times New Roman 14, 1.5 spacing — ready to submit",
  featAbstractKeywords: "Abstract and keywords",
  featIntroSectionsConclusion: "Introduction, main sections, conclusion",
  featReferences: "List of references",
  featTitleToc: "Title page and table of contents",
  featIntroChaptersConclusion: "Introduction, chapters, conclusion",
  featImagesReferences: "Images and list of references",
  docSentAsWord: "The ready document will be sent to Telegram in Word (.docx) format.",
  aiWritingPlacingImages: "AI is writing the text and placing images.",
  aiWritingText: "AI is writing the text.",
  mayTake2to4min: "This may take 2-4 minutes.",
  documentReady: "Document ready! 🎉",
  telegramUserNotDetectedLong: "Telegram user not detected. Please open the app via the \"🚀 Open web app\" button inside the bot (not in the browser).",
  docCreateError: "An error occurred while creating the document",
  docTakingLong: "Document creation is taking a while. It will be sent to Telegram when ready.",
  docCreateFailedRefund: "An error occurred while creating the document. Your balance has been refunded.",
  glossaryHint: "AI prepares important terms with their definitions in alphabetical order.",
  crosswordHint: "AI selects words and builds a crossword by intersecting them.",
  unitTerm: "terms",
  unitWord: "words",
  featAlphabeticalTerms: "Terms in alphabetical order",
  featAcademicDefinitions: "Precise academic definitions",
  featWordPrintReady: "Word (.docx) — ready to print",
  featIntersectingCells: "Intersecting cells",
  featQuestionsHV: "Questions (horizontal/vertical)",
  featWithAnswerKey: "With answer key",
  contentPlaceholder10: "Enter textbook text or topic... (at least 10 characters)",
  selectTermCount: "Select number of terms",
  selectWordCount: "Select number of words",
  readyWordFileSent: "The ready Word (.docx) file will be sent to Telegram.",
  takesFewSeconds: "This takes a few seconds.",
  readyEmoji: "Ready! 🎉",
  tplClassic: "Classic",
  tplMinimal: "Minimal",
  tplBold: "Bold",
  tplTwoTone: "Two-tone",
  tplExecutive: "Executive",
  personalInfo: "Personal information",
  experienceEducation: "Experience and education",
  chooseTemplate: "Select template",
  preparing: "Preparing...",
  fullNameLabel: "Full name",
  fullNameSample: "John Smith",
  positionLabel: "Position / profession",
  positionPlaceholder: "Frontend developer",
  phoneLabel: "Phone",
  emailLabel: "Email",
  emailPlaceholder: "name@mail.com",
  cityLabel: "City",
  cityPlaceholder: "Tashkent",
  experienceLabel: "Work experience",
  experiencePlaceholder: "Where, when and how you worked — write freely. AI will make it professional.",
  educationLabel: "Education",
  educationPlaceholder: "Which university/college, major, years",
  skillsLabel: "Skills",
  skillsPlaceholder: "JavaScript, React, Git (comma separated)",
  languagesLabel: "Languages",
  languagesPlaceholder: "Uzbek, Russian, English - B2",
  chooseDesignYouLike: "Choose the design you like:",
  priceLabel: "Price",
  resumeTemplateNote: "✨ A professional CV (Word .docx) in the selected template will be sent to Telegram.",
  resumeBeingPrepared: "Resume is being prepared...",
  aiFormatsInfo: "AI formats your information into a professional layout.",
  resumeReady: "Resume ready! 🎉",
  cvSentToTelegram: "The CV has been sent to Telegram in Word (.docx) format.",
  resumeCreateError: "An error occurred while creating the resume",
  langUzbek: "🇺🇿 Uzbek",
  langRussian: "🇷🇺 Russian",
  langEnglish: "🇬🇧 English",
  langGerman: "🇩🇪 German",
  translationLanguage: "Translation language",
  translateTextPlaceholder: "Enter the text to translate...",
  translationResult: "Translation",
  copied: "Copied",
  copy: "Copy",
  translating: "Translating...",
  translateAction: "Translate",
  translationError: "Translation error",
  cardCount: "Number of cards",
  flashcardContentPlaceholder: "Enter textbook text or topic to create cards... (at least 10 characters)",
  selectCardCount: "Select number of cards",
  cardsUnit: "cards",
  featCardQA: "Each card: question/concept + answer/definition",
  featFlipReview: "Flip the card to review",
  featOpenInTelegram: "Can also be opened in Telegram",
  cardsBeingCreated: "Cards are being created...",
  aiSelectingKeyPoints: "AI is selecting the most important points",
  flashcardCreateError: "An error occurred while creating the flashcards",
  cardsNotFound: "Cards not found",
  home: "Home",
  question: "Question",
  tapForAnswer: "Tap for answer",
  answer: "Answer",
  tapToReturn: "Tap to return to the question",
  flip: "Flip",
  flashcardShareText: "memorize quickly with flashcards!",
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
  quizCreateError: "An error occurred while creating the quiz",
  quizTakingLong: "Quiz creation is taking too long. Please check back later.",
  quizGenerating: "AI is generating the test questions",
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
  allFeatures: "Alle Funktionen",
  createSlide: "Folie erstellen",
  withAI: "Mit KI",
  wordDocument: "Word-Dokument",
  docMustaqilIsh: "Selbstständige Arbeit",
  docReferat: "Referat",
  docInsho: "Aufsatz",
  inshoSubtitle: "Aufsatz",
  docKursIshi: "Hausarbeit",
  docMaqola: "Artikel",
  scientificArticle: "Wissenschaftlicher Artikel",
  docTezis: "Thesen",
  conference: "Konferenz",
  flashcards: "Lernkarten",
  quickMemorization: "Schnelles Merken",
  docGlossary: "Glossar",
  glossarySubtitle: "Erklärendes Wörterbuch",
  docCrossword: "Kreuzworträtsel",
  crosswordSubtitle: "Spielübung",
  docResume: "Lebenslauf (CV)",
  forWork: "Für die Arbeit",
  docTranslator: "Übersetzer",
  academicTranslation: "Akademische Übersetzung",
  creating: "Wird erstellt...",
  beingCreated: "wird erstellt...",
  next: "Weiter",
  characters: "Zeichen",
  readyShort: "Fertig",
  optional: "(optional)",
  totalPrice: "Gesamtpreis",
  pages: "Seiten",
  backToHome: "Zur Startseite",
  wordSentToChat: "Die Word-Datei (.docx) wurde an Ihren Telegram-Chat gesendet.",
  telegramUserNotDetected: "Telegram-Benutzer nicht erkannt. Bitte öffnen Sie die App über die Schaltfläche im Bot.",
  enterText: "Text eingeben",
  textOrTopic: "Text oder Thema",
  detailsStep: "Details",
  sizeAndPrice: "Umfang und Preis",
  descMustaqilIsh: "Die KI erstellt eine professionelle selbstständige Arbeit",
  descReferat: "Die KI erstellt ein professionelles Referat",
  descInsho: "Die KI schreibt einen flüssigen, professionellen Aufsatz",
  descKursIshi: "Die KI erstellt eine vollständige Hausarbeit",
  descMaqola: "Die KI schreibt einen wissenschaftlichen Artikel (Abstract + Schlüsselwörter)",
  descTezis: "Die KI schreibt Konferenzthesen",
  readyDocIncludes: "Fertiges Dokument: mit Titelblatt, Inhaltsverzeichnis, Einleitung, Kapiteln, Fazit, Literaturverzeichnis und Bildern.",
  topic: "Thema",
  docTopicPlaceholder: "Zum Beispiel: Der Einfluss künstlicher Intelligenz auf die moderne Gesellschaft",
  institution: "Bildungseinrichtung",
  institutionPlaceholder: "Zum Beispiel: Staatliche Universität Taschkent",
  preparedBy: "Erstellt von",
  fullNamePlaceholder: "Vorname Nachname",
  checkedBy: "Geprüft von",
  teacherNamePlaceholder: "Vollständiger Name des Lehrers",
  selectSize: "Umfang auswählen",
  featEssayText: "Flüssiger, ausdrucksstarker Aufsatztext",
  featIntroBodyConclusion: "Einleitung — Hauptteil — Schluss",
  featFontReady: "Times New Roman 14, Zeilenabstand 1,5 — abgabefertig",
  featAbstractKeywords: "Abstract und Schlüsselwörter",
  featIntroSectionsConclusion: "Einleitung, Hauptabschnitte, Schluss",
  featReferences: "Literaturverzeichnis",
  featTitleToc: "Titelblatt und Inhaltsverzeichnis",
  featIntroChaptersConclusion: "Einleitung, Kapitel, Schluss",
  featImagesReferences: "Bilder und Literaturverzeichnis",
  docSentAsWord: "Das fertige Dokument wird im Word-Format (.docx) an Telegram gesendet.",
  aiWritingPlacingImages: "Die KI schreibt den Text und fügt Bilder ein.",
  aiWritingText: "Die KI schreibt den Text.",
  mayTake2to4min: "Das kann 2-4 Minuten dauern.",
  documentReady: "Dokument fertig! 🎉",
  telegramUserNotDetectedLong: "Telegram-Benutzer nicht erkannt. Bitte öffnen Sie die App über die Schaltfläche \"🚀 Open web app\" im Bot (nicht im Browser).",
  docCreateError: "Beim Erstellen des Dokuments ist ein Fehler aufgetreten",
  docTakingLong: "Die Erstellung des Dokuments dauert etwas. Es wird an Telegram gesendet, sobald es fertig ist.",
  docCreateFailedRefund: "Beim Erstellen des Dokuments ist ein Fehler aufgetreten. Ihr Guthaben wurde zurückerstattet.",
  glossaryHint: "Die KI bereitet wichtige Begriffe mit ihren Definitionen in alphabetischer Reihenfolge auf.",
  crosswordHint: "Die KI wählt Wörter aus und erstellt ein Kreuzworträtsel, indem sie sie überkreuzt.",
  unitTerm: "Begriffe",
  unitWord: "Wörter",
  featAlphabeticalTerms: "Begriffe in alphabetischer Reihenfolge",
  featAcademicDefinitions: "Präzise akademische Definitionen",
  featWordPrintReady: "Word (.docx) — druckfertig",
  featIntersectingCells: "Sich kreuzende Felder",
  featQuestionsHV: "Fragen (waagerecht/senkrecht)",
  featWithAnswerKey: "Mit Lösungsschlüssel",
  contentPlaceholder10: "Lehrbuchtext oder Thema eingeben... (mindestens 10 Zeichen)",
  selectTermCount: "Anzahl der Begriffe auswählen",
  selectWordCount: "Anzahl der Wörter auswählen",
  readyWordFileSent: "Die fertige Word-Datei (.docx) wird an Telegram gesendet.",
  takesFewSeconds: "Das dauert nur wenige Sekunden.",
  readyEmoji: "Fertig! 🎉",
  tplClassic: "Klassisch",
  tplMinimal: "Minimal",
  tplBold: "Kräftig",
  tplTwoTone: "Zweifarbig",
  tplExecutive: "Executive",
  personalInfo: "Persönliche Informationen",
  experienceEducation: "Erfahrung und Ausbildung",
  chooseTemplate: "Vorlage auswählen",
  preparing: "Wird vorbereitet...",
  fullNameLabel: "Vollständiger Name",
  fullNameSample: "Max Mustermann",
  positionLabel: "Position / Beruf",
  positionPlaceholder: "Frontend-Entwickler",
  phoneLabel: "Telefon",
  emailLabel: "E-Mail",
  emailPlaceholder: "name@mail.com",
  cityLabel: "Stadt",
  cityPlaceholder: "Taschkent",
  experienceLabel: "Berufserfahrung",
  experiencePlaceholder: "Wo, wann und wie Sie gearbeitet haben — schreiben Sie frei. Die KI macht es professionell.",
  educationLabel: "Ausbildung",
  educationPlaceholder: "Welche Universität/Hochschule, Fachrichtung, Jahre",
  skillsLabel: "Fähigkeiten",
  skillsPlaceholder: "JavaScript, React, Git (durch Komma getrennt)",
  languagesLabel: "Sprachen",
  languagesPlaceholder: "Usbekisch, Russisch, Englisch - B2",
  chooseDesignYouLike: "Wählen Sie das Design, das Ihnen gefällt:",
  priceLabel: "Preis",
  resumeTemplateNote: "✨ Ein professioneller Lebenslauf (Word .docx) in der ausgewählten Vorlage wird an Telegram gesendet.",
  resumeBeingPrepared: "Lebenslauf wird vorbereitet...",
  aiFormatsInfo: "Die KI formatiert Ihre Informationen in ein professionelles Layout.",
  resumeReady: "Lebenslauf fertig! 🎉",
  cvSentToTelegram: "Der Lebenslauf wurde im Word-Format (.docx) an Telegram gesendet.",
  resumeCreateError: "Beim Erstellen des Lebenslaufs ist ein Fehler aufgetreten",
  langUzbek: "🇺🇿 Usbekisch",
  langRussian: "🇷🇺 Russisch",
  langEnglish: "🇬🇧 Englisch",
  langGerman: "🇩🇪 Deutsch",
  translationLanguage: "Übersetzungssprache",
  translateTextPlaceholder: "Geben Sie den zu übersetzenden Text ein...",
  translationResult: "Übersetzung",
  copied: "Kopiert",
  copy: "Kopieren",
  translating: "Wird übersetzt...",
  translateAction: "Übersetzen",
  translationError: "Übersetzungsfehler",
  cardCount: "Anzahl der Karten",
  flashcardContentPlaceholder: "Geben Sie einen Lehrbuchtext oder ein Thema ein, um Karten zu erstellen... (mindestens 10 Zeichen)",
  selectCardCount: "Anzahl der Karten auswählen",
  cardsUnit: "Karten",
  featCardQA: "Jede Karte: Frage/Begriff + Antwort/Definition",
  featFlipReview: "Karte umdrehen zum Wiederholen",
  featOpenInTelegram: "Kann auch in Telegram geöffnet werden",
  cardsBeingCreated: "Karten werden erstellt...",
  aiSelectingKeyPoints: "Die KI wählt die wichtigsten Punkte aus",
  flashcardCreateError: "Beim Erstellen der Lernkarten ist ein Fehler aufgetreten",
  cardsNotFound: "Keine Karten gefunden",
  home: "Startseite",
  question: "Frage",
  tapForAnswer: "Tippen für die Antwort",
  answer: "Antwort",
  tapToReturn: "Tippen, um zur Frage zurückzukehren",
  flip: "Umdrehen",
  flashcardShareText: "schnell mit Lernkarten auswendig lernen!",
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
  quizCreateError: "Beim Erstellen des Tests ist ein Fehler aufgetreten",
  quizTakingLong: "Die Testerstellung dauert zu lange. Bitte später erneut prüfen.",
  quizGenerating: "KI erstellt die Testfragen",
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
  tr,
  kk,
  ar,
  ko,
  uzc,
};

export function getTranslations(lang: SupportedLanguage): Translations {
  return translations[lang] || translations.uz;
}
