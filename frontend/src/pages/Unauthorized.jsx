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
    <div className="unauth-container">
      <div className="unauth-icon">
        <i className="fas fa-lock" />
      </div>
      <h1>Akses Ditolak</h1>
      <p>
        Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi
        administrator jika Anda merasa ini adalah kesalahan.
      </p>
      <button className="btn btn-primary" onClick={goBack}>
        <i className="fas fa-arrow-left" />
        Kembali ke Beranda
      </button>
    </div>
  )
}
