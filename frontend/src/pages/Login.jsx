import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
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
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password) {
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
      <div className="login-overlay" />
      <div className="login-content">
        <h1 className="login-header-title">
          <span className="text-yellow">Selamat</span>{' '}
          <span className="text-white">Datang!</span>
        </h1>
        <div className="login-card">
          <div className="login-card-header">
            <div className="user-icon-wrapper">
              <i className="fas fa-user" />
            </div>
            <h2>Sign in to Your Account</h2>
          </div>

          {error && (
            <div className="alert-error">
              <i className="fas fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <i className="fas fa-user input-icon" />
                <input
                  id="username"
                  className="form-control"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon" />
                <input
                  id="password"
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className="remember-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="remember-text">Remember Me</span>
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Login'}
            </button>

            <div className="signup-row">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </div>
          </form>

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
        </div>
      </div>
    </div>
  )
}