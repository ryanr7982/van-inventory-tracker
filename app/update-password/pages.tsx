'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'updated' | 'error'>('loading')
  const [error, setError] = useState('')

  // Handles Supabase magic link/recovery redirect
  useEffect(() => {
    async function handleRecovery() {
      setStatus('loading')
      // Parse access_token from URL hash
      const hash = window.location.hash
      const params = new URLSearchParams(hash.replace('#', ''))
      const access_token = params.get('access_token')

      if (!access_token) {
        setError('Missing access token. Please use the reset link in your email.')
        setStatus('error')
        return
      }

      // Set the session using the access_token (so user can update password)
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token: access_token // For password recovery, refresh_token is not needed but required by the API
      })

      if (error) {
        setError('Failed to validate session. Try the reset link again.')
        setStatus('error')
      } else {
        setStatus('ready')
      }
    }

    handleRecovery()
  }, [])

  const handleUpdate = async () => {
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('error')
      setError(error.message)
    } else {
      setStatus('updated')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-bold mb-4">Set a New Password</h2>
      {status === 'loading' && <p>Loading...</p>}
      {status === 'ready' && (
        <>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border p-2 mb-2 w-64 rounded"
            placeholder="New Password"
          />
          <button
            onClick={handleUpdate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-2"
          >
            Update Password
          </button>
        </>
      )}
      {status === 'updated' && (
        <p className="text-green-600 mt-2">
          Password updated! You can now <a href="/login" className="underline text-blue-600">login</a>.
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

