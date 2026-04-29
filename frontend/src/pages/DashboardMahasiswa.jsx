import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'

export default function DashboardMahasiswa() {
  const { user } = useAuth()

  return (
    <AppLayout>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card accent-blue">
          <div className="stat-icon">
            <i className="fas fa-briefcase" />
          </div>
          <div className="stat-info">
            <p>Lowongan Tersedia</p>
            <h3>24</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-lines" />
          </div>
          <div className="stat-info">
            <p>Lamaran Dikirim</p>
            <h3>3</h3>
          </div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon" style={{ color: '#2dce89' }}>
            <i className="fas fa-circle-check" />
          </div>
          <div className="stat-info">
            <p>Logbook Disetujui</p>
            <h3>12</h3>
          </div>
        </div>
        <div className="stat-card accent-warn">
          <div className="stat-icon" style={{ color: '#fb6340' }}>
            <i className="fas fa-clock" />
          </div>
          <div className="stat-info">
            <p>Menunggu Review</p>
            <h3>2</h3>
          </div>
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
              <td>NIM</td>
              <td>{user?.nim ?? '–'}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>{user?.email ?? '–'}</td>
            </tr>
            <tr>
              <td>Peran</td>
              <td>
                <span className="badge badge-mahasiswa">Mahasiswa</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
