'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      const user = signInData.user
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData) {
          console.error('Error fetching profile:', profileError)
          setError('Profile not found or role missing')
        } else {
          const role = profileData.role
          window.localStorage.setItem('userRole', role)
          if (role === 'admin') {
            window.location.href = '/dashboard'
          } else {
            window.location.href = '/van'
          }
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
        className="border p-2 mb-2 w-64 rounded"
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 mb-2 w-64 rounded"
        placeholder="Password"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Log In
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}



