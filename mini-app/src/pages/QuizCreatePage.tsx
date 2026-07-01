import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Brain, FileText, Sparkles } from 'lucide-react';

type Step = 'content' | 'settings' | 'generating';
type QuizType = 'multiple_choice' | 'true_false' | 'mixed';
type QuizDifficulty = 'easy' | 'medium' | 'hard';

export default function QuizCreatePage() {
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton } = useTelegram();
  const { language } = useLanguage();

  const [step, setStep] = useState<Step>('content');
  const [content, setContent] = useState('');
  const [quizType, setQuizType] = useState<QuizType>('multiple_choice');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [quizLanguage] = useState(language || 'uz');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    showBackButton(() => {
      haptic('light');
      if (step === 'content') {
        navigate('/');
      } else if (step === 'settings') {
        setStep('content');
      }
    });
    return () => hideBackButton();
  }, [step, showBackButton, hideBackButton, navigate, haptic]);

  const handleNext = () => {
    haptic('light');
    if (step === 'content' && content.trim()) {
      setStep('settings');
    } else if (step === 'settings') {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setStep('generating');
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 800);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          quizType,
          difficulty,
          numberOfQuestions,
          language: quizLanguage,
          userId: 1, // Temporary - should be from Telegram user
        }),
      });

      if (!response.ok) throw new Error('Failed to create quiz');

      const data = await response.json();
      clearInterval(progressInterval);
      setProgress(100);

      // Poll for quiz completion
      pollQuizStatus(data.id);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Quiz generation failed:', error);
      alert('Quiz yaratishda xatolik yuz berdi');
      navigate('/');
    }
  };

  const pollQuizStatus = async (id: string) => {
    const maxAttempts = 60; // 3 minutes max
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(poll);
        alert('Quiz yaratish juda uzoq davom etmoqda. Iltimos, keyinroq tekshiring.');
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`/api/quiz/${id}`);
        const quiz = await response.json();

        if (quiz.status === 'completed') {
          clearInterval(poll);
          haptic('success');
          // Navigate to quiz list or results page
          setTimeout(() => navigate('/'), 1000);
        } else if (quiz.status === 'failed') {
          clearInterval(poll);
          alert('Quiz yaratishda xatolik yuz berdi');
          navigate('/');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const canProceed = step === 'content' ? content.trim().length >= 50 : true;

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Brain className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Quiz yaratish</h1>
            <p className="text-sm text-gray-500">
              {step === 'content' && 'Matn kiriting'}
              {step === 'settings' && 'Sozlamalar'}
              {step === 'generating' && 'Yaratilmoqda...'}
            </p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`flex-1 h-1 rounded-full ${step !== 'content' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'generating' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        <AnimatePresence mode="wait">
          {/* Step 1: Content Input */}
          {step === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Matn kiriting</h3>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Test yaratish uchun darslik matni yoki mavzuni kiriting... (kamida 50 belgi)"
                  className="w-full h-64 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">
                    {content.length} belgi
                  </span>
                  {content.length >= 50 && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Tayyor
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Settings */}
          {step === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Quiz Type */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Savol turi</h3>
                <div className="space-y-2">
                  {[
                    { value: 'multiple_choice', label: 'Ko\'p tanlovli' },
                    { value: 'true_false', label: 'To\'g\'ri/Noto\'g\'ri' },
                    { value: 'mixed', label: 'Aralash' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        haptic('light');
                        setQuizType(type.value as QuizType);
                      }}
                      className={`w-full p-3 rounded-xl border-2 transition-colors ${
                        quizType === type.value
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Qiyinlik darajasi</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'easy', label: 'Oson', color: 'green' },
                    { value: 'medium', label: 'O\'rta', color: 'yellow' },
                    { value: 'hard', label: 'Qiyin', color: 'red' },
                  ].map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => {
                        haptic('light');
                        setDifficulty(diff.value as QuizDifficulty);
                      }}
                      className={`p-3 rounded-xl border-2 transition-colors ${
                        difficulty === diff.value
                          ? `border-${diff.color}-600 bg-${diff.color}-50`
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900">{diff.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Savollar soni</h3>
                <input
                  type="number"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Math.max(5, Math.min(30, parseInt(e.target.value) || 10)))}
                  min={5}
                  max={30}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-2">5 dan 30 gacha</p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-6 animate-pulse">
                <Brain className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz yaratilmoqda...</h3>
              <p className="text-gray-500 mb-6">AI test savollarini yaratyapti</p>

              {/* Progress Bar */}
              <div className="w-full max-w-xs">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">{Math.round(progress)}%</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Button */}
      {step !== 'generating' && (
        <div className="p-5 bg-white border-t border-gray-200">
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              canProceed
                ? 'bg-indigo-600 text-white active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === 'content' && 'Keyingisi'}
            {step === 'settings' && (
              <>
                <Sparkles className="w-5 h-5" />
                Quiz yaratish
              </>
            )}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
