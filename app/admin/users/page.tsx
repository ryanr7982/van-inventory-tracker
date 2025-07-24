'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UsersAdminPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfiles()
    // eslint-disable-next-line
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    setError('')
    // join with auth.users for email (if you want to show email, see NOTE below)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, created_at')
      .order('created_at', { ascending: false })
    setProfiles(data || [])
    setError(error ? error.message : '')
    setLoading(false)
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    setUpdatingId(id)
    setError('')
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    if (error) setError(error.message)
    await fetchProfiles()
    setUpdatingId(null)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 border">User ID</th>
                <th className="px-2 py-1 border">Role</th>
                <th className="px-2 py-1 border">Actions</th>
                <th className="px-2 py-1 border">Created</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(user => (
                <tr key={user.id}>
                  <td className="px-2 py-1 border break-all">{user.id}</td>
                  <td className="px-2 py-1 border capitalize">{user.role}</td>
                  <td className="px-2 py-1 border">
                    <div className="flex gap-1 flex-wrap">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          className={`px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 ${
                            updatingId === user.id ? 'opacity-50' : ''
                          }`}
                          disabled={updatingId === user.id}
                        >
                          Make Admin
                        </button>
                      )}
                      {user.role !== 'installer' && (
                        <button
                          onClick={() => handleRoleChange(user.id, 'installer')}
                          className={`px-2 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 ${
                            updatingId === user.id ? 'opacity-50' : ''
                          }`}
                          disabled={updatingId === user.id}
                        >
                          Make Installer
                        </button>
                      )}
                      {/* 
                      // Uncomment if you want to add deactivate, etc.
                      <button className="px-2 py-1 rounded bg-red-600 text-white">Deactivate</button>
                      */}
                    </div>
                  </td>
                  <td className="px-2 py-1 border">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleString()
                      : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

