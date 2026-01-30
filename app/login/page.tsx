'use client'

import { useState } from 'react'
// Note the two dots (..) to go up one folder level
import { supabase } from '../lib/supabaseClient' 
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      router.push('/') 
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      setErrorMsg(error.message)
    } else {
      alert("Account created! Logging you in...")
      router.push('/') 
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-blue-900 text-center">MedQ Login</h1>
        
        {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {errorMsg}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              required
              minLength={6}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Log In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Don't have an account?</p>
          <button 
            type="button"
            onClick={handleSignUp}
            className="text-blue-600 text-sm font-semibold hover:underline mt-1"
          >
            Sign Up here
          </button>
        </div>
      </div>
    </main>
  )
}