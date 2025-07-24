'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type UserProfile = {
  id: string
  email: string | null
  role: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,role')
        .order('email', { ascending: true })
      if (error) {
        setError('Could not fetch profiles: ' + error.message)
        setLoading(false)
        return
      }
      setUsers(data || [])
      setLoading(false)
    }
    fetchUsers()
  }, [refresh])

  const handleRoleChange = async (id: string, newRole: string) => {
    setUpdatingId(id)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    setUpdatingId(null)
    if (error) setError(error.message)
    else setRefresh(r => r + 1)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">User ID</th>
                <th className="py-2 px-4 text-left">Role</th>
                <th className="py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="py-2 px-4 font-mono">{u.email || <span className="text-gray-400 italic">N/A</span>}</td>
                  <td className="py-2 px-4 font-mono">{u.id}</td>
                  <td className="py-2 px-4">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="admin">Admin</option>
                      <option value="installer">Installer</option>
                    </select>
                  </td>
                  <td className="py-2 px-4">
                    {updatingId === u.id && <span className="text-xs text-blue-600">Saving...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs mt-4 text-gray-500">
        * User emails are shown if they exist in <code>profiles</code>. All new signups are automatically recorded.
      </p>
    </div>
  )
}




