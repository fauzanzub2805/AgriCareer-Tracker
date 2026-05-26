import { useState, useEffect } from 'react'
import api from '../services/api'

export default function PengumumanAdmin() {
  const [pengumumanList, setPengumumanList] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    judul: '', isi: ''
  })

  useEffect(() => {
    fetchPengumuman()
  }, [])

  const fetchPengumuman = async () => {
    try {
      setLoading(true)
      const response = await api.get('/pengumuman/')
      setPengumumanList(response.data)
    } catch (err) {
      console.error("Gagal mendapatkan data pengumuman:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingId(null)
    setForm({ judul: '', isi: '' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (pengumuman) => {
    setEditingId(pengumuman.id)
    setForm({
      judul: pengumuman.judul,
      isi: pengumuman.isi
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return
    try {
      await api.delete(`/pengumuman/${id}`)
      alert('Pengumuman berhasil dihapus.')
      fetchPengumuman()
    } catch (err) {
      console.error(err)
      alert('Gagal menghapus pengumuman.')
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      if (editingId) {
        await api.put(`/pengumuman/${editingId}`, form)
        alert('Pengumuman berhasil diperbarui.')
      } else {
        await api.post('/pengumuman/', form)
        alert('Pengumuman berhasil ditambahkan.')
      }
      setIsModalOpen(false)
      fetchPengumuman()
    } catch (err) {
      console.error(err)
      alert('Gagal menyimpan pengumuman.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-[#0f1626] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1">Manajemen Pengumuman</h2>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Kelola pengumuman yang akan tampil di dashboard mahasiswa</p>
              <p className="text-xs sm:text-sm text-gray-400 sm:hidden">Kelola pengumuman dashboard</p>
            </div>
            
            <button 
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold transition shadow-md hover:shadow-lg text-xs sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Tambah Pengumuman</span>
              <span className="sm:hidden">Tambah</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs sm:text-sm">
                  <th className="py-3 px-2 sm:px-4 font-medium w-1/2 sm:w-1/3">Judul Pengumuman</th>
                  <th className="py-3 px-2 sm:px-4 font-medium w-1/4">Tanggal Dibuat</th>
                  <th className="py-3 px-2 sm:px-4 font-medium w-1/4 hidden sm:table-cell">Penulis</th>
                  <th className="py-3 px-2 sm:px-4 font-medium text-right w-1/4 sm:w-1/6">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {loading ? (
                   <tr><td colSpan="4" className="py-8 text-center text-gray-500">Memuat data...</td></tr>
                ) : pengumumanList.length > 0 ? pengumumanList.map(item => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition">
                    <td className="py-4 px-2 sm:px-4">
                      <div className="font-medium text-white line-clamp-2 max-w-[120px] sm:max-w-none">{item.judul}</div>
                    </td>
                    <td className="py-4 px-2 sm:px-4 text-gray-400 whitespace-nowrap">
                      {item.tanggal_dibuat}
                    </td>
                    <td className="py-4 px-2 sm:px-4 text-gray-400 hidden sm:table-cell">
                      {item.penulis || 'Admin'}
                    </td>
                    <td className="py-4 px-2 sm:px-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1 sm:gap-3 flex-col sm:flex-row">
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="text-yellow-400 hover:text-yellow-300 font-medium"
                        >
                          Edit
                        </button>
                        <span className="text-gray-600 hidden sm:inline">|</span>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      Belum ada pengumuman yang ditambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-[#1e2638] rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-[#0f1626]">
              <h3 className="text-xl font-bold text-yellow-400">{editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Judul Pengumuman</label>
                <input required type="text" name="judul" value={form.judul} onChange={handleChange} className="w-full bg-[#0f1626] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" placeholder="Masukkan judul..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Isi Pengumuman</label>
                <textarea required name="isi" value={form.isi} onChange={handleChange} rows="6" className="w-full bg-[#0f1626] border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" placeholder="Tulis detail pengumuman..."></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition">Batal</button>
                <button type="submit" disabled={submitting} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition shadow ${submitting ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}>{editingId ? 'Simpan Perubahan' : 'Terbitkan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
