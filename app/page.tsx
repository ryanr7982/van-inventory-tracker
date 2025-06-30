import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="p-6 min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to Van Inventory Tracker</h1>
      <p className="mb-4">Get started by logging in</p>
      <Link href="/login">
  <button className="px-4 py-2 bg-blue-600 text-white rounded">
    Go to Login
  </button>
</Link>
    </div>
  )
}