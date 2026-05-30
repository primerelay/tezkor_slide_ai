export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },

  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'tezkor',
    password: process.env.DATABASE_PASSWORD || 'tezkor123',
    name: process.env.DATABASE_NAME || 'tezkor_slide_ai',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },

  images: {
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY,
    pexelsApiKey: process.env.PEXELS_API_KEY,
    // Hybrid fallback: when no stock key matches, optionally generate an
    // image via OpenRouter (reuses the existing OpenRouter key).
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    // Set to 'false' to disable the paid OpenRouter image fallback.
    openrouterEnabled: (process.env.IMAGE_OPENROUTER_ENABLED || 'true') !== 'false',
    generateModel:
      process.env.IMAGE_GENERATION_MODEL || 'google/gemini-2.5-flash-image',
  },

  storage: {
    path: process.env.STORAGE_PATH || './storage',
  },

  admin: {
    telegramIds: (process.env.ADMIN_TELEGRAM_IDS || '')
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id)),
  },

  requiredChannel: {
    username: process.env.REQUIRED_CHANNEL_USERNAME || '',
    url: process.env.REQUIRED_CHANNEL_URL || '',
  },

  pricing: {
    creditsPerPresentation: parseInt(
      process.env.CREDITS_PER_PRESENTATION || '1',
      10,
    ),
    defaultFreeCredits: parseInt(process.env.DEFAULT_FREE_CREDITS || '3', 10),
  },

  payment: {
    cardNumber: process.env.PAYMENT_CARD_NUMBER || '8600 1234 5678 9012',
    cardOwner: process.env.PAYMENT_CARD_OWNER || 'SliderAI UZ',
  },
});
