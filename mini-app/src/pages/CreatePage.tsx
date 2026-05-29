import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { Translations } from '../i18n/translations';

// Template type
interface Template {
  id: string;
  nameKey: keyof Pick<Translations, 'modern' | 'academic' | 'minimalist' | 'nature' | 'sunset' | 'elegant'>;
  preview: string;
  textColor: string;
}

// Professional templates with background images
const templates: Template[] = [
  {
    id: 'modern-purple',
    nameKey: 'modern',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    textColor: '#ffffff',
  },
  {
    id: 'academic-blue',
    nameKey: 'academic',
    preview: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    textColor: '#ffffff',
  },
  {
    id: 'minimal-light',
    nameKey: 'minimalist',
    preview: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    textColor: '#1e293b',
  },
  {
    id: 'nature-green',
    nameKey: 'nature',
    preview: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    textColor: '#ffffff',
  },
  {
    id: 'sunset-orange',
    nameKey: 'sunset',
    preview: 'linear-gradient(135deg, #ea580c 0%, #fbbf24 100%)',
    textColor: '#ffffff',
  },
  {
    id: 'dark-elegant',
    nameKey: 'elegant',
    preview: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    textColor: '#ffffff',
  },
];

const slideCountOptions = [6, 8, 10, 12];

type Step = 'topic' | 'template' | 'options' | 'generating';

export default function CreatePage() {
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton, webApp } = useTelegram();
  const { t, language } = useLanguage();

  const [step, setStep] = useState<Step>('topic');
  const [topic, setTopic] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(8);
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [_isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    showBackButton(() => {
      haptic('light');
      if (step === 'topic') {
        navigate('/');
      } else if (step === 'template') {
        setStep('topic');
      } else if (step === 'options') {
        setStep('template');
      }
    });
    return () => hideBackButton();
  }, [step, showBackButton, hideBackButton, navigate, haptic]);

  const handleNext = () => {
    haptic('light');
    if (step === 'topic' && topic.trim()) {
      setStep('template');
    } else if (step === 'template' && selectedTemplate) {
      setStep('options');
    } else if (step === 'options') {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setStep('generating');
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const response = await fetch('/api/mini-app/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: webApp?.initDataUnsafe?.user?.id,
          presentation: {
            title: topic,
            studentName: studentName || undefined,
            teacherName: teacherName || undefined,
            template: templates.find(tmpl => tmpl.id === selectedTemplate),
            language: language, // Use the user's selected language
            slides: [],
          },
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        haptic('success');
        // Show success message and close after user confirms
        setTimeout(() => {
          if (webApp?.showAlert) {
            webApp.showAlert(
              `✅ ${t.presentationCreating}\n\n${t.willBeSentToChat}`,
              () => {
                // Close app after user dismisses alert
                webApp?.close();
              }
            );
          } else {
            // Fallback for development
            alert(`${t.presentationCreating} ${t.willBeSentToChat}`);
            window.close();
          }
        }, 800);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Generation failed');
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      haptic('error');
      const errorMessage = error?.message || t.errorOccurred;
      if (webApp?.showAlert) {
        webApp.showAlert(`❌ ${errorMessage}\n\n${t.tryAgain}`, () => {
          setStep('options');
          setIsGenerating(false);
        });
      } else {
        alert(errorMessage);
        setStep('options');
        setIsGenerating(false);
      }
    }
  };

  const canProceed = () => {
    if (step === 'topic') return topic.trim().length > 0;
    if (step === 'template') return selectedTemplate !== null;
    if (step === 'options') return true;
    return false;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Progress indicator */}
      {step !== 'generating' && (
        <div className="px-5 pt-4">
          <div className="flex gap-2">
            {['topic', 'template', 'options'].map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  ['topic', 'template', 'options'].indexOf(step) >= i
                    ? 'bg-purple-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {step === 'topic' && (
            <TopicStep
              key="topic"
              topic={topic}
              setTopic={setTopic}
              t={t}
            />
          )}

          {step === 'template' && (
            <TemplateStep
              key="template"
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              haptic={haptic}
              t={t}
            />
          )}

          {step === 'options' && (
            <OptionsStep
              key="options"
              slideCount={slideCount}
              setSlideCount={setSlideCount}
              studentName={studentName}
              setStudentName={setStudentName}
              teacherName={teacherName}
              setTeacherName={setTeacherName}
              haptic={haptic}
              t={t}
            />
          )}

          {step === 'generating' && (
            <GeneratingStep
              key="generating"
              progress={progress}
              topic={topic}
              t={t}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      {step !== 'generating' && (
        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 'options' ? (
              <>
                <Sparkles className="w-5 h-5" />
                {t.create}
              </>
            ) : (
              <>
                {t.continue}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function TopicStep({ topic, setTopic, t }: { topic: string; setTopic: (v: string) => void; t: Translations }) {
  const suggestions = [t.ecology, t.health, t.technology, t.art];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-5"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t.enterTopic}
        </h1>
        <p className="text-gray-500">
          {t.aiWillCreate}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.presentationTopic}
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.topicPlaceholder}
            className="input"
            autoFocus
          />
        </div>

        {/* Topic suggestions */}
        <div>
          <p className="text-xs text-gray-400 mb-2">{t.suggestions}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setTopic(suggestion)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

function TemplateStep({
  selectedTemplate,
  setSelectedTemplate,
  haptic,
  t,
}: {
  selectedTemplate: string | null;
  setSelectedTemplate: (v: string) => void;
  haptic: (type: HapticType) => void;
  t: Translations;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-5"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t.selectTemplate}
        </h1>
        <p className="text-gray-500">
          {t.chooseFromProfessional}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {templates.map((template) => (
          <motion.button
            key={template.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptic('selection');
              setSelectedTemplate(template.id);
            }}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            style={{ background: template.preview }}
          >
            {/* Template preview content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-3">
              <div
                className="text-sm font-bold mb-1"
                style={{ color: template.textColor }}
              >
                {t.title}
              </div>
              <div className="flex gap-1">
                <div
                  className="w-8 h-1 rounded-full opacity-60"
                  style={{ backgroundColor: template.textColor }}
                />
                <div
                  className="w-6 h-1 rounded-full opacity-40"
                  style={{ backgroundColor: template.textColor }}
                />
              </div>
            </div>

            {/* Template name */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
              <div className="text-white text-sm font-medium">{t[template.nameKey]}</div>
            </div>

            {/* Selected indicator */}
            {selectedTemplate === template.id && (
              <div className="absolute top-2 right-2 z-30 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                <Check className="w-4 h-4 text-purple-600" />
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function OptionsStep({
  slideCount,
  setSlideCount,
  studentName,
  setStudentName,
  teacherName,
  setTeacherName,
  haptic,
  t,
}: {
  slideCount: number;
  setSlideCount: (v: number) => void;
  studentName: string;
  setStudentName: (v: string) => void;
  teacherName: string;
  setTeacherName: (v: string) => void;
  haptic: (type: HapticType) => void;
  t: Translations;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-5"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t.settings}
        </h1>
        <p className="text-gray-500">
          {t.enterDetails}
        </p>
      </div>

      <div className="space-y-5">
        {/* Slide count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t.slideCount}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {slideCountOptions.map((count) => (
              <button
                key={count}
                onClick={() => {
                  haptic('selection');
                  setSlideCount(count);
                }}
                className={`py-3 rounded-xl font-medium transition-all ${
                  slideCount === count
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Student name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.studentNameOptional}
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="input"
          />
        </div>

        {/* Teacher name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.teacherNameOptional}
          </label>
          <input
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="input"
          />
        </div>
      </div>
    </motion.div>
  );
}

interface ProgressStep {
  threshold: number;
  labelKey: keyof Pick<Translations, 'starting' | 'analyzingTopic' | 'creatingContent' | 'preparingSlides' | 'applyingDesign' | 'ready'>;
  icon: string;
}

const progressSteps: ProgressStep[] = [
  { threshold: 0, labelKey: 'starting', icon: '🚀' },
  { threshold: 20, labelKey: 'analyzingTopic', icon: '🔍' },
  { threshold: 40, labelKey: 'creatingContent', icon: '✍️' },
  { threshold: 60, labelKey: 'preparingSlides', icon: '📊' },
  { threshold: 80, labelKey: 'applyingDesign', icon: '🎨' },
  { threshold: 100, labelKey: 'ready', icon: '✅' },
];

function GeneratingStep({ progress, topic, t }: { progress: number; topic: string; t: Translations }) {
  const isComplete = progress >= 100;

  // Find current step based on progress
  const currentStep = progressSteps.reduce((acc, step) => {
    if (progress >= step.threshold) return step;
    return acc;
  }, progressSteps[0]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-8"
    >
      <motion.div
        key={currentStep.threshold}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
          isComplete ? 'bg-green-100' : 'bg-purple-100'
        }`}
      >
        {isComplete ? (
          <Check className="w-10 h-10 text-green-600" />
        ) : (
          <span className="text-4xl">{currentStep.icon}</span>
        )}
      </motion.div>

      <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
        {t[currentStep.labelKey]}
      </h2>
      <p className="text-gray-500 text-center mb-6 max-w-xs">
        "{topic}"
      </p>

      {/* Progress steps indicators */}
      <div className="w-full max-w-xs mb-4">
        <div className="flex justify-between mb-2">
          {[20, 40, 60, 80, 100].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                progress >= step
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {progress >= step ? '✓' : `${step}%`}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-xs">
        <div className="progress-bar h-2">
          <div
            className={`progress-bar-fill ${isComplete ? 'bg-green-500' : ''}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-400 mt-2">
          {isComplete ? `✓ ${t.willBeSentToTelegram}` : `${Math.round(progress)}% ${t.percentReady}`}
        </p>
      </div>
    </motion.div>
  );
}
