'use client'

import { Question } from '../lib/types';

interface Props {
  question: Question;
  selectedOption: string | null;
  isAnswered: boolean;
  showFeedback: boolean;
  onSelect: (option: string) => void;
}

export default function QuestionCard({ question, selectedOption, isAnswered, showFeedback, onSelect }: Props) {
  
  const getOptionColor = (option: string) => {
    if (!showFeedback) {
        return option === selectedOption 
            ? "bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500" 
            : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200";
    }

    if (option === question.correct_answer) {
        return "bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-100 font-bold";
    }
    if (option === selectedOption && selectedOption !== question.correct_answer) {
        return "bg-red-100 dark:bg-red-900/40 border-red-500 text-red-800 dark:text-red-100";
    }
    return "bg-gray-50 dark:bg-gray-800 opacity-50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500";
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6 text-gray-900 dark:text-white transition-colors">
      
      <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-semibold mb-3 mr-2">
        {question.category}
      </span>
      {question.question_type === 'short_answer' && (
          <span className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded-full font-semibold mb-3">
            Essay
          </span>
      )}

      <h3 className="text-xl font-bold mb-6 whitespace-pre-wrap">{question.question_text}</h3>

      {/* RENDER BASED ON TYPE */}
      {question.question_type === 'multiple_choice' ? (
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => !isAnswered && onSelect(option)}
                disabled={isAnswered && showFeedback}
                className={`w-full text-left p-4 rounded-lg border transition-all ${getOptionColor(option)}`}
              >
                {option}
              </button>
            ))}
          </div>
      ) : (
          // SHORT ANSWER INPUT
          <div className="space-y-4">
              <input 
                  type="text" 
                  value={selectedOption || ''}
                  onChange={(e) => onSelect(e.target.value)}
                  disabled={isAnswered}
                  placeholder="Skriv ditt svar här..."
                  className={`w-full p-4 rounded-lg border text-lg ${
                      showFeedback 
                        ? (selectedOption === 'CORRECT_OVERRULE' || question.correct_answer.toLowerCase().includes((selectedOption||'').toLowerCase()) 
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100" 
                            : "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100")
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
              />
              {showFeedback && (
                  <div className="text-sm">
                      <span className="font-bold text-gray-500">Facit: </span>
                      <span className="font-mono text-gray-900 dark:text-white">{question.correct_answer}</span>
                  </div>
              )}
          </div>
      )}

      {showFeedback && isAnswered && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg animate-fade-in">
          <p className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-1">Förklaring:</p>
          <p className="text-gray-700 dark:text-gray-300 mb-3">{question.explanation}</p>
          
          {/* THE DISCLAIMER */}
          <p className="text-[14px] text-gray-400 dark:text-gray-500 italic border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
             ⚠️ Observera: Denna förklaring är genererad av LLM och kan vara felaktig. Dubbelkolla mot kurslitteratur eller säkra källor om något verkar fel.
          </p>
        </div>
      )}
    </div>
  );
}