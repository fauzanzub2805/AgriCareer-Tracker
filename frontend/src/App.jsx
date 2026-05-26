import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Unauthorized from './pages/Unauthorized'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Layouts (Keep static because they wrap everything and contain nav/headers)
import AdminLayout from './layouts/AdminLayout'
import DosenLayout from './layouts/DosenLayout'
import MahasiswaLayout from './layouts/MahasiswaLayout'

const DashboardMahasiswa = lazy(() => import('./pages/DashboardMahasiswa'))
const LowonganMahasiswa = lazy(() => import('./pages/LowonganMahasiswa'))
const DetailLowonganMahasiswa = lazy(() => import('./pages/DetailLowonganMahasiswa'))
const LamaranMahasiswa = lazy(() => import('./pages/LamaranMahasiswa'))
const DetailLamaranMahasiswa = lazy(() => import('./pages/DetailLamaranMahasiswa'))
const ApplyMagang = lazy(() => import('./pages/ApplyMagang'))
const ProfileMahasiswa = lazy(() => import('./pages/ProfileMahasiswa'))
const Chat = lazy(() => import('./pages/Chat'))

const DashboardAdmin = lazy(() => import('./pages/DashboardAdmin'))
const UsersAdmin = lazy(() => import('./pages/UsersAdmin'))
const LowonganAdmin = lazy(() => import('./pages/LowonganAdmin'))
const FormLowonganAdmin = lazy(() => import('./pages/FormLowonganAdmin'))
const BimbinganAdmin = lazy(() => import('./pages/BimbinganAdmin'))
const ProfileAdmin = lazy(() => import('./pages/ProfileAdmin'))
const PengumumanAdmin = lazy(() => import('./pages/PengumumanAdmin'))

const DashboardDosen = lazy(() => import('./pages/DashboardDosen'))
const LamaranDosen = lazy(() => import('./pages/LamaranDosen'))
const ProfileDosen = lazy(() => import('./pages/ProfileDosen'))
const LowonganDosen = lazy(() => import('./pages/LowonganDosen'))
const DetailLowonganDosen = lazy(() => import('./pages/DetailLowonganDosen'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#1e2638]">
            <div className="w-10 h-10 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Mahasiswa Routes */}
            <Route path="/mahasiswa" element={<ProtectedRoute roles={['mahasiswa']}><MahasiswaLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardMahasiswa />} />
              <Route path="lowongan" element={<LowonganMahasiswa />} />
              <Route path="lowongan/detail/:id" element={<DetailLowonganMahasiswa />} />
              <Route path="lamaran" element={<LamaranMahasiswa />} />
              <Route path="lamaran/detail/:id" element={<DetailLamaranMahasiswa />} />
              <Route path="apply-magang" element={<ApplyMagang />} />
              <Route path="profile" element={<ProfileMahasiswa />} />
              <Route path="chat" element={<Chat />} />
              {/* Redirect /mahasiswa to /mahasiswa/dashboard */}
              <Route index element={<Navigate to="/mahasiswa/dashboard" replace />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardAdmin />} />
              <Route path="users" element={<UsersAdmin />} />
              <Route path="lowongan" element={<LowonganAdmin />} />
              <Route path="lowongan/create" element={<FormLowonganAdmin />} />
              <Route path="lowongan/edit/:id" element={<FormLowonganAdmin />} />
              <Route path="bimbingan" element={<BimbinganAdmin />} />
              <Route path="pengumuman" element={<PengumumanAdmin />} />
              <Route path="profile" element={<ProfileAdmin />} />
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Dosen Routes */}
            <Route path="/dosen" element={<ProtectedRoute roles={['dosen']}><DosenLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardDosen />} />
              <Route path="lowongan" element={<LowonganDosen />} />
              <Route path="lowongan/detail/:id" element={<DetailLowonganDosen />} />
              <Route path="lamaran" element={<LamaranDosen />} />
              <Route path="profile" element={<ProfileDosen />} />
              <Route path="chat" element={<Chat />} />
              <Route index element={<Navigate to="/dosen/dashboard" replace />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
