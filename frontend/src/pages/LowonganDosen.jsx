import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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

export default function LowonganDosen() {
  const [lowonganList, setLowonganList] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const limit = 10

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  // Calendar Logic
  const getCalendarDays = () => {
    const year = time.getFullYear()
    const month = time.getMonth() // 0-indexed
    
    // First day of current month
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 (Sun) to 6 (Sat)
    
    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    // Days from previous month to fill the first week
    const prevMonthTotalDays = new Date(year, month, 0).getDate()
    
    const days = []
    
    // Fill previous month's trailing days
    // Adapt getDay() to start with Monday: Monday is 0, Sunday is 6
    let startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1
    
    for (let i = startDayOffset; i > 0; i--) {
      days.push({
        day: prevMonthTotalDays - i + 1,
        isCurrentMonth: false,
        dateObj: new Date(year, month - 1, prevMonthTotalDays - i + 1)
      })
    }
    
    // Fill current month's days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        dateObj: new Date(year, month, i)
      })
    }
    
    // Fill next month's starting days to complete calendar grid (6 rows * 7 columns = 42 cells)
    const remainingCells = 42 - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateObj: new Date(year, month + 1, i)
      })
    }
    
    return days
  }

  const calendarDays = getCalendarDays()
  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-6">Lowongan Terbuka</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job listings */}
        <div className="lg:col-span-2 space-y-5">
          {lowonganList.length > 0 ? lowonganList.map((l) => (
            <div key={l.id} className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
              <h3 className="text-white font-semibold text-lg">{l.perusahaan}</h3>
              <p className="text-sm text-gray-400 mt-1">{l.posisi}, {l.lokasi}</p>
              <Link to={`/dosen/lowongan/detail/${l.id}`} className="inline-block mt-2 text-xs font-medium text-yellow-400 hover:text-yellow-300 transition">
                Lihat Detail Lebih Lanjut
              </Link>
              
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

        {/* Right Column: Clock, Date, & Calendar Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Digital Clock & Date */}
          <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400 rounded-bl-full opacity-5"></div>
            
            <p className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-2">Waktu Lokal</p>
            <p className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-sm text-gray-400 mt-2 font-medium">
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Calendar Widget */}
          <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
              <h3 className="text-yellow-400 font-semibold text-base">Kalender</h3>
              <span className="text-xs font-semibold text-gray-400 bg-gray-800 px-2.5 py-1 rounded">
                {namaBulan[time.getMonth()]} {time.getFullYear()}
              </span>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map((day, idx) => (
                <span key={idx} className="text-[10px] font-bold text-gray-500 uppercase">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((cell, idx) => {
                const today = isToday(cell.dateObj)
                
                let dayClass = "text-xs p-2 rounded-lg font-medium transition-all"
                
                if (today) {
                  dayClass += " bg-yellow-400 text-black font-bold shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                } else if (cell.isCurrentMonth) {
                  dayClass += " text-gray-300 hover:bg-gray-800/60 cursor-pointer"
                } else {
                  dayClass += " text-gray-600 hover:bg-gray-800/30 cursor-pointer"
                }

                return (
                  <div key={idx} className={`${dayClass}`} title={cell.dateObj.toDateString()}>
                    {cell.day}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
