'use client'

import { Question } from '../lib/types'; 

interface Props {
  question: Question;
  onAnswer: (option: string) => void;
  showFeedback: boolean;
  selectedAnswer: string | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onReport: () => void; 
}

export default function QuestionCard({ 
    question, 
    onAnswer, 
    showFeedback, 
    selectedAnswer, 
    isBookmarked, 
    onToggleBookmark, 
    onReport 
}: Props) {
    
  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative">
      
      {/* TOOLBAR (Top Right) */}
      <div className="absolute top-4 right-4 flex gap-2">
          {/* Bookmark Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
            className={`p-2 rounded-full transition-all ${isBookmarked ? 'text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-300 hover:text-yellow-400'}`}
          >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
              </svg>
          </button>

          {/* Report Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onReport(); }}
            className="p-2 rounded-full text-gray-300 hover:text-red-500 transition-all"
          >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.652l3.163-.732A.75.75 0 0122.5 4.5v12a.75.75 0 01-.918.731l-3.257.752a9.75 9.75 0 01-5.58-.652l-.108-.054a8.25 8.25 0 00-6.725-.738l-1.912.477A.75.75 0 013 16.5v-13.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
              </svg>
          </button>
      </div>

      {/* Category Badge */}
      <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-3 py-1 rounded-full mb-4">
        {question.category}
      </span>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 pr-12">
        {question.question_text}
      </h3>

      <div className="space-y-3">
        {question.options.map((option, index) => {
           let btnClass = "w-full p-4 rounded-xl border-2 text-left transition-all font-medium ";
           
           if (showFeedback) {
               if (option === question.correct_answer) {
                   btnClass += "bg-green-100 border-green-500 text-green-900 dark:bg-green-900/40 dark:text-green-100";
               } else if (option === selectedAnswer) {
                   btnClass += "bg-red-100 border-red-500 text-red-900 dark:bg-red-900/40 dark:text-red-100";
               } else {
                   btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50";
               }
           } else {
               if (selectedAnswer === option) {
                   btnClass += "border-blue-500 bg-blue-50 dark:bg-blue-900/30";
               } else {
                   btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400";
               }
           }
           
           return (
             <button
               key={index}
               onClick={() => !showFeedback && onAnswer(option)}
               disabled={showFeedback}
               className={btnClass}
             >
               {option}
             </button>
           )
        })}
      </div>

      {showFeedback && (
        <div className="mt-6 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl animate-fade-in">
           <p className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-2">Förklaring</p>
           <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}