import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import ProfileMenu from '../components/ProfileMenu'

export default function DashboardAdmin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState({ users: 0, lowongan: 0, lamaran: 0, pengumuman: 0 })
  const [recentLowongan, setRecentLowongan] = useState([])
  const [pengumumanList, setPengumumanList] = useState([])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    
    const fetchData = async () => {
      try {
        const [resUsers, resLowongan, resPengumuman] = await Promise.all([
          api.get('/users/'),
          api.get('/lowongan/'),
          api.get('/pengumuman/')
        ])
        
        setStats({
          users: resUsers.data.length,
          lowongan: resLowongan.data.length,
          lamaran: 0, // Mock for now until we have an endpoint for all lamaran across the system
          pengumuman: resPengumuman.data.length
        })
        
        // Take the last 3 lowongan for "Aktivitas Lowongan Terakhir"
        setRecentLowongan(resLowongan.data.slice(-3).reverse())
        setPengumumanList(resPengumuman.data)
      } catch (err) {
        console.error("Gagal mengambil data dashboard admin:", err)
      }
    }
    fetchData()
    
    return () => clearInterval(timer)
  }, [])

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
              <li><Link to="/admin/dashboard" className="text-yellow-400">Beranda</Link></li>
              <li><Link to="/admin/users" className="text-gray-300 hover:text-white transition">Kelola Pengguna</Link></li>
              <li><Link to="/admin/lowongan" className="text-gray-300 hover:text-white transition">Lowongan Magang</Link></li>
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
        
        <div className="bg-[#0f1626] rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border border-gray-800 shadow-lg gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600">
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white">Administrator Panel</h2>
              <p className="text-sm text-gray-400">Selamat datang kembali, {user?.full_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-300">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-3xl font-bold text-yellow-400">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Total Pengguna</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.users}</p>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Lowongan Aktif</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.lowongan}</p>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Lamaran Masuk</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.lamaran}</p>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-500 rounded-bl-full opacity-10 z-0"></div>
            <p className="text-xs sm:text-sm text-gray-400 mb-2 relative z-10">Total Pengumuman</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.pengumuman}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-yellow-400 font-semibold text-lg mb-4">Pengumuman Terbaru</h3>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {pengumumanList.length > 0 ? pengumumanList.map(p => (
                  <div key={p.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-white font-medium text-base">{p.judul}</h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{new Date(p.tanggal_dibuat).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2 leading-relaxed">{p.isi}</p>
                    <p className="text-xs text-yellow-500/80">Oleh: {p.penulis}</p>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400">Belum ada pengumuman terkini</p>
                )}
              </div>
              <div className="mt-4 text-right">
                <button className="text-xs font-medium text-yellow-400 hover:text-yellow-300">Tambah Pengumuman Baru &rarr;</button>
              </div>
            </div>

            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-yellow-400 font-semibold text-lg">Aktivitas Lowongan Terakhir</h3>
                <Link to="/admin/lowongan" className="text-xs text-gray-400 hover:text-white transition">Lihat Semua</Link>
              </div>
              
              <div className="space-y-4">
                {recentLowongan.length > 0 ? recentLowongan.map(l => (
                  <div key={l.id} className="border border-gray-700/60 rounded-lg p-5 flex items-start gap-4 hover:border-gray-500 transition">
                    <div className="mt-1">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <h4 className="text-white font-medium text-base">{l.perusahaan} membuka lowongan</h4>
                        <span className="text-xs text-gray-500">Baru Saja</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 mb-3">{l.posisi} - {l.lokasi}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400">Tidak ada data lowongan terkini.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            
            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-yellow-400 font-semibold text-lg mb-6">Informasi Akun</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Nama</span>
                  <span className="text-white font-medium text-right">{user?.full_name || '–'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">NIP</span>
                  <span className="text-white font-medium text-right">{user?.nip || '–'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white font-medium text-right">{user?.email || '–'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-400">Hak Akses</span>
                  <span className="text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider text-right">Administrator</span>
                </div>
              </div>
            </div>

            </div>
        </div>
      </main>
    </div>
  )
}
