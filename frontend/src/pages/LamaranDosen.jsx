import { useState, useEffect } from 'react'
import api, { openSecureFile } from '../services/api'
import { useAuth } from '../context/AuthContext'

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

export default function LamaranDosen() {
  const { user } = useAuth()
  const [lamaran, setLamaran] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  const fetchLamaran = async () => {
    try {
      const [resLamaran, resProfile] = await Promise.all([
        api.get('/lamaran/all'),
        api.get('/profile/me')
      ])
      setLamaran(resLamaran.data)
      setProfile(resProfile.data)
    } catch (err) {
      console.error("Gagal mendapatkan data lamaran:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLamaran()
  }, [])



  const handleUpdateStatus = async (id, newStatus) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${newStatus}?`)) return
    try {
      await api.put(`/lamaran/${id}/status`, { status_lamaran: newStatus })
      alert(`Status lamaran berhasil diubah menjadi ${newStatus}`)
      fetchLamaran()
    } catch (error) {
      console.error("Gagal mengubah status:", error)
      alert("Terjadi kesalahan saat mengubah status")
    }
  }

  const [lamaranAdministrasi, setLamaranAdministrasi] = useState([])
  const [lamaranAkhir, setLamaranAkhir] = useState([])
  const [lamaranSelesai, setLamaranSelesai] = useState([])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLamaranAdministrasi(lamaran.filter(l => l.status_lamaran === 'Menunggu Administrasi' || l.status_lamaran === 'Menunggu'))
      setLamaranAkhir(lamaran.filter(l => l.status_lamaran === 'Menunggu Validasi Akhir'))
      setLamaranSelesai(lamaran.filter(l => !['Menunggu', 'Menunggu Administrasi', 'Menunggu Validasi Akhir'].includes(l.status_lamaran)))
    }, 10)

    return () => clearTimeout(timer)
  }, [lamaran])
  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-6">Validasi Lamaran Mahasiswa</h2>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Memuat data...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Kolom Menunggu Validasi */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
                <h3 className="text-yellow-400 font-semibold text-lg mb-5 flex items-center gap-2">
                  Tahap 1: Validasi Administrasi
                  {lamaranAdministrasi.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{lamaranAdministrasi.length}</span>
                  )}
                </h3>
                
                <div className="space-y-4">
                  {lamaranAdministrasi.length > 0 ? lamaranAdministrasi.map((l) => (
                    <div key={l.id} className="border border-gray-700/60 rounded-lg p-5 hover:border-gray-500 transition bg-[#161f30]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-medium text-lg">{l.full_name} <span className="text-sm text-gray-400 font-normal">({l.nim})</span></h4>
                          <p className="text-sm text-gray-300 mt-1">{l.perusahaan} - <span className="text-yellow-400">{l.posisi_lamaran}</span></p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-900/50 text-blue-300">
                          {l.status_lamaran}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 mb-4 text-xs text-gray-400">
                        <p>Dikirim: {formatTanggalDatabase(l.tanggal_kirim)}</p>
                        <p>Email: {l.email || '-'}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-700/50">
                        {l.cv_path && (
                          <button onClick={() => openSecureFile(l.cv_path)} className="text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-3 py-2 rounded transition flex items-center justify-center gap-1 border border-blue-900/50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            Lihat CV
                          </button>
                        )}
                        <div className="flex gap-2 sm:ml-auto">
                          <button onClick={() => handleUpdateStatus(l.id, 'Ditolak')} className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-4 py-2 rounded transition border border-red-900/50">
                            Tolak
                          </button>
                          <button onClick={() => handleUpdateStatus(l.id, 'Seleksi Perusahaan')} className="text-xs font-medium text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40 px-4 py-2 rounded transition border border-green-900/50">
                            Setujui Administrasi
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-700 rounded-lg">
                      Tidak ada lamaran yang menunggu validasi administrasi.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
                <h3 className="text-yellow-400 font-semibold text-lg mb-5 flex items-center gap-2">
                  Tahap 2: Validasi Penerimaan Akhir
                  {lamaranAkhir.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{lamaranAkhir.length}</span>
                  )}
                </h3>
                
                <div className="space-y-4">
                  {lamaranAkhir.length > 0 ? lamaranAkhir.map((l) => (
                    <div key={l.id} className="border border-yellow-900/40 rounded-lg p-5 hover:border-yellow-700/60 transition bg-[#161f30]">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-white font-medium text-lg">{l.full_name} <span className="text-sm text-gray-400 font-normal">({l.nim})</span></h4>
                          <p className="text-sm text-gray-300 mt-1">{l.perusahaan} - <span className="text-yellow-400">{l.posisi_lamaran}</span></p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-900/50 text-yellow-300">
                          {l.status_lamaran}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4 mb-4 text-xs text-gray-400">
                        <p>Dikirim: {formatTanggalDatabase(l.tanggal_kirim)}</p>
                        <p>Email: {l.email || '-'}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-700/50">
                        {l.bukti_penerimaan_path && (
                          <button onClick={() => openSecureFile(l.bukti_penerimaan_path)} className="text-xs font-medium text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/40 px-3 py-2 rounded transition flex items-center justify-center gap-1 border border-yellow-900/50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Lihat Bukti
                          </button>
                        )}
                        <div className="flex gap-2 sm:ml-auto">
                          <button onClick={() => handleUpdateStatus(l.id, 'Ditolak')} className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-4 py-2 rounded transition border border-red-900/50">
                            Tolak
                          </button>
                          <button onClick={() => handleUpdateStatus(l.id, 'Diterima')} className="text-xs font-medium text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40 px-4 py-2 rounded transition border border-green-900/50">
                            Terima Final
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-700 rounded-lg">
                      Tidak ada bukti keputusan yang perlu divalidasi.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kolom Riwayat Validasi */}
            <div className="lg:col-span-1">
              <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg sticky top-24">
                <h3 className="text-yellow-400 font-semibold text-lg mb-6">Riwayat Validasi</h3>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {lamaranSelesai.length > 0 ? lamaranSelesai.map((l) => (
                    <div key={l.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm text-gray-300 font-medium">{l.full_name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          l.status_lamaran === 'Diterima' ? 'bg-green-900/40 text-green-400' : 
                          l.status_lamaran === 'Ditolak' ? 'bg-red-900/40 text-red-400' : 
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {l.status_lamaran}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{l.nim} - {l.perusahaan}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{formatTanggalDatabase(l.tanggal_kirim)}</p>
                    </div>
                  )) : (
                    <p className="text-gray-400 text-sm">Belum ada riwayat validasi.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
  )
}