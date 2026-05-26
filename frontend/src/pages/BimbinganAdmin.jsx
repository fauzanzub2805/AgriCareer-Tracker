import { useState, useEffect } from 'react'
import api from '../services/api'

export default function BimbinganAdmin() {
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMahasiswa, setEditingMahasiswa] = useState(null)
  const [selectedDosen, setSelectedDosen] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/')
      setUsersList(response.data)
    } catch (err) {
      console.error("Gagal mendapatkan data pengguna:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDosen = async () => {
    if (!editingMahasiswa) return
    try {
      await api.put(`/users/${editingMahasiswa}/dosen`, { dosen_pembimbing: selectedDosen || null })
      alert('Berhasil memperbarui dosen pembimbing')
      setEditingMahasiswa(null)
      setSelectedDosen("")
      fetchUsers()
    } catch (err) {
      console.error("Gagal memperbarui dosen:", err)
      alert(err.response?.data?.detail || "Gagal memperbarui dosen pembimbing.")
    }
  }



  const mahasiswaList = usersList.filter(u => u.role === 'mahasiswa')
  const dosenList = usersList.filter(u => u.role === 'dosen')

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">Manajemen Dosen Pembimbing</h2>
              <p className="text-xs sm:text-sm text-gray-400">Kelola dan tetapkan Dosen Pembimbing untuk setiap mahasiswa</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs sm:text-sm">
                  <th className="py-3 px-2 sm:px-4 font-medium w-1/3 sm:w-1/3">Mahasiswa</th>
                  <th className="py-3 px-2 sm:px-4 font-medium sm:w-1/6 hidden sm:table-cell">NIM</th>
                  <th className="py-3 px-2 sm:px-4 font-medium w-1/2 sm:w-1/3">Dosen Pembimbing</th>
                  <th className="py-3 px-2 sm:px-4 font-medium text-right w-1/6 sm:w-1/6">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {loading ? (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-500">Memuat data...</td></tr>
                ) : mahasiswaList.length > 0 ? mahasiswaList.map((m, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-4 px-2 sm:px-4 font-medium text-white">{m.full_name}</td>
                    <td className="py-4 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">{m.nim || '-'}</td>
                    <td className="py-4 px-2 sm:px-4">
                      {editingMahasiswa === m.username ? (
                        <select 
                          className="bg-gray-800 border border-gray-600 text-white text-xs sm:text-sm rounded focus:ring-yellow-500 focus:border-yellow-500 block w-full p-1.5 sm:p-2 truncate"
                          value={selectedDosen}
                          onChange={(e) => setSelectedDosen(e.target.value)}
                        >
                          <option value="">-- Pilih Dosen --</option>
                          {dosenList.map(d => (
                            <option key={d.username} value={d.username}>{d.full_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={m.dosen_pembimbing ? 'text-blue-400 font-medium' : 'text-red-400 italic'}>
                          {m.nama_dosen_pembimbing || 'Belum Diatur'}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-2 sm:px-4 text-right whitespace-nowrap">
                      {editingMahasiswa === m.username ? (
                        <div className="flex justify-end gap-1 sm:gap-2 flex-col sm:flex-row">
                          <button onClick={handleUpdateDosen} className="text-green-400 hover:text-green-300 font-medium text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border border-green-500/50 rounded transition">Simpan</button>
                          <button onClick={() => setEditingMahasiswa(null)} className="text-gray-400 hover:text-gray-300 font-medium text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-500/50 rounded transition">Batal</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingMahasiswa(m.username)
                            setSelectedDosen(m.dosen_pembimbing || "")
                          }}
                          className="text-yellow-400 hover:text-yellow-300 transition font-medium text-[10px] sm:text-xs border border-yellow-500/50 hover:bg-yellow-500/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="py-8 text-center text-gray-500">Tidak ada data mahasiswa.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
  )
}
