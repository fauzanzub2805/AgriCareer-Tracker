import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'

// Mahasiswa
import DashboardMahasiswa from './pages/DashboardMahasiswa'
import LowonganMahasiswa from './pages/LowonganMahasiswa'
import DetailLowonganMahasiswa from './pages/DetailLowonganMahasiswa'
import LamaranMahasiswa from './pages/LamaranMahasiswa'

// Admin
import DashboardAdmin from './pages/DashboardAdmin'
import UsersAdmin from './pages/UsersAdmin'
import LowonganAdmin from './pages/LowonganAdmin'


// Dosen
import DashboardDosen from './pages/DashboardDosen'
import LamaranDosen from './pages/LamaranDosen'

import Unauthorized from './pages/Unauthorized'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
          <Route
            path="/mahasiswa/lowongan"
            element={
              <ProtectedRoute roles={['mahasiswa']}>
                <LowonganMahasiswa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahasiswa/lowongan/detail/:id"
            element={
              <ProtectedRoute roles={['mahasiswa']}>
                <DetailLowonganMahasiswa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahasiswa/lamaran"
            element={
              <ProtectedRoute roles={['mahasiswa']}>
                <LamaranMahasiswa />
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
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UsersAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lowongan"
            element={
              <ProtectedRoute roles={['admin']}>
                <LowonganAdmin />
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
          <Route
            path="/dosen/lamaran"
            element={
              <ProtectedRoute roles={['dosen']}>
                <LamaranDosen />
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
