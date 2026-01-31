'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Modal from '../components/Modal'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') // New state
  const [loading, setLoading] = useState(false)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState({ title: '', body: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Validation check
    if (password !== confirmPassword) {
        setModalMessage({ title: "Fel", body: "Lösenorden matchar inte." });
        setModalOpen(true);
        setLoading(false);
        return;
    }

    const { error } = await supabase.auth.updateUser({ password: password })

    if (error) {
      setModalMessage({ title: "Fel", body: error.message })
      setModalOpen(true)
    } else {
      // 2. Force Logout Logic
      await supabase.auth.signOut(); // Kill the session immediately
      
      setModalMessage({ title: "Klart!", body: "Lösenordet uppdaterat. Logga in med ditt nya lösenord." })
      setModalOpen(true)
      
      // Redirect to Login instead of Home
      setTimeout(() => router.push('/login'), 2500)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMessage.title} footer={null}>
        <p className="text-gray-700 dark:text-gray-300">{modalMessage.body}</p>
      </Modal>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Återställ Lösenord</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase">Nytt Lösenord</label>
            <input 
              type="password" 
              required minLength={6}
              className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* CONFIRM FIELD */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1 uppercase">Bekräfta Lösenord</label>
            <input 
              type="password" 
              required minLength={6}
              className="block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg">
            {loading ? 'Sparar...' : 'Uppdatera & Logga ut'}
          </button>
        </form>
      </div>
    </main>
  )
}