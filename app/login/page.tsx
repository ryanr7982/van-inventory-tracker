'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('ryan.roberson@powershades.com')
  const [password, setPassword] = useState('Powershades1!')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      const user = signInData.user
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          setError(profileError.message)
        } else {
          window.localStorage.setItem('userRole', profile.role)
          window.location.href = '/van'
        }
      }
    }
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
    </div>
  )
}


