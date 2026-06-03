import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function FormLowonganAdmin() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    perusahaan: '',
    posisi: '',
    lokasi: '',
    deskripsi: '',
    tanggal_tutup: '',
    status_aktif: true,
    banner_path: '',
    persyaratan: '',
    benefit: ''
  })
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  useEffect(() => {
    if (isEdit) {
      fetchLowongan()
    }
  }, [id])

  const fetchLowongan = async () => {
    try {
      setLoading(true)
      const res = await api.get('/lowongan/')
      const found = res.data.find(l => String(l.id) === String(id))
      if (found) {
        setForm({
          perusahaan: found.perusahaan || '',
          posisi: found.posisi || '',
          lokasi: found.lokasi || '',
          deskripsi: found.deskripsi || '',
          tanggal_tutup: found.tanggal_tutup || '',
          status_aktif: found.status_aktif === 1 || found.status_aktif === true,
          banner_path: found.banner_path || '',
          persyaratan: found.persyaratan || '',
          benefit: found.benefit || ''
        })
      } else {
        alert('Data lowongan tidak ditemukan.')
        navigate('/admin/lowongan')
      }
    } catch (err) {
      console.error(err)
      alert('Gagal mengambil data lowongan.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    
    try {
      setUploadingBanner(true)
      const res = await api.post('/lowongan/upload-banner', formData)
      setForm(prev => ({ ...prev, banner_path: res.data.url }))
    } catch (err) {
      console.error('Upload error', err)
      alert('Gagal mengunggah banner.')
    } finally {
      setUploadingBanner(false)
      e.target.value = null
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      if (isEdit) {
        await api.put(`/lowongan/${id}`, form)
        alert('Lowongan berhasil diperbarui.')
      } else {
        await api.post('/lowongan/', form)
        alert('Lowongan berhasil ditambahkan.')
      }
      navigate('/admin/lowongan')
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Gagal menyimpan lowongan.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex justify-center items-center">
        <div className="text-gray-400">Memuat data...</div>
      </main>
    )
  }

  return (
    <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 mt-4">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/admin/lowongan" className="text-gray-400 hover:text-yellow-400 transition flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Kembali
        </Link>
      </div>

      <div className="bg-[#0f1626] rounded-xl p-6 sm:p-8 border border-gray-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 pb-4 border-b border-gray-800">
          {isEdit ? 'Edit Lowongan Magang' : 'Buat Lowongan Magang Baru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Foto Background / Banner</label>
            <div className="w-full h-48 bg-[#1e2638] rounded-xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center relative overflow-hidden group">
              {form.banner_path ? (
                <>
                  <img src={form.banner_path} alt="Banner Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <label className="cursor-pointer bg-yellow-500 text-gray-900 px-4 py-2 rounded font-semibold text-sm">
                      {uploadingBanner ? 'Mengunggah...' : 'Ganti Gambar'}
                      <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} />
                    </label>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400 mb-2">Belum ada banner yang dipilih.</p>
                  <label className="cursor-pointer text-yellow-400 hover:text-yellow-300 underline text-sm">
                    {uploadingBanner ? 'Mengunggah...' : 'Pilih Gambar'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Perusahaan</label>
              <input required type="text" name="perusahaan" value={form.perusahaan} onChange={handleChange} className="w-full bg-[#1e2638] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Posisi</label>
              <input required type="text" name="posisi" value={form.posisi} onChange={handleChange} className="w-full bg-[#1e2638] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" placeholder="Contoh: Software Engineer, UI/UX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Lokasi</label>
              <input required type="text" name="lokasi" value={form.lokasi} onChange={handleChange} className="w-full bg-[#1e2638] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tenggat Waktu</label>
              <input required type="date" name="tanggal_tutup" value={form.tanggal_tutup} onChange={handleChange} className="w-full bg-[#1e2638] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 transition [color-scheme:dark]" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Deskripsi Pekerjaan</label>
            <textarea required name="deskripsi" value={form.deskripsi} onChange={handleChange} rows="4" className="w-full bg-[#1e2638] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition" placeholder="Jelaskan secara singkat tentang pekerjaan ini..."></textarea>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Persyaratan (Opsional)</label>
            <textarea name="persyaratan" value={form.persyaratan} onChange={handleChange} rows="4" className="w-full bg-[#1e2638] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition" placeholder="Syarat-syarat yang harus dipenuhi oleh pendaftar..."></textarea>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Benefit (Opsional)</label>
            <textarea name="benefit" value={form.benefit} onChange={handleChange} rows="3" className="w-full bg-[#1e2638] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition" placeholder="Keuntungan magang (Uang saku, sertifikat, mentor)..."></textarea>
          </div>

          <div className="flex items-center pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-300">
              <input type="checkbox" name="status_aktif" checked={form.status_aktif} onChange={handleChange} className="w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-[#1e2638]" />
              Status Lowongan Aktif
            </label>
          </div>

          <div className="pt-6 border-t border-gray-800 flex justify-end gap-4">
            <Link to="/admin/lowongan" className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition">
              Batal
            </Link>
            <button type="submit" disabled={submitting || uploadingBanner} className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition ${submitting || uploadingBanner ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}>
              {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Terbitkan Lowongan')}
            </button>
          </div>

        </form>
      </div>
    </main>
  )
}
