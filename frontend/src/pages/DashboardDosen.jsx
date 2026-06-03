import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import AuthImage from '../components/AuthImage'

export default function DashboardDosen() {
  const { user } = useAuth()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [profile, setProfile] = useState(null)
  const [lamaran, setLamaran] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    api.get('/profile/me').then(res => {
      setProfile(res.data)
    }).catch(err => console.error("Gagal profile:", err)).finally(() => setLoading(false))

    api.get('/lamaran/all').then(res => {
      setLamaran(res.data)
    }).catch(err => console.error("Gagal lamaran:", err))
  }, [])



  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`

  const avatarUrl = profile?.foto_profile || user?.foto_profile || fallbackAvatarUrl

  const lamaranMenunggu = useMemo(() => 
    lamaran.filter(l => ['Menunggu', 'Menunggu Administrasi', 'Menunggu Validasi Akhir'].includes(l.status_lamaran)), 
    [lamaran]
  )

  const administrasiPerlu = useMemo(() => 
    lamaran.filter(l => l.status_lamaran === 'Menunggu Administrasi' || l.status_lamaran === 'Menunggu').length,
    [lamaran]
  )

  const administrasiTervalidasi = useMemo(() => 
    lamaran.filter(l => l.status_lamaran !== 'Menunggu Administrasi' && l.status_lamaran !== 'Menunggu').length,
    [lamaran]
  )

  const penerimaanPerlu = useMemo(() => 
    lamaran.filter(l => l.status_lamaran === 'Menunggu Validasi Akhir').length,
    [lamaran]
  )

  const penerimaanTervalidasi = useMemo(() => 
    lamaran.filter(l => 
      ['Diterima', 'Selesai'].includes(l.status_lamaran) || 
      (l.status_lamaran === 'Ditolak' && l.bukti_penerimaan_path)
    ).length,
    [lamaran]
  )

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Desktop View: Combined Welcome & Clock */}
        <div className="hidden sm:flex bg-[#0f1626] rounded-xl p-6 justify-between items-center border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 flex-shrink-0 aspect-square relative">
              {avatarUrl ? (
                <AuthImage src={avatarUrl} fallbackSrc={fallbackAvatarUrl} alt="Profile" className="w-full h-full object-cover aspect-square" />
              ) : (
                <div className="w-full h-full bg-gray-600 animate-pulse aspect-square"></div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Dosen Panel</h2>
              <p className="text-sm text-gray-400">Selamat datang kembali, {profile?.full_name || user?.full_name || 'Dosen'}</p>
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
            <div className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 flex-shrink-0 aspect-square relative">
              {avatarUrl ? (
                <AuthImage src={avatarUrl} fallbackSrc={fallbackAvatarUrl} alt="Profile" className="w-full h-full object-cover aspect-square" />
              ) : (
                <div className="w-full h-full bg-gray-600 animate-pulse aspect-square"></div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">Selamat Datang,</h2>
              <p className="text-sm text-gray-300 truncate">{profile?.full_name || user?.full_name || 'Dosen'}</p>
              <p className="text-xs text-gray-500">Dosen Pembimbing</p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-[#0f1626] rounded-xl py-6 px-6 border border-gray-800 shadow-lg flex flex-col justify-between">
            <p className="text-sm text-gray-400 font-semibold mb-4 border-b border-gray-800 pb-2 text-center">Administrasi</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Perlu Validasi</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{administrasiPerlu}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Tervalidasi</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{administrasiTervalidasi}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0f1626] rounded-xl py-6 px-6 border border-gray-800 shadow-lg flex flex-col justify-between">
            <p className="text-sm text-gray-400 font-semibold mb-4 border-b border-gray-800 pb-2 text-center">Penerimaan Akhir</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Perlu Validasi</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">{penerimaanPerlu}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Tervalidasi</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{penerimaanTervalidasi}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Menunggu Validasi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0f1626] rounded-xl p-4 sm:p-6 border border-gray-800 shadow-lg">
              <div className="flex justify-between items-center mb-4 sm:mb-5">
                <h3 className="text-yellow-400 font-semibold text-sm sm:text-lg flex items-center gap-2">
                  Menunggu Validasi
                  {lamaranMenunggu.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full">{lamaranMenunggu.length}</span>
                  )}
                </h3>
                <Link to="/dosen/lamaran" className="text-[10px] sm:text-xs text-gray-400 hover:text-white transition">Lihat Semua</Link>
              </div>
              
              <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {lamaranMenunggu.length > 0 ? (
                  lamaranMenunggu.slice(0, 5).map((item) => (
                    <div key={item.id} className="border border-gray-700/60 rounded-lg p-3 sm:p-5 flex items-start gap-3 sm:gap-4 hover:border-gray-500 transition">
                      <div className="mt-1 hidden sm:block">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1 sm:gap-2 mb-1 sm:mb-0">
                          <h4 className="text-white font-medium text-sm sm:text-base truncate">{item.full_name}</h4>
                          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full bg-blue-900/50 text-blue-300 w-max">
                            Lamaran Magang
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 mb-2 sm:mb-3 truncate">{item.nim} &middot; {item.perusahaan}</p>
                        <p className="text-[10px] sm:text-xs text-gray-300 mb-2 sm:mb-3 truncate"><span className="font-semibold text-gray-400">Posisi:</span> {item.posisi_lamaran}</p>
                        <Link to="/dosen/lamaran" className="text-[10px] sm:text-xs font-medium text-yellow-400 hover:text-yellow-300 border border-yellow-400/50 hover:border-yellow-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded transition inline-block">
                          Review Lamaran
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs sm:text-sm">
                    Tidak ada lamaran yang menunggu validasi saat ini.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info Card */}
          <div className="space-y-6">
            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-yellow-400 font-semibold text-lg">Informasi Akun</h3>
                <Link to="/dosen/profile" className="text-xs text-gray-400 hover:text-white transition">Edit</Link>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Nama Lengkap</span>
                  <span className="text-white font-medium text-right">{profile?.full_name || '–'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">NIP</span>
                  <span className="text-white font-medium text-right">{profile?.nip || profile?.username || '–'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white font-medium text-right">{profile?.email || '–'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-400">Hak Akses</span>
                  <span className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider text-right">Dosen Pembimbing</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
  )
}
