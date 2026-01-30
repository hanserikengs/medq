'use client'

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // SECURITY
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pin, setPin] = useState('');
    const ADMIN_PIN = "374545"; 

    // FORM STATE
    const [qType, setQType] = useState<'multiple_choice' | 'short_answer'>('multiple_choice');
    const [category, setCategory] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']); 
    const [correctAnswer, setCorrectAnswer] = useState(''); 
    const [explanation, setExplanation] = useState('');
    
    const [existingCategories, setExistingCategories] = useState<string[]>([]);

    useEffect(() => {
        checkUser();
        fetchCategories();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) router.push('/login');
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('questions').select('category');
        if (data) {
            const unique = [...new Set(data.map(d => d.category))];
            setExistingCategories(unique);
        }
    };

    // --- HANDLERS ---
    
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
        if (qType === 'multiple_choice' && options[index] === correctAnswer) {
            setCorrectAnswer(value);
        }
    };

    const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
    const removeOption = (index: number) => {
        if (options.length > 2) {
            const valToRemove = options[index];
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
            if (valToRemove === correctAnswer) setCorrectAnswer('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!questionText || !correctAnswer) {
            alert("Fyll i fråga och rätt svar.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('questions').insert({
            category,
            question_text: questionText,
            question_type: qType,
            options: qType === 'multiple_choice' ? options : [], 
            correct_answer: correctAnswer,
            explanation
        });

        if (error) {
            alert("Fel: " + error.message);
        } else {
            setQuestionText('');
            if (qType === 'multiple_choice') {
                setOptions(new Array(options.length).fill(''));
            }
            setCorrectAnswer('');
            setExplanation('');
            document.getElementById('q-text')?.focus();
        }
        setLoading(false);
    };

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) setIsUnlocked(true);
        else alert("Fel lösenord!");
    };

    if (!isUnlocked) return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-md text-center">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Admin Login 🔒</h1>
                <form onSubmit={handleUnlock} className="space-y-4">
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-widest" placeholder="PIN" autoFocus />
                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">Lås upp</button>
                </form>
            </div>
        </main>
    );

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Frågefabrik 🏭</h1>
                    <button onClick={() => router.push('/')} className="text-gray-500 hover:text-blue-600">Tillbaka</button>
                </header>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* 1. TYPE SELECTOR */}
                        <div className="flex gap-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setQType('multiple_choice')}
                                className={`flex-1 py-2 rounded-md font-bold transition-all ${qType === 'multiple_choice' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500'}`}
                            >
                                Flervalsfråga
                            </button>
                            <button
                                type="button"
                                onClick={() => setQType('short_answer')}
                                className={`flex-1 py-2 rounded-md font-bold transition-all ${qType === 'short_answer' ? 'bg-white dark:bg-gray-600 shadow text-purple-600 dark:text-purple-300' : 'text-gray-500'}`}
                            >
                                Kort Svar / Essay
                            </button>
                        </div>

                        {/* 2. Category */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                            <input list="categories" value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Kardiologi" required />
                            <datalist id="categories">{existingCategories.map(c => <option key={c} value={c} />)}</datalist>
                        </div>

                        {/* 3. Question */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Fråga</label>
                            <textarea id="q-text" value={questionText} onChange={e => setQuestionText(e.target.value)} className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white h-24 font-medium" required />
                        </div>

                        {/* 4. CONTENT AREA (Depends on Type) */}
                        {qType === 'multiple_choice' ? (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Alternativ</label>
                                    <div className="text-xs space-x-2">
                                        <button type="button" onClick={() => removeOption(options.length - 1)} disabled={options.length <= 2} className="text-red-500 font-bold px-2">-</button>
                                        <button type="button" onClick={addOption} disabled={options.length >= 6} className="text-blue-500 font-bold px-2">+</button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {options.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <span className="text-gray-400 text-sm font-mono w-6">{String.fromCharCode(65 + idx)}.</span>
                                            <input value={opt} onChange={e => handleOptionChange(idx, e.target.value)} className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={`Alternativ ${String.fromCharCode(65 + idx)}`} required />
                                            <button type="button" onClick={() => opt && setCorrectAnswer(opt)} className={`p-2 rounded-full border ${correctAnswer === opt && opt !== '' ? "bg-green-500 text-white border-green-500" : "bg-gray-100 dark:bg-gray-800 text-gray-300"}`}>✓</button>
                                        </div>
                                    ))}
                                </div>
                                <input type="text" value={correctAnswer} readOnly className="sr-only" required />
                            </div>
                        ) : (
                            // SHORT ANSWER VIEW
                            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900">
                                <label className="block text-sm font-bold text-purple-900 dark:text-purple-300 mb-1">Facit (Accepterade svar)</label>
                                <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">Separera synonymer med kommatecken.</p>
                                <textarea 
                                    value={correctAnswer} 
                                    onChange={e => setCorrectAnswer(e.target.value)} 
                                    className="w-full p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-20"
                                    placeholder="T.ex: Propofol, Diprivan, Propolipid"
                                    required
                                />
                            </div>
                        )}

                        {/* 5. Explanation (UPDATED TO TEXTAREA) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Förklaring</label>
                            <textarea 
                                value={explanation} 
                                onChange={e => setExplanation(e.target.value)} 
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white h-32" 
                                placeholder="Förklara svaret i detalj..." 
                            />
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all">
                            {loading ? 'Sparar...' : '💾 Spara Fråga'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}