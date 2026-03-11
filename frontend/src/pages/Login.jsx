import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const ROLE_REDIRECT = {
  mahasiswa: '/mahasiswa/dashboard',
  admin: '/admin/dashboard',
  dosen: '/dosen/dashboard',
}

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username dan password tidak boleh kosong.')
      return
    }
    const result = await login(form.username.trim(), form.password)
    if (result.success) {
      const destination = from || ROLE_REDIRECT[result.role] || '/'
      navigate(destination, { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="login-page">
      {/* ── Left panel ── */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-left-logo">
            <i className="fas fa-briefcase" />
          </div>
          <h2>Sistem Informasi Magang</h2>
          <p>
            Platform terpadu untuk mengelola program magang mahasiswa, mulai
            dari pencarian lowongan hingga pencatatan logbook digital.
          </p>
          <ul className="feature-list">
            <li>
              <span className="feat-icon"><i className="fas fa-search" /></span>
              Akses lowongan magang terkurasi
            </li>
            <li>
              <span className="feat-icon"><i className="fas fa-chart-line" /></span>
              Lacak status lamaran secara real-time
            </li>
            <li>
              <span className="feat-icon"><i className="fas fa-book-open" /></span>
              Catat logbook digital dengan mudah
            </li>
            <li>
              <span className="feat-icon"><i className="fas fa-shield-halved" /></span>
              Akses berbasis peran yang aman
            </li>
          </ul>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-header">
            <h3>Selamat Datang</h3>
            <p>Masuk menggunakan akun yang telah terdaftar</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <i className="fas fa-circle-exclamation" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-icon-wrapper">
                <i className="fas fa-user input-icon" />
                <input
                  id="username"
                  className="form-control"
                  type="text"
                  name="username"
                  placeholder="Masukkan username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrapper">
                <i className="fas fa-lock input-icon" />
                <input
                  id="password"
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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

            <div className="remember-row">
              <label>
                <input type="checkbox" />
                Ingat saya
              </label>
              <a href="#">Lupa kata sandi?</a>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  Masuk
                  <span className="btn-arrow">
                    <i className="fas fa-angle-right" />
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Demo credentials helper */}
          <div className="demo-box">
            <p>Demo Akun</p>
            <div className="demo-credentials">
              <div className="demo-cred-row">
                <span>Mahasiswa</span>
                <code>mhs_arip / mahasiswa123</code>
              </div>
              <div className="demo-cred-row">
                <span>Administrator</span>
                <code>etmin_ludwik / admin123</code>
              </div>
              <div className="demo-cred-row">
                <span>Dosen</span>
                <code>dosen_ojan / dosen123</code>
              </div>
            </div>
          </div>

          <div className="login-footer">
            &copy; {new Date().getFullYear()} AgriCareer &mdash; v1.0.0
          </div>
        </div>
      </div>
    </div>
  )
}
