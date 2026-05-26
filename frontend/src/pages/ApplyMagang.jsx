import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ApplyMagang() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lowonganData = location.state?.lowonganData;
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [profileData, setProfileData] = useState(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvBlobUrl, setCvBlobUrl] = useState(null);

  useEffect(() => {
    fetchProfile();
    return () => {
      // Cleanup object URL on unmount
      if (cvBlobUrl) {
        URL.revokeObjectURL(cvBlobUrl);
      }
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile/me');
      setProfileData(data);
      
      if (data.cv_path) {
        const res = await api.get(data.cv_path, { responseType: 'blob' });
        const url = URL.createObjectURL(res.data);
        setCvBlobUrl(oldUrl => {
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          return url;
        });
      }
    } catch (err) {
      console.error('Gagal mengambil data profil atau CV', err);
    }
  };

  const [selectedPosition, setSelectedPosition] = useState(
    location.state?.selectedPosition || 
    (lowonganData?.posisi ? lowonganData.posisi.split(',')[0].trim() : '')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const positions = lowonganData?.posisi ? lowonganData.posisi.split(',').map(p => p.trim()) : [];

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      await uploadCv(file);
    }
  };

  const uploadCv = async (file) => {
    setIsUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/profile/upload/cv_path', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('CV berhasil diperbarui!');
      await fetchProfile(); // Refresh profile to show new CV preview
    } catch (err) {
      console.error('Gagal mengunggah CV', err);
      alert('Gagal mengunggah CV. Silakan coba lagi.');
    } finally {
      setIsUploadingCv(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!lowonganData) {
      setSubmitError('Data lowongan tidak valid.');
      return;
    }
    
    // Pastikan user memiliki CV
    if (!profileData?.cv_path && !selectedFile) {
      setSubmitError('Anda harus memiliki CV yang terunggah sebelum mengirim lamaran.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await api.post('/lamaran/', {
        id_lowongan: lowonganData.id,
        posisi: selectedPosition
      });
      alert('Lamaran berhasil dikirim!');
      navigate('/mahasiswa/lamaran');
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Terjadi kesalahan saat melamar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <main className="flex-grow max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 mt-4">
        {/* Judul Halaman */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#facc15]">Pengajuan Lamaran</h1>
        </div>

        {/* Card Form */}
        <form onSubmit={handleSubmit} className="bg-[#131927] border border-slate-700 rounded-xl p-8 shadow-lg">
          {submitError && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
              {submitError}
            </div>
          )}

          {/* Header Info Perusahaan */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full border border-slate-500 flex-shrink-0 flex items-center justify-center overflow-hidden bg-slate-800">
              <span className="text-xl font-bold text-slate-400">
                {lowonganData?.perusahaan ? lowonganData.perusahaan.charAt(0) : 'B'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {lowonganData?.perusahaan || 'Perusahaan Tidak Ditemukan'}
              </h2>
              <p className="text-sm text-slate-400">
                {lowonganData?.lokasi || 'Lokasi tidak tersedia'}
              </p>
            </div>
          </div>

          {/* Info Timeline & Dropdown Posisi */}
          <div className="mb-6 space-y-4 text-sm text-slate-300">
            <div>
              <label className="block text-yellow-400 font-medium mb-1">Pilih Posisi yang Dilamar:</label>
              {positions.length > 1 ? (
                <select 
                  value={selectedPosition} 
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full md:w-1/2 bg-slate-800 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-yellow-400"
                  required
                >
                  <option value="" disabled>Pilih Posisi</option>
                  {positions.map((pos, idx) => (
                    <option key={idx} value={pos}>{pos}</option>
                  ))}
                </select>
              ) : (
                <p className="p-2 bg-slate-800 border border-slate-600 rounded text-white md:w-1/2">{selectedPosition || 'Tidak diketahui'}</p>
              )}
            </div>
            <p>Batas Akhir Lamaran: {lowonganData?.tanggal_tutup || 'Tidak ditentukan'}</p>
          </div>

          {/* Deskripsi Label & Konten */}
          <div className="mb-8">
            <h3 className="text-base font-medium mb-2">Deskripsi Pekerjaan</h3>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {lowonganData?.deskripsi || 'Deskripsi pekerjaan tidak tersedia.'}
              </p>
            </div>
          </div>

          {/* Upload & Preview CV Area */}
          <div className="mb-8">
            <h3 className="text-base font-medium mb-4 border-b border-gray-700 pb-2">Dokumen CV (Curriculum Vitae)</h3>
            
            <div className="bg-[#171e2e] border border-slate-600 rounded-lg p-6 flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Preview CV Saat Ini
                </h4>
                
                <label className={`relative flex items-center gap-2 px-4 py-2 rounded-md transition-colors cursor-pointer text-sm font-semibold ${isUploadingCv ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {isUploadingCv ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Perbarui CV
                    </>
                  )}
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={isUploadingCv} />
                </label>
              </div>
              
              <div className="w-full bg-white rounded flex items-center justify-center overflow-hidden h-[500px] border border-gray-400 relative">
                {cvBlobUrl ? (
                  <iframe 
                    src={cvBlobUrl} 
                    className="w-full h-full"
                    title="CV Preview"
                  />
                ) : (
                  <div className="text-gray-500 text-sm flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Belum ada CV yang diunggah
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-700 mt-6">
            <button 
              type="submit" 
              disabled={isSubmitting || isUploadingCv || (!profileData?.cv_path && !selectedFile)}
              className={`px-8 py-3 rounded-md transition-colors font-bold text-sm uppercase tracking-wide shadow-lg ${isSubmitting || isUploadingCv || (!profileData?.cv_path && !selectedFile) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-500 hover:shadow-yellow-400/20'}`}
            >
              {isSubmitting ? 'Memproses Lamaran...' : 'Kirim Lamaran Sekarang'}
            </button>
          </div>

        </form>
      </main>
  );
}