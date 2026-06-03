import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api, { openSecureFile } from '../services/api'
import AuthImage from '../components/AuthImage'

export default function DashboardMahasiswa() {
  const { user } = useAuth()

  const [lowonganList, setLowonganList] = useState([])
  const [totalLowongan, setTotalLowongan] = useState(0)
  const [lamaranList, setLamaranList] = useState([])
  const [pengumumanList, setPengumumanList] = useState([])
  const [profile, setProfile] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    api.get('/lowongan/stats/summary').then(res => {
      setTotalLowongan(res.data.total)
      setLowonganList(res.data.recent)
    }).catch(err => console.error(err))
    api.get('/lamaran/').then(res => setLamaranList(res.data)).catch(err => console.error(err))
    api.get('/pengumuman/').then(res => setPengumumanList(res.data)).catch(err => console.error(err))
    api.get('/profile/me').then(res => setProfile(res.data)).catch(err => console.error(err))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
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
              <h2 className="text-xl font-semibold text-white">Selamat Datang, {user?.full_name} {user?.nim ? `- ${user.nim}` : ''}</h2>
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
              <h2 className="text-sm font-semibold text-white">Selamat Datang,</h2>
              <p className="text-lg text-gray-300 truncate">{user?.full_name}</p>
              {user?.nim && <p className="text-sm text-gray-500">{user.nim}</p>}
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
                <Link to={lowonganList.length > 0 ? `/mahasiswa/lowongan/detail/${lowonganList[0].id}` : '/mahasiswa/lowongan'} className="text-xs text-gray-400 hover:text-yellow-400 transition">Lihat detail Lowongan</Link>
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
                  {profile?.cv_path ? (
                    <button onClick={() => openSecureFile(profile.cv_path)} className="text-yellow-400 hover:text-yellow-300 font-medium text-right">Lihat Disini</button>
                  ) : (
                    <span className="text-gray-500 font-medium text-right">Belum Unggah</span>
                  )}
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-400">Transkrip Nilai</span>
                  {profile?.transkrip_path ? (
                    <button onClick={() => openSecureFile(profile.transkrip_path)} className="text-yellow-400 hover:text-yellow-300 font-medium text-right">Lihat Disini</button>
                  ) : (
                    <span className="text-gray-500 font-medium text-right">Belum Unggah</span>
                  )}
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
            <p className="text-3xl font-bold text-yellow-400">{totalLowongan}</p>
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
  )
}
