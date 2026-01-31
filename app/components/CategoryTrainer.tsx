'use client'

import { useMemo } from 'react';
// FIX: Import from types, not page
import { QuestionStat } from '../lib/types';
import { TEXTS } from '../lib/texts';

interface Props {
    category: string;
    stats: QuestionStat[]; 
    onStart: (mode: 'instant' | 'custom' | 'hard') => void;
    onBack: () => void;
}

export default function CategoryTrainer({ category, stats, onStart, onBack }: Props) {
    const t = TEXTS.categoryLobby;

    const aggregated = useMemo(() => {
        let attempts = 0;
        let correct = 0;
        stats.forEach(s => {
            attempts += s.attempts;
            correct += s.correctCount;
        });
        return { attempts, correct };
    }, [stats]);

    const percentage = aggregated.attempts > 0 
        ? Math.round((aggregated.correct / aggregated.attempts) * 100) 
        : 0;

    const getLevelColor = (pct: number) => {
        if (pct >= 80) return "text-green-600 bg-green-100 border-green-200";
        if (pct >= 60) return "text-orange-600 bg-orange-100 border-orange-200";
        return "text-red-600 bg-red-100 border-red-200";
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in pb-16">
            <button onClick={onBack} className="mb-8 text-gray-500 hover:text-blue-600 flex items-center gap-2">
                {TEXTS.stats.back}
            </button>
            
            <div className="text-center mb-10">
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-bold mb-4 uppercase tracking-wide">
                    {category}
                </span>
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
                    {t.titlePrefix} {category}
                </h2>
                
                {/* Stats Badge */}
                <div className={`inline-flex items-center gap-4 px-6 py-3 rounded-2xl border ${aggregated.attempts > 0 ? getLevelColor(percentage) : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                    <div className="text-center">
                        <p className="text-xs uppercase font-bold opacity-70">{t.level}</p>
                        <p className="text-2xl font-black">{aggregated.attempts > 0 ? `${percentage}%` : "-"}</p>
                    </div>
                    <div className="w-px h-8 bg-current opacity-20"></div>
                    <div className="text-center">
                        <p className="text-xs uppercase font-bold opacity-70">{t.answered}</p>
                        <p className="text-xl font-bold">{aggregated.attempts}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* 1. Standard */}
                <button 
                    onClick={() => onStart('instant')}
                    className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-blue-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                            🚀
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {t.modes.standard.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.modes.standard.desc}</p>
                        </div>
                    </div>
                </button>

                {/* 2. Hard Mode */}
                <button 
                    onClick={() => onStart('hard')}
                    className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-orange-100 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all text-left shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                            💪
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400">
                                {t.modes.hard.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.modes.hard.desc}</p>
                        </div>
                    </div>
                </button>

                {/* 3. Custom */}
                <button 
                    onClick={() => onStart('custom')}
                    className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-gray-400 transition-all text-left shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 dark:bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center text-2xl">
                            ⚙️
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300">
                                {t.modes.custom.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{t.modes.custom.desc}</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}