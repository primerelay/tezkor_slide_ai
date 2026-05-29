import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { motion } from 'framer-motion';
import { Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

// Mock presentation data
const mockPresentation = {
  id: '1',
  title: "O'zbekiston tarixi",
  slides: [
    {
      id: 1,
      type: 'hero',
      title: "O'zbekiston tarixi",
      subtitle: 'Qadimdan zamonaviy davrgacha',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 2,
      type: 'bullets',
      title: 'Qadimgi davr',
      bullets: [
        'Miloddan avvalgi 3-ming yillik',
        'Zaraushtrilik dini',
        'Ipak yo\'li savdo markazi',
      ],
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 3,
      type: 'bullets',
      title: "O'rta asrlar",
      bullets: [
        'Temuriylar sulolasi',
        'Samarqand - ilm-fan markazi',
        'Ulug\'bek rasadxonasi',
      ],
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
  ],
  createdAt: '2 soat oldin',
};

export default function PreviewPage() {
  const navigate = useNavigate();
  const { id: _id } = useParams();
  const { haptic, showBackButton, hideBackButton, webApp } = useTelegram();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    showBackButton(() => {
      haptic('light');
      navigate('/');
    });
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, navigate, haptic]);

  const presentation = mockPresentation;
  const slide = presentation.slides[currentSlide];

  const goToSlide = (index: number) => {
    if (index >= 0 && index < presentation.slides.length) {
      haptic('light');
      setCurrentSlide(index);
    }
  };

  const handleDownload = () => {
    haptic('medium');
    webApp?.showAlert('Prezentatsiya Telegram chatga yuboriladi.');
    // In real app, would trigger download
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-medium truncate">{presentation.title}</h1>
          <p className="text-gray-400 text-xs">{presentation.createdAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => haptic('light')}
            className="p-2 rounded-lg bg-white/10 text-white"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-purple-500 text-white"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Slide Preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg slide-preview"
          style={{ background: slide.background }}
        >
          <div className="h-full flex flex-col items-center justify-center p-6 text-white text-center">
            {slide.type === 'hero' && (
              <>
                <h2 className="text-2xl font-bold mb-2">{slide.title}</h2>
                <p className="text-white/70">{slide.subtitle}</p>
              </>
            )}
            {slide.type === 'bullets' && (
              <>
                <h2 className="text-xl font-bold mb-4">{slide.title}</h2>
                <ul className="text-left space-y-2">
                  {slide.bullets?.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/70 mt-1.5 flex-shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="px-4 py-4">
        {/* Slide counter */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => goToSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white text-sm">
            {currentSlide + 1} / {presentation.slides.length}
          </span>
          <button
            onClick={() => goToSlide(currentSlide + 1)}
            disabled={currentSlide === presentation.slides.length - 1}
            className="p-2 rounded-lg bg-white/10 text-white disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {presentation.slides.map((s, index) => (
            <button
              key={s.id}
              onClick={() => goToSlide(index)}
              className={`slide-thumbnail flex-shrink-0 w-16 ${
                currentSlide === index ? 'active' : ''
              }`}
              style={{ background: s.background }}
            >
              <div className="h-full flex items-center justify-center p-1">
                <span className="text-white text-[6px] font-medium truncate">
                  {s.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
