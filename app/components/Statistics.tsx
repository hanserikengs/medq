'use client'

import { useState, useMemo, useEffect } from 'react';
import { Question } from '../page';
import Modal from './Modal';
import { useRouter } from 'next/navigation';

export type QuestionStat = {
    questionId: number;
    attempts: number;
    correctCount: number;
}

interface Props {
    questionStats: Record<number, QuestionStat>; 
    allQuestions: Question[]; 
    onBack: () => void;
    isGuest: boolean; // <--- NEW PROP
}

export default function Statistics({ questionStats, allQuestions, onBack, isGuest }: Props) {
    const router = useRouter();
    const [greenLimit, setGreenLimit] = useState(70);
    const orangeLimit = greenLimit - 10;
    
    const [reviewQuestion, setReviewQuestion] = useState<Question | null>(null);
    const [showAnswerInModal, setShowAnswerInModal] = useState(false);

    // Load settings (only if not guest)
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

    // --- AGGREGATION LOGIC ---
    const stats = useMemo(() => {
        let totalAttempts = 0;
        let totalCorrect = 0;
        const uniqueQuestionsAnswered = Object.keys(questionStats).length;

        Object.values(questionStats).forEach(q => {
            totalAttempts += q.attempts;
            totalCorrect += q.correctCount;
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

    // --- RENDER ---
    return (
        <div className="max-w-5xl mx-auto animate-fade-in pb-10 relative">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="text-gray-500 hover:text-blue-600">← Tillbaka</button>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Min Statistik</h2>
            </div>

            {/* GUEST LOCK OVERLAY */}
            {isGuest && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4">
                    {/* The Blur Backdrop */}
                    <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl"></div>
                    
                    {/* The Call to Action Card */}
                    <div className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md text-center">
                        <div className="text-5xl mb-4">🔒</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lås upp din statistik</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Som gäst sparas inte din historik permanent. Om du skapar ett konto kommer statistik om frågor och kategorier att sparas.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => router.push('/login')}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all"
                            >
                                Skapa Konto / Logga In
                            </button>
                            <button 
                                onClick={onBack}
                                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            >
                                Fortsätt som gäst
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT (Blurred if guest) */}
            <div className={isGuest ? "filter blur-sm pointer-events-none select-none" : ""}>
                
                {/* Config & Big Numbers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Gränsvärden</h3>
                        <p className="text-xs text-gray-500 mb-4">Minsta % för grön nivå.</p>
                        <select 
                            value={greenLimit}
                            onChange={(e) => handleLimitChange(Number(e.target.value))}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold"
                        >
                            {[50, 60, 70, 80, 90, 100].map(val => <option key={val} value={val}>{val}%</option>)}
                        </select>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Totalt antal svar</span>
                            <span className="text-4xl font-extrabold text-blue-900 dark:text-blue-100">{stats.totalAttempts}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Unika frågor sedda</span>
                            <span className="text-4xl font-extrabold text-indigo-900 dark:text-indigo-100">
                                {stats.uniqueQuestionsAnswered} <span className="text-xl text-gray-300">/ {allQuestions.length}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Category Stats */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Statistik per Ämne</h3>
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
            </div>

            {/* Hidden Review Modal just to satisfy Typescript logic even if hidden */}
            <Modal isOpen={!!reviewQuestion} onClose={() => setReviewQuestion(null)} title="Granska" footer={null} children={null} />
        </div>
    );
}