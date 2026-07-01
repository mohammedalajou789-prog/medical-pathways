'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import Image from 'next/image'

type Student = {
  id: string
  full_name: string
  phone: string
  university: string
  study_year: string
  registration_number: number
  pin_code: string
}

const englishOnly = /^[a-zA-Z0-9\s\-'.]*$/
const jordanPhone = /^07[789]\d{7}$/

export default function RegisterForm() {
  const [form, setForm] = useState({ full_name: '', phone: '', university: '', study_year: '', pathway: '' })
  const [fieldErrors, setFieldErrors] = useState({ full_name: '', phone: '', university: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [student, setStudent] = useState<Student | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (student && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, student.id, { width: 280, margin: 2, color: { dark: '#8B0000', light: '#ffffff' } })
      QRCode.toDataURL(student.id, { width: 280 }).then(setQrUrl)
    }
  }, [student])

  const handleTextChange = (field: 'full_name' | 'university', value: string) => {
    if (!englishOnly.test(value)) { setFieldErrors(prev => ({ ...prev, [field]: 'English characters only' })); return }
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePhoneChange = (value: string) => {
    if (value.includes('+')) { setFieldErrors(prev => ({ ...prev, phone: 'Phone number must not include +' })); return }
    if (!/^\d*$/.test(value)) { setFieldErrors(prev => ({ ...prev, phone: 'Numbers only' })); return }
    setFieldErrors(prev => ({ ...prev, phone: '' }))
    setForm(prev => ({ ...prev, phone: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!jordanPhone.test(form.phone)) { setFieldErrors(prev => ({ ...prev, phone: 'Must be a valid Jordanian number starting with 07' })); return }
    setLoading(true)
    const pin = Math.floor(100000 + Math.random() * 900000).toString()
    const { data, error } = await supabase.from('students').insert({
      full_name: form.full_name, phone: form.phone, university: form.university,
      study_year: form.study_year, pin_code: pin, pathway: form.pathway
    }).select().single()
    if (error) { setError(error.code === '23505' ? 'Phone number already registered' : 'An error occurred, please try again'); setLoading(false); return }
    setStudent(data)
    setLoading(false)
  }

  const Logos = () => (
    <div className="flex justify-center items-center gap-4 mb-4">
      <Image src="/logo1.jpg" alt="Logo 1" width={65} height={65} className="object-contain bg-white rounded-full p-1" />
      <Image src="/logo2.jpg" alt="Logo 2" width={85} height={85} className="object-contain bg-white rounded-full p-1" />
      <Image src="/logo3.jpg" alt="Logo 3" width={65} height={65} className="object-contain bg-white rounded-full p-1" />
    </div>
  )

  if (student) {
    return (
      <div className="w-full max-w-4xl">
        {/* Desktop: side by side | Mobile: stacked */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Left - QR */}
            <div className="sm:w-1/2 bg-gray-50 p-8 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-100">
              <Logos />
              <h1 className="text-2xl font-bold text-[#C41E3A] mb-1">Registration Successful!</h1>
              <p className="text-gray-500 text-sm mb-6">Keep this code to enter the event</p>
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
            <div className="sm:w-1/2 p-8 flex flex-col justify-center">
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">Student Information</h2>
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Name', value: student.full_name },
                  { label: 'Phone', value: student.phone },
                  { label: 'University', value: student.university },
                  { label: 'Year', value: student.study_year },
                  { label: 'Reg #', value: student.registration_number },
                  { label: 'PIN', value: student.pin_code },
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
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Left - Branding (Desktop only) */}
          <div className="hidden sm:flex sm:w-2/5 bg-gradient-to-b from-[#C41E3A] to-[#8B0000] p-10 flex-col items-center justify-center text-white">
            <Logos />
            <h1 className="text-3xl font-bold text-white text-center mt-2">مسارات طبيب</h1>
            <p className="text-red-200 text-sm mt-2 text-center">Medical Pathways</p>
            <div className="mt-8 text-center text-red-100 text-sm space-y-2">
              <p>🏥 Register now to attend</p>
              <p>📱 Get your QR Code instantly</p>
              <p>🎓 Open to all medical students</p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="sm:w-3/5 p-8">
            {/* Mobile Header */}
            <div className="sm:hidden text-center mb-6">
              <Logos />
              <h1 className="text-2xl font-bold text-[#C41E3A]">مسارات طبيب</h1>
              <p className="text-gray-500 text-sm mt-1">Medical Pathways</p>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-6 hidden sm:block">Event Registration</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" required placeholder="Mohammed El-Ajou"
                  className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${fieldErrors.full_name ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.full_name} onChange={e => handleTextChange('full_name', e.target.value)} />
                {fieldErrors.full_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" required placeholder="079..." maxLength={10}
                  className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${fieldErrors.phone ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.phone} onChange={e => handlePhoneChange(e.target.value)} />
                {fieldErrors.phone
                  ? <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
                  : <p className="text-gray-400 text-xs mt-1">Jordanian number only — format: 07XXXXXXXX</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <input type="text" required placeholder="Hashemite University"
                  className={`w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${fieldErrors.university ? 'border-red-400' : 'border-gray-300'}`}
                  value={form.university} onChange={e => handleTextChange('university', e.target.value)} />
                {fieldErrors.university && <p className="text-red-500 text-xs mt-1">{fieldErrors.university}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Study Year</label>
                <select required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]"
                  value={form.study_year} onChange={e => setForm({ ...form, study_year: e.target.value })}>
                  <option value="">Select Year</option>
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Fourth Year">Fourth Year</option>
                  <option value="Fifth Year">Fifth Year</option>
                  <option value="Sixth Year">Sixth Year</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interested Pathway</label>
                <select required className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]"
                  value={form.pathway} onChange={e => setForm({ ...form, pathway: e.target.value })}>
                  <option value="">Select Pathway</option>
                  <option value="Royal Medical Services">الخدمات الملكية - Royal Medical Services</option>
                  <option value="Jordan Ministry of Health">وزارة الصحة الأردنية - Jordan Ministry of Health</option>
                  <option value="University Hospitals">المستشفيات الجامعية - University Hospitals</option>
                  <option value="USA">أمريكا - USA</option>
                  <option value="Germany">ألمانيا - Germany</option>
                  <option value="Japan">اليابان - Japan</option>
                  <option value="Luxembourg">لوكسمبورغ - Luxembourg</option>
                  <option value="Australia">أستراليا - Australia</option>
                </select>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-[#C41E3A] text-white py-3 rounded-xl font-medium hover:bg-[#8B0000] transition disabled:opacity-50 text-base">
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}