'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Invalid email or password'); setLoading(false); return }
    const { data: admin } = await supabase.from('admins').select('role').eq('id', data.user.id).single()
    if (!admin) { setError('You do not have access'); await supabase.auth.signOut(); setLoading(false); return }
    if (admin.role === 'super_admin') { 
  router.refresh()
  router.push('/admin/dashboard') 
} else { 
  router.refresh()
  router.push('/admin/scanner') 
}
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row">

          {/* Left - Branding */}
          <div className="hidden sm:flex sm:w-2/5 bg-gradient-to-b from-[#C41E3A] to-[#8B0000] p-10 flex-col items-center justify-center text-white">
            <div className="flex justify-center items-center gap-3 mb-6">
              <Image src="/logo1.jpg" alt="Logo 1" width={60} height={60} className="object-contain bg-white rounded-full p-1" />
              <Image src="/logo2.jpg" alt="Logo 2" width={80} height={80} className="object-contain bg-white rounded-full p-1" />
              <Image src="/logo3.jpg" alt="Logo 3" width={60} height={60} className="object-contain bg-white rounded-full p-1" />
            </div>
            <h1 className="text-3xl font-bold text-white text-center">مسارات طبيب</h1>
            <p className="text-red-200 text-sm mt-2 text-center">Medical Pathways</p>
            <div className="mt-8 text-center text-red-100 text-sm space-y-2">
              <p>🔐 Secure Admin Access</p>
              <p>📊 Manage Registrations</p>
              <p>📱 Scan QR Codes</p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="sm:w-3/5 p-8 flex flex-col justify-center">
            {/* Mobile Header */}
            <div className="sm:hidden text-center mb-6">
              <div className="flex justify-center items-center gap-3 mb-4">
                <Image src="/logo1.jpg" alt="Logo 1" width={55} height={55} className="object-contain bg-white rounded-full p-1 shadow" />
                <Image src="/logo2.jpg" alt="Logo 2" width={70} height={70} className="object-contain bg-white rounded-full p-1 shadow" />
                <Image src="/logo3.jpg" alt="Logo 3" width={55} height={55} className="object-contain bg-white rounded-full p-1 shadow" />
              </div>
              <h1 className="text-2xl font-bold text-[#C41E3A]">مسارات طبيب</h1>
              <p className="text-gray-500 text-sm mt-1">Medical Pathways</p>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2 hidden sm:block">Admin Panel</h2>
            <p className="text-gray-400 text-sm mb-6 hidden sm:block">Sign in to access the dashboard</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email" required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password" required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full bg-[#C41E3A] text-white py-3 rounded-xl font-medium hover:bg-[#8B0000] transition disabled:opacity-50 text-base"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}