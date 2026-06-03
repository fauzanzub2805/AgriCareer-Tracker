import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { openSecureFile } from '../services/api'

function formatTanggal(tanggal) {
  if (!tanggal) return 'Tanggal belum tersedia'
  const parts = String(tanggal).split('-')
  if (parts.length !== 3) return tanggal
  const [tahun, bulan, hari] = parts
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const idx = Number(bulan) - 1
  if (idx < 0 || idx > 11) return tanggal
  return `${Number(hari)} ${namaBulan[idx]} ${tahun}`
}

export default function DetailLamaranMahasiswa() {
  const { id } = useParams()

  const [lamaran, setLamaran] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cvBlobUrl, setCvBlobUrl] = useState(null)
  const [error, setError] = useState('')
  const [fileBukti, setFileBukti] = useState(null)
  const [uploadingBukti, setUploadingBukti] = useState(false)

  const handleUploadBukti = async (e) => {
    e.preventDefault()
    if (!fileBukti) return

    setUploadingBukti(true)
    try {
      const formData = new FormData()
      formData.append('file', fileBukti)
      
      await api.post(`/lamaran/${id}/upload-bukti`, formData)
      alert("Bukti keputusan berhasil diunggah!")
      const res = await api.get(`/lamaran/${id}`)
      setLamaran(res.data)
      setFileBukti(null)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || "Gagal mengunggah bukti keputusan.")
    } finally {
      setUploadingBukti(false)
    }
  }

  useEffect(() => {
    const fetchDetailLamaran = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/lamaran/${id}`)
        const data = response.data
        setLamaran(data)

        if (data.cv_path) {
          try {
            const cvResponse = await api.get(data.cv_path, { responseType: 'blob' })
            const url = URL.createObjectURL(cvResponse.data)
            setCvBlobUrl(url)
          } catch (cvErr) {
            console.error("Gagal mendapatkan file CV:", cvErr)
          }
        }
      } catch (err) {
        console.error("Gagal mengambil detail lamaran:", err)
        setError(err.response?.data?.detail || "Gagal memuat detail lamaran.")
      } finally {
        setLoading(false)
      }
    }

    fetchDetailLamaran()

    return () => {
      if (cvBlobUrl) {
        URL.revokeObjectURL(cvBlobUrl)
      }
    }
  }, [id])

  // Helper untuk stepper timeline
  const getTimelineSteps = (lamaran) => {
    const status = lamaran.status_lamaran;
    const steps = [
      {
        id: 1,
        title: 'Verifikasi',
        desc: 'Validasi Administrasi',
        status: 'upcoming',
        info: ''
      },
      {
        id: 2,
        title: 'Terkirim',
        desc: 'Proses Seleksi',
        status: 'upcoming',
        info: ''
      },
      {
        id: 3,
        title: 'Keputusan',
        desc: 'Hasil Seleksi',
        status: 'upcoming',
        info: ''
      }
    ]

    // Helper untuk mengecek apakah deadline (tanggal_tutup) sudah lewat
    let isDeadlinePassed = false
    if (lamaran.tanggal_tutup) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const deadline = new Date(lamaran.tanggal_tutup)
      deadline.setHours(0, 0, 0, 0)
      isDeadlinePassed = today > deadline
    }

    const hasDeadlinePassedBeforeApproval = 
      (status === 'Menunggu Administrasi' || status === 'Menunggu') && isDeadlinePassed

    if (hasDeadlinePassedBeforeApproval) {
      // Melewati deadline sebelum disetujui
      steps[0].status = 'failed'
      steps[0].info = 'Pendaftaran ditutup sebelum administrasi disetujui.'
      
      steps[1].status = 'disabled'
      steps[1].info = 'Proses terhenti.'
      
      steps[2].status = 'failed'
      steps[2].title = 'Deadline'
      steps[2].desc = 'Melewati Batas Waktu'
      steps[2].info = `Batas akhir pendaftaran (${formatTanggal(lamaran.tanggal_tutup)}) telah terlewati.`
    } else if (status === 'Menunggu Administrasi' || status === 'Menunggu') {
      // Sebelum pengiriman lamaran disetujui
      steps[0].status = 'active'
      steps[0].info = 'Menunggu dosen menyetujui dokumen administrasi Anda.'
      steps[1].status = 'upcoming'
      steps[1].info = 'Menunggu administrasi disetujui.'
      steps[2].status = 'upcoming'
      steps[2].info = 'Menunggu hasil keputusan seleksi.'
    } else if (status === 'Seleksi Perusahaan' || status === 'Wawancara' || status === 'Dikirim') {
      // Setelah pengiriman lamaran disetujui
      steps[0].status = 'completed'
      steps[0].info = 'Administrasi disetujui Dosen.'
      steps[1].status = 'active'
      steps[1].info = 'Lamaran Anda sedang diproses oleh perusahaan. Silakan unggah bukti keputusan jika sudah ada.'
      steps[2].status = 'upcoming'
      steps[2].info = 'Unggah bukti keputusan untuk melanjutkan.'
    } else if (status === 'Menunggu Validasi Akhir') {
      // Bukti keputusan dikirim, menunggu verifikasi dosen
      steps[0].status = 'completed'
      steps[0].info = 'Administrasi disetujui Dosen.'
      steps[1].status = 'completed'
      steps[1].info = 'Bukti keputusan telah diunggah.'
      steps[2].status = 'active'
      steps[2].info = 'Bukti telah dikirim. Menunggu verifikasi akhir dari Dosen.'
    } else if (status === 'Diterima') {
      steps[0].status = 'completed'
      steps[0].info = 'Administrasi disetujui Dosen.'
      steps[1].status = 'completed'
      steps[1].info = 'Bukti keputusan divalidasi.'
      steps[2].status = 'success'
      steps[2].title = 'Diterima'
      steps[2].info = 'Selamat! Lamaran Anda telah diterima dan divalidasi.'
    } else if (status === 'Ditolak') {
      if (!lamaran.bukti_penerimaan_path) {
        // Ditolak saat administrasi
        steps[0].status = 'failed'
        steps[0].info = 'Administrasi Anda ditolak oleh Dosen.'
        steps[1].status = 'disabled'
        steps[1].info = 'Proses terhenti.'
        steps[2].status = 'failed'
        steps[2].title = 'Ditolak'
        steps[2].info = 'Lamaran Anda ditolak pada tahap administrasi.'
      } else {
        // Ditolak setelah upload bukti
        steps[0].status = 'completed'
        steps[0].info = 'Administrasi disetujui Dosen.'
        steps[1].status = 'completed'
        steps[1].info = 'Bukti keputusan telah diunggah.'
        steps[2].status = 'failed'
        steps[2].title = 'Ditolak'
        steps[2].info = 'Bukti keputusan ditolak atau dinyatakan tidak diterima.'
      }
    } else if (status === 'Selesai') {
      steps[0].status = 'completed'
      steps[0].info = 'Administrasi disetujui Dosen.'
      steps[1].status = 'completed'
      steps[1].info = 'Bukti keputusan divalidasi.'
      steps[2].status = 'success'
      steps[2].title = 'Selesai'
      steps[2].info = 'Program magang telah diselesaikan sepenuhnya!'
    }

    return steps
  }

  const steps = lamaran ? getTimelineSteps(lamaran) : []

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Navigation / Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link to="/mahasiswa/lamaran" className="text-sm text-yellow-400 hover:text-yellow-300 transition flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Daftar Lamaran
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold">Detail Lamaran Kerja</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-[#0f1626] rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-xl text-red-400 font-bold mb-4">{error}</h2>
            <Link to="/mahasiswa/lamaran" className="text-yellow-400 hover:underline">Kembali ke Daftar Lamaran</Link>
          </div>
        ) : !lamaran ? (
          <div className="text-center py-20 bg-[#0f1626] rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-xl text-gray-400 font-bold mb-4">Lamaran Tidak Ditemukan</h2>
            <Link to="/mahasiswa/lamaran" className="text-yellow-400 hover:underline">Kembali ke Daftar Lamaran</Link>
          </div>
        ) : (
          <>
            {/* TIMELINE PROGRESS LINE */}
            <div className="bg-[#0f1626] rounded-xl p-6 sm:p-8 border border-gray-800 shadow-lg">
              <h3 className="text-lg font-bold text-yellow-400 mb-8 border-b border-gray-800 pb-3">Status Pelacakan Lamaran</h3>
              
              {/* Stepper container */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                
                {/* Horizontal line for medium screens and above */}
                <div className="absolute top-6 left-[16%] right-[16%] h-0.5 bg-gray-800 hidden md:block z-0"></div>
                
                {steps.map((step, idx) => {
                  let circleClass = "";
                  let textClass = "";
                  let icon = null;

                  if (step.status === 'completed') {
                    circleClass = "bg-yellow-400 text-[#0f1626] ring-4 ring-yellow-400/20";
                    textClass = "text-yellow-400";
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    );
                  } else if (step.status === 'active') {
                    circleClass = "bg-yellow-400 text-[#0f1626] ring-4 ring-yellow-400/40 animate-pulse";
                    textClass = "text-yellow-300 font-semibold";
                    icon = <span className="font-bold text-base">{step.id}</span>;
                  } else if (step.status === 'success') {
                    circleClass = "bg-green-500 text-white ring-4 ring-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.4)]";
                    textClass = "text-green-500 font-semibold";
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    );
                  } else if (step.status === 'failed') {
                    circleClass = "bg-red-500 text-white ring-4 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
                    textClass = "text-red-400 font-semibold";
                    icon = (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    );
                  } else {
                    circleClass = "bg-[#1e2638] border-2 border-slate-700 text-slate-500";
                    textClass = "text-slate-500";
                    icon = <span className="text-sm font-semibold">{step.id}</span>;
                  }

                  return (
                    <div key={step.id} className="flex flex-col items-center text-center relative z-10">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${circleClass}`}>
                        {icon}
                      </div>
                      <h4 className={`text-base font-semibold ${textClass}`}>{step.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{step.desc}</p>
                      <p className="text-xs text-gray-500 mt-2 px-4 leading-relaxed">{step.info}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DETAIL DATA GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Vacancy & Applicant Information */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Vacancy Info */}
                <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-md">
                  <h3 className="text-yellow-400 font-semibold text-lg mb-4 border-b border-gray-800 pb-2">Informasi Lowongan</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Perusahaan</p>
                      <p className="text-white font-semibold text-base mt-0.5">{lamaran.perusahaan}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs">Posisi yang Dilamar</p>
                      <span className="inline-block px-2.5 py-1 mt-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded text-xs font-semibold uppercase tracking-wider">
                        {lamaran.posisi_lamaran || lamaran.posisi}
                      </span>
                    </div>

                    {lamaran.lokasi && (
                      <div>
                        <p className="text-gray-500 text-xs">Lokasi</p>
                        <p className="text-gray-300 mt-0.5">{lamaran.lokasi}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-gray-500 text-xs">Tanggal Pengajuan</p>
                      <p className="text-gray-300 mt-0.5">{formatTanggal(lamaran.tanggal_kirim)}</p>
                    </div>
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-md">
                  <h3 className="text-yellow-400 font-semibold text-lg mb-4 border-b border-gray-800 pb-2">Informasi Pelamar</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Nama Lengkap</p>
                      <p className="text-white font-semibold mt-0.5">{lamaran.full_name}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs">NIM</p>
                      <p className="text-gray-300 mt-0.5">{lamaran.nim || '–'}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="text-gray-300 mt-0.5">{lamaran.email || '–'}</p>
                    </div>
                  </div>
                </div>

                {/* Upload Bukti Keputusan */}
                {(!lamaran.bukti_penerimaan_path && ['Seleksi Perusahaan', 'Wawancara', 'Dikirim'].includes(lamaran.status_lamaran)) && (
                  <div className="bg-[#0f1626] rounded-xl p-6 border border-yellow-400/30 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                       <i className="fas fa-file-upload text-6xl text-yellow-400"></i>
                    </div>
                    <h3 className="text-yellow-400 font-semibold text-lg mb-2">Unggah Bukti Keputusan</h3>
                    <p className="text-xs text-gray-400 mb-4">Silakan unggah surat penerimaan atau bukti pengumuman dari perusahaan agar dapat divalidasi oleh dosen.</p>
                    
                    <form onSubmit={handleUploadBukti}>
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => setFileBukti(e.target.files[0])}
                        className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-400 file:text-[#0f1626] hover:file:bg-yellow-300 mb-3 cursor-pointer"
                      />
                      <button 
                        type="submit" 
                        disabled={!fileBukti || uploadingBukti}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-[#0f1626] text-sm font-semibold py-2 rounded transition disabled:opacity-50"
                      >
                        {uploadingBukti ? 'Mengunggah...' : 'Kirim Bukti'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Tampilkan Bukti yang sudah diunggah */}
                {lamaran.bukti_penerimaan_path && (
                  <div className="bg-[#0f1626] rounded-xl p-6 border border-green-500/30 shadow-md">
                    <h3 className="text-green-400 font-semibold text-lg mb-2 flex items-center gap-2">
                       <i className="fas fa-check-circle"></i>
                       Bukti Terkirim
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Anda telah mengunggah bukti keputusan. Menunggu verifikasi akhir dari Dosen Pembimbing.</p>
                    <button 
                      onClick={() => openSecureFile(lamaran.bukti_penerimaan_path)}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 rounded transition border border-gray-700"
                    >
                      Lihat Dokumen Bukti
                    </button>
                  </div>
                )}

              </div>

              {/* Right Column: CV Preview & Job Description */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Job Description */}
                {lamaran.deskripsi && (
                  <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-md">
                    <h3 className="text-yellow-400 font-semibold text-lg mb-3 border-l-4 border-yellow-400 pl-3">Deskripsi Pekerjaan</h3>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {lamaran.deskripsi}
                    </p>
                  </div>
                )}

                {/* Curriculum Vitae Preview */}
                <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-md">
                  <h3 className="text-yellow-400 font-semibold text-lg mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Berkas CV yang Dikirim
                  </h3>
                  
                  <div className="w-full bg-[#1e2638] rounded flex items-center justify-center overflow-hidden h-[500px] border border-gray-700 relative">
                    {cvBlobUrl ? (
                      <iframe 
                        src={cvBlobUrl} 
                        className="w-full h-full border-0"
                        title="CV Preview"
                      />
                    ) : (
                      <div className="text-gray-500 text-sm flex flex-col items-center p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="font-semibold text-gray-300">File CV Tidak Tersedia</p>
                        <p className="text-xs text-gray-500 mt-1">Gagal memuat berkas atau tidak ada berkas yang dikaitkan.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </main>
  )
}
