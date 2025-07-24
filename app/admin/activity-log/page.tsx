'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*, profiles(role), auth.users(email)')
        .order('created_at', { ascending: false })
        .limit(100)
      setLogs(data || [])
    }
    fetchLogs()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Activity Log</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">User</th>
              <th className="px-2 py-1 border">Action</th>
              <th className="px-2 py-1 border">Item</th>
              <th className="px-2 py-1 border">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="px-2 py-1 border">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-2 py-1 border">{log.user_id}</td>
                <td className="px-2 py-1 border">{log.action}</td>
                <td className="px-2 py-1 border">{log.item_name}</td>
                <td className="px-2 py-1 border">{log.quantity ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
