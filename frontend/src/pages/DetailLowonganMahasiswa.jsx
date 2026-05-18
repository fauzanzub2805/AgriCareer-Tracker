import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

function formatTanggalDatabase(tanggal) {
  if (!tanggal) return 'Tanggal belum tersedia'

  const [tahun, bulan, hari] = String(tanggal).split('-')
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const indeksBulan = Number(bulan) - 1
  if (!tahun || !bulan || !hari || indeksBulan < 0 || indeksBulan > 11) {
    return tanggal
  }

  return `${Number(hari)} ${namaBulan[indeksBulan]} ${tahun}`
}

export default function DetailLowonganMahasiswa() {
  const { id } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [lowongan, setLowongan] = useState(null)
  const [relatedLowongan, setRelatedLowongan] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await api.get('/lowongan/')
        const allJobs = res.data
        const selected = allJobs.find(l => l.id === parseInt(id))
        
        if (selected) {
          setLowongan(selected)
          const related = allJobs.filter(l => l.perusahaan === selected.perusahaan)
          setRelatedLowongan(related)
        } else {
          setLowongan(null)
        }
      } catch (err) {
        console.error("Gagal mendapatkan data lowongan:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    window.scrollTo(0, 0)
  }, [id])

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
                src="https://upload.wikimedia.org/wikipedia/id/thumb/0/05/Makara_of_IPB_University.svg/1200px-Makara_of_IPB_University.svg.png" 
                alt="Logo IPB" 
                className="w-[70%] h-[70%] object-contain"
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

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        ) : !lowongan ? (
          <div className="text-center py-20 bg-[#0f1626] rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-2xl text-gray-400 font-bold mb-4">Lowongan Tidak Ditemukan</h2>
            <Link to="/mahasiswa/lowongan" className="text-yellow-400 hover:underline">Kembali ke Daftar Lowongan</Link>
          </div>
        ) : (
          <>
            <div className="bg-[#0f1626] rounded-xl overflow-hidden border border-gray-800 shadow-xl">
              <div className="relative w-full h-64 sm:h-80 lg:h-96">
                <img 
                  src={`https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop`}
                  alt="Kantor Perusahaan" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1626] via-[#0f1626]/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-yellow-400 drop-shadow-lg tracking-wide">
                    {lowongan.perusahaan}
                  </h2>
                  <p className="text-white mt-2 flex items-center gap-2 opacity-90">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {lowongan.lokasi}
                  </p>
                </div>
              </div>

              <div className="p-8 md:p-12 max-w-4xl mx-auto text-center border-b border-gray-800">
                <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-6">
                  {lowongan.posisi}
                </h3>
                
                <div className="inline-flex flex-wrap justify-center gap-4 text-sm text-gray-300 mb-8 p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Posisi Magang</span>
                  </div>
                  <div className="w-px h-5 bg-gray-600 hidden sm:block"></div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Ditutup: <span className="text-white font-medium">{formatTanggalDatabase(lowongan.tanggal_tutup)}</span></span>
                  </div>
                </div>

                <div className="text-left">
                  <h4 className="text-xl font-medium text-white mb-4 border-l-4 border-yellow-400 pl-3">Deskripsi Pekerjaan</h4>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-line">
                    {lowongan.deskripsi}
                  </p>
                </div>

                <div className="mt-12 flex justify-center">
                  <button onClick={() => alert("Fitur Kirim Lamaran akan segera hadir!")} className="px-8 py-3 border border-yellow-400 bg-yellow-400/10 rounded-md text-sm font-bold text-yellow-400 hover:bg-yellow-400 hover:text-black transition duration-300 uppercase tracking-wide shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                    Kirim Lamaran Sekarang
                  </button>
                </div>
              </div>
            </div>

            {relatedLowongan.length > 0 && (
              <div className="bg-[#0f1626] rounded-xl p-6 sm:p-8 border border-gray-800 shadow-xl mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-yellow-400">
                    Posisi Lain di {lowongan.perusahaan}
                  </h3>
                  <Link to="/mahasiswa/lowongan" className="text-sm text-gray-400 hover:text-white transition">
                    &larr; Kembali ke Daftar
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {relatedLowongan.map(item => (
                    <div key={item.id} className={`border ${item.id === lowongan.id ? 'border-yellow-400 bg-gray-800/80' : 'border-gray-600 hover:bg-gray-800/50'} rounded-lg p-6 flex flex-col transition duration-300`}>
                      <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">{item.posisi}</h4>
                      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                        📍 {item.lokasi}
                      </p>
                      <p className="text-sm text-gray-300 flex-grow mb-6 leading-relaxed line-clamp-3 opacity-80">
                        {item.deskripsi}
                      </p>
                      <div className="mt-auto">
                        {item.id === lowongan.id ? (
                          <span className="block text-center px-5 py-2 border border-yellow-400 bg-yellow-400 text-black rounded-md text-sm font-medium">
                            Posisi Saat Ini
                          </span>
                        ) : (
                          <Link to={`/mahasiswa/lowongan/detail/${item.id}`} className="block text-center px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-white hover:bg-white hover:text-black transition duration-200">
                            Lihat Detail
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}