import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Unauthorized() {
  const navigate = useNavigate()
  const { user } = useAuth()

  function goBack() {
    if (user) {
      const map = { mahasiswa: '/mahasiswa/dashboard', admin: '/admin/dashboard', dosen: '/dosen/dashboard' }
      navigate(map[user.role] || '/', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="font-['Poppins'] min-h-screen bg-[#1e2638] flex items-center justify-center p-4">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="bg-[#0f1626] border border-gray-800 shadow-2xl rounded-2xl max-w-md w-full p-8 sm:p-10 text-center relative z-10">
        <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">Akses Ditolak</h1>
        <p className="text-gray-400 text-sm sm:text-base mb-8 leading-relaxed">
          Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan sistem.
        </p>
        
        <button 
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 group" 
          onClick={goBack}
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}
