import { useState, useEffect } from 'react'
import api, { openSecureFile } from '../services/api'
import { useAuth } from '../context/AuthContext'
import AuthImage from '../components/AuthImage'
import { compressImage } from '../utils/imageCompressor'

export default function ProfileMahasiswa() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me')
      setProfile(res.data)
    } catch (err) {
      console.error("Gagal mendapatkan profil:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleFileUpload = async (e, type) => {
    let file = e.target.files[0]
    if (!file) return

    setUploading(true)

    if (type === 'foto_profile') {
      try {
        file = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 })
      } catch (err) {
        console.error("Gagal mengompres gambar, menggunakan file asli:", err)
      }
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post(`/profile/upload/${type}`, formData)
      if (type === 'foto_profile') {
        // optimistically fetch and update user context too
        const profileRes = await api.get('/profile/me')
        if (profileRes.data.foto_profile) {
          updateUser({ foto_profile: profileRes.data.foto_profile })
        }
      }
      alert('Berhasil mengunggah file!')
      fetchProfile()
    } catch (err) {
      console.error(err)
      alert('Gagal mengunggah file.')
    } finally {
      setUploading(false)
      e.target.value = null // reset input
    }
  }

  const handleDeleteFile = async (fileType) => {
    const label = fileType === 'foto_profile' ? 'Foto Profil' : fileType === 'cv_path' ? 'CV' : 'Transkrip Nilai'
    if (!confirm(`Apakah Anda yakin ingin menghapus ${label}?`)) return
    
    try {
      setUploading(true)
      await api.delete(`/profile/upload/${fileType}`)
      if (fileType === 'foto_profile') {
        updateUser({ foto_profile: null })
      }
      fetchProfile()
    } catch (error) {
      console.error('Delete error:', error)
      alert(error.response?.data?.detail || 'Gagal menghapus file')
    } finally {
      setUploading(false)
    }
  }



  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=random`
  
  const avatarUrl = profile?.foto_profile || fallbackAvatarUrl

  if (loading) {
    return (
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex items-center justify-center">
        <div className="text-gray-400">Memuat profil...</div>
      </main>
    )
  }

  return (
    <main className="flex-grow max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 mt-4">
        <div className="bg-[#0f1626] rounded-xl p-6 md:p-10 border border-gray-800 shadow-xl">
          <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
            <h2 className="text-2xl font-bold text-yellow-400">Profil Mahasiswa</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Kolom Kiri: Avatar & Info Dasar */}
            <div className="md:col-span-1 flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-gray-400 bg-gray-700 shadow-lg">
                  <AuthImage src={avatarUrl} fallbackSrc={fallbackAvatarUrl} alt="Profil" className="w-full h-full object-cover" />
                </div>
                <label className="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col items-center justify-center rounded-full cursor-pointer transition">
                  <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span className="text-xs font-semibold text-white">Ubah Foto</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'foto_profile')} disabled={uploading} />
                </label>
              </div>
              {profile?.foto_profile && (
                <button 
                  onClick={() => handleDeleteFile('foto_profile')}
                  className="text-xs text-red-400 hover:text-red-300 underline font-medium mt-1 transition"
                  disabled={uploading}
                >
                  Hapus Foto
                </button>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{profile?.full_name}</h3>
                <p className="text-gray-400">{profile?.nim}</p>
                <span className="inline-block mt-2 px-4 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold border border-yellow-500/30">
                  {profile?.role.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Kolom Kanan: Info Detail & Dokumen */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="bg-[#1e2638] rounded-xl p-6 border border-gray-700 shadow-md">
                <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Informasi Akun
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white font-medium">{profile?.email || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-3">
                    <span className="text-gray-400">NIM</span>
                    <span className="text-white font-medium">{profile?.nim || '-'}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-400">Jumlah Lamaran Diajukan</span>
                    <span className="text-yellow-400 font-bold text-base">{profile?.jumlah_lamaran}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e2638] rounded-xl p-6 border border-gray-700 shadow-md">
                <h4 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Dokumen Pendukung
                </h4>
                <div className="space-y-4">
                  
                  {/* CV Upload */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0f1626] rounded-lg border border-gray-800 gap-4">
                    <div>
                      <p className="font-semibold text-white text-sm mb-1">Curriculum Vitae (CV)</p>
                      {profile?.cv_path ? (
                        <div className="flex items-center gap-3">
                          <button onClick={() => openSecureFile(profile.cv_path)} className="text-xs text-blue-400 hover:text-blue-300 underline font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            Lihat CV
                          </button>
                          <span className="text-gray-600">|</span>
                          <button onClick={() => handleDeleteFile('cv_path')} className="text-xs text-red-400 hover:text-red-300 underline font-medium" disabled={uploading}>
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-red-400">Belum ada dokumen CV</p>
                      )}
                    </div>
                    <label className={`cursor-pointer px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded-lg transition whitespace-nowrap text-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading ? 'Mengunggah...' : 'Unggah CV'}
                      <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, 'cv_path')} disabled={uploading} />
                    </label>
                  </div>

                  {/* Transkrip Upload */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0f1626] rounded-lg border border-gray-800 gap-4">
                    <div>
                      <p className="font-semibold text-white text-sm mb-1">Transkrip Nilai</p>
                      {profile?.transkrip_path ? (
                        <div className="flex items-center gap-3">
                          <button onClick={() => openSecureFile(profile.transkrip_path)} className="text-xs text-blue-400 hover:text-blue-300 underline font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            Lihat Transkrip
                          </button>
                          <span className="text-gray-600">|</span>
                          <button onClick={() => handleDeleteFile('transkrip_path')} className="text-xs text-red-400 hover:text-red-300 underline font-medium" disabled={uploading}>
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-red-400">Belum ada dokumen Transkrip</p>
                      )}
                    </div>
                    <label className={`cursor-pointer px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded-lg transition whitespace-nowrap text-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploading ? 'Mengunggah...' : 'Unggah Transkrip'}
                      <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, 'transkrip_path')} disabled={uploading} />
                    </label>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
  )
}
