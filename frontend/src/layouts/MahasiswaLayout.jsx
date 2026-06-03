import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'
import ProfileMenu from '../components/ProfileMenu'
import NotificationBell from '../components/NotificationBell'

export default function MahasiswaLayout() {
  const { user, logout, unreadChatCount } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Preload JS chunks di background agar transisi halaman terasa instan
    const preloadPages = () => {
      import('../pages/LowonganMahasiswa')
      import('../pages/LamaranMahasiswa')
      import('../pages/Chat')
      import('../pages/ProfileMahasiswa')
      import('../pages/ApplyMagang')
    }
    
    if (window.requestIdleCallback) {
      window.requestIdleCallback(preloadPages)
    } else {
      setTimeout(preloadPages, 2000)
    }
  }, [])

  // Removed interval, unread count is managed globally in AuthContext

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const isActive = (path) => {
    // Specifically handle active states for nested routes
    if (path === '/mahasiswa/lowongan' && location.pathname.startsWith('/mahasiswa/lowongan')) return true
    if (path === '/mahasiswa/lamaran' && location.pathname.startsWith('/mahasiswa/lamaran')) return true
    return location.pathname === path
  }

  return (
    <div className="font-['Poppins'] bg-[#1e2638] text-white min-h-screen flex flex-col antialiased pb-16 md:pb-0">
      <nav className="bg-[#0f1626] border-b border-gray-800 px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/mahasiswa/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
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
                <Link to="/mahasiswa/dashboard" className={isActive('/mahasiswa/dashboard') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/mahasiswa/lowongan" className={isActive('/mahasiswa/lowongan') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Lowongan Magang
                </Link>
              </li>
              <li>
                <Link to="/mahasiswa/lamaran" className={isActive('/mahasiswa/lamaran') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}>
                  Status Lamaran
                </Link>
              </li>
              <li>
                <Link to="/mahasiswa/chat" className={`relative ${isActive('/mahasiswa/chat') ? 'text-yellow-400' : 'text-gray-300 hover:text-white transition'}`}>
                  Pesan
                  {unreadChatCount > 0 && !isActive('/mahasiswa/chat') && (
                    <span className="absolute -top-1 -right-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f1626] border-t border-gray-800 md:hidden px-4 py-2 shadow-lg">
        <ul className="flex justify-around items-center text-center">
          <li className="flex-1">
            <Link to="/mahasiswa/dashboard" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/mahasiswa/dashboard') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Beranda</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link to="/mahasiswa/lowongan" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/mahasiswa/lowongan') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Lowongan</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link to="/mahasiswa/lamaran" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition ${isActive('/mahasiswa/lamaran') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>Status</span>
            </Link>
          </li>
          <li className="flex-1">
            <Link to="/mahasiswa/chat" className={`flex flex-col items-center gap-1 py-1 text-[10px] sm:text-xs font-medium transition relative ${isActive('/mahasiswa/chat') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Pesan</span>
              {unreadChatCount > 0 && !isActive('/mahasiswa/chat') && (
                <span className="absolute top-0 right-4 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}
