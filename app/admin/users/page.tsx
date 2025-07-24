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
  is_active?: boolean
}

// --- AUDIT TRAIL UTILITY ---
async function logUserAction(
  actor_id: string,
  action: string,
  target_user_id: string,
  target_email: string | null,
  details: object = {}
) {
  await supabase.from('activity_log').insert({
    user_id: actor_id,
    action,
    target_user_id,
    target_email,
    details,
  })
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)

  // New user form state
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('installer')
  const [inviteMsg, setInviteMsg] = useState('')

  // Get current user id for audit log
  const [actorId, setActorId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setActorId(data?.user?.id ?? null))
  }, [])

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,role,is_active')
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
    else {
      setRefresh(r => r + 1)
      // Audit log
      const user = users.find(u => u.id === id)
      if (actorId && user)
        await logUserAction(actorId, 'role_change', id, user.email, { newRole })
    }
  }

  const handleSuspend = async (id: string, email: string | null) => {
    if (!confirm(`Suspend (deactivate) ${email}?`)) return
    setUpdatingId(id)
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id)
    setUpdatingId(null)
    if (error) setError(error.message)
    else {
      setRefresh(r => r + 1)
      if (actorId)
        await logUserAction(actorId, 'suspend', id, email)
    }
  }

  const handleActivate = async (id: string, email: string | null) => {
    setUpdatingId(id)
    const { error } = await supabase.from('profiles').update({ is_active: true }).eq('id', id)
    setUpdatingId(null)
    if (error) setError(error.message)
    else {
      setRefresh(r => r + 1)
      if (actorId)
        await logUserAction(actorId, 'activate', id, email)
    }
  }

  const handleInvite = async (email: string, role: string) => {
    setInviteMsg('Sending invite...')
    setError('')
    try {
      // Use Supabase Admin API for invitation if available in your setup
      const { error } = await supabase.auth.admin.createUser({
        email,
        password: crypto.randomUUID().slice(0, 12) + 'Aa!',
        email_confirm: false,
        user_metadata: { invited: true }
      })
      if (error) {
        setInviteMsg('')
        setError('Invite error: ' + error.message)
      } else {
        setInviteMsg('Invite sent!')
        setNewEmail('')
        setNewRole('installer')
        setRefresh(r => r + 1)
        if (actorId)
          await logUserAction(actorId, 'invite', '', email, { role })
      }
    } catch (e: any) {
      setInviteMsg('')
      setError('Invite error: ' + e.message)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">User Management</h1>

      {/* --- Add/invite user form --- */}
      <div className="mb-6 p-4 border rounded bg-gray-50 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 items-center mb-2">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="New user email"
            className="border rounded p-2 flex-1"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            className="border rounded p-2"
          >
            <option value="installer">Installer</option>
            <option value="admin">Admin</option>
          </select>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded min-w-[120px]"
            disabled={!newEmail}
            onClick={() => handleInvite(newEmail, newRole)}
          >
            Invite User
          </button>
        </div>
        {inviteMsg && <p className="text-green-600 text-sm">{inviteMsg}</p>}
        <p className="text-xs text-gray-500">
          User will receive an email invite. Admin role grants full access.
        </p>
      </div>

      {/* --- Table --- */}
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
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t">
                  <td className="py-2 px-4 font-mono whitespace-nowrap">
                    {u.email || <span className="text-gray-400 italic">N/A</span>}
                  </td>
                  <td className="py-2 px-4 font-mono break-all">{u.id}</td>
                  <td className="py-2 px-4">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id || !(u.is_active ?? true)}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="border p-1 rounded bg-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="installer">Installer</option>
                    </select>
                  </td>
                  <td className="py-2 px-4">
                    {u.is_active === false ? (
                      <span className="text-red-500 font-semibold">Suspended</span>
                    ) : (
                      <span className="text-green-600 font-semibold">Active</span>
                    )}
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    {u.is_active === false ? (
                      <button
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                        onClick={() => handleActivate(u.id, u.email)}
                        disabled={updatingId === u.id}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        className="text-xs px-2 py-1 bg-yellow-600 text-white rounded"
                        onClick={() => handleSuspend(u.id, u.email)}
                        disabled={updatingId === u.id}
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                      onClick={() => handleInvite(u.email ?? '', u.role)}
                      disabled={!u.email || updatingId === u.id}
                    >
                      Resend Invite
                    </button>
                    {updatingId === u.id && <span className="text-xs text-blue-600 ml-2">Saving...</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs mt-4 text-gray-500 text-center">
        * All actions are immediate. User email invites require email sending configured in Supabase Auth.
      </p>
    </div>
  )
}





