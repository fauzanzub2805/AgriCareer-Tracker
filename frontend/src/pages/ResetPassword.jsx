import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [form, setForm] = useState({ new_password: '', confirm_password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) {
      setError('Token reset password tidak ditemukan.')
      return
    }
    if (!form.new_password || !form.confirm_password) {
      setError('Harap isi semua kolom password.')
      return
    }
    if (form.new_password !== form.confirm_password) {
      setError('Password dan Konfirmasi Password tidak cocok.')
      return
    }
    
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      const response = await api.post('/auth/reset-password', { 
        token: token,
        new_password: form.new_password 
      })
      setMessage(response.data.message)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mereset password. Token mungkin tidak valid atau sudah kedaluwarsa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-overlay" />
      <div className="login-content">
        <h1 className="login-header-title">
          <span className="text-yellow">Password</span>{' '}
          <span className="text-white">Baru</span>
        </h1>
        <div className="login-card">
          <div className="login-card-header">
            <div className="user-icon-wrapper">
              <i className="fas fa-lock" />
            </div>
            <h2>Buat Password Baru</h2>
          </div>

          {!token && (
            <div className="alert-error">
              <i className="fas fa-circle-exclamation" />
              <span>Token reset password tidak ditemukan di URL.</span>
            </div>
          )}

          {error && (
            <div className="alert-error">
              <i className="fas fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}
          
          {message && (
            <div className="alert-error" style={{ background: '#4CAF50' }}>
              <i className="fas fa-check-circle" />
              <span>{message} Mengalihkan ke login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="new_password">Password Baru</label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon" />
                <input
                  id="new_password"
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  name="new_password"
                  placeholder="Masukkan password baru"
                  value={form.new_password}
                  onChange={(e) => setForm(prev => ({...prev, new_password: e.target.value}))}
                  autoFocus
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Konfirmasi Password Baru</label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon" />
                <input
                  id="confirm_password"
                  className="form-control"
                  type="password"
                  name="confirm_password"
                  placeholder="Ulangi password baru"
                  value={form.confirm_password}
                  onChange={(e) => setForm(prev => ({...prev, confirm_password: e.target.value}))}
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading || !token || message !== ''}
              style={{ marginTop: '1.5rem' }}
            >
              {loading ? <span className="spinner" /> : 'Simpan Password Baru'}
            </button>

            <div className="signup-row">
              <Link to="/login">Batal dan kembali ke Login</Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
