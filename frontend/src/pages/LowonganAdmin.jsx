import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import ProfileMenu from '../components/ProfileMenu'

export default function LowonganAdmin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [lowonganList, setLowonganList] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    perusahaan: '', posisi: '', lokasi: '', deskripsi: '', tanggal_tutup: '', status_aktif: true
  })

  useEffect(() => {
    fetchLowongan()
  }, [])

  const fetchLowongan = async () => {
    try {
      const response = await api.get('/lowongan/')
      setLowonganList(response.data)
    } catch (err) {
      console.error("Gagal mendapatkan data lowongan:", err)
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm({ perusahaan: '', posisi: '', lokasi: '', deskripsi: '', tanggal_tutup: '', status_aktif: true })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (lowongan) => {
    setEditingId(lowongan.id)
    setForm({
      perusahaan: lowongan.perusahaan,
      posisi: lowongan.posisi,
      lokasi: lowongan.lokasi,
      deskripsi: lowongan.deskripsi,
      tanggal_tutup: lowongan.tanggal_tutup,
      status_aktif: lowongan.status_aktif === 1 || lowongan.status_aktif === true
    })
    setIsModalOpen(true)
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(prev => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/lowongan/${editingId}`, form)
        alert('Lowongan berhasil diperbarui.')
      } else {
        await api.post('/lowongan/', form)
        alert('Lowongan berhasil ditambahkan.')
      }
      setIsModalOpen(false)
      fetchLowongan()
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan lowongan.')
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const avatarUrl = user?.full_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`
    : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'

  return (
    <div className="font-['Poppins'] bg-[#1e2638] text-white min-h-screen flex flex-col antialiased">
      <nav className="bg-[#0f1626] border-b border-gray-800 px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/admin/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-blue-900 rounded-full border border-gray-600 flex items-center justify-center overflow-hidden">
              <img 
                src="/Institut_Pertanian_Bogor_logo.png" 
                alt="Logo IPB" 
                className="w-[100%] h-[100%] object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              <span className="text-yellow-400">AgriCareer</span><span className="text-white">-Tracker</span>
            </h1>
          </Link>

          <div className="flex items-center gap-8">
            <ul className="hidden md:flex gap-8 font-medium text-sm">
              <li><Link to="/admin/dashboard" className="text-gray-300 hover:text-white transition">Beranda</Link></li>
              <li><Link to="/admin/users" className="text-gray-300 hover:text-white transition">Kelola Pengguna</Link></li>
              <li><Link to="/admin/lowongan" className="text-yellow-400">Lowongan Magang</Link></li>
            </ul>

            <div className="flex items-center gap-5">
              <button className="text-gray-400 hover:text-white transition relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-[#0f1626] bg-red-500"></span>
              </button>
              <ProfileMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Kelola Lowongan</h2>
              <p className="text-sm text-gray-400">Buat, ubah, dan hapus penawaran magang</p>
            </div>
            
            <button 
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-5 py-2.5 rounded-lg font-semibold transition shadow-md hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Tambah Lowongan Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Perusahaan</th>
                  <th className="py-3 px-4 font-medium">Posisi</th>
                  <th className="py-3 px-4 font-medium">Tenggat Waktu</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {lowonganList.length > 0 ? lowonganList.map((lowongan) => (
                  <tr key={lowongan.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-4 px-4 font-medium text-white">{lowongan.perusahaan}</td>
                    <td className="py-4 px-4 text-gray-400">{lowongan.posisi}</td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(lowongan.tanggal_tutup).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <span className={lowongan.status_aktif ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                        {lowongan.status_aktif ? "Aktif" : "Tutup"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(lowongan)}
                        className="text-yellow-400 hover:text-yellow-300 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">Memuat data lowongan...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-[#1e2638] rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#0f1626]">
              <h3 className="text-xl font-bold text-yellow-400">{editingId ? 'Edit Lowongan' : 'Tambah Lowongan Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Perusahaan</label>
                <input required type="text" name="perusahaan" value={form.perusahaan} onChange={handleChange} className="w-full bg-[#0f1626] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Posisi</label>
                <input required type="text" name="posisi" value={form.posisi} onChange={handleChange} className="w-full bg-[#0f1626] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lokasi</label>
                <input required type="text" name="lokasi" value={form.lokasi} onChange={handleChange} className="w-full bg-[#0f1626] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi</label>
                <textarea required name="deskripsi" value={form.deskripsi} onChange={handleChange} rows="3" className="w-full bg-[#0f1626] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition"></textarea>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tenggat Waktu</label>
                  <input required type="date" name="tanggal_tutup" value={form.tanggal_tutup} onChange={handleChange} className="w-full bg-[#0f1626] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition [color-scheme:dark]" />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-300">
                    <input type="checkbox" name="status_aktif" checked={form.status_aktif} onChange={handleChange} className="w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-[#0f1626]" />
                    Status Aktif
                  </label>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-400 text-gray-900 transition shadow">{editingId ? 'Simpan Perubahan' : 'Tambah Lowongan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}