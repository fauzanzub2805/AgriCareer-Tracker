import AppLayout from '../components/AppLayout'

export default function UsersAdmin() {
  return (
    <AppLayout pageTitle="Manajemen Pengguna">
      <div className="page-header">
        <h2>Manajemen Pengguna</h2>
        <p>Halaman ini untuk mengelola akun dosen, mahasiswa, dan administrator.</p>
      </div>
    </AppLayout>
  )
}