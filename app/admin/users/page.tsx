'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: usersData } = await supabase.rpc('get_all_users') // fallback: query 'auth.users' with RLS
      const { data: profilesData } = await supabase.from('profiles').select('*')
      setUsers(usersData || [])
      setProfiles(profilesData || [])
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const getRole = (id: string) => profiles.find((p: any) => p.id === id)?.role ?? 'installer'

  const handleRoleChange = async (id: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setProfiles(p => p.map(pr => pr.id === id ? { ...pr, role } : pr))
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-2 py-1 border">User ID</th>
              <th className="px-2 py-1 border">Role</th>
              <th className="px-2 py-1 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(user => (
              <tr key={user.id}>
                <td className="px-2 py-1 border">{user.id}</td>
                <td className="px-2 py-1 border">{user.role}</td>
                <td className="px-2 py-1 border">
                  {user.role !== 'admin' && (
                    <button
                      className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
                      onClick={() => handleRoleChange(user.id, 'admin')}
                    >
                      Make Admin
                    </button>
                  )}
                  {user.role !== 'installer' && (
                    <button
                      className="px-2 py-1 bg-gray-500 text-white rounded"
                      onClick={() => handleRoleChange(user.id, 'installer')}
                    >
                      Make Installer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
