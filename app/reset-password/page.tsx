'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  const handleReset = async () => {
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })
    if (error) {
      setStatus('error')
      setError(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-bold mb-4">Reset Password</h2>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2 mb-2 w-64 rounded"
        placeholder="Email"
      />
      <button
        onClick={handleReset}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-2"
      >
        Send Reset Email
      </button>
      {status === 'sent' && (
        <p className="text-green-600 mt-2">
          Reset email sent! Check your inbox.
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-500 mt-2">{error}</p>
      )}
      <p className="mt-2 text-sm">
        <Link href="/login" className="text-blue-600 hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  )
}
