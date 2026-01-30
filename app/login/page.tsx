'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Modal from '../../app/components/Modal' // Adjust path if needed

export default function LoginPage() {
  const router = useRouter()
  
  // UI STATE
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  
  // FORM STATE
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // MODAL STATE
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' });

  const showModal = (title: string, body: string) => {
      setModalContent({ title, body });
      setModalOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      showModal("Kunde inte logga in", error.message === "Invalid login credentials" ? "Fel e-post eller lösenord." : error.message);
    } else {
      router.push('/') 
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      showModal("Fel vid registrering", error.message);
    } else {
      // SUCCESS! Show instructions
      showModal(
          "Konto skapat! ✉️", 
          `Vi har skickat ett verifieringsmail till ${email}. Du måste klicka på länken i mailet innan du kan logga in.`
      );
      setView('login'); // Switch back to login view automatically
    }
    setLoading(false)
  }

  const handleGuestLogin = async () => {
      setLoading(true);
      const { error } = await supabase.auth.signInAnonymously();
      
      if (error) {
          showModal("Fel", "Kunde inte skapa gästsession. Kontakta erik.engstrom@stud.ki.se ifall felet fortsätter.");
      } else {
          router.push('/');
          router.refresh();
      }
      setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      
      {/* FEEDBACK MODAL */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title={modalContent.title}
        footer={<button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">OK</button>}
      >
        <p className="text-gray-700 dark:text-gray-300">{modalContent.body}</p>
      </Modal>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        
        {/* HEADER */}
        <h1 className="text-3xl font-extrabold mb-2 text-blue-900 dark:text-blue-400 text-center">MedQ</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Ett verktyg att förbereda dig för tentan</p>

        {/* TABS (Toggle View) */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
            <button 
                onClick={() => setView('login')}
                className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${view === 'login' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
                Logga In
            </button>
            <button 
                onClick={() => setView('signup')}
                className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${view === 'signup' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
                Skapa Konto
            </button>
        </div>

        {/* FORM */}
        <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase tracking-wide">E-post</label>
            <input 
              type="email" 
              required
              className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="namn@student.ki.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase tracking-wide">Lösenord</label>
            <input 
              type="password" 
              required
              minLength={6}
              className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {view === 'signup' && (
                <p className="text-xs text-gray-400 mt-1 ml-1">Minst 6 tecken.</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Bearbetar...' : (view === 'login' ? 'Logga In' : 'Registrera dig')}
          </button>
        </form>

        {/* GUEST OPTION */}
        {view === 'login' && (
            <>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">eller</span>
                    </div>
                </div>

                <button 
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                >
                    👤 Logga in som gäst utan statistik
                </button>
            </>
        )}
      </div>
    </main>
  )
}