'use client'

import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

import ExamSetup, { ExamSettings } from './components/ExamSetup';
import ExamRunner from './components/ExamRunner';
import Statistics, { QuestionStat } from './components/Statistics';
import CategoryTrainer from './components/CategoryTrainer';
import Modal from './components/Modal';

export type Question = {
    id: number;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    category: string;
    question_type: 'multiple_choice' | 'short_answer';
}

type Mode = 'dashboard' | 'category-lobby' | 'setup' | 'exam' | 'statistics';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  // NEW STATE: Track if user is guest
  const [isGuest, setIsGuest] = useState(false);
  
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', body: '' });

  const [categories, setCategories] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionStats, setQuestionStats] = useState<Record<number, QuestionStat>>({});
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); 
  const [currentSettings, setCurrentSettings] = useState<ExamSettings | null>(null);

  const showAlert = (title: string, body: string) => {
      setModalMessage({ title, body });
      setModalOpen(true);
  };

  const fetchData = useCallback(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      
      // CHECK IF GUEST
      if (user.is_anonymous) {
          setIsGuest(true);
          // Guests don't have profiles, so we manually set display name
          setUser({ ...user, display_name: "Gäst" } as any);
      } else {
          setIsGuest(false);
          const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
          setUser({ ...user, display_name: profile?.display_name || user.email } as any);
      }

      const { data: qData } = await supabase.from('questions').select('*');
      if (qData) {
          const uniqueCats = [...new Set(qData.map(item => item.category))];
          setCategories(uniqueCats);
          
          const formattedQuestions = qData.map(q => {
             return {...q, options: q.options as string[]};
          });
          setQuestions(formattedQuestions);

          const initialStats: Record<number, QuestionStat> = {};
          formattedQuestions.forEach(q => {
              initialStats[q.id] = { questionId: q.id, attempts: 0, correctCount: 0 };
          });

          // Fetch History (Guests can fetch their own temp history)
          const { data: history } = await supabase
              .from('user_answers')
              .select('question_id, is_correct')
              .eq('user_id', user.id);

          if (history) {
              history.forEach(h => {
                  if (initialStats[h.question_id]) {
                      initialStats[h.question_id].attempts += 1;
                      if (h.is_correct) initialStats[h.question_id].correctCount += 1;
                  }
              });
          }
          setQuestionStats(initialStats);
      }
  }, [router]);

  useEffect(() => {
    if (mode === 'dashboard' || mode === 'category-lobby' || mode === 'statistics') {
        fetchData();
    }
  }, [mode, fetchData]); 

  const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
      setMode('category-lobby');
  };

  const handleLobbyStart = (subMode: 'instant' | 'custom' | 'hard') => {
      if (subMode === 'custom') {
          setMode('setup');
      } else if (subMode === 'instant') {
          handleStartExam({
              category: selectedCategory,
              allowBacktracking: true,
              instantFeedback: true,
              timed: false,
              recordStats: true
          });
      } else if (subMode === 'hard') {
          handleStartExam({
              category: selectedCategory,
              allowBacktracking: true,
              instantFeedback: true,
              timed: false,
              recordStats: true,
          }, true);
      }
  };

  const handleStartExam = async (settings: ExamSettings, filterHardMode = false) => {
    setCurrentSettings(settings); 
    
    let pool = questions;

    if (settings.category) {
        pool = pool.filter(q => q.category === settings.category);
    }

    if (filterHardMode) {
        pool = pool.filter(q => {
            const stat = questionStats[q.id];
            if (!stat || stat.attempts === 0) return true; 
            const acc = stat.correctCount / stat.attempts;
            return acc < 0.6; 
        });
        
        if (pool.length === 0) {
            showAlert("Bra jobbat!", "Du har inga 'svåra' frågor kvar i denna kategori!");
            return;
        }
    }

    if (pool.length > 0) {
        const shuffledQuestions = [...pool].sort(() => 0.5 - Math.random());
        const finalizedExam = shuffledQuestions.map(q => {
            if (q.question_type === 'multiple_choice') {
                const opts = [...q.options];
                for (let i = opts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [opts[i], opts[j]] = [opts[j], opts[i]];
                }
                return { ...q, options: opts };
            }
            return q;
        });

        setQuestions(finalizedExam); 
        setMode('exam');
    } else {
        showAlert("Ojdå!", "Inga frågor hittades med dessa inställningar.");
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  }

  // --- NAME BUTTON LOGIC ---
  const handleNameClick = () => {
      if (isGuest) {
          // If guest, send them to login/signup
          router.push('/login');
      } else {
          // If real user, go to profile
          router.push('/profile');
      }
  }

  if (!user) return <div className="p-10 text-center dark:bg-gray-900 dark:text-white min-h-screen">Laddar MedQ...</div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 transition-colors duration-200">
      
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title={modalMessage.title}
        footer={<button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">OK</button>}
      >
        <p className="text-gray-700 dark:text-gray-300">{modalMessage.body}</p>
      </Modal>

      {(mode === 'dashboard' || mode === 'statistics') && (
        <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-400">MedQ</h1>
            
            <div className="flex flex-wrap justify-center items-center gap-3">
                <a 
                    href="mailto:erik.engstrom@stud.ki.se?subject=MedQ%20Bug%20Report"
                    className="text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-700 hover:border-red-300 px-3 py-1 rounded transition-colors"
                >
                    🐛 Rapportera fel
                </a>

                {mode !== 'statistics' && (
                    <button onClick={() => setMode('statistics')} className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600">
                        📊 Statistik
                    </button>
                )}
                
                {/* NAME BUTTON - Now handles Guest Logic */}
                <button 
                    onClick={handleNameClick}
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 flex items-center gap-2"
                >
                    {(user as any).display_name} {isGuest ? '👤' : '⚙️'}
                </button>
                
                <button onClick={handleLogout} className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50">
                    Logga ut
                </button>
            </div>
        </header>
      )}

      {/* DASHBOARD */}
      {mode === 'dashboard' && (
         <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">Vad vill du plugga idag?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => { setSelectedCategory(null); setMode('setup'); }}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform"></div>
                    <h3 className="text-3xl font-bold mb-2">⚡ Blandad Tentamen</h3>
                    <p className="text-blue-100 text-lg">Slumpmässiga frågor från alla kategorier.</p>
                </button>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6 text-xl">Välj Ämne:</h3>
                    <div className="flex flex-col gap-3">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className="px-5 py-4 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 text-left rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all shadow-sm w-full flex justify-between items-center group"
                            >
                                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                    {cat}
                                </span>
                                <span className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
         </div>
      )}

      {/* CATEGORY LOBBY */}
      {mode === 'category-lobby' && selectedCategory && (
          <CategoryTrainer 
              category={selectedCategory}
              stats={Object.values(questionStats).filter(qs => 
                  questions.find(q => q.id === qs.questionId)?.category === selectedCategory
              )}
              onStart={handleLobbyStart}
              onBack={() => setMode('dashboard')}
          />
      )}

      {/* STATISTICS - Now gets isGuest prop */}
      {mode === 'statistics' && (
          <Statistics 
             questionStats={questionStats} 
             allQuestions={questions} 
             onBack={() => setMode('dashboard')} 
             isGuest={isGuest} // <--- Pass the guest status
          />
      )}

      {/* SETUP */}
      {mode === 'setup' && (
          <ExamSetup 
            categories={categories} 
            defaultCategory={selectedCategory} 
            onStart={(s) => handleStartExam(s)} 
            onBack={() => setMode('dashboard')}
          /> 
      )}

      {/* EXAM RUNNER */}
      {mode === 'exam' && currentSettings && (
        <ExamRunner 
            questions={questions} 
            settings={currentSettings} 
            onExit={() => setMode('dashboard')} 
        />
      )}
    </main>
  );
}