import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Send } from 'lucide-react';

interface Question {
  id: number;
  questionText: string;
  options: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  orderIndex: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  numberOfQuestions: number;
  questions: Question[];
}

export default function QuizViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { haptic, showBackButton, hideBackButton, user } = useTelegram();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    showBackButton(() => {
      haptic('light');
      navigate('/');
    });
    return () => hideBackButton();
  }, [showBackButton, hideBackButton, navigate, haptic]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quiz/${id}`);
        if (!response.ok) throw new Error('Failed to load quiz');
        const data = await response.json();
        setQuiz(data);
      } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Quiz yuklanmadi');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchQuiz();
  }, [id, navigate]);

  const handleSelectAnswer = (questionId: number, answer: string) => {
    haptic('light');
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answer });
  };

  const handleNext = () => {
    haptic('light');
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) correct++;
    });
    const percentage = (correct / quiz.questions.length) * 100;
    return { correct, total: quiz.questions.length, percentage };
  };

  const handleSendToTelegram = async () => {
    if (!user?.id || !quiz) return;

    try {
      setSending(true);
      haptic('light');

      const response = await fetch(`/api/quiz/${quiz.id}/send-to-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: user.id.toString() }),
      });

      if (!response.ok) throw new Error('Failed to send quiz');

      haptic('success');
      alert('✅ Quiz Telegram botga yuborildi! Endi uni forward qilishingiz mumkin.');
    } catch (error) {
      console.error('Error sending quiz:', error);
      alert('❌ Yuborishda xatolik yuz berdi');
      haptic('error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Quiz yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-5 py-4">
          <h1 className="text-lg font-bold text-gray-900">Natijalar</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
              score.percentage >= 70 ? 'bg-green-100' : score.percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <span className={`text-4xl font-bold ${
                score.percentage >= 70 ? 'text-green-600' : score.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {Math.round(score.percentage)}%
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {score.percentage >= 70 ? '🎉 Ajoyib!' : score.percentage >= 50 ? '👍 Yaxshi!' : '💪 Harakat qiling!'}
            </h2>
            <p className="text-gray-600">
              {score.correct} / {score.total} ta to'g'ri javob
            </p>
          </motion.div>

          <div className="mb-6">
            <button
              onClick={handleSendToTelegram}
              disabled={sending}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Yuborilmoqda...' : 'Telegramga yuborish'}
            </button>
          </div>

          <div className="space-y-4">
            {quiz.questions.map((question, index) => {
              const userAnswer = selectedAnswers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">{question.questionText}</p>
                      <div className="space-y-2 text-sm">
                        <div className={`p-2 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <span className="font-medium">Sizning javobingiz: </span>
                          {userAnswer ? question.options[userAnswer] : 'Javob berilmagan'}
                        </div>
                        {!isCorrect && (
                          <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                            <span className="font-medium">To'g'ri javob: </span>
                            {question.options[question.correctAnswer]}
                          </div>
                        )}
                        {question.explanation && (
                          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                            <span className="font-medium">Tushuntirish: </span>
                            {question.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => {
                haptic('light');
                setCurrentQuestion(0);
                setSelectedAnswers({});
                setShowResults(false);
              }}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold active:scale-[0.98] transition-transform"
            >
              Qayta boshlash
            </button>
            <button
              onClick={() => {
                haptic('light');
                navigate('/');
              }}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold active:scale-[0.98] transition-transform"
            >
              Bosh sahifa
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-900">{quiz.title}</h1>
          <span className="text-sm text-gray-500">
            {currentQuestion + 1} / {quiz.questions.length}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={handleSendToTelegram}
          disabled={sending}
          className="w-full mt-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Yuborilmoqda...' : 'Telegramga yuborish'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="card p-4">
            <p className="text-lg font-medium text-gray-900 mb-4">{question.questionText}</p>
            <div className="space-y-2">
              {Object.entries(question.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleSelectAnswer(question.id, key)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    selectedAnswers[question.id] === key
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-indigo-600 mr-3">{key.toUpperCase()}.</span>
                  <span className="text-gray-900">{value}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={!selectedAnswers[question.id]}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            selectedAnswers[question.id]
              ? 'bg-indigo-600 text-white active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {currentQuestion < quiz.questions.length - 1 ? 'Keyingisi' : 'Natijani ko\'rish'}
        </button>
      </div>
    </div>
  );
}
