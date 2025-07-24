'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ActivityEntry = {
  id: number
  created_at: string
  user_id: string
  action: string
  item_name: string
  quantity: number
  profiles?: { email: string | null; role: string | null }[]
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityEntry[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, created_at, user_id, action, item_name, quantity, profiles(email, role)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) return setLogs([])
      setLogs(data as ActivityEntry[] || [])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const filtered = logs.filter(l =>
    !search ||
    ((l.profiles?.[0]?.email?.toLowerCase().includes(search.toLowerCase())) ||
      l.item_name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      <input
        type="text"
        placeholder="Search by user email or item"
        className="mb-4 p-2 border rounded w-full sm:w-96"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border bg-white text-sm rounded shadow">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left border">Date</th>
                <th className="px-3 py-2 text-left border">User</th>
                <th className="px-3 py-2 text-left border">Action</th>
                <th className="px-3 py-2 text-left border">Item</th>
                <th className="px-3 py-2 text-left border">Qty</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    No activity found.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 border">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 border font-mono">
                      {log.profiles?.[0]?.email ||
                        <span className="text-gray-400 italic">{log.user_id.slice(0, 8)}…</span>
                      }
                    </td>
                    <td className="px-3 py-2 border">{log.action}</td>
                    <td className="px-3 py-2 border">{log.item_name}</td>
                    <td className="px-3 py-2 border">{log.quantity ?? ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs mt-4 text-gray-500">Most recent 100 actions. Logged automatically on add/edit/delete/import.</p>
    </div>
  )
}

