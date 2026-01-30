'use client'

import { QuestionStat } from "./Statistics";

interface Props {
    category: string;
    stats: QuestionStat[]; // Stats only for this category's questions
    onStart: (mode: 'instant' | 'custom' | 'hard') => void;
    onBack: () => void;
}

export default function CategoryTrainer({ category, stats, onStart, onBack }: Props) {
    
    // Calculate simple stats for this category
    const totalAttempts = stats.reduce((acc, curr) => acc + curr.attempts, 0);
    const totalCorrect = stats.reduce((acc, curr) => acc + curr.correctCount, 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <button onClick={onBack} className="mb-6 text-gray-500 hover:text-blue-600 flex items-center gap-2">
                ← Tillbaka till menyn
            </button>

            {/* HEADER CARD */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg mb-8">
                <h1 className="text-4xl font-extrabold mb-2">{category}</h1>
                <div className="flex gap-6 mt-4">
                    <div>
                        <span className="block text-blue-200 text-sm">Din Säkerhet</span>
                        <span className="text-2xl font-bold">{accuracy}%</span>
                    </div>
                    <div>
                        <span className="block text-blue-200 text-sm">Frågor Besvarade</span>
                        <span className="text-2xl font-bold">{stats.filter(s => s.attempts > 0).length} / {stats.length}</span>
                    </div>
                </div>
            </div>

            {/* ACTION GRID */}
            <div className="grid grid-cols-1 gap-4">
                
                {/* 1. INSTANT */}
                <button 
                    onClick={() => onStart('instant')}
                    className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left flex justify-between items-center"
                >
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600">🚀 Snabbstart</h3>
                        <p className="text-gray-500 text-sm mt-1">Hoppa rakt in. Slumpmässiga frågor tills du tröttnar.</p>
                    </div>
                    <span className="text-2xl">→</span>
                </button>

                {/* 2. CUSTOM */}
                <button 
                    onClick={() => onStart('custom')}
                    className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-left flex justify-between items-center"
                >
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600">⚙️ Anpassad Tenta</h3>
                        <p className="text-gray-500 text-sm mt-1">Välj antal frågor, tidtagning och inställningar.</p>
                    </div>
                    <span className="text-2xl">→</span>
                </button>

                {/* 3. TRAIN HARD (The new feature) */}
                <button 
                    onClick={() => onStart('hard')}
                    className="group bg-red-50 dark:bg-red-900/10 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900 hover:border-red-500 dark:hover:border-red-500 transition-all text-left flex justify-between items-center"
                >
                    <div>
                        <h3 className="text-xl font-bold text-red-800 dark:text-red-400 group-hover:text-red-600">💪 Träna Svårt</h3>
                        <p className="text-red-600 dark:text-red-300 text-sm mt-1">Fokusera enbart på frågor du tidigare svarat fel på.</p>
                    </div>
                    <span className="text-2xl text-red-500">⚠</span>
                </button>

            </div>
        </div>
    );
}