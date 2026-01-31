'use client'

import { useState } from 'react';
import QuestionCard from './QuestionCard';
import Modal from './Modal'; 
import { supabase } from '../lib/supabaseClient';
import { Question } from '../lib/types'; 
import { ExamSettings } from './ExamSetup';

interface Props {
  questions: Question[];
  settings: ExamSettings;
  onExit: () => void;
  bookmarks: Set<number>;
  onToggleBookmark: (id: number) => void;
}

// Helper to track the state of every question
type QuestionState = {
    selectedOption: string | null;
    isAnswered: boolean;
    isCorrect: boolean;
}

export default function ExamRunner({ questions, settings, onExit, bookmarks, onToggleBookmark }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // GLOBAL STATE: Track every question's status
  const [history, setHistory] = useState<Record<number, QuestionState>>({});
  
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // UI STATES
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // CURRENT QUESTION HELPERS
  const currentQ = questions[currentIndex];
  const currentState = history[currentIndex] || { selectedOption: null, isAnswered: false, isCorrect: false };
  const showFeedback = currentState.isAnswered && settings.instantFeedback;

  // 1. SELECT OPTION (Just visual update)
  const handleOptionSelect = (answer: string) => {
      if (currentState.isAnswered) return; // Prevent changing if already locked in
      
      setHistory(prev => ({
          ...prev,
          [currentIndex]: { ...prev[currentIndex], selectedOption: answer }
      }));
  };

  // 2. CONFIRM ANSWER (Lock it in)
  const handleConfirmAnswer = async () => {
      const answer = currentState.selectedOption;
      if (!answer) return;

      const isCorrect = answer === currentQ.correct_answer;
      if (isCorrect) setScore(s => s + 1);

      // Save to DB
      if (settings.recordStats) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
             await supabase.from('user_answers').insert({
                 user_id: user.id,
                 question_id: currentQ.id,
                 is_correct: isCorrect
             });
          }
      }

      // Update State to "Answered"
      setHistory(prev => ({
          ...prev,
          [currentIndex]: { 
              selectedOption: answer, 
              isAnswered: true, 
              isCorrect: isCorrect 
          }
      }));
  };

  // NAVIGATION HANDLERS
  const handleNext = () => {
      if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          setIsFinished(true);
      }
  };

  const handlePrev = () => {
      if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
      }
  };

  const handleJumpTo = (index: number) => {
      setCurrentIndex(index);
      setOverviewOpen(false);
  };

  const handleReportSubmit = async () => {
      if (!reportReason.trim()) return;
      setIsReporting(true);
      
      const { error } = await supabase.from('question_reports').insert({
          question_id: currentQ.id,
          reason: reportReason,
          status: 'pending'
      });

      setIsReporting(false);
      setReportModalOpen(false);
      setReportReason('');
      
      if (error) alert("Kunde inte skicka rapport.");
      else alert("Tack! Rapporten har skickats.");
  };

  if (isFinished) {
      return (
          <div className="text-center p-10 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Bra jobbat!</h2>
              <p className="mb-6 text-xl">Du fick {score} av {questions.length} rätt.</p>
              <button onClick={onExit} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">Tillbaka till menyn</button>
          </div>
      )
  }

  if (!currentQ) return <div>Laddar...</div>;
  const isBookmarked = bookmarks ? bookmarks.has(currentQ.id) : false;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-32 pt-6 px-4 relative">
      
      {/* OVERVIEW MODAL (The "Indexing") */}
      <Modal isOpen={overviewOpen} onClose={() => setOverviewOpen(false)} title="Översikt" footer={<button onClick={() => setOverviewOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Stäng</button>}>
          <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto p-1">
              {questions.map((_, idx) => {
                  const state = history[idx];
                  let bg = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
                  if (idx === currentIndex) bg = "ring-2 ring-blue-500 bg-white dark:bg-gray-800";
                  else if (state?.isAnswered) bg = state.isCorrect ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
                  
                  return (
                      <button key={idx} onClick={() => handleJumpTo(idx)} className={`p-2 rounded-lg text-sm font-bold transition-all ${bg}`}>
                          {idx + 1}
                      </button>
                  )
              })}
          </div>
      </Modal>

      {/* REPORT MODAL */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Rapportera Fråga" footer={<div className="flex gap-2 justify-end w-full"><button onClick={() => setReportModalOpen(false)} className="px-4 py-2 text-gray-500">Avbryt</button><button onClick={handleReportSubmit} disabled={isReporting} className="px-4 py-2 bg-red-600 text-white rounded font-bold">{isReporting ? '...' : 'Skicka'}</button></div>}>
        <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">Vad är fel med denna fråga?</p>
            <textarea className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white h-32" placeholder="T.ex. Fel svar, dålig bild, stavfel..." value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
        </div>
      </Modal>

      {/* TOP BAR */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onExit} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">Avsluta</button>
        
        {/* INDEXING BUTTON */}
        <button onClick={() => setOverviewOpen(true)} className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <span className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300">
                Fråga {currentIndex + 1} / {questions.length}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        </button>

        <div className="w-12"></div> {/* Spacer for centering */}
      </div>

      <QuestionCard 
        question={currentQ}
        onAnswer={handleOptionSelect}
        showFeedback={showFeedback}
        selectedAnswer={currentState.selectedOption}
        isBookmarked={isBookmarked}
        onToggleBookmark={() => onToggleBookmark(currentQ.id)}
        onReport={() => setReportModalOpen(true)}
      />

      {/* CONTROL BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
          <div className="max-w-3xl mx-auto flex gap-3 items-center">
              
              {/* PREVIOUS BUTTON (Only if backtracking allowed) */}
              {settings.allowBacktracking && (
                  <button 
                    onClick={handlePrev} 
                    disabled={currentIndex === 0}
                    className="p-3 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
                    title="Föregående fråga"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                  </button>
              )}

              {/* MAIN ACTIONS */}
              <div className="flex-1 flex gap-3">
                  {!showFeedback ? (
                      // WAITING FOR ANSWER
                      <>
                        <button onClick={handleNext} className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            Hoppa över
                        </button>
                        <button 
                            onClick={handleConfirmAnswer}
                            disabled={!currentState.selectedOption}
                            className="flex-[2] py-3 bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all disabled:cursor-not-allowed"
                        >
                            Svara
                        </button>
                      </>
                  ) : (
                      // NEXT BUTTON
                      <button 
                        onClick={handleNext}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-blue-700 transition-all transform hover:-translate-y-1"
                      >
                          {currentIndex === questions.length - 1 ? "Se Resultat" : "Nästa Fråga →"}
                      </button>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}