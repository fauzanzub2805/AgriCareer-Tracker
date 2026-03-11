import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import DashboardMahasiswa from './pages/DashboardMahasiswa'
import DashboardAdmin from './pages/DashboardAdmin'
import DashboardDosen from './pages/DashboardDosen'
import Unauthorized from './pages/Unauthorized'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Mahasiswa */}
          <Route
            path="/mahasiswa/dashboard"
            element={
              <ProtectedRoute roles={['mahasiswa']}>
                <DashboardMahasiswa />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          {/* Dosen */}
          <Route
            path="/dosen/dashboard"
            element={
              <ProtectedRoute roles={['dosen']}>
                <DashboardDosen />
              </ProtectedRoute>
            }
          />

          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
