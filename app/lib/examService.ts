import { supabase } from './supabaseClient';
import { Question, QuestionStat } from './types';
import { CATEGORY_WEIGHTS } from './config';
import { ExamSettings } from '../components/ExamSetup';
import { TEXTS } from './texts';

type FetchResult = {
    questions: Question[];
    errorTitle?: string;
    errorMessage?: string;
}

export async function fetchExamQuestions(
    settings: ExamSettings, 
    limit: number, 
    hardMode: boolean, 
    categories: string[],
    questionStats: Record<number, QuestionStat>
): Promise<FetchResult> {
    
    let fetchedQuestions: Question[] = [];

    // CASE A: Specific Category
    if (settings.category) {
        let query = supabase.from('questions').select('*').eq('category', settings.category);
        
        if (limit > 0) {
             const { data } = await supabase.rpc('get_random_questions', { p_category: settings.category, p_limit: limit });
             if (data) fetchedQuestions = data;
        } else {
             const { data } = await query;
             if (data) fetchedQuestions = data as Question[];
        }
    } 
    
    // CASE B: Mixed Mode (Smart Algorithm)
    else {
        if (limit === 0) limit = 100; // Cap "Marathon" at 100

        const totalWeight = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
        
        // --- FIX FOR YOUR ERROR IS HERE ---
        // We use 'any[]' because Supabase builders are "Thenables" but not strict "Promises"
        const promises: any[] = []; 

        categories.forEach(cat => {
            const weight = CATEGORY_WEIGHTS[cat] || 1;
            let count = Math.floor((weight / totalWeight) * limit);
            if (count < 1) count = 1; 

            // Add the supabase call to the array
            promises.push(supabase.rpc('get_random_questions', { p_category: cat, p_limit: count }));
        });

        const results = await Promise.all(promises);
        results.forEach((res: any) => {
            if (res.data) fetchedQuestions.push(...res.data);
        });

        // Fallback if we are short on questions
        if (fetchedQuestions.length < limit) {
            const remainder = limit - fetchedQuestions.length;
            const { data: fill } = await supabase.rpc('get_random_mixed_questions', { p_limit: remainder });
            if (fill) fetchedQuestions.push(...fill);
        }
    }

    // Shuffle result
    fetchedQuestions = fetchedQuestions.sort(() => 0.5 - Math.random());
    
    // Filter Hard Mode
    if (hardMode) {
        fetchedQuestions = fetchedQuestions.filter(q => {
            const stat = questionStats[q.id];
            if (!stat || stat.attempts === 0) return true; 
            return (stat.correctCount / stat.attempts) < 0.6;
        });
        
        if (fetchedQuestions.length === 0) {
             return { questions: [], errorTitle: "Bra jobbat!", errorMessage: TEXTS.alerts.noHardQuestions };
        }
    }

    // Shuffle Options
    const finalized = fetchedQuestions.map(q => {
        if (q.question_type === 'multiple_choice') {
            const opts = [...q.options];
            for (let i = opts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [opts[i], opts[j]] = [opts[j], opts[i]];
            }
            return { ...q, options: opts };
        }
        return q;
    });

    if (finalized.length === 0) {
        return { questions: [], errorTitle: "Ojdå", errorMessage: TEXTS.alerts.noQuestions };
    }

    return { questions: finalized };
}