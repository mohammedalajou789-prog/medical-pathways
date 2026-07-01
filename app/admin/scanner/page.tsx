'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Html5Qrcode } from 'html5-qrcode'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  full_name: string
  phone: string
  university: string
  study_year: string
  registration_number: number
  status: string
  entry_time: string | null
}

export default function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<Student | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'warning' | 'error'>('success')
  const [stats, setStats] = useState({ total: 0, entered: 0, not_entered: 0 })
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchStats()
    return () => { stopScanner() }
  }, [])

  const fetchStats = async () => {
    const { data } = await supabase.from('students').select('status')
    if (data) {
      setStats({
        total: data.length,
        entered: data.filter(s => s.status === 'ENTERED').length,
        not_entered: data.filter(s => s.status === 'NOT_ENTERED').length
      })
    }
  }

  const startScanner = async () => {
    setResult(null)
    setMessage('')
    const html5Qrcode = new Html5Qrcode('qr-reader')
    scannerRef.current = html5Qrcode
    setScanning(true)
    await html5Qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await html5Qrcode.stop()
        setScanning(false)
        await handleScan(decodedText)
      },
      () => {}
    )
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      setScanning(false)
    }
  }

  const handleScan = async (uuid: string) => {
    const { data: student, error } = await supabase.from('students').select('*').eq('id', uuid).single()
    if (error || !student) { setMessage('Student not found'); setMessageType('error'); return }
    if (student.status === 'ENTERED') { setResult(student); setMessage('This attendee has already entered'); setMessageType('warning'); return }
    const entryTime = new Date().toISOString()
    await supabase.from('students').update({ status: 'ENTERED', entry_time: entryTime }).eq('id', uuid)
    setResult({ ...student, status: 'ENTERED', entry_time: entryTime })
    setMessage('Entry confirmed successfully!')
    setMessageType('success')
    fetchStats()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Image src="/logo2.jpg" alt="Logo" width={45} height={45} className="object-contain bg-white rounded-full p-1" />
          <div>
            <h1 className="text-lg font-bold text-[#C41E3A]">Medical Pathways</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
          Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            <p className="text-gray-400 text-sm mb-2">Total Registered</p>
            <p className="text-6xl font-bold text-[#C41E3A]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            <p className="text-gray-400 text-sm mb-2">Inside Hall</p>
            <p className="text-6xl font-bold text-green-600">{stats.entered}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            <p className="text-gray-400 text-sm mb-2">Outside</p>
            <p className="text-6xl font-bold text-gray-400">{stats.not_entered}</p>
          </div>
        </div>

        {/* Main Content - Scanner + Result side by side on desktop */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex flex-col sm:flex-row">

            {/* Scanner Side */}
            <div className="sm:w-1/2 p-8 border-b sm:border-b-0 sm:border-r border-gray-100">
              <h2 className="font-bold text-xl mb-6 text-center text-[#C41E3A]">QR Scanner</h2>
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden mb-6" />
              <div className="flex gap-3">
                {!scanning ? (
                  <button onClick={startScanner} className="flex-1 bg-[#C41E3A] text-white py-3 rounded-xl font-medium hover:bg-[#8B0000] transition text-base">
                    Start Scanning
                  </button>
                ) : (
                  <button onClick={stopScanner} className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-medium hover:bg-gray-600 transition text-base">
                    Stop Scanning
                  </button>
                )}
                {result && (
                  <button onClick={() => { setResult(null); setMessage('') }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300 transition text-base">
                    Scan Again
                  </button>
                )}
              </div>
            </div>

            {/* Result Side */}
            <div className="sm:w-1/2 p-8 flex flex-col justify-center">
              {!message && !result && (
                <div className="text-center text-gray-300">
                  <p className="text-6xl mb-4">📷</p>
                  <p className="text-lg font-medium">Scan a QR Code</p>
                  <p className="text-sm mt-1">Results will appear here</p>
                </div>
              )}

              {message && (
                <div className={`rounded-2xl p-5 text-center font-medium text-base mb-4 ${
                  messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                  messageType === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {messageType === 'success' ? '✅' : messageType === 'warning' ? '⚠️' : '❌'} {message}
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <h3 className="font-bold text-xl border-b pb-3">Student Details</h3>
                  {[
                    { label: 'Name', value: result.full_name },
                    { label: 'Phone', value: result.phone },
                    { label: 'University', value: result.university },
                    { label: 'Year', value: result.study_year },
                    { label: 'Reg #', value: result.registration_number },
                    { label: 'Entry Time', value: result.entry_time ? new Date(result.entry_time).toLocaleTimeString() : '-' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${result.status === 'ENTERED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {result.status === 'ENTERED' ? '✅ Entered' : 'Not Entered'}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}