import { motion } from 'framer-motion';
import { Sparkles, Zap, Globe, Shield, ArrowRight, CheckCircle, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI bilan yarating',
    description: "Sun'iy intellekt yordamida professional prezentatsiyalar bir necha daqiqada tayyor",
  },
  {
    icon: Zap,
    title: 'Tez va oson',
    description: "Mavzuni yozing, shablon tanlang va tayyor prezentatsiyangizni oling",
  },
  {
    icon: Globe,
    title: "Ko'p tilli",
    description: "O'zbek, Rus, Ingliz va Nemis tillarida prezentatsiyalar yarating",
  },
  {
    icon: Shield,
    title: 'Xavfsiz',
    description: "Barcha ma'lumotlaringiz xavfsiz saqlanadi va himoyalanadi",
  },
];

const steps = [
  { number: '01', title: 'Telegram botni oching', description: '@slider_ai_uz_bot ni boshlang' },
  { number: '02', title: 'Mavzuni kiriting', description: "Prezentatsiya mavzusini yozing" },
  { number: '03', title: 'Shablon tanlang', description: "Professional dizaynlardan birini tanlang" },
  { number: '04', title: 'Yuklab oling', description: 'Tayyor PPTX faylni oling' },
];

const pricing = [
  { slides: '8 ta', price: "5,000", popular: false },
  { slides: '10 ta', price: "7,000", popular: true },
  { slides: '12 ta', price: "10,000", popular: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SliderAI" className="w-10 h-10 rounded-xl" />
              <span className="font-bold text-xl text-gray-900">SliderAI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Imkoniyatlar</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">Qanday ishlaydi</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Narxlar</a>
            </div>
            <a
              href="https://t.me/slider_ai_uz_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <MessageCircle className="w-5 h-5" />
              Boshlash
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI yordamida prezentatsiya
            </span>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Professional<br />
              <span className="gradient-text">Prezentatsiyalar</span><br />
              bir necha daqiqada
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Telegram orqali mavzuni yuboring, AI sizga chiroyli va professional
              PowerPoint prezentatsiya yaratib beradi. Talabalar uchun ideal.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://t.me/slider_ai_uz_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-lg px-8 py-4"
              >
                <MessageCircle className="w-6 h-6" />
                Telegram botni ochish
                <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#how-it-works" className="btn btn-secondary text-lg px-8 py-4">
                Qanday ishlaydi?
              </a>
            </div>
          </motion.div>

          {/* Hero image mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="bg-gradient-to-br from-primary-600 to-purple-700 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-inner">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-2xl md:text-4xl font-bold mb-2">O'ZBEKISTON TARIXI</h3>
                    <p className="text-blue-200">Professional prezentatsiya namunasi</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <div className="w-16 h-1 bg-white/60 rounded-full" />
                      <div className="w-12 h-1 bg-white/40 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nima uchun <span className="gradient-text">SliderAI</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Vaqtingizni tejang, professional natija oling
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Qanday <span className="gradient-text">ishlaydi</span>?
            </h2>
            <p className="text-xl text-gray-600">Faqat 4 ta oddiy qadam</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-bold gradient-text mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="gradient-text">Narxlar</span>
            </h2>
            <p className="text-xl text-gray-600">Hamyonbop narxlarda professional prezentatsiyalar</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.slides}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`card relative ${plan.popular ? 'border-2 border-primary-500 shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
                    Mashhur
                  </div>
                )}
                <div className="text-center">
                  <div className="text-lg text-gray-600 mb-2">Slaydlar soni</div>
                  <div className="text-4xl font-bold text-gray-900 mb-4">{plan.slides}</div>
                  <div className="text-3xl font-bold gradient-text mb-6">{plan.price} so'm</div>
                  <ul className="space-y-3 mb-6 text-left">
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Professional dizayn
                    </li>
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      AI kontent
                    </li>
                    <li className="flex items-center gap-2 text-gray-600">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      PPTX format
                    </li>
                  </ul>
                  <a
                    href="https://t.me/slider_ai_uz_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Boshlash
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Tayyor prezentatsiya yaratishga?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Telegram botimizni oching va birinchi prezentatsiyangizni yarating
          </p>
          <a
            href="https://t.me/slider_ai_uz_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 shadow-xl"
          >
            <MessageCircle className="w-6 h-6" />
            @slider_ai_uz_bot
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SliderAI" className="w-10 h-10 rounded-xl" />
              <span className="font-bold text-xl text-white">SliderAI</span>
            </div>
            <p className="text-gray-400">
              © 2024 SliderAI AI. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
