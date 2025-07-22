'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSignup = async () => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setError(error.message)
    } else {
      const user = signUpData.user
      if (user) {
        let attempts = 0
        let profileData = null
        let profileError = null
        while (attempts < 5 && !profileData) {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          profileData = data
          profileError = error
          if (!profileData) await sleep(500) // Wait 0.5 sec and try again
          attempts++
        }
        if (!profileData) {
          setError('Profile not found or role missing')
          return
        }
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
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
        onClick={handleSignup}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Sign Up
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <p className="mt-2 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

