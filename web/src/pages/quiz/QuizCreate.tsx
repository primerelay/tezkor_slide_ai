import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizCreate.css';

interface QuizFormData {
  title: string;
  description: string;
  sourceContent: string;
  sourceFileName: string;
  quizType: 'multiple_choice' | 'true_false' | 'short_answer' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  numberOfQuestions: number;
  language: 'uz' | 'ru' | 'en';
  subject: string;
  topic: string;
}

const QuizCreate: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    sourceContent: '',
    sourceFileName: '',
    quizType: 'multiple_choice',
    difficulty: 'medium',
    numberOfQuestions: 10,
    language: 'uz',
    subject: '',
    topic: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('text/')) {
      setError('Faqat PDF yoki TEXT fayllar qo\'llab-quvvatlanadi');
      return;
    }

    setFormData({ ...formData, sourceFileName: file.name });

    // Read file content
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setFormData({ ...formData, sourceContent: content, sourceFileName: file.name });
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sourceContent) {
      setError('Iltimos, matn kiriting yoki fayl yuklang');
      return;
    }

    if (!formData.title) {
      setError('Iltimos, test nomini kiriting');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStep(3);

    // Simulate progress (real progress would come from WebSocket/polling)
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 2000);

    try {
      const response = await axios.post('/api/quiz', formData);
      const quizId = response.data.id;

      // Poll for completion
      const checkInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`/api/quiz/${quizId}`);

          if (statusRes.data.status === 'completed') {
            clearInterval(checkInterval);
            clearInterval(progressInterval);
            setGenerationProgress(100);

            setTimeout(() => {
              navigate(`/admin/quiz/${quizId}`);
            }, 1000);
          } else if (statusRes.data.status === 'failed') {
            clearInterval(checkInterval);
            clearInterval(progressInterval);
            setError(statusRes.data.errorMessage || 'Test yaratishda xatolik yuz berdi');
            setIsGenerating(false);
          }
        } catch (err) {
          console.error('Status check error:', err);
        }
      }, 3000);

    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.response?.data?.message || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="quiz-create-container">
      <div className="quiz-create-header">
        <button className="back-button" onClick={() => navigate('/admin/quizzes')}>
          ← Orqaga
        </button>
        <h1>🎯 Yangi Test Yaratish</h1>
        <p>AI yordamida professional test yarating</p>
      </div>

      {/* Progress Steps */}
      <div className="steps-container">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Matn kiritish</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Sozlamalar</div>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Yaratilmoqda</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="quiz-form">
        {/* Step 1: Content Input */}
        {step === 1 && (
          <div className="form-step">
            <h2>📄 Matn yoki Fayl Yuklang</h2>

            <div className="upload-section">
              <label className="file-upload-box">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  hidden
                />
                <div className="upload-icon">📎</div>
                <div className="upload-text">
                  {formData.sourceFileName || 'PDF yoki TXT fayl tanlang'}
                </div>
                <div className="upload-hint">yoki shu yerga bosing</div>
              </label>

              <div className="or-divider">
                <span>yoki</span>
              </div>

              <textarea
                className="content-textarea"
                placeholder="Matnni shu yerga yozing...

Misol:
- Darslik matni
- Ma'ruza konspekti
- Maqola
- Taqdimot matni

AI shu matndan test savollarini avtomatik yaratadi."
                value={formData.sourceContent}
                onChange={(e) => setFormData({ ...formData, sourceContent: e.target.value })}
                rows={12}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (formData.sourceContent) {
                    setStep(2);
                    setError('');
                  } else {
                    setError('Iltimos, matn kiriting yoki fayl yuklang');
                  }
                }}
              >
                Keyingi qadam →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <div className="form-step">
            <h2>⚙️ Test Sozlamalari</h2>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Test nomi *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Misol: Matematika - Algebra"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Qisqacha tavsif (ixtiyoriy)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Misol: Linear tenglamalar bo'yicha test"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Savol turi *</label>
                <select
                  className="form-select"
                  value={formData.quizType}
                  onChange={(e) => setFormData({ ...formData, quizType: e.target.value as any })}
                >
                  <option value="multiple_choice">📝 Ko'p tanlovli (A, B, C, D)</option>
                  <option value="true_false">✅ To'g'ri/Noto'g'ri</option>
                  <option value="short_answer">✍️ Qisqa javob</option>
                  <option value="mixed">🔀 Aralash (barcha turlar)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Qiyinlik darajasi *</label>
                <select
                  className="form-select"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                >
                  <option value="easy">😊 Oson</option>
                  <option value="medium">🤔 O'rtacha</option>
                  <option value="hard">😰 Qiyin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Savollar soni: {formData.numberOfQuestions}</label>
                <input
                  type="range"
                  className="form-range"
                  min="5"
                  max="50"
                  value={formData.numberOfQuestions}
                  onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) })}
                />
                <div className="range-labels">
                  <span>5</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              <div className="form-group">
                <label>Til *</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="language"
                      value="uz"
                      checked={formData.language === 'uz'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                    />
                    <span>🇺🇿 O'zbek</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="language"
                      value="ru"
                      checked={formData.language === 'ru'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                    />
                    <span>🇷🇺 Русский</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="language"
                      value="en"
                      checked={formData.language === 'en'}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                    />
                    <span>🇬🇧 English</span>
                  </label>
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                ← Orqaga
              </button>
              <button type="submit" className="btn btn-primary">
                🚀 Test Yaratish
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Generation Progress */}
        {step === 3 && isGenerating && (
          <div className="form-step generation-step">
            <div className="generation-animation">
              <div className="robot-icon">🤖</div>
              <h2>Test yaratilmoqda...</h2>
              <p>AI {formData.numberOfQuestions} ta savol yaratyapti</p>
            </div>

            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{generationProgress}%</div>
            </div>

            <div className="generation-steps">
              <div className={`gen-step ${generationProgress >= 20 ? 'completed' : ''}`}>
                <span className="gen-icon">✓</span>
                <span>Matn tahlil qilindi</span>
              </div>
              <div className={`gen-step ${generationProgress >= 40 ? 'completed' : ''}`}>
                <span className="gen-icon">✓</span>
                <span>Muhim mavzular aniqlandi</span>
              </div>
              <div className={`gen-step ${generationProgress >= 60 ? 'completed' : ''}`}>
                <span className="gen-icon">✓</span>
                <span>Savollar yaratilmoqda...</span>
              </div>
              <div className={`gen-step ${generationProgress >= 80 ? 'completed' : ''}`}>
                <span className="gen-icon">✓</span>
                <span>Javob variantlari qo'shilmoqda...</span>
              </div>
              <div className={`gen-step ${generationProgress >= 100 ? 'completed' : ''}`}>
                <span className="gen-icon">✓</span>
                <span>Tushuntirishlar yozilmoqda...</span>
              </div>
            </div>

            <div className="generation-info">
              <p>⏱️ Taxminiy vaqt: 30-60 soniya</p>
              <p>💡 Sahifani yopmang, jarayon tugashini kuting</p>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>
        )}
      </form>
    </div>
  );
};

export default QuizCreate;
