import { useState, useEffect } from 'react'
import api from '../services/api'

export default function UsersAdmin() {
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



  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">Manajemen Pengguna</h2>
              <p className="text-xs sm:text-sm text-gray-400">Kelola akun dosen, mahasiswa, dan administrator</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs sm:text-sm">
                  <th className="py-3 px-2 sm:px-4 font-medium">Nama Lengkap</th>
                  <th className="py-3 px-2 sm:px-4 font-medium hidden sm:table-cell">Username</th>
                  <th className="py-3 px-2 sm:px-4 font-medium">Peran</th>
                  <th className="py-3 px-2 sm:px-4 font-medium hidden sm:table-cell">Status</th>
                  <th className="py-3 px-2 sm:px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {usersList.length > 0 ? usersList.map((u, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-4 px-2 sm:px-4 font-medium text-white truncate max-w-[120px] sm:max-w-none">{u.full_name}</td>
                    <td className="py-4 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">{u.username}</td>
                    <td className="py-4 px-2 sm:px-4">
                      <span className={`px-2 py-1 rounded text-[10px] sm:text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-red-900/40 text-red-400' :
                        u.role === 'dosen' ? 'bg-purple-900/40 text-purple-400' :
                        'bg-blue-900/40 text-blue-400'
                      }`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-2 sm:px-4 hidden sm:table-cell">
                      <span className={u.disabled ? 'text-red-400' : 'text-green-400'}>
                        {u.disabled ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </td>
                    <td className="py-4 px-2 sm:px-4 text-right whitespace-nowrap">
                      {u.role === 'admin' ? (
                        <span className="text-gray-600 text-[10px] sm:text-xs italic">Akses Tetap</span>
                      ) : (
                        <button 
                          onClick={() => handleUpdateRole(u.username, u.role)}
                          className="text-yellow-400 hover:text-yellow-300 transition font-medium text-[10px] sm:text-xs border border-yellow-500/50 hover:bg-yellow-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded"
                        >
                          {u.role === 'mahasiswa' ? 'Ke Dosen' : 'Ke Mhs'}
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
  )
}