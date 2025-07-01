'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import jsPDF from 'jspdf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [items, setItems] = useState<any[]>([])
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const role = window.localStorage.getItem('userRole')
    setUserRole(role)
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase.from('inventory').select('*')
    setItems(data || [])
  }

  const addItem = async () => {
    if (name && qty >= 0 && userRole === 'admin') {
      await supabase.from('inventory').insert({ name, quantity: qty })
      setName('')
      setQty(1)
      fetchItems()
    }
  }

  const updateQuantity = async (id: string, newQty: number) => {
    await supabase.from('inventory').update({ quantity: newQty }).eq('id', id)
    fetchItems()
  }

  const deleteItem = async (id: string, name: string) => {
    if (userRole === 'admin' && confirm(`Delete "${name}"?`)) {
      await supabase.from('inventory').delete().eq('id', id)
      fetchItems()
    }
  }

  useEffect(() => {
    fetchItems()
    const sub = supabase
      .channel('realtime:inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchItems()
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Quantity'],
      ...items.map(item => [item.name, item.quantity])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text('Inventory Report', 10, 10)
    items.forEach((item, i) => {
      doc.text(`${item.name}: ${item.quantity}`, 10, 20 + i * 10)
    })
    doc.save('inventory.pdf')
  }

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => (showLowStockOnly ? item.quantity < 5 : true))

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search items"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="p-2 border rounded"
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={e => {
              setShowLowStockOnly(e.target.checked)
              setCurrentPage(1)
            }}
          />
          Low stock only
        </label>

        {userRole === 'admin' && (
          <>
            <input
              type="file"
              accept=".csv"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  const text = await e.target.files[0].text()
                  const rows = text.split('\n').slice(1)
                  for (const row of rows) {
                    const [name, quantity] = row.split(',')
                    if (name && quantity) {
                      await supabase.from('inventory').insert({
                        name: name.trim(),
                        quantity: Number(quantity)
                      })
                    }
                  }
                  fetchItems()
                }
              }}
              className="p-2 border rounded"
            />
            <input
              type="text"
              placeholder="Item Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="number"
              placeholder="Qty"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="p-2 border rounded w-20"
            />
            <button onClick={addItem} className="bg-green-600 text-white px-4 py-2 rounded">
              Add
            </button>
            <button onClick={handleExportCSV} className="bg-blue-600 text-white px-4 py-2 rounded">
              Export CSV
            </button>
            <button onClick={handleExportPDF} className="bg-purple-600 text-white px-4 py-2 rounded">
              Export PDF
            </button>
          </>
        )}
      </div>

      <ul className="space-y-2">
        {paginatedItems.map(item => (
          <li key={item.id} className="border p-2 rounded flex justify-between items-center">
            <div>
              <strong>{item.name}</strong>:
              <span className={item.quantity < 5 ? 'text-red-600 font-bold' : ''}>
                {' '}{item.quantity}
              </span>
              {item.quantity < 5 && (
                <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                  Low stock
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="px-2 py-1 bg-green-500 text-white text-sm rounded"
              >
                +
              </button>
              <button
                onClick={() => {
                  if (item.quantity > 0) {
                    updateQuantity(item.id, item.quantity - 1)
                  }
                }}
                className="px-2 py-1 bg-red-500 text-white text-sm rounded"
              >
                –
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={() => deleteItem(item.id, item.name)}
                  className="px-2 py-1 bg-red-700 text-white text-sm rounded"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={() => {
            const maxPage = Math.ceil(filteredItems.length / itemsPerPage)
            setCurrentPage(p => Math.min(p + 1, maxPage))
          }}
          disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage)}
          className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

