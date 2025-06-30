'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function VanPage() {
  const [items, setItems] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [searchTerm, setSearchTerm] = useState('')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  const fetchItems = async () => {
    const { data, error } = await supabase.from('inventory').select('*')
    if (error) console.error('Error fetching inventory:', error)
    else setItems(data || [])
  }

  const updateQuantity = async (id: string, newQty: number) => {
    await supabase.from('inventory').update({ quantity: newQty }).eq('id', id)
    fetchItems()
  }

  useEffect(() => {
    fetchItems()
    const interval = setInterval(fetchItems, 3000)
    return () => clearInterval(interval)
  }, [])

  const filteredItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => (showLowStockOnly ? item.quantity < 5 : true))

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Installer Inventory View</h1>

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





