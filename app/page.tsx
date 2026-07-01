'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import RegisterForm from '@/components/RegisterForm'
import QRCode from 'qrcode'
import Image from 'next/image'

const jordanPhone = /^07[789]\d{7}$/

const Logos = () => (
  <div className="flex justify-center items-center gap-3">
    <Image src="/logo1.jpg" alt="Logo 1" width={55} height={55} className="object-contain bg-white rounded-full p-1" />
    <Image src="/logo2.jpg" alt="Logo 2" width={70} height={70} className="object-contain bg-white rounded-full p-1" />
    <Image src="/logo3.jpg" alt="Logo 3" width={55} height={55} className="object-contain bg-white rounded-full p-1" />
  </div>
)

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
    if (!jordanPhone.test(phone)) { setPhoneError('Must be a valid Jordanian number starting with 07'); return }
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
      <div className="w-full max-w-4xl">
        {!student ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Left - Red Side */}
              <div className="bg-gradient-to-b from-[#C41E3A] to-[#8B0000] p-8 flex flex-col items-center justify-center text-white sm:w-2/5">
                <Logos />
                <h1 className="text-2xl font-bold text-white text-center mt-4">مسارات طبيب</h1>
                <p className="text-red-200 text-sm mt-1 text-center">Medical Pathways</p>
                <p className="text-red-100 text-xs mt-4 text-center">Registration is closed</p>
              </div>
              {/* Right - Form */}
              <div className="p-8 sm:w-3/5 flex flex-col justify-center">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Retrieve Your QR Code</h2>
                <p className="text-gray-400 text-sm mb-6">Enter your phone number to get your QR Code</p>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel" required placeholder="07..." maxLength={10}
                      className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${phoneError ? 'border-red-400' : 'border-gray-300'}`}
                      value={phone} onChange={e => handlePhoneChange(e.target.value)}
                    />
                    {phoneError
                      ? <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                      : <p className="text-gray-400 text-xs mt-1">Jordanian number only — format: 07XXXXXXXX</p>
                    }
                  </div>
                  {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-[#C41E3A] text-white py-3 rounded-xl font-medium hover:bg-[#8B0000] transition disabled:opacity-50">
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Left - QR */}
              <div className="bg-gray-50 p-8 flex flex-col items-center justify-center sm:w-1/2 border-b sm:border-b-0 sm:border-r border-gray-100">
                <Logos />
                <h1 className="text-2xl font-bold text-[#C41E3A] mt-4 mb-1">Your QR Code</h1>
                <p className="text-gray-500 text-sm mb-6">Show this at the entrance</p>
                <canvas ref={canvasRef} className="mx-auto rounded-xl mb-4" />
                <div className="bg-white rounded-xl p-4 w-full text-center shadow-sm mb-4">
                  <p className="text-xs text-gray-400 mb-1">PIN Code</p>
                  <p className="text-4xl font-bold text-[#C41E3A] tracking-widest">{student.pin_code}</p>
                </div>
                <a href={qrUrl} download="qr-code.png" className="block w-full bg-[#C41E3A] text-white py-2.5 rounded-xl font-medium hover:bg-[#8B0000] transition text-center">
                  Download QR Code
                </a>
              </div>
              {/* Right - Info */}
              <div className="p-8 sm:w-1/2 flex flex-col justify-center">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">Student Information</h2>
                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Name', value: student.full_name },
                    { label: 'Phone', value: student.phone },
                    { label: 'University', value: student.university },
                    { label: 'Year', value: student.study_year },
                    { label: 'Reg #', value: student.registration_number },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-1">
                      <span className="text-gray-500 text-sm">{item.label}</span>
                      <span className="font-medium text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-medium text-right mb-1">يرجى الاحتفاظ بهذا الكود لأنه هو الوسيلة الوحيدة للدخول إلى القاعة</p>
                  <p className="text-red-600 text-sm">Please keep this QR Code. It is the only way to enter the event hall.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}