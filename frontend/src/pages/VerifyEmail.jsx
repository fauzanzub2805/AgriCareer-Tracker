import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('Sedang memverifikasi email Anda...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token verifikasi tidak ditemukan.')
      return
    }

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`)
        setStatus('success')
        setMessage(response.data.message || 'Email berhasil diverifikasi!')
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.detail || 'Verifikasi gagal atau token sudah kedaluwarsa.')
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="login-page">
      <div className="login-overlay" />
      <div className="login-content">
        <div className="login-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          
          {status === 'loading' && (
            <div>
              <div className="w-12 h-12 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold">{message}</h2>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="text-green-500 text-6xl mb-4">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verifikasi Sukses!</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <button 
                className="login-submit-btn" 
                onClick={() => navigate('/login')}
              >
                Kembali ke Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div>
              <div className="text-red-500 text-6xl mb-4">
                <i className="fas fa-times-circle"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2">Verifikasi Gagal</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="flex gap-4">
                <button 
                  className="login-submit-btn" 
                  onClick={() => navigate('/login')}
                >
                  Ke Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
