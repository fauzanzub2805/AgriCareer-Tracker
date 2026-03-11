import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/AppLayout'

export default function DashboardDosen() {
  const { user } = useAuth()

  return (
    <AppLayout pageTitle="Dashboard Dosen Pembimbing">
      <div className="page-header">
        <h2>Selamat Datang, {user?.full_name}!</h2>
        <p>Validasi lamaran dan logbook mahasiswa bimbingan Anda.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card accent-blue">
          <div className="stat-icon">
            <i className="fas fa-user-graduate" />
          </div>
          <div className="stat-info">
            <p>Mhs. Bimbingan</p>
            <h3>18</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-circle-check" />
          </div>
          <div className="stat-info">
            <p>Lamaran Perlu Validasi</p>
            <h3>6</h3>
          </div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon" style={{ color: '#2dce89' }}>
            <i className="fas fa-book-open" />
          </div>
          <div className="stat-info">
            <p>Logbook Perlu Review</p>
            <h3>9</h3>
          </div>
        </div>
        <div className="stat-card accent-warn">
          <div className="stat-icon" style={{ color: '#fb6340' }}>
            <i className="fas fa-comment-dots" />
          </div>
          <div className="stat-info">
            <p>Komentar Terkirim</p>
            <h3>34</h3>
          </div>
        </div>
      </div>

      {/* Pending validations */}
      <div
        className="card"
        style={{ padding: '1.5rem', maxWidth: 600, marginBottom: '1.25rem' }}
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
            className="fas fa-hourglass-half"
            style={{ marginRight: '0.5rem', color: 'var(--primary)' }}
          />
          Menunggu Validasi
        </h4>
        {[
          { nim: 'G6401231038', name: 'Arief Abdul Rahman', type: 'Lamaran', company: 'Lele Corp.' },
          { nim: 'G6401231129', name: 'Muhammad Fauzan Zubaedi',   type: 'Logbook', company: 'Lele Corp.' },
          { nim: 'G6401231006', name: 'Ludwig Alven T. L. Tobing', type: 'Logbook', company: 'Lele Corp.' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 0',
              borderBottom: i < 2 ? '1px solid var(--border-color)' : 'none',
            }}
          >
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                {item.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {item.nim} &middot; {item.company}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                className={`badge badge-${item.type === 'Lamaran' ? 'mahasiswa' : 'dosen'}`}
              >
                {item.type}
              </span>
              <button
                className="btn btn-primary"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
              >
                Review
              </button>
            </div>
          </div>
        ))}
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
                <span className="badge badge-dosen">Dosen Pembimbing</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
