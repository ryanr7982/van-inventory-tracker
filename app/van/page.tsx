'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function VanPage() {
  const [items, setItems] = useState<any[]>([])
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const fetchItems = async () => {
    const { data, error } = await supabase.from('inventory').select('*')
    if (error) console.error('Error fetching inventory:', error)
    else setItems(data || [])
  }

  useEffect(() => {
    fetchItems()

    const interval = setInterval(() => {
      fetchItems()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Detect PWA install availability
  useEffect(() => {
    const handler = (e: any) => {
      console.log("🔥 beforeinstallprompt event fired")
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = () => {
    if (!deferredPrompt) return
    console.log("💡 Prompting install")
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(choice => {
      console.log("📦 User response:", choice)
      setDeferredPrompt(null)
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Installer Inventory View</h1>

      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Install App
        </button>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500">No items in inventory yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="border p-2 rounded">
              <strong>{item.name}</strong>: {item.quantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}



