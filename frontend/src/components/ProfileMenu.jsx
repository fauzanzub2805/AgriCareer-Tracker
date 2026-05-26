import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthImage from './AuthImage'

export default function ProfileMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fallbackAvatarUrl = user?.full_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`
    : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'
  
  // Di navigasi (ProfileMenu), kita hanya menggunakan avatar huruf (fallback)
  const avatarUrl = fallbackAvatarUrl

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <div 
        className="w-9 h-9 rounded-full bg-gray-600 overflow-hidden border border-gray-500 cursor-pointer transition hover:border-yellow-400"
        onClick={() => setIsOpen(!isOpen)}
        title="Menu Profil"
      >
        <AuthImage src={avatarUrl} fallbackSrc={fallbackAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0f1626] border border-gray-800 rounded-lg shadow-xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-gray-800">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
          </div>
          {user?.role && (
            <button 
              onClick={() => {
                setIsOpen(false)
                navigate(`/${user.role}/profile`)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              Pengaturan Profil
            </button>
          )}
          <button 
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-950/20 hover:text-red-300 transition flex items-center gap-2 border-t border-gray-800/60"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
