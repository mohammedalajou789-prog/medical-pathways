'use client'

export const dynamic = 'force-dynamic'


import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, entered: 0, not_entered: 0 })
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [regOpen, setRegOpen] = useState(true)
  const [admins, setAdmins] = useState<any[]>([])
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', full_name: '' })
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'students' | 'admins'>('students')
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
useEffect(() => {
  const checkRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    const { data: admin } = await supabase.from('admins').select('role').eq('id', user.id).single()
    if (!admin || admin.role !== 'super_admin') { router.push('/admin/scanner') }
  }
  checkRole()
}, [])
  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: studentsData } = await supabase.from('students').select('*').order('created_at', { ascending: false })
    const { data: settings } = await supabase.from('event_settings').select('*').single()
    const { data: adminsData } = await supabase.from('admins').select('*').order('created_at', { ascending: false })
    if (studentsData) {
      setStudents(studentsData)
      setStats({
        total: studentsData.length,
        entered: studentsData.filter(s => s.status === 'ENTERED').length,
        not_entered: studentsData.filter(s => s.status === 'NOT_ENTERED').length
      })
    }
    if (settings) setRegOpen(settings.registration_open)
    if (adminsData) setAdmins(adminsData.filter(a => a.role === 'admin'))
  }

  const toggleRegistration = async () => {
    const { data } = await supabase.from('event_settings').select('id').single()
    await supabase.from('event_settings').update({ registration_open: !regOpen }).eq('id', data?.id)
    setRegOpen(!regOpen)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    await supabase.from('students').delete().eq('id', id)
    fetchData()
  }

  const handleResetEntry = async (id: string) => {
    if (!confirm('Reset entry status for this student?')) return
    await supabase.from('students').update({ status: 'NOT_ENTERED', entry_time: null }).eq('id', id)
    fetchData()
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError('')
    setAdminSuccess('')

    const res = await fetch('/api/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdmin)
    })

    const result = await res.json()

    if (!res.ok) {
      setAdminError(result.error || 'Failed to create admin')
      return
    }

    setAdminSuccess('Admin created successfully!')
    setNewAdmin({ email: '', password: '', full_name: '' })
    fetchData()
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Delete this admin?')) return
    await supabase.from('admins').delete().eq('id', id)
    fetchData()
  }

  const exportPDF = () => {
    const entered = students.filter(s => s.status === 'ENTERED')
    const rows = entered.map(s => `
      <tr>
        <td>${s.registration_number}</td>
        <td>${s.full_name}</td>
        <td>${s.phone}</td>
        <td>${s.university}</td>
        <td>${s.study_year}</td>
        <td>${s.entry_time ? new Date(s.entry_time).toLocaleTimeString() : '-'}</td>
      </tr>
    `).join('')
    const html = `
      <html><head><title>Attendance Report</title>
      <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#C41E3A;color:white}h1{color:#C41E3A}</style>
      </head><body>
      <h1>Medical Pathways - Attendance Report</h1>
      <p>Total Entered: ${entered.length} / ${students.length}</p>
      <table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>University</th><th>Year</th><th>Entry Time</th></tr></thead>
      <tbody>${rows}</tbody></table>
      </body></html>
    `
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close(); win.print() }
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Image src="/logo2.jpg" alt="Logo" width={40} height={40} className="object-contain mix-blend-multiply" />
          <div>
            <h1 className="text-base font-bold text-[#C41E3A] leading-tight">Medical Pathways</h1>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/admin/scanner')} className="bg-[#C41E3A] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#8B0000] transition">
            QR Scanner
          </button>
          <button onClick={handleLogout} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
            Logout
          </button>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <p className="text-gray-400 text-xs mb-1">Total</p>
            <p className="text-2xl font-bold text-[#C41E3A]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <p className="text-gray-400 text-xs mb-1">Entered</p>
            <p className="text-2xl font-bold text-green-600">{stats.entered}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow text-center">
            <p className="text-gray-400 text-xs mb-1">Outside</p>
            <p className="text-2xl font-bold text-gray-400">{stats.not_entered}</p>
          </div>
        </div>

        {/* Registration Toggle */}
        <div className="bg-white rounded-xl p-4 shadow mb-4 flex justify-between items-center">
          <div>
            <p className="font-medium text-sm">Registration</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${regOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {regOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <button onClick={toggleRegistration} className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition ${regOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
            {regOpen ? 'Close' : 'Open'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('students')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'students' ? 'bg-[#C41E3A] text-white' : 'bg-white text-gray-600 shadow'}`}>
            Students ({students.length})
          </button>
          <button onClick={() => setActiveTab('admins')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'admins' ? 'bg-[#C41E3A] text-white' : 'bg-white text-gray-600 shadow'}`}>
            Admins ({admins.length})
          </button>
        </div>

        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center">
              <h2 className="font-bold text-base">Registered Students</h2>
              <div className="flex gap-2">
                <input type="text" placeholder="Search..." className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]" value={search} onChange={e => setSearch(e.target.value)} />
                <button onClick={exportPDF} className="bg-[#C41E3A] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#8B0000] transition whitespace-nowrap">
                  PDF
                </button>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="block sm:hidden space-y-3">
              {filtered.map(s => (
                <div key={s.id} className="border rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{s.full_name}</p>
                      <p className="text-gray-400 text-xs">{s.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'ENTERED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status === 'ENTERED' ? 'Entered' : 'Outside'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium">University:</span> {s.university}</p>
                    <p><span className="font-medium">Year:</span> {s.study_year}</p>
                    <p><span className="font-medium">Pathway:</span> {s.pathway || '-'}</p>
                    <p><span className="font-medium">PIN:</span> <span className="font-mono">{s.pin_code}</span></p>
                    {s.entry_time && <p><span className="font-medium">Entry:</span> {new Date(s.entry_time).toLocaleTimeString()}</p>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {s.status === 'ENTERED' && (
                      <button onClick={() => handleResetEntry(s.id)} className="flex-1 bg-yellow-100 text-yellow-700 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-200">
                        Reset Entry
                      </button>
                    )}
                    <button onClick={() => handleDeleteStudent(s.id)} className="flex-1 bg-red-100 text-red-700 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">University</th>
                    <th className="p-3 text-left">Year</th>
                    <th className="p-3 text-left">Pathway</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Entry Time</th>
                    <th className="p-3 text-left">PIN</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">{s.registration_number}</td>
                      <td className="p-3">{s.full_name}</td>
                      <td className="p-3">{s.phone}</td>
                      <td className="p-3">{s.university}</td>
                      <td className="p-3">{s.study_year}</td>
                      <td className="p-3">{s.pathway || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'ENTERED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.status === 'ENTERED' ? 'Entered' : 'Not Entered'}
                        </span>
                      </td>
                      <td className="p-3">{s.entry_time ? new Date(s.entry_time).toLocaleTimeString() : '-'}</td>
                      <td className="p-3 font-mono">{s.pin_code}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {s.status === 'ENTERED' && (
                            <button onClick={() => handleResetEntry(s.id)} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs hover:bg-yellow-200">
                              Reset
                            </button>
                          )}
                          <button onClick={() => handleDeleteStudent(s.id)} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-bold text-base mb-4">Create New Admin</h2>
              <form onSubmit={handleCreateAdmin} className="space-y-3">
                <input type="text" required placeholder="Full Name" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]" value={newAdmin.full_name} onChange={e => setNewAdmin({ ...newAdmin, full_name: e.target.value })} />
                <input type="email" required placeholder="Email" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                <input type="password" required placeholder="Password" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                {adminError && <p className="text-red-500 text-sm">{adminError}</p>}
                {adminSuccess && <p className="text-green-600 text-sm">{adminSuccess}</p>}
                <button type="submit" className="w-full bg-[#C41E3A] text-white py-2 rounded-lg font-medium hover:bg-[#8B0000] transition">
                  Create Admin
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-bold text-base mb-4">Admins List</h2>
              <div className="space-y-3">
                {admins.map(a => (
                  <div key={a.id} className="flex justify-between items-center border rounded-xl p-3">
                    <div>
                      <p className="font-medium text-sm">{a.full_name}</p>
                      <p className="text-gray-400 text-xs">{a.email}</p>
                    </div>
                    <button onClick={() => handleDeleteAdmin(a.id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200">
                      Delete
                    </button>
                  </div>
                ))}
                {admins.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No admins yet</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
