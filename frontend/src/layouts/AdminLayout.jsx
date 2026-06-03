import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Suspense, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import ProfileMenu from '../components/ProfileMenu'
import NotificationBell from '../components/NotificationBell'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Preload JS chunks di background agar transisi halaman terasa instan
    const preloadPages = () => {
      import('../pages/UsersAdmin')
      import('../pages/BimbinganAdmin')
      import('../pages/PengumumanAdmin')
      import('../pages/LowonganAdmin')
      import('../pages/ProfileAdmin')
      import('../pages/FormLowonganAdmin')
    }
    
    if (window.requestIdleCallback) {
      window.requestIdleCallback(preloadPages)
    } else {
      setTimeout(preloadPages, 2000)
    }
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="font-['Poppins'] bg-[#1e2638] text-white min-h-screen flex flex-col antialiased pb-16 md:pb-0">
      <nav className="bg-[#0f1626] border-b border-gray-800 px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/admin/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-blue-900 rounded-full border border-gray-600 flex items-center justify-center overflow-hidden">
              <img 
                src="/Institut_Pertanian_Bogor_logo.webp" 
                alt="Logo IPB" 
                className="w-[100%] h-[100%] object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              <span className="text-yellow-400">AgriCareer</span><span className="text-white">-Tracker</span>
            </h1>
          </Link>

          <div className="flex items-center gap-8">
            <ul className="hidden md:flex gap-8 font-medium text-sm">
              <li>
                <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/admin/users" className={isActive('/admin/users') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Kelola Pengguna
                </Link>
              </li>
              <li>
                <Link to="/admin/bimbingan" className={isActive('/admin/bimbingan') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Kelola Bimbingan
                </Link>
              </li>
              <li>
                <Link to="/admin/pengumuman" className={isActive('/admin/pengumuman') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Kelola Pengumuman
                </Link>
              </li>
              <li>
                <Link to="/admin/lowongan" className={isActive('/admin/lowongan') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Lowongan Magang
                </Link>
              </li>
            </ul>

            <div className="flex items-center gap-5">
              <NotificationBell />
              <ProfileMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-yellow-400 rounded-full animate-spin"></div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1626] border-t border-gray-800 md:hidden px-2 py-2 shadow-lg">
        <ul className="flex justify-around items-center text-center">
          <li className="flex-1">
            <Link to="/admin/dashboard" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/admin/dashboard') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Beranda</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link to="/admin/users" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/admin/users') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Pengguna</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link to="/admin/bimbingan" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/admin/bimbingan') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Bimbingan</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link to="/admin/pengumuman" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/admin/pengumuman') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>Pengumuman</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link to="/admin/lowongan" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/admin/lowongan') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Lowongan</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
