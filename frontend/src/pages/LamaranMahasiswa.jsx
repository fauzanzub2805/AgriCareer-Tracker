import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

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

function getProgressColors(lamaran) {
  const status = lamaran.status_lamaran;
  let step1 = 'bg-gray-700';
  let step2 = 'bg-gray-700';
  let step3 = 'bg-gray-700';

  // Check if deadline is passed
  let isDeadlinePassed = false;
  if (lamaran.tanggal_tutup) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(lamaran.tanggal_tutup);
    deadline.setHours(0, 0, 0, 0);
    isDeadlinePassed = today > deadline;
  }

  const hasDeadlinePassedBeforeApproval = 
    (status === 'Menunggu Administrasi' || status === 'Menunggu') && isDeadlinePassed;

  if (hasDeadlinePassedBeforeApproval) {
    step1 = 'bg-red-500';
    step2 = 'bg-gray-700';
    step3 = 'bg-red-500';
  } else if (status === 'Menunggu Administrasi' || status === 'Menunggu') {
    step1 = 'bg-yellow-400 animate-pulse';
  } else if (status === 'Seleksi Perusahaan' || status === 'Wawancara' || status === 'Dikirim') {
    step1 = 'bg-yellow-400';
    step2 = 'bg-yellow-400 animate-pulse';
  } else if (status === 'Menunggu Validasi Akhir') {
    step1 = 'bg-yellow-400';
    step2 = 'bg-yellow-400';
    step3 = 'bg-yellow-400 animate-pulse';
  } else if (status === 'Diterima') {
    step1 = 'bg-yellow-400';
    step2 = 'bg-yellow-400';
    step3 = 'bg-green-500';
  } else if (status === 'Ditolak') {
    if (!lamaran.bukti_penerimaan_path) {
      step1 = 'bg-red-500';
      step2 = 'bg-gray-700';
      step3 = 'bg-red-500';
    } else {
      step1 = 'bg-yellow-400';
      step2 = 'bg-yellow-400';
      step3 = 'bg-red-500';
    }
  } else if (status === 'Selesai') {
    step1 = 'bg-yellow-400';
    step2 = 'bg-yellow-400';
    step3 = 'bg-green-500';
  }

  return { step1, step2, step3 };
}

function getStatusBadge(lamaran) {
  const status = lamaran.status_lamaran;
  
  // Check if deadline is passed
  let isDeadlinePassed = false;
  if (lamaran.tanggal_tutup) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(lamaran.tanggal_tutup);
    deadline.setHours(0, 0, 0, 0);
    isDeadlinePassed = today > deadline;
  }

  const hasDeadlinePassedBeforeApproval = 
    (status === 'Menunggu Administrasi' || status === 'Menunggu') && isDeadlinePassed;

  if (hasDeadlinePassedBeforeApproval) {
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">Deadline</span>;
  }

  switch (status) {
    case 'Menunggu':
    case 'Menunggu Administrasi':
    case 'Dikirim':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 uppercase tracking-wider">{status}</span>;
    case 'Seleksi Perusahaan':
    case 'Wawancara':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-400/10 text-orange-400 border border-orange-400/20 uppercase tracking-wider">{status}</span>;
    case 'Menunggu Validasi Akhir':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">Validasi Akhir</span>;
    case 'Diterima':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">{status}</span>;
    case 'Ditolak':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">{status}</span>;
    case 'Selesai':
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-wider">{status}</span>;
    default:
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20 uppercase tracking-wider">{status}</span>;
  }
}

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



  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=random`

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-8">Status Lamaran</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lamaranList.length > 0 ? lamaranList.map((lamaran) => {
              const colors = getProgressColors(lamaran);
              return (
                <div 
                  key={lamaran.id} 
                  onClick={() => navigate(`/mahasiswa/lamaran/detail/${lamaran.id}`)}
                  className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg hover:border-gray-300/30 hover:shadow-[0_0_0px_rgba(250,204,21,0.15)] transition duration-100 cursor-pointer flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-start mb-4 gap-2">
                            <h3 className="text-white font-semibold text-lg hover:text-yellow-400 transition line-clamp-1">{lamaran.perusahaan}</h3>
                            {getStatusBadge(lamaran)}
                        </div>
                        
                        <div className="flex gap-2 mb-6">
                            <div className={`h-1.5 flex-1 rounded-full ${colors.step1}`} title="Verifikasi"></div>
                            <div className={`h-1.5 flex-1 rounded-full ${colors.step2}`} title="Terkirim"></div>
                            <div className={`h-1.5 flex-1 rounded-full ${colors.step3}`} title="Keputusan"></div>
                        </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-400 border-t border-gray-800/80 pt-3">
                        <p><span className="text-gray-500">Posisi:</span> <span className="text-gray-300 font-medium">{lamaran.posisi_lamaran || lamaran.posisi}</span></p>
                        <p><span className="text-gray-500">Tanggal Kirim:</span> <span className="text-gray-300">{formatTanggal(lamaran.tanggal_kirim)}</span></p>
                    </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-12 bg-[#0f1626] rounded-xl border border-gray-800">
                <p className="text-gray-400">Belum ada lamaran yang diajukan.</p>
              </div>
            )}
        </div>
      </main>
  )
}