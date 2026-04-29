import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    password: '',
    password_confirmation: '',
    full_name: '',
    email: '',
    role: 'mahasiswa',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    setSuccessMsg('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim() || !form.password_confirmation.trim() || !form.full_name.trim() || !form.email.trim()) {
      setError('Terdapat form yang belum terisi.')
      return
    }

    if (form.password !== form.password_confirmation) {
      setError('Password dan Konfirmasi Password tidak cocok.')
      return
    }

    const { password_confirmation, ...submitData } = form

    setLoading(true)
    try {
      const response = await api.post('/auth/register', submitData)
      if (response.data) {
        setSuccessMsg('Registrasi berhasil! Mengalihkan ke login...')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 1500)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mendaftar. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-overlay" />
      <div className="login-content">
        <h1 className="login-header-title">
          <span className="text-yellow">Ayo</span>{' '}
          <span className="text-white">Bergabung!</span>
        </h1>

        <div className="login-card">
          <div className="login-card-header">
            <div className="user-icon-wrapper">
              <i className="fas fa-user-plus" />
            </div>
            <h2>Create an Account</h2>
          </div>

          {error && (
            <div className="alert-error">
              <i className="fas fa-circle-exclamation" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="alert-error" style={{ background: '#4CAF50' }}>
              <i className="fas fa-check-circle" />
              {successMsg}
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
              <label htmlFor="full_name">Full Name</label>
              <div className="input-wrapper">
                <i className="fas fa-id-badge input-icon" />
                <input
                  id="full_name"
                  className="form-control"
                  type="text"
                  name="full_name"
                  placeholder="Enter your full name"
                  value={form.full_name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>

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
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
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
                  placeholder="Enter your Password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
              <label htmlFor="password_confirmation">Confirm Password</label>
              <div className="input-wrapper">
                <i className="fas fa-lock input-icon" />
                <input
                  id="password_confirmation"
                  className="form-control"
                  // type={showPasswordConfirmation ? 'text' : 'password'}
                  type={"password"}
                  name="password_confirmation"
                  placeholder="Confirm your Password"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {/* <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPasswordConfirmation((v) => !v)}
                  tabIndex={-1}
                >
                  <i className={`fas ${showPasswordConfirmation ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button> */}
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading || successMsg !== ''}
              style={{ marginTop: '2rem' }}
            >
              {loading ? <span className="spinner" /> : 'Sign Up'}
            </button>

            <div className="signup-row">
              Already have an account? <Link to="/login">Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
