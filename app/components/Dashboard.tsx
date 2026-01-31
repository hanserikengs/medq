import { TEXTS } from '../lib/texts';
import { User } from '@supabase/supabase-js';

interface Props {
  user: User;
  categories: string[];
  onQuickHub: () => void;
  onCustomSetup: () => void;
  onCategorySelect: (cat: string) => void;
}

export default function Dashboard({ user, categories, onQuickHub, onCustomSetup, onCategorySelect }: Props) {
  const today = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 10) return TEXTS.greetings.morning;
      if (hour < 18) return TEXTS.greetings.day;
      return TEXTS.greetings.evening;
  }
  const displayName = (user as any).display_name?.split(' ')[0] || "Student";

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-16"> 
        <div className="mb-10 text-center">
            <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide text-xs mb-2">{today}</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
                {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{displayName}</span>.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{TEXTS.greetings.subHeader}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button onClick={onQuickHub} className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 text-left">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform"></div>
                <span className="text-4xl mb-4 block">⚡</span>
                <h3 className="text-2xl font-bold mb-2">{TEXTS.dashboard.quickHubTitle}</h3>
                <p className="text-blue-100">{TEXTS.dashboard.quickHubDesc}</p>
            </button>

            <button onClick={onCustomSetup} className="group relative overflow-hidden bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all transform hover:-translate-y-1 text-left">
                <span className="text-4xl mb-4 block">⚙️</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{TEXTS.dashboard.customExamTitle}</h3>
                <p className="text-gray-500 dark:text-gray-400">{TEXTS.dashboard.customExamDesc}</p>
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-6 text-xl">{TEXTS.dashboard.chooseCategory}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map(cat => (
                    <button key={cat} onClick={() => onCategorySelect(cat)} className="px-5 py-4 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 text-left rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-300 transition-all shadow-sm w-full flex justify-between items-center group">
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">{cat}</span>
                        <span className="text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
}