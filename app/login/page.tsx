'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Modal from '../../app/components/Modal'
import TermsText from '../../app/components/TermsText' 

export default function LoginPage() {
  const router = useRouter()
  
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // NEW: Confirm Password State
  const [confirmPassword, setConfirmPassword] = useState('')

  const [displayName, setDisplayName] = useState('') 
  const [acceptedTerms, setAcceptedTerms] = useState(false) 
  
  const [resetEmail, setResetEmail] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' as React.ReactNode });

  const showModal = (title: string, body: string | React.ReactNode) => {
      setModalContent({ title, body });
      setModalOpen(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      showModal("Kunde inte logga in", "Fel e-post eller lösenord.");
    } else {
      router.push('/') 
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDATION: Check passwords match
    if (password !== confirmPassword) {
        showModal("Fel", "Lösenorden matchar inte.");
        return;
    }

    if (!acceptedTerms) {
        showModal("GDPR", "Du måste godkänna villkoren för att skapa ett konto.");
        return;
    }

    setLoading(true)

    // PRE-CHECK (Optional logic) goes here

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    
    if (error) {
      showModal("Fel vid registrering", error.message);
    } else if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: displayName,
            updated_at: new Date().toISOString()
        });

        showModal(
            "Förfrågan mottagen ✉️", 
            `Om det inte redan finns ett konto registrerat på ${email} har vi skickat en verifieringslänk. Kontrollera din inkorg.`
        );
        setView('login');
    }
    setLoading(false)
  }

  const handleGuestLogin = async () => {
      setLoading(true);
      const { error } = await supabase.auth.signInAnonymously();
      if (error) showModal("Fel", "Kunde inte skapa gästsession.");
      else { router.push('/'); router.refresh(); }
      setLoading(false);
  }

  const handleResetPassword = async () => {
      if (!resetEmail) return;
      setLoading(true);
      
      const redirectTo = `${window.location.origin}/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo,
      });

      if (error) {
          showModal("Fel", error.message);
      } else {
          showModal("Mail skickat", `Om ${resetEmail} finns registrerad har vi skickat en återställningslänk.`);
          setIsResetMode(false);
          setResetEmail('');
      }
      setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalContent.title} 
        footer={<button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">OK</button>}
      >
        {modalContent.body}
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal isOpen={isResetMode} onClose={() => setIsResetMode(false)} title="Återställ Lösenord" footer={null}>
          <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Ange din e-postadress så skickar vi en länk för att återställa lösenordet.</p>
              <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="namn@student.ki.se"/>
              <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsResetMode(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">Avbryt</button>
                  <button onClick={handleResetPassword} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50">
                      {loading ? 'Skickar...' : 'Skicka länk'}
                  </button>
              </div>
          </div>
      </Modal>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-extrabold mb-2 text-blue-900 dark:text-blue-400 text-center">MedQ</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Din medicinska kunskapsbank</p>

        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
            <button onClick={() => setView('login')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${view === 'login' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Logga In</button>
            <button onClick={() => setView('signup')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${view === 'signup' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Skapa Konto</button>
        </div>

        <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
          
          {view === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase">Namn</label>
                <input type="text" required className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Dr. Exempel" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase">E-post</label>
            <input type="email" required className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="namn@student.ki.se" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase">Lösenord</label>
            <input type="password" required minLength={6} className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            
            {view === 'login' && (
                <div className="text-right mt-1">
                    <button type="button" onClick={() => setIsResetMode(true)} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Glömt lösenord?</button>
                </div>
            )}
          </div>

          {/* CONFIRM PASSWORD (SIGNUP ONLY) */}
          {view === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase">Bekräfta Lösenord</label>
                <input type="password" required minLength={6} className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
          )}

          {view === 'signup' && (
              <div className="flex items-start gap-2 pt-2">
                  <input type="checkbox" id="gdpr" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1" />
                  <label htmlFor="gdpr" className="text-xs text-gray-500 dark:text-gray-400">
                      Jag godkänner <span onClick={() => showModal("Användarvillkor", <TermsText />)} className="underline cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800">villkoren</span> för MedQ.
                  </label>
              </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 mt-2">
            {loading ? 'Bearbetar...' : (view === 'login' ? 'Logga In' : 'Registrera dig')}
          </button>
        </form>

        {view === 'login' && (
            <>
                <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-gray-800 text-gray-500">eller</span></div></div>
                <button type="button" onClick={handleGuestLogin} disabled={loading} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2">👤 Prova som gäst</button>
            </>
        )}
      </div>
    </main>
  )
}