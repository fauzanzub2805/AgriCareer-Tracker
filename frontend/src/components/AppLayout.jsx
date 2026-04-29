import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_MAHASISWA = [
  { to: '/mahasiswa/dashboard', label: 'Beranda' },
  { to: '/mahasiswa/lowongan', label: 'Lowongan Magang' },
  { to: '/mahasiswa/lamaran', label: 'Status Lamaran' },
  { to: '/mahasiswa/logbook', label: 'Logbook Digital' },
]

const NAV_ADMIN = [
  { to: '/admin/dashboard', label: 'Beranda' },
  { to: '/admin/users', label: 'Manajemen Pengguna' },
  { to: '/admin/lowongan', label: 'Kelola Lowongan' },
  { to: '/admin/tenggat', label: 'Tenggat Waktu' },
]

const NAV_DOSEN = [
  { to: '/dosen/dashboard', label: 'Beranda' },
  { to: '/dosen/lamaran', label: 'Validasi Lamaran' },
  { to: '/dosen/logbook', label: 'Validasi Logbook' },
]

const NAV_BY_ROLE = {
  mahasiswa: NAV_MAHASISWA,
  admin: NAV_ADMIN,
  dosen: NAV_DOSEN,
}

export default function AppLayout({ children, pageTitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = NAV_BY_ROLE[user?.role] ?? []

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const identifier = user?.nim || user?.nip;

  // We can use UI Avatars to generate a fallback image
  const avatarUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.full_name || 'User') + "&background=random";

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="text-yellow">AgriCareer-</span><span className="text-white">Tracker</span>
        </div>

        <nav className="topbar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-user">
          <button className="avatar-btn" onClick={handleLogout} title="Klik untuk keluar">
             <img src={avatarUrl} alt="User Avatar" />
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="dashboard-welcome">
          {pageTitle ? (
            <h2 style={{ fontWeight: 600, fontSize: '1.25rem' }}>{pageTitle}</h2>
          ) : (
            <h2>Selamat Datang, <strong>{user?.full_name}</strong> {identifier && `- ${identifier}`}</h2>
          )}
        </div>
        
        <div className="glass-container">
          {children}
        </div>
      </main>
    </div>
  )
}
