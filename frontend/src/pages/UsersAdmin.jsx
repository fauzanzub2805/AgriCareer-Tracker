import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import ProfileMenu from '../components/ProfileMenu'

export default function UsersAdmin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [usersList, setUsersList] = useState([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/')
      setUsersList(response.data)
    } catch (err) {
      console.error("Gagal mendapatkan data pengguna:", err)
    }
  }

  const handleUpdateRole = async (username, currentRole) => {
    const newRole = currentRole === 'mahasiswa' ? 'dosen' : 'mahasiswa'
    if (!window.confirm(`Apakah Anda yakin ingin mengubah peran ${username} menjadi ${newRole}?`)) return
    
    try {
      await api.put(`/users/${username}/role`, { role: newRole })
      alert(`Berhasil memperbarui peran menjadi ${newRole}`)
      fetchUsers()
    } catch (err) {
      console.error("Gagal memperbarui peran:", err)
      alert("Gagal memperbarui peran.")
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const avatarUrl = user?.full_name 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=random`
    : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'

  return (
    <div className="font-['Poppins'] bg-[#1e2638] text-white min-h-screen flex flex-col antialiased">
      <nav className="bg-[#0f1626] border-b border-gray-800 px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/admin/dashboard" className="flex items-center gap-3 hover:opacity-90 transition">
            <div className="w-10 h-10 bg-blue-900 rounded-full border border-gray-600 flex items-center justify-center overflow-hidden">
              <img 
                src="/Institut_Pertanian_Bogor_logo.png" 
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
              <li><Link to="/admin/dashboard" className="text-gray-300 hover:text-white transition">Beranda</Link></li>
              <li><Link to="/admin/users" className="text-yellow-400">Kelola Pengguna</Link></li>
              <li><Link to="/admin/lowongan" className="text-gray-300 hover:text-white transition">Lowongan Magang</Link></li>
            </ul>

            <div className="flex items-center gap-5">
              <button className="text-gray-400 hover:text-white transition relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-[#0f1626] bg-red-500"></span>
              </button>
              <ProfileMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Manajemen Pengguna</h2>
              <p className="text-sm text-gray-400">Kelola akun dosen, mahasiswa, dan administrator</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Nama Lengkap</th>
                  <th className="py-3 px-4 font-medium">Username</th>
                  <th className="py-3 px-4 font-medium">Peran</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {usersList.length > 0 ? usersList.map((u, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-4 px-4 font-medium text-white">{u.full_name}</td>
                    <td className="py-4 px-4 text-gray-400">{u.username}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-red-900/40 text-red-400' :
                        u.role === 'dosen' ? 'bg-purple-900/40 text-purple-400' :
                        'bg-blue-900/40 text-blue-400'
                      }`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={u.disabled ? 'text-red-400' : 'text-green-400'}>
                        {u.disabled ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {u.role === 'admin' ? (
                        <span className="text-gray-600 text-xs italic">Akses Tetap</span>
                      ) : (
                        <button 
                          onClick={() => handleUpdateRole(u.username, u.role)}
                          className="text-yellow-400 hover:text-yellow-300 transition font-medium text-xs border border-yellow-500/50 hover:bg-yellow-500/10 px-3 py-1.5 rounded"
                        >
                          {u.role === 'mahasiswa' ? 'Upgrade ke Dosen' : 'Jadikan Mahasiswa'}
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">Memuat data pengguna...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}