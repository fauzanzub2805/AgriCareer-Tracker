import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

export default function DetailLowonganDosen() {
  const { id } = useParams()
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

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
        </div>
      ) : !lowongan ? (
        <div className="text-center py-20 bg-[#0f1626] rounded-xl border border-gray-800 shadow-xl">
          <h2 className="text-2xl text-gray-400 font-bold mb-4">Lowongan Tidak Ditemukan</h2>
          <Link to="/dosen/lowongan" className="text-yellow-400 hover:underline">Kembali ke Daftar Lowongan</Link>
        </div>
      ) : (
        <>
            <div className="bg-[#0f1626] rounded-xl overflow-hidden border border-gray-800 shadow-xl">
              <div className="relative w-full h-64 sm:h-80 lg:h-96">
                <img
                  src={lowongan.banner_path || `https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop`}
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
                <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
                  Pilihan Posisi Tersedia
                </h3>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {lowongan.posisi.split(',').map((pos, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm">
                      {pos.trim()}
                    </span>
                  ))}
                </div>

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

                <div className="text-left space-y-8">
                  <div>
                    <h4 className="text-xl font-medium text-white mb-4 border-l-4 border-yellow-400 pl-3">Deskripsi Pekerjaan</h4>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-line">
                      {lowongan.deskripsi}
                    </p>
                  </div>
                  
                  {lowongan.persyaratan && (
                    <div>
                      <h4 className="text-xl font-medium text-white mb-4 border-l-4 border-yellow-400 pl-3">Persyaratan Khusus</h4>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-line">
                        {lowongan.persyaratan}
                      </p>
                    </div>
                  )}

                  {lowongan.benefit && (
                    <div>
                      <h4 className="text-xl font-medium text-white mb-4 border-l-4 border-yellow-400 pl-3">Benefit</h4>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-line">
                        {lowongan.benefit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {relatedLowongan.length > 0 && (
              <div className="bg-[#0f1626] rounded-xl p-6 sm:p-8 border border-gray-800 shadow-xl mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-yellow-400">
                    Posisi Tersedia di {lowongan.perusahaan}
                  </h3>
                  <Link to="/dosen/lowongan" className="text-sm text-gray-400 hover:text-white transition">
                    &larr; Kembali ke Daftar
                  </Link>
                </div>

                <div className="flex flex-col gap-6">
                  {relatedLowongan.flatMap(item =>
                    item.posisi.split(',').map((pos, idx) => {
                      const positionName = pos.trim()
                      const isCurrentLowongan = item.id === lowongan.id
                      
                      return (
                        <div key={`${item.id}-${idx}`} className={`border ${isCurrentLowongan ? 'border-yellow-400 bg-gray-800/40' : 'border-gray-800 bg-gray-900/30'} rounded-xl p-6 sm:p-8 flex flex-col gap-4 transition duration-300`}>
                          <div className="flex flex-wrap items-center gap-3">
                            <h4 className="text-white font-bold text-xl uppercase tracking-wide">{positionName}</h4>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {item.lokasi}
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span>
                            <span className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Ditutup: {formatTanggalDatabase(item.tanggal_tutup)}
                            </span>
                          </div>

                          <div className="space-y-4 pt-2">
                            {item.deskripsi && (
                              <div>
                                <h5 className="text-xs font-semibold uppercase text-yellow-400/80 tracking-wider">Deskripsi Pekerjaan</h5>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mt-1">
                                  {item.deskripsi}
                                </p>
                              </div>
                            )}
                            
                            {item.persyaratan && (
                              <div>
                                <h5 className="text-xs font-semibold uppercase text-yellow-400/80 tracking-wider">Persyaratan Khusus</h5>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mt-1">
                                  {item.persyaratan}
                                </p>
                              </div>
                            )}

                            {item.benefit && (
                              <div>
                                <h5 className="text-xs font-semibold uppercase text-yellow-400/80 tracking-wider">Benefit</h5>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mt-1">
                                  {item.benefit}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </>
      )}
    </main>
  )
}
