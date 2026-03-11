import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_MAHASISWA = [
  { to: '/mahasiswa/dashboard', icon: 'fa-house', label: 'Beranda' },
  { to: '/mahasiswa/lowongan', icon: 'fa-magnifying-glass', label: 'Lowongan Magang' },
  { to: '/mahasiswa/lamaran', icon: 'fa-file-lines', label: 'Status Lamaran' },
  { to: '/mahasiswa/logbook', icon: 'fa-book-open', label: 'Logbook Digital' },
]

const NAV_ADMIN = [
  { to: '/admin/dashboard', icon: 'fa-house', label: 'Beranda' },
  { to: '/admin/users', icon: 'fa-users', label: 'Manajemen Pengguna' },
  { to: '/admin/lowongan', icon: 'fa-briefcase', label: 'Kelola Lowongan' },
  { to: '/admin/tenggat', icon: 'fa-clock', label: 'Tenggat Waktu' },
]

const NAV_DOSEN = [
  { to: '/dosen/dashboard', icon: 'fa-house', label: 'Beranda' },
  { to: '/dosen/lamaran', icon: 'fa-file-circle-check', label: 'Validasi Lamaran' },
  { to: '/dosen/logbook', icon: 'fa-comments', label: 'Validasi Logbook' },
]

const NAV_BY_ROLE = {
  mahasiswa: NAV_MAHASISWA,
  admin: NAV_ADMIN,
  dosen: NAV_DOSEN,
}

const ROLE_LABEL = {
  mahasiswa: 'Mahasiswa',
  admin: 'Administrator',
  dosen: 'Dosen Pembimbing',
}

export default function AppLayout({ children, pageTitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = NAV_BY_ROLE[user?.role] ?? []

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>AgriCareer<br />Tracker</h1>
          <small>Portal Akademik Terpadu</small>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <i className="fas fa-user" />
          </div>
          <div className="sidebar-user-info">
            <p>{user?.full_name}</p>
            <span>{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
        </div>

        <nav>
          <ul className="sidebar-nav">
            <li className="sidebar-section-label">Menu Utama</li>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
                  <i className={`fas ${item.icon}`} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.75)' }}>
            <i className="fas fa-right-from-bracket" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{pageTitle}</span>
          <div className="topbar-right">
            <span
              className={`badge badge-${user?.role}`}
              style={{ textTransform: 'capitalize' }}
            >
              <i className="fas fa-circle-user" style={{ marginRight: '0.35rem' }} />
              {ROLE_LABEL[user?.role]}
            </span>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
