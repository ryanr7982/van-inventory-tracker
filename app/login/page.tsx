'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('ryan.roberson@powershades.com')
  const [password, setPassword] = useState('Powershades1!')
  const [error, setError] = useState('')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      window.location.href = '/van'
    }
  }

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      console.log('✅ beforeinstallprompt captured')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null)
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2 mb-2 w-64"
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 mb-2 w-64"
        placeholder="Password"
      />
      <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded mb-2">
        Log In
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="bg-green-600 text-white px-4 py-2 rounded mt-4"
        >
          Install App
        </button>
      )}
    </div>
  )
}

