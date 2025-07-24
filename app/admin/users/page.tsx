'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type UserProfile = {
  id: string
  email: string
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
      // 1. Get all users from auth
      const { data: userList, error: userErr } = await supabase.auth.admin.listUsers()
      if (userErr) {
        setError('Could not fetch user list: ' + userErr.message)
        setLoading(false)
        return
      }
      // 2. Get profiles table (id/role)
      const { data: profileList, error: profileErr } = await supabase.from('profiles').select('id,role')
      if (profileErr) {
        setError('Could not fetch profiles: ' + profileErr.message)
        setLoading(false)
        return
      }
      // 3. Merge email/id/role
      const merged: UserProfile[] = (userList?.users || []).map((user: any) => ({
        id: user.id,
        email: user.email ?? '',
        role: profileList?.find((p: any) => p.id === user.id)?.role ?? 'installer',
      }))
      setUsers(merged)
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Role</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="py-2 px-4">{u.email}</td>
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
                  {updatingId === u.id && <span className="text-sm text-blue-600">Saving...</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}


