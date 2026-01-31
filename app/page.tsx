'use client'

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

// --- NEW IMPORTS ---
import { TEXTS } from './lib/texts';
import { APP_VERSION } from './lib/config';
import { Question, QuestionStat } from './lib/types';
import { fetchExamQuestions } from './lib/examService';

// --- COMPONENTS ---
import ExamSetup, { ExamSettings } from './components/ExamSetup';
import ExamRunner from './components/ExamRunner';
import Statistics from './components/Statistics';
import CategoryTrainer from './components/CategoryTrainer';
import Modal from './components/Modal';
import Dashboard from './components/Dashboard';
import QuickHub from './components/QuickHub';

type Mode = 'dashboard' | 'quick-hub' | 'category-lobby' | 'setup' | 'exam' | 'statistics';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('dashboard');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', body: '' });

  // Data States
  const [categories, setCategories] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionStats, setQuestionStats] = useState<Record<number, QuestionStat>>({});
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); 
  const [currentSettings, setCurrentSettings] = useState<ExamSettings | null>(null);

  // --- 1. INITIAL FETCH ---
  const fetchUserData = useCallback(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      
      if (user.is_anonymous) {
          setIsGuest(true);
          setUser({ ...user, display_name: "Gäst" } as any);
      } else {
          setIsGuest(false);
          const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
          setUser({ ...user, display_name: profile?.display_name || user.email } as any);
      }

      const { data: catData } = await supabase.from('questions').select('category');
      if (catData) {
          const uniqueCats = [...new Set(catData.map(item => item.category))];
          setCategories(uniqueCats);
      }

      const { data: history } = await supabase.from('user_answers').select('question_id, is_correct').eq('user_id', user.id);
      if (history) {
          const statsMap: Record<number, QuestionStat> = {};
          history.forEach(h => {
              if (!statsMap[h.question_id]) statsMap[h.question_id] = { questionId: h.question_id, attempts: 0, correctCount: 0 };
              statsMap[h.question_id].attempts += 1;
              if (h.is_correct) statsMap[h.question_id].correctCount += 1;
          });
          setQuestionStats(statsMap);
      }
  }, [router]);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  // --- 2. EXAM HANDLER (Uses new Service) ---
  const handleExamRequest = async (settings: ExamSettings, limit: number, hardMode: boolean) => {
      setLoadingQuestions(true);
      
      const result = await fetchExamQuestions(settings, limit, hardMode, categories, questionStats);
      
      if (result.errorTitle) {
          setModalMessage({ title: result.errorTitle, body: result.errorMessage || '' });
          setModalOpen(true);
      } else {
          setQuestions(result.questions);
          setCurrentSettings(settings);
          setMode('exam');
      }
      
      setLoadingQuestions(false);
  };

  // --- UI HANDLERS ---
  const handleCategorySelect = (cat: string) => { setSelectedCategory(cat); setMode('category-lobby'); };

  const handleQuickHubSelect = (type: 'quick' | 'standard' | 'marathon') => {
      let limit = 40;
      if (type === 'quick') limit = 10;
      if (type === 'marathon') limit = 100;

      handleExamRequest({
          category: null, 
          allowBacktracking: true, 
          instantFeedback: true, 
          timed: false, 
          recordStats: true
      }, limit, false);
  };

  const handleStartCustom = (settings: ExamSettings) => { handleExamRequest(settings, 0, false); };
  
  const handleLobbyStart = (subMode: 'instant' | 'custom' | 'hard') => {
      if (subMode === 'custom') setMode('setup');
      else if (subMode === 'instant') handleExamRequest({ category: selectedCategory, allowBacktracking: true, instantFeedback: true, timed: false, recordStats: true }, 40, false);
      else if (subMode === 'hard') handleExamRequest({ category: selectedCategory, allowBacktracking: true, instantFeedback: true, timed: false, recordStats: true }, 50, true);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); }
  const handleNameClick = () => isGuest ? router.push('/login') : router.push('/profile');

  if (!user) return <div className="p-10 text-center dark:bg-gray-900 dark:text-white min-h-screen">{TEXTS.loading}</div>;
  if (loadingQuestions) return <div className="p-10 text-center dark:bg-gray-900 dark:text-white min-h-screen flex items-center justify-center"><div className="animate-bounce text-2xl">⚡ Hämtar frågor...</div></div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 transition-colors duration-200 relative">
      
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMessage.title} footer={<button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">OK</button>}>
        <p className="text-gray-700 dark:text-gray-300">{modalMessage.body}</p>
      </Modal>

      {(mode === 'dashboard' || mode === 'statistics' || mode === 'quick-hub') && (
        <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-400">{TEXTS.headers.title}</h1>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3">
                <a href="mailto:erik.engstrom@stud.ki.se?subject=MedQ%20Bug%20Report" className="text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-700 hover:border-red-300 px-3 py-1 rounded transition-colors">{TEXTS.headers.bugReport}</a>
                {mode !== 'statistics' && <button onClick={() => setMode('statistics')} className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600">{TEXTS.headers.stats}</button>}
                <button onClick={handleNameClick} className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 flex items-center gap-2">{(user as any).display_name} {isGuest ? '👤' : '⚙️'}</button>
                <button onClick={handleLogout} className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50">{TEXTS.headers.logout}</button>
            </div>
        </header>
      )}

      {mode === 'dashboard' && (
          <Dashboard 
            user={user} 
            categories={categories} 
            onQuickHub={() => setMode('quick-hub')} 
            onCustomSetup={() => { setSelectedCategory(null); setMode('setup'); }}
            onCategorySelect={handleCategorySelect}
          />
      )}

      {mode === 'quick-hub' && <QuickHub onBack={() => setMode('dashboard')} onSelect={handleQuickHubSelect} />}

      {mode === 'category-lobby' && selectedCategory && (
          <CategoryTrainer category={selectedCategory} stats={Object.values(questionStats)} onStart={handleLobbyStart} onBack={() => setMode('dashboard')} />
      )}

      {mode === 'statistics' && <Statistics questionStats={questionStats} allQuestions={questions} onBack={() => setMode('dashboard')} isGuest={isGuest} />}
      {mode === 'setup' && <ExamSetup categories={categories} defaultCategory={selectedCategory} onStart={handleStartCustom} onBack={() => setMode('dashboard')} />}
      {mode === 'exam' && currentSettings && <ExamRunner questions={questions} settings={currentSettings} onExit={() => setMode('dashboard')} />}
      
      <div className="fixed bottom-2 left-4 text-[10px] text-gray-300 dark:text-gray-700 font-mono pointer-events-none select-none z-50">
          {APP_VERSION}
      </div>
    </main>
  );
}