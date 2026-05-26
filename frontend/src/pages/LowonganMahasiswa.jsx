import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

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
  const { user } = useAuth()
  const [lowonganList, setLowonganList] = useState([])
  const [lamaranList, setLamaranList] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const limit = 10

  const fetchLamaran = async () => {
    try {
      const resLamaran = await api.get('/lamaran/')
      setLamaranList(resLamaran.data)
    } catch (err) {
      console.error("Gagal mendapatkan lamaran:", err)
    }
  }

  const fetchLowongan = async (currentOffset) => {
    setLoadingMore(true)
    try {
      const resLowongan = await api.get(`/lowongan/?limit=${limit}&offset=${currentOffset}`)
      const newData = resLowongan.data
      if (newData.length < limit) {
        setHasMore(false)
      }
      if (currentOffset === 0) {
        setLowonganList(newData)
      } else {
        setLowonganList(prev => [...prev, ...newData])
      }
    } catch (err) {
      console.error("Gagal mendapatkan lowongan:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchLamaran()
    fetchLowongan(0)
  }, [])

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    const nextOffset = offset + limit
    setOffset(nextOffset)
    fetchLowongan(nextOffset)
  }

  // Infinite Scroll Observer
  const loadMoreRef = useRef(null)

  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        handleLoadMore()
      }
    }, { threshold: 0.1 })

    observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [hasMore, loadingMore, offset])

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
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
              <p className="text-gray-400 text-sm">Tidak ada lowongan tersedia saat ini.</p>
            )}
            
            {hasMore && lowonganList.length > 0 && (
              <div ref={loadMoreRef} className="flex justify-center mt-6 py-4">
                <span className="text-sm font-medium text-gray-500 animate-pulse">
                  Memuat lowongan berikutnya...
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-yellow-400 font-semibold text-lg mb-6">Status Lamaran Terbaru</h3>
              
              <div className="space-y-4">
                {lamaranList.length > 0 ? lamaranList.map((lamaran) => {
                  let isDeadlinePassed = false;
                  if (lamaran.tanggal_tutup) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const deadline = new Date(lamaran.tanggal_tutup);
                    deadline.setHours(0, 0, 0, 0);
                    isDeadlinePassed = today > deadline;
                  }
                  const hasDeadlinePassedBeforeApproval = 
                    (lamaran.status_lamaran === 'Menunggu Administrasi' || lamaran.status_lamaran === 'Menunggu') && isDeadlinePassed;
                  const displayStatus = hasDeadlinePassedBeforeApproval ? "Deadline" : lamaran.status_lamaran;
                  const colorClass = ['Diterima', 'Selesai'].includes(displayStatus) ? 'text-green-400' :
                                     ['Ditolak', 'Deadline'].includes(displayStatus) ? 'text-red-400' :
                                     'text-yellow-400';
                  return (
                    <div key={lamaran.id} className="border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                      <p className={`text-sm font-medium ${colorClass}`}>{displayStatus}</p>
                      <p className="text-xs text-gray-500 mt-1">{lamaran.perusahaan} - {lamaran.posisi_lamaran || lamaran.posisi}</p>
                    </div>
                  );
                }) : (
                  <p className="text-gray-400 text-sm">Belum ada riwayat lamaran.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
  )
}
