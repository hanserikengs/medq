'use client'

import { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { useRouter } from 'next/navigation';
import { Question, QuestionStat } from '../lib/types';
import { TEXTS } from '../lib/texts'; // Import texts

interface Props {
    questionStats: Record<number, QuestionStat>; 
    allQuestions: Question[]; 
    onBack: () => void;
    isGuest: boolean; 
}

export default function Statistics({ questionStats, allQuestions, onBack, isGuest }: Props) {
    const router = useRouter();
    const t = TEXTS.stats; // Shortcut to make code cleaner

    const [greenLimit, setGreenLimit] = useState(70);
    const orangeLimit = greenLimit - 10;
    
    const [reviewQuestion, setReviewQuestion] = useState<Question | null>(null);
    const [showAnswerInModal, setShowAnswerInModal] = useState(false);

    useEffect(() => {
        if (!isGuest) {
            const savedLimit = localStorage.getItem('medq_green_limit');
            if (savedLimit) setGreenLimit(Number(savedLimit));
        }
    }, [isGuest]);

    const handleLimitChange = (val: number) => {
        setGreenLimit(val);
        localStorage.setItem('medq_green_limit', val.toString());
    };

    // --- LOGIC FIX: Count unique seen questions properly ---
    const stats = useMemo(() => {
        let totalAttempts = 0;
        let totalCorrect = 0;
        let uniqueQuestionsAnswered = 0;

        Object.values(questionStats).forEach(q => {
            totalAttempts += q.attempts;
            totalCorrect += q.correctCount;
            if (q.attempts > 0) uniqueQuestionsAnswered++;
        });

        return { uniqueQuestionsAnswered, totalAttempts, totalCorrect };
    }, [questionStats]);

    const categoryStats = useMemo(() => {
        const cats: Record<string, { attempts: number, correct: number, totalQs: number }> = {};
        allQuestions.forEach(q => {
            if (!cats[q.category]) cats[q.category] = { attempts: 0, correct: 0, totalQs: 0 };
            cats[q.category].totalQs += 1;
            const stat = questionStats[q.id];
            if (stat) {
                cats[q.category].attempts += stat.attempts;
                cats[q.category].correct += stat.correctCount;
            }
        });
        return cats;
    }, [allQuestions, questionStats]);

    const getColor = (percentage: number) => {
        if (percentage >= greenLimit) return "text-green-700 bg-green-100 border-green-200";
        if (percentage >= orangeLimit) return "text-orange-700 bg-orange-100 border-orange-200";
        return "text-red-700 bg-red-100 border-red-200";
    };

    const getBarColor = (percentage: number) => {
        if (percentage >= greenLimit) return "bg-green-500";
        if (percentage >= orangeLimit) return "bg-orange-500";
        return "bg-red-500";
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-10 relative">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-gray-500 hover:text-blue-600">{t.back}</button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
            </div>

            {/* Guest Lock Overlay */}
            {isGuest && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl"></div>
                    <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md text-center">
                        <div className="text-5xl mb-4">🔒</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.guestLock.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t.guestLock.desc}</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => router.push('/login')} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all">{t.guestLock.loginBtn}</button>
                            <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">{t.guestLock.guestBtn}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={isGuest ? "filter blur-sm pointer-events-none select-none" : ""}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Config Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">{t.config.title}</h3>
                        <p className="text-xs text-gray-500 mb-4">{t.config.desc}</p>
                        <select value={greenLimit} onChange={(e) => handleLimitChange(Number(e.target.value))} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold">
                            {[50, 60, 70, 80, 90, 100].map(val => <option key={val} value={val}>{val}%</option>)}
                        </select>
                    </div>

                    {/* Totals Cards */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">{t.cards.total}</span>
                            <span className="text-4xl font-extrabold text-blue-900 dark:text-blue-100">{stats.totalAttempts}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">{t.cards.unique}</span>
                            <span className="text-4xl font-extrabold text-indigo-900 dark:text-indigo-100">
                                {stats.uniqueQuestionsAnswered} <span className="text-xl text-gray-300">/ {allQuestions.length}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Category Bars */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t.subjects}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {Object.entries(categoryStats).map(([catName, data]) => {
                        const percent = data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0;
                        const barColor = data.attempts > 0 ? getBarColor(percent) : "bg-gray-200";
                        return (
                            <div key={catName} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{catName}</span>
                                    <div className="text-right">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mr-2 ${data.attempts > 0 ? getColor(percent) : 'bg-gray-100 text-gray-400'}`}>
                                            {data.attempts > 0 ? `${percent}%` : '-'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-900 h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Question List */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t.listTitle}</h3>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {Object.values(questionStats)
                            .filter(q => q.attempts > 0)
                            .map(q => {
                                const pct = Math.round((q.correctCount / q.attempts) * 100);
                                const questionData = allQuestions.find(item => item.id === q.questionId);
                                if (!questionData) return null;

                                return (
                                    <button 
                                        key={q.questionId} 
                                        onClick={() => {
                                            setReviewQuestion(questionData);
                                            setShowAnswerInModal(false);
                                        }}
                                        className="w-full text-left p-4 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center group"
                                    >
                                        <div className="flex-1 pr-4">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">
                                                {questionData.question_text}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-sm font-bold min-w-[60px] text-center ${getColor(pct)}`}>
                                            {pct}%
                                        </div>
                                    </button>
                                )
                            })}
                         {stats.uniqueQuestionsAnswered === 0 && (
                            <div className="p-8 text-center text-gray-500">{t.empty}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            <Modal 
                isOpen={!!reviewQuestion} 
                onClose={() => setReviewQuestion(null)}
                title={t.review.title}
                footer={<button onClick={() => setReviewQuestion(null)} className="px-4 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg font-bold">{t.review.close}</button>}
            >
                {reviewQuestion && (
                    <div className="space-y-6">
                        <p className="text-lg font-medium text-gray-900 dark:text-white">{reviewQuestion.question_text}</p>
                        {reviewQuestion.question_type === 'multiple_choice' && (
                            <div className="space-y-2">
                                {reviewQuestion.options.map((opt, idx) => {
                                    const isCorrect = opt === reviewQuestion.correct_answer;
                                    return (
                                        <div key={idx} className={`p-3 rounded border ${showAnswerInModal && isCorrect ? "bg-green-100 border-green-500 text-green-900 dark:bg-green-900/30 dark:text-green-100" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"}`}>
                                            {opt} {showAnswerInModal && isCorrect && "✅"}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <input type="checkbox" checked={showAnswerInModal} onChange={(e) => setShowAnswerInModal(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600" />
                            <span className="font-medium text-gray-700 dark:text-gray-200">{t.review.showAnswer}</span>
                        </label>
                        {showAnswerInModal && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg animate-fade-in">
                                <p className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-1">{t.review.explanation}</p>
                                <p className="text-gray-700 dark:text-gray-300">{reviewQuestion.explanation}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}