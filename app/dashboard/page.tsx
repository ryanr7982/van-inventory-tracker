'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

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
    await supabase.from('inventory').insert({ name, quantity: qty })
    setName('')
    setQty(1)
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="mb-4 flex gap-2">
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
      </div>
      <ul className="space-y-2">
  {items.map(item => (
    <li key={item.id} className="border p-2 rounded flex justify-between items-center">
      <div>
        <strong>{item.name}</strong>: {item.quantity}
      </div>
      <div className="flex gap-2">
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
