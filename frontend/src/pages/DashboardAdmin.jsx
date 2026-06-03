import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import AuthImage from '../components/AuthImage'

export default function DashboardAdmin() {
  const { user } = useAuth()
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState({ users: 0, lowongan: 0, lowonganAktif: 0, pengumuman: 0 })
  const [recentLowongan, setRecentLowongan] = useState([])
  const [pengumumanList, setPengumumanList] = useState([])
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    
    api.get('/profile/me').then(res => {
      setProfile(res.data)
    }).catch(err => console.error("Gagal load profile:", err))
    
    api.get('/users/').then(res => {
      setStats(prev => ({ ...prev, users: res.data.length }))
    }).catch(err => console.error(err))

    api.get('/lowongan/stats/summary').then(res => {
      setStats(prev => ({
        ...prev,
        lowongan: res.data.total,
        lowonganAktif: res.data.aktif
      }))
      setRecentLowongan(res.data.recent)
    }).catch(err => console.error(err))

    api.get('/pengumuman/').then(res => {
      setStats(prev => ({ ...prev, pengumuman: res.data.length }))
      setPengumumanList(res.data)
    }).catch(err => console.error(err))
    
    return () => clearInterval(timer)
  }, [])

  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`
    
  const avatarUrl = profile?.foto_profile || user?.foto_profile || fallbackAvatarUrl

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Desktop View: Combined Welcome & Clock */}
        <div className="hidden sm:flex bg-[#0f1626] rounded-xl p-6 justify-between items-center border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 flex-shrink-0 aspect-square">
              <AuthImage src={avatarUrl} fallbackSrc={fallbackAvatarUrl} alt="Profile" className="w-full h-full object-cover aspect-square" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Administrator Panel</h2>
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

        {/* Mobile View: Welcome & Clock Separated */}
        <div className="sm:hidden space-y-4">
          {/* Welcome Card */}
          <div className="bg-[#0f1626] rounded-xl p-5 flex items-center gap-4 border border-gray-800 shadow-lg">
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 flex-shrink-0 aspect-square">
              <AuthImage src={avatarUrl} fallbackSrc={fallbackAvatarUrl} alt="Profile" className="w-full h-full object-cover aspect-square" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">Selamat Datang,</h2>
              <p className="text-sm text-gray-300 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          
          {/* Clock Card */}
          <div className="bg-[#0f1626] rounded-xl p-5 border border-gray-800 shadow-lg flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-gray-300">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-3xl font-bold text-yellow-400 mt-1">
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
            <p className="text-3xl font-bold text-yellow-400">{stats.lowonganAktif}</p>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-4 text-center border border-gray-800 shadow-lg">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Total Lowongan</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.lowongan}</p>
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
                <Link to="/admin/pengumuman" className="text-xs font-medium text-yellow-400 hover:text-yellow-300">Tambah Pengumuman Baru &rarr;</Link>
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
  )
}
