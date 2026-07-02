import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useLanguage } from './contexts/LanguageContext';
import { getTelegramUserId } from './utils/telegram';
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';
import PreviewPage from './pages/PreviewPage';
import EditorPage from './pages/EditorPage';
import QuizCreatePage from './pages/QuizCreatePage';
import QuizViewPage from './pages/QuizViewPage';
import DocumentCreatePage from './pages/DocumentCreatePage';
import FlashcardCreatePage from './pages/FlashcardCreatePage';
import FlashcardViewPage from './pages/FlashcardViewPage';

function App() {
  const { webApp, ready } = useTelegram();
  const { t, isLoading: langLoading } = useLanguage();

  useEffect(() => {
    if (webApp) {
      webApp.ready();
      webApp.expand();
      webApp.enableClosingConfirmation();

      // Set header color
      document.body.style.backgroundColor = '#fafafa';

      // Cache the Telegram user id as soon as it's available so every feature
      // (including documents) can resolve it later even if state lags.
      getTelegramUserId();
    }
  }, [webApp]);

  if (!ready || langLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/quiz/create" element={<QuizCreatePage />} />
        <Route path="/quiz/:id" element={<QuizViewPage />} />
        <Route path="/document/create" element={<DocumentCreatePage />} />
        <Route path="/flashcards/create" element={<FlashcardCreatePage />} />
        <Route path="/flashcards/:id" element={<FlashcardViewPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/preview/:id" element={<PreviewPage />} />
      </Routes>
    </div>
  );
}

export default App;
