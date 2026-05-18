import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

function formatTanggalDatabase(tanggal) {
  if (!tanggal) return 'Tanggal belum tersedia'

  const [tahun, bulan, hari] = String(tanggal).split('-')
  const namaBulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  const indeksBulan = Number(bulan) - 1
  if (!tahun || !bulan || !hari || indeksBulan < 0 || indeksBulan > 11) {
    return tanggal
  }

  return `${Number(hari)} ${namaBulan[indeksBulan]} ${tahun}`
}

export default function LowonganMahasiswa() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [lowonganList, setLowonganList] = useState([])
  const [lamaranList, setLamaranList] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLowongan, resLamaran] = await Promise.all([
          api.get('/lowongan/'),
          api.get('/lamaran/')
        ])
        setLowonganList(resLowongan.data)
        setLamaranList(resLamaran.data)
      } catch (err) {
        console.error("Gagal mendapatkan data:", err)
      }
    }
    fetchData()
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
          <div className="flex items-center gap-3">
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
          </div>

          <div className="flex items-center gap-8">
            <ul className="hidden md:flex gap-8 font-medium text-sm">
              <li><Link to="/mahasiswa/dashboard" className="text-gray-300 hover:text-white transition">Beranda</Link></li>
              <li><Link to="/mahasiswa/lowongan" className="text-yellow-400">Lowongan Magang</Link></li>
              <li><Link to="/mahasiswa/lamaran" className="text-gray-300 hover:text-white transition">Status Lamaran</Link></li>
            </ul>

            <div className="flex items-center gap-5">
              <button className="text-gray-400 hover:text-white transition relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="w-9 h-9 rounded-full bg-gray-600 overflow-hidden border border-gray-500 cursor-pointer" onClick={handleLogout} title="Klik untuk logout">
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-6">Lowongan Terbuka</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {lowonganList.length > 0 ? lowonganList.map((l) => (
              <div key={l.id} className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
                <h3 className="text-white font-semibold text-lg">{l.perusahaan}</h3>
                <p className="text-sm text-gray-400 mt-1">{l.posisi}, {l.lokasi}</p>
                <Link to={`/mahasiswa/lowongan/detail/${l.id}`} className="inline-block mt-2 text-xs font-medium text-yellow-400 hover:text-yellow-300 transition">Lihat Detail Lebih Lanjut</Link>
                
                <hr className="border-gray-800 my-4" />
                
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ditutup Pada:</p>
                  <p className="text-sm font-semibold text-yellow-400">{formatTanggalDatabase(l.tanggal_tutup)}</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-400 text-sm">Tidak ada lowongan tersedia saar ini.</p>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-yellow-400 font-semibold text-lg mb-6">Status Lamaran Terbaru</h3>
              
              <div className="space-y-4">
                {lamaranList.length > 0 ? lamaranList.map((lamaran) => (
                  <div key={lamaran.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm text-gray-300 font-medium">{lamaran.status_lamaran}</p>
                    <p className="text-xs text-gray-500 mt-1">{lamaran.perusahaan} - {lamaran.posisi}</p>
                  </div>
                )) : (
                  <p className="text-gray-400 text-sm">Belum ada riwayat lamaran.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
