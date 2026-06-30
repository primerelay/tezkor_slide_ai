import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizList.css';

interface Quiz {
  id: number;
  title: string;
  description: string;
  quizType: string;
  difficulty: string;
  numberOfQuestions: number;
  status: string;
  createdAt: string;
  metadata?: {
    language?: string;
    subject?: string;
  };
}

const QuizList: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get('/api/quiz/user/my-quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (id: number) => {
    if (!window.confirm("Testni o'chirishga ishonchingiz komilmi?")) return;

    try {
      await axios.delete(`/api/quiz/${id}`);
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      alert("Testni o'chirishda xatolik yuz berdi");
    }
  };

  const getQuizTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      multiple_choice: '📝',
      true_false: '✅',
      short_answer: '✍️',
      mixed: '🔀'
    };
    return icons[type] || '📄';
  };

  const getDifficultyBadge = (difficulty: string) => {
    const badges: Record<string, { icon: string; text: string; className: string }> = {
      easy: { icon: '😊', text: 'Oson', className: 'badge-easy' },
      medium: { icon: '🤔', text: "O'rtacha", className: 'badge-medium' },
      hard: { icon: '😰', text: 'Qiyin', className: 'badge-hard' },
    };
    return badges[difficulty] || badges.medium;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: string; text: string; className: string }> = {
      completed: { icon: '✅', text: 'Tayyor', className: 'status-completed' },
      generating: { icon: '⏳', text: 'Yaratilmoqda', className: 'status-generating' },
      pending: { icon: '⏱️', text: 'Navbatda', className: 'status-pending' },
      failed: { icon: '❌', text: 'Xato', className: 'status-failed' },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="quiz-list-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Testlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <div>
          <h1>🎯 Mening Testlarim</h1>
          <p>Yaratilgan testlar: {quizzes.length}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/admin/quiz/create')}
        >
          + Yangi Test
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h2>Hali testlar yo'q</h2>
          <p>Birinchi testingizni yarating va boshlang!</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/quiz/create')}
          >
            + Yangi Test Yaratish
          </button>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz) => {
            const difficultyBadge = getDifficultyBadge(quiz.difficulty);
            const statusBadge = getStatusBadge(quiz.status);

            return (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-card-header">
                  <div className="quiz-icon">{getQuizTypeIcon(quiz.quizType)}</div>
                  <div className={`status-badge ${statusBadge.className}`}>
                    <span>{statusBadge.icon}</span>
                    <span>{statusBadge.text}</span>
                  </div>
                </div>

                <h3 className="quiz-title">{quiz.title}</h3>
                {quiz.description && (
                  <p className="quiz-description">{quiz.description}</p>
                )}

                <div className="quiz-meta">
                  <div className="meta-item">
                    <span className="meta-icon">❓</span>
                    <span>{quiz.numberOfQuestions} savol</span>
                  </div>
                  <div className={`meta-item ${difficultyBadge.className}`}>
                    <span className="meta-icon">{difficultyBadge.icon}</span>
                    <span>{difficultyBadge.text}</span>
                  </div>
                  {quiz.metadata?.language && (
                    <div className="meta-item">
                      <span className="meta-icon">🌐</span>
                      <span>{quiz.metadata.language.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                <div className="quiz-date">
                  {new Date(quiz.createdAt).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>

                <div className="quiz-actions">
                  {quiz.status === 'completed' && (
                    <>
                      <button
                        className="btn-action btn-view"
                        onClick={() => navigate(`/admin/quiz/${quiz.id}`)}
                      >
                        👁️ Ko'rish
                      </button>
                      <button className="btn-action btn-export">
                        📥 Yuklash
                      </button>
                    </>
                  )}
                  <button
                    className="btn-action btn-delete"
                    onClick={() => deleteQuiz(quiz.id)}
                  >
                    🗑️ O'chirish
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuizList;
