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
      QRCode.toCanvas(canvasRef.current, student.id, { width: 250, margin: 2, color: { dark: '#8B0000', light: '#ffffff' } })
      QRCode.toDataURL(student.id, { width: 250 }).then(setQrUrl)
    }
  }, [student])

  const handleTextChange = (field: 'full_name' | 'university', value: string) => {
    if (!englishOnly.test(value)) {
      setFieldErrors(prev => ({ ...prev, [field]: 'English characters only' }))
      return
    }
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePhoneChange = (value: string) => {
    if (value.includes('+')) {
      setFieldErrors(prev => ({ ...prev, phone: 'Phone number must not include +' }))
      return
    }
    if (!/^\d*$/.test(value)) {
      setFieldErrors(prev => ({ ...prev, phone: 'Numbers only' }))
      return
    }
    setFieldErrors(prev => ({ ...prev, phone: '' }))
    setForm(prev => ({ ...prev, phone: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!jordanPhone.test(form.phone)) {
      setFieldErrors(prev => ({ ...prev, phone: 'Must be a valid Jordanian number starting with 07' }))
      return
    }

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

  if (student) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Image src="/logo1.jpg" alt="Logo 1" width={60} height={60} className="object-contain mix-blend-multiply" />
          <Image src="/logo2.jpg" alt="Logo 2" width={80} height={80} className="object-contain mix-blend-multiply" />
          <Image src="/logo3.jpg" alt="Logo 3" width={60} height={60} className="object-contain mix-blend-multiply" />
        </div>
        <h1 className="text-2xl font-bold text-[#C41E3A] mb-2">Registration Successful!</h1>
        <p className="text-gray-500 mb-6">Keep this code to enter the event</p>
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
    )
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Image src="/logo1.jpg" alt="Logo 1" width={60} height={60} className="object-contain mix-blend-multiply" />
          <Image src="/logo2.jpg" alt="Logo 2" width={80} height={80} className="object-contain mix-blend-multiply" />
          <Image src="/logo3.jpg" alt="Logo 3" width={60} height={60} className="object-contain mix-blend-multiply" />
        </div>
        <h1 className="text-2xl font-bold text-[#C41E3A]">مسارات طبيب</h1>
        <p className="text-gray-500 text-sm mt-1">Medical Pathways</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text" required
            placeholder="Mohammed El-Ajou"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${fieldErrors.full_name ? 'border-red-400' : 'border-gray-300'}`}
            value={form.full_name}
            onChange={e => handleTextChange('full_name', e.target.value)}
          />
          {fieldErrors.full_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel" required
            placeholder="079..."
            maxLength={10}
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${fieldErrors.phone ? 'border-red-400' : 'border-gray-300'}`}
            value={form.phone}
            onChange={e => handlePhoneChange(e.target.value)}
          />
          {fieldErrors.phone
            ? <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>
            : <p className="text-gray-400 text-xs mt-1">Jordanian number only — format: 07XXXXXXXX</p>
          }
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
          <input
            type="text" required
            placeholder="Hashemite University"
            className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C41E3A] ${fieldErrors.university ? 'border-red-400' : 'border-gray-300'}`}
            value={form.university}
            onChange={e => handleTextChange('university', e.target.value)}
          />
          {fieldErrors.university && <p className="text-red-500 text-xs mt-1">{fieldErrors.university}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Study Year</label>
          <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]" value={form.study_year} onChange={e => setForm({ ...form, study_year: e.target.value })}>
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
          <select required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C41E3A]" value={form.pathway} onChange={e => setForm({ ...form, pathway: e.target.value })}>
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
        <button type="submit" disabled={loading} className="w-full bg-[#C41E3A] text-white py-2 rounded-lg font-medium hover:bg-[#8B0000] transition disabled:opacity-50">
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}