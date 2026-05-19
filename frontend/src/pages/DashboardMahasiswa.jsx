import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import ProfileMenu from '../components/ProfileMenu'

export default function DashboardMahasiswa() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [lowonganList, setLowonganList] = useState([])
  const [lamaranList, setLamaranList] = useState([])
  const [pengumumanList, setPengumumanList] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLowongan, resLamaran, resPengumuman] = await Promise.all([
          api.get('/lowongan/'),
          api.get('/lamaran/'),
          api.get('/pengumuman/')
        ])
        setLowonganList(resLowongan.data)
        setLamaranList(resLamaran.data)
        setPengumumanList(resPengumuman.data)
      } catch (err) {
        console.error("Gagal mendapatkan data:", err)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
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
          <Link to="/mahasiswa/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
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
              <li><Link to="/mahasiswa/dashboard" className="text-yellow-400">Beranda</Link></li>
              <li><Link to="/mahasiswa/lowongan" className="text-gray-300 hover:text-white transition">Lowongan Magang</Link></li>
              <li><Link to="/mahasiswa/lamaran" className="text-gray-300 hover:text-white transition">Status Lamaran</Link></li>
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
              <h2 className="text-lg sm:text-xl font-semibold text-white">Selamat Datang, {user?.full_name} {user?.nim ? `- ${user.nim}` : ''}</h2>
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
            </div>

            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-yellow-400 font-semibold text-lg mb-3">Highlight Lowongan:</h3>
              <h4 className="text-white font-medium mb-4">{lowonganList.length > 0 ? lowonganList[0].perusahaan : 'Belum Ada Data'}</h4>
              
              <div className="w-full h-64 bg-gray-800 rounded-lg overflow-hidden mb-3">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop" alt="Meeting" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition" />
              </div>
              
              <div className="text-right">
                <Link to="/mahasiswa/lowongan" className="text-xs text-gray-400 hover:text-yellow-400 transition">Lihat detail Lowongan</Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-yellow-400 font-semibold text-lg mb-6">Status Lamaran</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Nama</span>
                  <span className="text-white font-medium text-right">{user?.full_name || '–'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">NIM</span>
                  <span className="text-white font-medium text-right">{user?.nim || '–'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white font-medium text-right">{user?.email || '–'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Jumlah Lamaran</span>
                  <span className="text-white font-medium text-right">{lamaranList.length}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">CV</span>
                  <Link to="#" className="text-yellow-400 hover:text-yellow-300 font-medium text-right">Lihat Disini</Link>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Transkrip Nilai</span>
                  <Link to="#" className="text-yellow-400 hover:text-yellow-300 font-medium text-right">Lihat Disini</Link>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-400">Lamaran Yang Diajukan</span>
                  <Link to="/mahasiswa/lamaran" className="text-yellow-400 hover:text-yellow-300 font-medium text-right">Lihat Disini</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Lowongan Tersedia</p>
            <p className="text-3xl font-bold text-yellow-400">{lowonganList.length}</p>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Lowongan Diajukan</p>
            <p className="text-3xl font-bold text-yellow-400">{lamaranList.length}</p>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Lowongan Diterima</p>
            <p className="text-3xl font-bold text-yellow-400">{lamaranList.filter(l => l.status_lamaran === 'Diterima').length}</p>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Lowongan Ditolak</p>
            <p className="text-3xl font-bold text-yellow-400">{lamaranList.filter(l => l.status_lamaran === 'Ditolak').length}</p>
          </div>
        </div>

        <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-yellow-400 font-semibold text-lg">Lowongan Terbuka</h3>
            <Link to="/mahasiswa/lowongan" className="text-xs text-gray-400 hover:text-white transition">Lihat Semua</Link>
          </div>
          
          <div className="space-y-4">
            {lowonganList.length > 0 ? lowonganList.slice(0, 3).map((l) => (
              <div key={l.id} className="border border-gray-700/60 rounded-lg p-5 flex items-start gap-4 hover:border-gray-500 transition">
                <div className="mt-1">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2"></circle></svg>
                </div>
                <div className="flex-grow">
                  <h4 className="text-white font-medium text-base">{l.perusahaan}</h4>
                  <p className="text-xs text-gray-400 mt-1 mb-3">{l.posisi} - {l.lokasi}</p>
                  <Link to={`/mahasiswa/lowongan/detail/${l.id}`} className="text-xs font-medium text-yellow-400 hover:text-yellow-300">Lihat detail Lowongan</Link>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-400">Belum ada lowongan.</p>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
