import { TEXTS } from '../lib/texts';

interface Props {
  onBack: () => void;
  onSelect: (type: 'quick' | 'standard' | 'marathon') => void;
}

export default function QuickHub({ onBack, onSelect }: Props) {
  const t = TEXTS.quickHub;

  return (
      <div className="max-w-4xl mx-auto animate-fade-in pb-16">
         <button onClick={onBack} className="mb-6 text-gray-500 hover:text-blue-600 flex items-center gap-2">{t.back}</button>
         <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">{t.title}</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <button onClick={() => onSelect('quick')} className="bg-green-100 dark:bg-green-900/30 p-8 rounded-2xl border-2 border-green-200 dark:border-green-800 hover:border-green-500 text-center transition-all">
                 <div className="text-4xl mb-4">{t.options.quick.emoji}</div>
                 <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">{t.options.quick.title}</h3>
                 <p className="text-green-700 dark:text-green-300">{t.options.quick.desc}</p>
             </button>
             <button onClick={() => onSelect('standard')} className="bg-blue-100 dark:bg-blue-900/30 p-8 rounded-2xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-500 text-center transition-all transform scale-105 shadow-xl">
                 <div className="text-4xl mb-4">{t.options.standard.emoji}</div>
                 <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">{t.options.standard.title}</h3>
                 <p className="text-blue-700 dark:text-blue-300">{t.options.standard.desc}</p>
             </button>
             <button onClick={() => onSelect('marathon')} className="bg-purple-100 dark:bg-purple-900/30 p-8 rounded-2xl border-2 border-purple-200 dark:border-purple-800 hover:border-purple-500 text-center transition-all">
                 <div className="text-4xl mb-4">{t.options.marathon.emoji}</div>
                 <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">{t.options.marathon.title}</h3>
                 <p className="text-purple-700 dark:text-purple-300">{t.options.marathon.desc}</p>
             </button>
         </div>
      </div>
  );
}