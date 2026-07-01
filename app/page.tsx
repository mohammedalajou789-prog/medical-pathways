'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import RegisterForm from '@/components/RegisterForm'
import QRCode from 'qrcode'
import Image from 'next/image'

const jordanPhone = /^07[789]\d{7}$/

export default function Home() {
  const [regOpen, setRegOpen] = useState<boolean | null>(null)
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [student, setStudent] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    supabase.from('event_settings').select('registration_open').single().then(({ data }) => {
      if (data) setRegOpen(data.registration_open)
    })
  }, [])

  useEffect(() => {
    if (student && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, student.id, { width: 250, margin: 2, color: { dark: '#8B0000', light: '#ffffff' } })
      QRCode.toDataURL(student.id, { width: 250 }).then(setQrUrl)
    }
  }, [student])

  const handlePhoneChange = (value: string) => {
    if (value.includes('+')) { setPhoneError('Phone number must not include +'); return }
    if (!/^\d*$/.test(value)) { setPhoneError('Numbers only'); return }
    setPhoneError('')
    setPhone(value)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jordanPhone.test(phone)) {
      setPhoneError('Must be a valid Jordanian number starting with 07')
      return
    }
    setLoading(true)
    setError('')
    setStudent(null)
    const { data } = await supabase.from('students').select('*').eq('phone', phone).single()
    if (!data) { setError('Registration not found'); setLoading(false); return }
    setStudent(data)
    setLoading(false)
  }

  if (regOpen === null) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )

  if (regOpen) return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <RegisterForm />
    </main>
  )

  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!student ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center items-center gap-4 mb-4">
                <Image src="/logo1.jpg" alt="Logo 1" width={60} height={60} className="object-contain mix-blend-multiply" />
                <Image src="/logo2.jpg" alt="Logo 2" width={80} height={80} className="object-contain mix-blend-multiply" />
                <Image src="/logo3.jpg" alt="Logo 3" width={60} height={60} className="object-contain mix-blend-multiply" />
              </div>
              <h1 className="text-2xl font-bold text-[#C41E3A]">مسارات طبيب</h1>
              <p className="text-gray-500 text-sm mt-1">Medical Pathways</p>
              <p className="text-gray-400 text-sm mt-3">Registration is closed. Enter your phone number to retrieve your QR Code.</p>
            </div>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="07..."
                  maxLength={10}
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${phoneError ? 'border-red-400' : 'border-gray-300'}`}
                  value={phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                />
                {phoneError
                  ? <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                  : <p className="text-gray-400 text-xs mt-1">Jordanian number only — format: 07XXXXXXXX</p>
                }
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-[#C41E3A] text-white py-2 rounded-lg font-medium hover:bg-[#8B0000] transition disabled:opacity-50">
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center items-center gap-4 mb-4">
              <Image src="/logo1.jpg" alt="Logo 1" width={60} height={60} className="object-contain mix-blend-multiply" />
              <Image src="/logo2.jpg" alt="Logo 2" width={80} height={80} className="object-contain mix-blend-multiply" />
              <Image src="/logo3.jpg" alt="Logo 3" width={60} height={60} className="object-contain mix-blend-multiply" />
            </div>
            <h1 className="text-2xl font-bold text-[#C41E3A] mb-2">Your QR Code</h1>
            <p className="text-gray-500 mb-6">Show this at the entrance</p>
            <canvas ref={canvasRef} className="mx-auto rounded-xl mb-4" />
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-500">PIN Code</p>
              <p className="text-3xl font-bold text-[#C41E3A] tracking-widest">{student.pin_code}</p>
            </div>
            <div className="text-left bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
              <p><span className="font-medium">Name:</span> {student.full_name}</p>
              <p><span className="font-medium">Phone:</span> {student.phone}</p>
              <p><span className="font-medium">University:</span> {student.university}</p>
              <p><span className="font-medium">Year:</span> {student.study_year}</p>
              <p><span className="font-medium">Reg #:</span> {student.registration_number}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-600 text-sm font-medium">يرجى الاحتفاظ بهذا الكود لأنه هو الوسيلة الوحيدة للدخول إلى القاعة</p>
              <p className="text-red-600 text-sm mt-1">Please keep this QR Code. It is the only way to enter the event hall.</p>
            </div>
            <a href={qrUrl} download="qr-code.png" className="block w-full bg-[#C41E3A] text-white py-2 rounded-lg font-medium hover:bg-[#8B0000] transition">
              Download QR Code
            </a>
          </div>
        )}
      </div>
    </main>
  )
}