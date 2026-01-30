'use client'

import { useState, useEffect } from 'react';

export type ExamSettings = {
    category: string | null;
    allowBacktracking: boolean;
    instantFeedback: boolean;
    timed: boolean;
    recordStats: boolean;
}

interface Props {
    categories: string[];
    defaultCategory: string | null; // NEW: Receives the dashboard selection
    onStart: (settings: ExamSettings) => void;
    onBack: () => void; // NEW: Ability to go back to dashboard
}

export default function ExamSetup({ categories, defaultCategory, onStart, onBack }: Props) {
    const [settings, setSettings] = useState<ExamSettings>({
        category: null, 
        allowBacktracking: true,
        instantFeedback: true,
        timed: false,
        recordStats: true
    });

    // EFFECT: When component loads, apply the default category if one was clicked
    useEffect(() => {
        if (defaultCategory) {
            setSettings(prev => ({ ...prev, category: defaultCategory }));
        }
    }, [defaultCategory]);

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <button onClick={onBack} className="mb-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 flex items-center gap-2 font-medium">
                ← Tillbaka till menyn
            </button>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Tentamensinställningar</h2>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 space-y-8">
                
                {/* 1. Category Selection */}
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">1. Välj Ämne</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSettings({ ...settings, category: null })}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                                settings.category === null 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                        >
                            ⚡ Blandat
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSettings({ ...settings, category: cat })}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                                    settings.category === cat 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Options Grid */}
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">2. Anpassa</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Toggle 
                            label="Direkt Rättning" 
                            checked={settings.instantFeedback} 
                            onChange={(v) => setSettings({...settings, instantFeedback: v})} 
                        />
                        <Toggle 
                            label="Tillåt Navigering" 
                            checked={settings.allowBacktracking} 
                            onChange={(v) => setSettings({...settings, allowBacktracking: v})} 
                        />
                        <Toggle 
                            label="Tidtagning" 
                            checked={settings.timed} 
                            onChange={(v) => setSettings({...settings, timed: v})} 
                        />
                        <Toggle 
                            label="Spara Statistik" 
                            checked={settings.recordStats} 
                            onChange={(v) => setSettings({...settings, recordStats: v})} 
                        />
                    </div>
                </div>

                <button 
                    onClick={() => onStart(settings)}
                    className="w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-bold hover:bg-black dark:hover:bg-blue-700 transition-all shadow-lg text-lg"
                >
                    Starta Tentamen
                </button>
            </div>
        </div>
    );
}

// Helper component for cleaner code
function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <span className="text-gray-700 dark:text-gray-200">{label}</span>
            <input 
                type="checkbox" 
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-100 border-gray-300 dark:bg-gray-600 dark:border-gray-500"
            />
        </label>
    );
}