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

// --- CONFIGURATION ---
const APP_VERSION = "v0.9.0-beta";

// Higher number = More questions appear from this category
// You can tweak these numbers to whatever you want.
const CATEGORY_WEIGHTS: Record<string, number> = {
    'Kirurgi': 10,
    'Ortopedi': 8,
    'Urologi': 6,
    'Radiologi': 5,
    'Primärvård': 5,
    'Onkologi': 4,
    'Anestesi': 3,
    'Rättsmedicin': 2, 
    // Any category not listed here defaults to weight 1
};

export type Question = {
    id: number;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    category: string;
    question_type: 'multiple_choice' | 'short_answer';
}

type Mode = 'dashboard' | 'quick-hub' | 'category-lobby' | 'setup' | 'exam' | 'statistics';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
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

  // DATE & GREETING UTILS
  const today = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 10) return "Tidig morgon";
      if (hour < 18) return "Välkommen";
      return "Pluggkväll?";
  }

  const showAlert = (title: string, body: string) => {
      setModalMessage({ title, body });
      setModalOpen(true);
  };

  const fetchData = useCallback(async () => {
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

      const { data: qData } = await supabase.from('questions').select('*');
      if (qData) {
          const uniqueCats = [...new Set(qData.map(item => item.category))];
          setCategories(uniqueCats);
          
          const formattedQuestions = qData.map(q => ({...q, options: q.options as string[]}));
          setQuestions(formattedQuestions);

          const initialStats: Record<number, QuestionStat> = {};
          formattedQuestions.forEach(q => {
              initialStats[q.id] = { questionId: q.id, attempts: 0, correctCount: 0 };
          });

          const { data: history } = await supabase.from('user_answers').select('question_id, is_correct').eq('user_id', user.id);
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
    if (mode === 'dashboard' || mode === 'category-lobby' || mode === 'statistics' || mode === 'quick-hub') {
        fetchData();
    }
  }, [mode, fetchData]); 

  // --- HANDLERS ---
  const handleCategoryClick = (category: string) => {
      setSelectedCategory(category);
      setMode('category-lobby');
  };

  // --- NEW SMART ALGORITHM ---
  const handleQuickStart = (type: 'standard' | 'quick' | 'full') => {
      let targetCount = 0;
      if (type === 'standard') targetCount = 40;
      if (type === 'quick') targetCount = 10;
      // 'full' means take everything, no algorithm needed.

      if (type === 'full') {
          handleStartExam({
              category: null, 
              allowBacktracking: true, 
              instantFeedback: true, 
              timed: false, 
              recordStats: true
          }, false, 0); // 0 = no limit
          return;
      }

      // 1. Group questions by category
      const questionsByCat: Record<string, Question[]> = {};
      categories.forEach(c => questionsByCat[c] = []);
      questions.forEach(q => {
          if (questionsByCat[q.category]) questionsByCat[q.category].push(q);
      });

      let selectedQuestions: Question[] = [];
      const usedQuestionIds = new Set<number>();

      // 2. BASELINE: Try to get 1 from each category (if targetCount allows)
      if (targetCount >= categories.length) {
          categories.forEach(cat => {
              const available = questionsByCat[cat];
              if (available.length > 0) {
                  // Pick random one
                  const randomQ = available[Math.floor(Math.random() * available.length)];
                  selectedQuestions.push(randomQ);
                  usedQuestionIds.add(randomQ.id);
              }
          });
      }

      // 3. WEIGHTED FILL: Fill the rest based on weights
      // Create a "lottery pool" where 'Kirurgi' appears 10 times, 'Rättsmedicin' 2 times, etc.
      const lotteryPool: string[] = [];
      categories.forEach(cat => {
          const weight = CATEGORY_WEIGHTS[cat] || 1; // Default to 1 if not in config
          for (let i = 0; i < weight; i++) {
              lotteryPool.push(cat);
          }
      });

      while (selectedQuestions.length < targetCount) {
          // If we ran out of ALL questions in database, stop
          if (selectedQuestions.length >= questions.length) break;

          // Pick a random category ticket from the pool
          const randomCat = lotteryPool[Math.floor(Math.random() * lotteryPool.length)];
          const availableInCat = questionsByCat[randomCat].filter(q => !usedQuestionIds.has(q.id));

          if (availableInCat.length > 0) {
              const randomQ = availableInCat[Math.floor(Math.random() * availableInCat.length)];
              selectedQuestions.push(randomQ);
              usedQuestionIds.add(randomQ.id);
          } else {
              // If this category is empty, we just loop again and hope to hit another category
              // (In a perfect world we remove this cat from the pool, but this works fine for now)
          }
      }

      // 4. Shuffle the final result so categories aren't clumped
      const shuffledFinal = selectedQuestions.sort(() => 0.5 - Math.random());

      // 5. Send to ExamRunner
      // We manually inject the pre-selected questions by filtering the main list to just these IDs
      // A bit hacky, but fits your current architecture easiest:
      const finalIds = new Set(shuffledFinal.map(q => q.id));
      const finalPool = questions.filter(q => finalIds.has(q.id));
      
      // We pass the "finalPool" logic by using a special call to handleStartExam
      // But wait, handleStartExam reshuffles. Let's modify handleStartExam slightly to accept pre-sorted?
      // Actually, standard handleStartExam filters by category. 
      // Let's just override the questions state directly inside handleStartExam logic below:
      
      setCurrentSettings({
          category: null, // "Blandat"
          allowBacktracking: true,
          instantFeedback: true,
          timed: false,
          recordStats: true
      });

      // Prepare options shuffling
      const finalizedExam = shuffledFinal.map(q => {
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
  };

  const handleStartExam = async (settings: ExamSettings, filterHardMode = false, limit: number = 0) => {
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
            showAlert("Bra jobbat!", "Du har inga 'svåra' frågor kvar!");
            return;
        }
    }

    if (pool.length > 0) {
        let shuffledQuestions = [...pool].sort(() => 0.5 - Math.random());

        if (limit > 0 && limit < shuffledQuestions.length) {
            shuffledQuestions = shuffledQuestions.slice(0, limit);
        }

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
        showAlert("Ojdå!", "Inga frågor hittades.");
    }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  }

  const handleNameClick = () => isGuest ? router.push('/login') : router.push('/profile');

  if (!user) return <div className="p-10 text-center dark:bg-gray-900 dark:text-white min-h-screen">Laddar MedQ...</div>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 transition-colors duration-200 relative">
      
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMessage.title} footer={<button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">OK</button>}>
        <p className="text-gray-700 dark:text-gray-300">{modalMessage.body}</p>
      </Modal>

      {(mode === 'dashboard' || mode === 'statistics' || mode === 'quick-hub') && (
        <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-blue-900 dark:text-blue-400">MedQ</h1>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-3">
                <a href="mailto:erik.engstrom@stud.ki.se?subject=MedQ%20Bug%20Report" className="text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-700 hover:border-red-300 px-3 py-1 rounded transition-colors">🐛 Rapportera fel</a>
                {mode !== 'statistics' && <button onClick={() => setMode('statistics')} className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600">📊 Statistik</button>}
                <button onClick={handleNameClick} className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-blue-600 flex items-center gap-2">{(user as any).display_name} {isGuest ? '👤' : '⚙️'}</button>
                <button onClick={handleLogout} className="text-xs text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50">Logga ut</button>
            </div>
        </header>
      )}

      {/* DASHBOARD */}
      {mode === 'dashboard' && (
         <div className="max-w-4xl mx-auto animate-fade-in pb-16"> 
            
            <div className="mb-10 text-center">
                <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide text-xs mb-2">
                    {today}
                </p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                    {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{(user as any).display_name.split(' ')[0]}</span>.
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Redo att utmana dig själv idag?
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* 1. SNABBVAL (QUICK HUB) */}
                <button 
                    onClick={() => setMode('quick-hub')}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left"
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform"></div>
                    <span className="text-4xl mb-4 block">⚡</span>
                    
                    {/* --- CHANGE NAME HERE --- */}
                    <h3 className="text-2xl font-bold mb-2">Snabbval / Mix</h3>
                    <p className="text-blue-100">Blandade frågor. Algoritmstyrd fördelning.</p>
                </button>

                {/* 2. CUSTOM EXAM */}
                <button 
                    onClick={() => { setSelectedCategory(null); setMode('setup'); }}
                    className="group relative overflow-hidden bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all transform hover:-translate-y-1 text-left"
                >
                    <span className="text-4xl mb-4 block">⚙️</span>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Anpassad Tenta</h3>
                    <p className="text-gray-500 dark:text-gray-400">Skräddarsy din upplevelse. Välj tid, ämnen och feedback.</p>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6 text-xl">Eller välj ett ämne:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => handleCategoryClick(cat)} className="px-5 py-4 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 text-left rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all shadow-sm w-full flex justify-between items-center group">
                            <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">{cat}</span>
                            <span className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    ))}
                </div>
            </div>
         </div>
      )}

      {/* QUICK HUB OVERLAY */}
      {mode === 'quick-hub' && (
          <div className="max-w-4xl mx-auto animate-fade-in pb-16">
             <button onClick={() => setMode('dashboard')} className="mb-6 text-gray-500 hover:text-blue-600 flex items-center gap-2">← Tillbaka</button>
             <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Välj Tentaform</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <button onClick={() => handleQuickStart('quick')} className="bg-green-100 dark:bg-green-900/30 p-8 rounded-2xl border-2 border-green-200 dark:border-green-800 hover:border-green-500 text-center transition-all">
                     <div className="text-4xl mb-4">☕</div>
                     <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Snabb</h3>
                     <p className="text-green-700 dark:text-green-300">10 Frågor</p>
                 </button>
                 <button onClick={() => handleQuickStart('standard')} className="bg-blue-100 dark:bg-blue-900/30 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-500 text-center transition-all transform scale-105 shadow-xl">
                     <div className="text-4xl mb-4">📝</div>
                     <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Standard</h3>
                     <p className="text-blue-700 dark:text-blue-300">40 Frågor</p>
                 </button>
                 <button onClick={() => handleQuickStart('full')} className="bg-purple-100 dark:bg-purple-900/30 p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500 text-center transition-all">
                     <div className="text-4xl mb-4">🧠</div>
                     <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">Maraton</h3>
                     <p className="text-purple-700 dark:text-purple-300">Alla frågor</p>
                 </button>
             </div>
          </div>
      )}

      {/* OTHER COMPONENTS */}
      {mode === 'category-lobby' && selectedCategory && <CategoryTrainer category={selectedCategory} stats={Object.values(questionStats).filter(qs => questions.find(q => q.id === qs.questionId)?.category === selectedCategory)} onStart={(subMode) => { if(subMode==='custom') setMode('setup'); else handleStartExam({ category: selectedCategory, allowBacktracking: true, instantFeedback: true, timed: false, recordStats: true }, subMode==='hard') }} onBack={() => setMode('dashboard')} />}
      {mode === 'statistics' && <Statistics questionStats={questionStats} allQuestions={questions} onBack={() => setMode('dashboard')} isGuest={isGuest} />}
      {mode === 'setup' && <ExamSetup categories={categories} defaultCategory={selectedCategory} onStart={(s) => handleStartExam(s)} onBack={() => setMode('dashboard')} />}
      {mode === 'exam' && currentSettings && <ExamRunner questions={questions} settings={currentSettings} onExit={() => setMode('dashboard')} />}
      
      {/* --- VERSION FOOTER --- */}
      <div className="fixed bottom-2 left-4 text-[10px] text-gray-300 dark:text-gray-700 font-mono pointer-events-none select-none z-50">
          {APP_VERSION}
      </div>

    </main>
  );
}