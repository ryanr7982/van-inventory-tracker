'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ActivityLogEntry = {
  id: string
  created_at: string
  user_id: string
  action: string
  item_name: string
  quantity: number | null
  profiles?: { email: string; role: string }[]
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 25

  // Fetch logs
  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('activity_log')
        .select('*, profiles(email, role)')
        .order('created_at', { ascending: false })
        .limit(500)
      setLogs(data || [])
    }
    fetchLogs()
  }, [])

  // Filtering
  const filtered = logs.filter(l =>
    (!search ||
      (l.profiles?.[0]?.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.item_name?.toLowerCase().includes(search.toLowerCase()))
    ) &&
    (!actionFilter || l.action === actionFilter) &&
    (!dateFilter || l.created_at.startsWith(dateFilter))
  )

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))

  // Export CSV
  const handleExportCSV = () => {
    const csv = [
      ['Date', 'User Email', 'Role', 'Action', 'Item', 'Quantity'],
      ...filtered.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.profiles?.[0]?.email || log.user_id,
        log.profiles?.[0]?.role || '',
        log.action,
        log.item_name,
        log.quantity ?? ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'activity_log.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text('Activity Log', 10, 10)
    filtered.forEach((log, i) => {
      doc.text(
        [
          new Date(log.created_at).toLocaleString(),
          log.profiles?.[0]?.email || log.user_id,
          log.profiles?.[0]?.role || '',
          log.action,
          log.item_name,
          String(log.quantity ?? '')
        ].join(' | '),
        10,
        20 + i * 7
      )
    })
    doc.save('activity_log.pdf')
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Activity Log</h1>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by user/email/item"
          className="p-2 border rounded w-full sm:w-64"
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          className="p-2 border rounded"
          value={actionFilter}
          onChange={e => {
            setActionFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All Actions</option>
          <option value="added">Added</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="imported">Imported</option>
        </select>
        <input
          type="date"
          className="p-2 border rounded"
          value={dateFilter}
          onChange={e => {
            setDateFilter(e.target.value)
            setPage(1)
          }}
        />
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
        >
          Export CSV
        </button>
        <button
          onClick={handleExportPDF}
          className="px-3 py-2 bg-purple-600 text-white rounded text-sm"
        >
          Export PDF
        </button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">Date</th>
              <th className="px-2 py-1 border">User</th>
              <th className="px-2 py-1 border">Role</th>
              <th className="px-2 py-1 border">Action</th>
              <th className="px-2 py-1 border">Item</th>
              <th className="px-2 py-1 border">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                  No activity found.
                </td>
              </tr>
            ) : (
              paginated.map(log => (
                <tr key={log.id}>
                  <td className="px-2 py-1 border">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-2 py-1 border">{log.profiles?.[0]?.email || log.user_id}</td>
                  <td className="px-2 py-1 border">{log.profiles?.[0]?.role || ''}</td>
                  <td className="px-2 py-1 border">{log.action}</td>
                  <td className="px-2 py-1 border">{log.item_name}</td>
                  <td className="px-2 py-1 border">{log.quantity ?? ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex gap-2 mt-4 justify-center">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-3 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="px-3 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}


