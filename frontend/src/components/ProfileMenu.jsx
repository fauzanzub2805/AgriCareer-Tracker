import { useState, useRef, useEffect } from 'react'

export default function ProfileMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const dropdownRef = useRef(null)

  const avatarUrl = user?.full_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`
    : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'

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
        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0f1626] border border-gray-800 rounded-lg shadow-xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-2 border-b border-gray-800">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 truncate">@{user?.username}</p>
          </div>
          <button 
            onClick={() => {
              setIsOpen(false)
              setShowModal(true)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Lihat Profil
          </button>
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

      {/* Profile Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
          <div className="bg-[#1e2638] rounded-xl border border-gray-700 shadow-2xl w-full max-w-md overflow-hidden text-white">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#0f1626]">
              <h3 className="text-lg font-bold text-yellow-400">Profil Saya</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-gray-800">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-400">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-bold text-white">{user?.full_name}</h4>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-y-3 text-sm">
                <div className="text-gray-400 font-medium col-span-1">Username</div>
                <div className="text-white col-span-2">@{user?.username}</div>

                <div className="text-gray-400 font-medium col-span-1">Email</div>
                <div className="text-white col-span-2 truncate">{user?.email || '-'}</div>

                {user?.role === 'mahasiswa' && (
                  <>
                    <div className="text-gray-400 font-medium col-span-1">NIM</div>
                    <div className="text-white col-span-2">{user?.nim || '-'}</div>
                  </>
                )}

                {user?.role === 'dosen' && (
                  <>
                    <div className="text-gray-400 font-medium col-span-1">NIP</div>
                    <div className="text-white col-span-2">{user?.nip || '-'}</div>
                  </>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-lg text-sm font-semibold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
