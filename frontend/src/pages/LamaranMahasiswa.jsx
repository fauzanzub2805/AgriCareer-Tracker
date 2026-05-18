import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function LamaranMahasiswa() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [lamaranList, setLamaranList] = useState([])

  useEffect(() => {
    const fetchLamaran = async () => {
      try {
        const response = await api.get('/lamaran/')
        setLamaranList(response.data)
      } catch (err) {
        console.error("Gagal mendapatkan data lamaran:", err)
      }
    }
    fetchLamaran()
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
              <li><Link to="/mahasiswa/lowongan" className="text-gray-300 hover:text-white transition">Lowongan Magang</Link></li>
              <li><Link to="/mahasiswa/lamaran" className="text-yellow-400">Status Lamaran</Link></li>
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
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-8">Status Lamaran</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lamaranList.length > 0 ? lamaranList.map((lamaran) => (
              <div key={lamaran.id} className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg hover:border-gray-600 transition duration-300">
                  <h3 className="text-white font-semibold text-lg mb-2">{lamaran.perusahaan}</h3>
                  <p className="text-sm text-gray-400 mb-5">{lamaran.status_lamaran}</p>
                  
                  <div className="flex gap-2 mb-4">
                      {/* Visual progress bar sederhana berdasarkan status */}
                      <div className={`h-1.5 flex-1 rounded-full ${lamaran.status_lamaran === 'Dikirim' || lamaran.status_lamaran === 'Menunggu' ? 'bg-yellow-400' : 'bg-white'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${lamaran.status_lamaran === 'Wawancara' ? 'bg-yellow-400' : 'bg-white'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${lamaran.status_lamaran === 'Diterima' ? 'bg-green-500' : 'bg-white'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${lamaran.status_lamaran === 'Selesai' ? 'bg-green-500' : 'bg-white'}`}></div>
                  </div>
                  
                  <p className="text-xs text-gray-500">Posisi: {lamaran.posisi}</p>
                  <p className="text-xs text-gray-500 mt-1">Tanggal Berlaku: {lamaran.tanggal_kirim}</p>
              </div>
            )) : (
              <p className="text-gray-400">Belum ada lamaran.</p>
            )}
        </div>
      </main>
    </div>
  )
}