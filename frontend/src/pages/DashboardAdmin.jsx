import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'

export default function DashboardAdmin() {
  const { user } = useAuth()

  return (
    <AppLayout pageTitle="Dashboard Administrator">
      <div className="page-header">
        <h2>Selamat Datang, {user?.full_name}!</h2>
        <p>Kelola akses pengguna, lowongan, dan tenggat waktu program magang.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card accent-dark">
          <div className="stat-icon" style={{ color: 'var(--primary-dark)' }}>
            <i className="fas fa-users" />
          </div>
          <div className="stat-info">
            <p>Total Pengguna</p>
            <h3>148</h3>
          </div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-icon">
            <i className="fas fa-briefcase" />
          </div>
          <div className="stat-info">
            <p>Lowongan Aktif</p>
            <h3>31</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-lines" />
          </div>
          <div className="stat-info">
            <p>Lamaran Masuk</p>
            <h3>87</h3>
          </div>
        </div>
        <div className="stat-card accent-warn">
          <div className="stat-icon" style={{ color: '#fb6340' }}>
            <i className="fas fa-triangle-exclamation" />
          </div>
          <div className="stat-info">
            <p>Perlu Tindakan</p>
            <h3>5</h3>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="card"
        style={{ padding: '1.5rem', width: 'fit-content', marginBottom: '1.25rem' }}
      >
        <h4
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--text-dark)',
            marginBottom: '1rem',
          }}
        >
          <i
            className="fas fa-bolt"
            style={{ marginRight: '0.5rem', color: 'var(--primary)' }}
          />
          Shortcuts
        </h4>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            <i className="fas fa-user-plus" /> Tambah Pengguna
          </button>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            <i className="fas fa-plus" /> Tambah Lowongan
          </button>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            <i className="fas fa-clock" /> Atur Tenggat
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="card" style={{ padding: '1.5rem', maxWidth: 560 }}>
        <h4
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--text-dark)',
            marginBottom: '1rem',
          }}
        >
          <i
            className="fas fa-id-card"
            style={{ marginRight: '0.5rem', color: 'var(--primary)' }}
          />
          Informasi Akun
        </h4>
        <table className="info-table">
          <tbody>
            <tr>
              <td>Nama Lengkap</td>
              <td>{user?.full_name}</td>
            </tr>
            <tr>
              <td>NIP</td>
              <td>{user?.nip ?? '–'}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{user?.email ?? '–'}</td>
            </tr>
            <tr>
              <td>Peran</td>
              <td>
                <span className="badge badge-admin">Administrator</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
