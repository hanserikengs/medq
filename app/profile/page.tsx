'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Modal from '../components/Modal' // Import the Modal

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const router = useRouter()

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' });

  const showModal = (title: string, body: string) => {
      setModalContent({ title, body });
      setModalOpen(true);
  };

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
          router.push('/login')
          return
      }

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`display_name`)
        .eq('id', user.id)
        .single()

      if (error && status !== 406) {
        throw error
      }

      if (data) {
        setDisplayName(data.display_name || '')
      }
    } catch (error) {
      console.log('Error loading user data!')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setUpdating(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('No user')

      const updates = {
        id: user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) throw error
      
      // SUCCESS MODAL
      showModal("Sparat!", "Din profil har uppdaterats.");
      
      // Optional: Delay redirect so user can see modal
      setTimeout(() => router.push('/'), 1500);

    } catch (error) {
      showModal("Fel", "Kunde inte spara data.");
    } finally {
      setUpdating(false)
    }
  }

  async function resetStats() {
    // We can use the native confirm for destructive actions, or build a specific "Confirm Modal".
    // For now, let's keep native confirm for SAFETY (harder to click accidentally), 
    // but use Modal for the result.
    const confirmReset = window.confirm("Är du säker? Detta raderar all din historik.");
    if (!confirmReset) return;

    try {
        setUpdating(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            const { error } = await supabase
                .from('user_answers')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
            showModal("Klart", "All statistik har nollställts.");
        }
    } catch (error) {
        showModal("Fel", "Kunde inte nollställa statistik.");
    } finally {
        setUpdating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center">
      
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalContent.title}
        footer={<button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">OK</button>}
      >
        <p className="text-gray-700 dark:text-gray-300">{modalContent.body}</p>
      </Modal>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Redigera Profil</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visningsnamn
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Ditt Namn"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={updateProfile}
              disabled={updating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updating ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </div>

        <hr className="my-8 border-gray-200 dark:border-gray-700" />

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
            <h3 className="text-red-800 dark:text-red-400 font-bold mb-2">Återställ Data</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                Detta raderar all sparad historik och nollställer dina framsteg.
            </p>
            <button
                onClick={resetStats}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-sm w-full sm:w-auto"
            >
                Nollställ Statistik
            </button>
        </div>
      </div>
    </main>
  )
}