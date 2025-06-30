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

  const fetchItems = async () => {
    const { data } = await supabase.from('inventory').select('*')
    setItems(data || [])
  }

  const addItem = async () => {
    if (name && qty >= 0) {
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

  useEffect(() => {
    fetchItems()
    const sub = supabase
      .channel('realtime:inventory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
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

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const text = await e.target.files[0].text()
      const rows = text.split('\n').slice(1) // skip header
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
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="mb-4 flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Item Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border p-2"
        />
        <input
          type="number"
          placeholder="Qty"
          value={qty}
          onChange={e => setQty(Number(e.target.value))}
          className="border p-2 w-20"
        />
        <button onClick={addItem} className="bg-green-600 text-white px-4 py-2 rounded">
          Add
        </button>
        <input
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          className="p-2 border rounded"
        />
        <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 text-white rounded">
          Export CSV
        </button>
        <button onClick={handleExportPDF} className="px-4 py-2 bg-purple-600 text-white rounded">
          Export PDF
        </button>
      </div>

      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.id} className="border p-2 rounded flex justify-between items-center">
            <div>
              <strong>{item.name}</strong>: {item.quantity}
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
              <button
                onClick={async () => {
                  const newQty = prompt('New quantity for ' + item.name, item.quantity)
                  if (newQty !== null) {
                    await supabase.from('inventory').update({ quantity: Number(newQty) }).eq('id', item.id)
                    fetchItems()
                  }
                }}
                className="px-2 py-1 bg-yellow-500 text-white text-sm rounded"
              >
                Edit
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Delete "${item.name}"?`)) {
                    await supabase.from('inventory').delete().eq('id', item.id)
                    fetchItems()
                  }
                }}
                className="px-2 py-1 bg-red-600 text-white text-sm rounded"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

