import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function LowonganAdmin() {
  const [lowonganList, setLowonganList] = useState([])
  const navigate = useNavigate()

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
    return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">Kelola Lowongan</h2>
              <p className="text-xs sm:text-sm text-gray-400">Buat, ubah, dan hapus penawaran magang</p>
            </div>
            
            <button 
              onClick={() => navigate('/admin/lowongan/create')}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold transition shadow-md hover:shadow-lg text-xs sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Tambah Lowongan Baru</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs sm:text-sm">
                  <th className="py-3 px-2 sm:px-4 font-medium">Perusahaan</th>
                  <th className="py-3 px-2 sm:px-4 font-medium">Posisi</th>
                  <th className="py-3 px-2 sm:px-4 font-medium hidden sm:table-cell">Tenggat Waktu</th>
                  <th className="py-3 px-2 sm:px-4 font-medium hidden sm:table-cell">Status</th>
                  <th className="py-3 px-2 sm:px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {lowonganList.length > 0 ? lowonganList.map((lowongan) => (
                  <tr key={lowongan.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-4 px-2 sm:px-4 font-medium text-white max-w-[100px] sm:max-w-none truncate">{lowongan.perusahaan}</td>
                    <td className="py-4 px-2 sm:px-4 text-gray-400 max-w-[100px] sm:max-w-none truncate">{lowongan.posisi}</td>
                    <td className="py-4 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">
                      {new Date(lowongan.tanggal_tutup).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-2 sm:px-4 hidden sm:table-cell">
                      <span className={lowongan.status_aktif ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                        {lowongan.status_aktif ? "Aktif" : "Tutup"}
                      </span>
                    </td>
                    <td className="py-4 px-2 sm:px-4 text-right">
                      <button 
                        onClick={() => navigate(`/admin/lowongan/edit/${lowongan.id}`)}
                        className="text-yellow-400 hover:text-yellow-300 transition font-medium text-[10px] sm:text-xs border border-yellow-500/50 hover:bg-yellow-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded"
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
  )
}