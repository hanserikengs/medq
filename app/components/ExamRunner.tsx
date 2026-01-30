'use client'

import { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import { ExamSettings } from './ExamSetup';
import { Question } from '../page';
import { supabase } from '../lib/supabaseClient';

interface Props {
    questions: Question[];
    settings: ExamSettings;
    onExit: () => void;
}

export default function ExamRunner({ questions, settings, onExit }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
    
    // NEW: Track overruled questions (questions user forced to be correct)
    const [overruledQuestions, setOverruledQuestions] = useState<Record<number, boolean>>({});

    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (!settings.timed || isFinished) return;
        const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [settings.timed, isFinished]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOptionSelect = (option: string) => {
        if (settings.instantFeedback && checkedQuestions[currentIndex]) return; 
        setAnswers(prev => ({ ...prev, [currentIndex]: option }));

        // Only auto-advance for Multiple Choice
        if (!settings.instantFeedback && questions[currentIndex].question_type === 'multiple_choice') {
            setTimeout(() => {
                if (currentIndex < questions.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                }
            }, 300);
        }
    };

    const handleCheckAnswer = () => {
        setCheckedQuestions(prev => ({ ...prev, [currentIndex]: true }));
    };

    // NEW: User claims they were right
    const handleOverrule = () => {
        setOverruledQuestions(prev => ({ ...prev, [currentIndex]: true }));
        // We modify the answer locally to a special flag or just handle it in scoring
    };

    const jumpToQuestion = (index: number) => {
        if (!settings.allowBacktracking && index < currentIndex) return;
        if (index < 0 || index >= questions.length) return;
        setCurrentIndex(index);
    };

    const finishExam = async () => {
        setIsFinished(true);
        if (!settings.recordStats) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = questions.map((q, index) => {
            const selected = answers[index];
            if (!selected) return null;

            // SCORING LOGIC
            let isCorrect = false;
            
            if (overruledQuestions[index]) {
                isCorrect = true; // User overruled
            } else if (q.question_type === 'multiple_choice') {
                isCorrect = selected === q.correct_answer;
            } else {
                // Fuzzy matching for Short Answer
                // Split correct answer by comma, trim, lowercase check
                const possibilities = q.correct_answer.split(',').map(s => s.trim().toLowerCase());
                isCorrect = possibilities.includes(selected.toLowerCase().trim());
            }

            return {
                user_id: user.id,
                question_id: q.id,
                category: q.category,
                is_correct: isCorrect,
                created_at: new Date().toISOString()
            };
        }).filter(item => item !== null);

        if (payload.length > 0) {
            await supabase.from('user_answers').insert(payload);
        }
    };

    // CALCULATE SCORE HELPER
    const calculateIsCorrect = (idx: number) => {
        if (overruledQuestions[idx]) return true;
        const q = questions[idx];
        const ans = answers[idx];
        if (!ans) return false;

        if (q.question_type === 'multiple_choice') {
            return ans === q.correct_answer;
        } else {
            const possibilities = q.correct_answer.split(',').map(s => s.trim().toLowerCase());
            return possibilities.includes(ans.toLowerCase().trim());
        }
    };

    if (isFinished) {
        const score = questions.reduce((acc, q, idx) => {
            return acc + (calculateIsCorrect(idx) ? 1 : 0);
        }, 0);

        return (
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center animate-fade-in border dark:border-gray-700">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tentamen Slutförd!</h2>
                <div className="text-6xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                    {Math.round((score / questions.length) * 100)}%
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                    Du svarade rätt på <span className="font-bold">{score}</span> av <span className="font-bold">{questions.length}</span> frågor.
                </p>
                <button onClick={onExit} className="px-8 py-3 bg-gray-900 dark:bg-blue-600 text-white rounded-lg font-bold hover:bg-black dark:hover:bg-blue-700 transition-colors">
                    Tillbaka till menyn
                </button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    const isChecked = checkedQuestions[currentIndex];
    const isCorrect = calculateIsCorrect(currentIndex);

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-700 dark:text-gray-200">
                        Fråga {currentIndex + 1} <span className="text-gray-400 font-normal">/ {questions.length}</span>
                    </span>
                    {settings.timed && (
                        <span className="font-mono text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-sm font-bold">
                            {formatTime(timeElapsed)}
                        </span>
                    )}
                </div>
                <button onClick={onExit} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium transition-colors">
                    Avbryt
                </button>
            </div>

            {/* Question Card */}
            <QuestionCard 
                key={currentIndex}
                question={currentQ}
                selectedOption={answers[currentIndex] || null}
                isAnswered={settings.instantFeedback ? isChecked : false} // Only lock UI if in instant feedback mode
                showFeedback={settings.instantFeedback ? isChecked : false}
                onSelect={handleOptionSelect}
            />

            {/* OVERRULE BUTTON (Only shows if: Instant Mode + Checked + Wrong + Short Answer) */}
            {settings.instantFeedback && isChecked && !isCorrect && currentQ.question_type === 'short_answer' && !overruledQuestions[currentIndex] && (
                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700 flex justify-between items-center animate-fade-in">
                    <span className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">Tycker du att du hade rätt?</span>
                    <button 
                        onClick={handleOverrule}
                        className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-900 dark:text-yellow-100 text-sm font-bold rounded-lg transition-colors"
                    >
                        ✅ Jag hade rätt (Overrule)
                    </button>
                </div>
            )}
            
            {/* Success Message for Overrule */}
            {overruledQuestions[currentIndex] && (
                 <div className="mb-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700 text-center animate-fade-in">
                    <span className="text-green-800 dark:text-green-200 text-sm font-bold">✅ Svaret godkänt manuellt.</span>
                </div>
            )}

            {/* ACTION BAR */}
            <div className="mt-6 flex justify-end items-center gap-3">
                {settings.instantFeedback ? (
                    !isChecked ? (
                        <button 
                            onClick={handleCheckAnswer}
                            disabled={!answers[currentIndex]}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Rätta Svar
                        </button>
                    ) : (
                        <button 
                            onClick={() => currentIndex < questions.length - 1 ? setCurrentIndex(prev => prev + 1) : finishExam()}
                            className="px-8 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-gray-600 shadow-lg transition-all"
                        >
                            {currentIndex === questions.length - 1 ? 'Slutför' : 'Nästa →'}
                        </button>
                    )
                ) : (
                    <button 
                         onClick={() => currentIndex < questions.length - 1 ? setCurrentIndex(prev => prev + 1) : finishExam()}
                         className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold"
                    >
                        {currentIndex === questions.length - 1 ? 'Lämna in' : 'Nästa'}
                    </button>
                )}
            </div>

            {/* NAVIGATION GRID */}
            {settings.allowBacktracking && (
                <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-4">
                     <button onClick={() => jumpToQuestion(currentIndex - 1)} disabled={currentIndex === 0} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors text-gray-600 dark:text-gray-300">
                        ←
                    </button>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                        {questions.map((_, idx) => {
                            const isAnswered = answers[idx] !== undefined;
                            const isCurrent = idx === currentIndex;
                            const isWrong = isChecked && !calculateIsCorrect(idx);
                            
                            let btnClass = "w-10 h-10 rounded-lg font-bold text-sm transition-all border ";
                            
                            if (isCurrent) {
                                btnClass += "border-blue-600 ring-2 ring-blue-200 dark:ring-blue-900 z-10 scale-110 bg-white dark:bg-gray-700 text-blue-900 dark:text-blue-100 shadow-md";
                            } else if (isAnswered) {
                                // If checked and wrong, show red. If just answered (in non-instant mode), show blue.
                                if (settings.instantFeedback && checkedQuestions[idx]) {
                                    btnClass += calculateIsCorrect(idx) 
                                        ? "bg-green-600 text-white border-green-600" 
                                        : "bg-red-500 text-white border-red-500";
                                } else {
                                    btnClass += "bg-blue-600 text-white border-blue-600 hover:bg-blue-700";
                                }
                            } else {
                                btnClass += "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600";
                            }

                            return (
                                <button key={idx} onClick={() => jumpToQuestion(idx)} className={btnClass}>
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                     <button onClick={() => jumpToQuestion(currentIndex + 1)} disabled={currentIndex === questions.length - 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors text-gray-600 dark:text-gray-300">
                        →
                    </button>
                </div>
            )}
        </div>
    );
}