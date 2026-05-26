import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Masukkan email Anda.')
      return
    }
    
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      const response = await api.post('/auth/forgot-password', { email })
      setMessage(response.data.message)
    } catch (err) {
      setError(err.response?.data?.detail || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-overlay" />
      <div className="login-content">
        <h1 className="login-header-title">
          <span className="text-yellow">Lupa</span>{' '}
          <span className="text-white">Password?</span>
        </h1>
        <div className="login-card">
          <div className="login-card-header">
            <div className="user-icon-wrapper">
              <i className="fas fa-key" />
            </div>
            <h2>Reset Password</h2>
            <p className="text-gray-400 text-sm mt-2">
              Masukkan email yang terdaftar untuk menerima link reset password.
            </p>
          </div>

          {error && (
            <div className="alert-error">
              <i className="fas fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}
          
          {message && (
            <div className="alert-error" style={{ background: '#4CAF50' }}>
              <i className="fas fa-check-circle" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon" />
                <input
                  id="email"
                  className="form-control"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              style={{ marginTop: '1.5rem' }}
            >
              {loading ? <span className="spinner" /> : 'Kirim Link Reset'}
            </button>

            <div className="signup-row">
              Ingat password? <Link to="/login">Kembali ke Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
