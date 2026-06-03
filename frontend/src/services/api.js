import axios from 'axios'

const api = axios.create({
  baseURL: 'https://agricareer.site/api',
})

// Menyimpan rata-rata durasi request (default 133ms agar 133 * 3 ~= 400ms)
let averageRequestTime = 133;

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Pengecualian timeout untuk endpoint yang lambat
  if (config.url && (config.url.includes('/login') || config.url.includes('/register') || config.url.includes('/forgot-password') || config.url.includes('/upload'))) {
    config.timeout = 15000; // 15 detik khusus untuk endpoint lambat
  } else {
    // Set timeout dinamis: 3x lipat dari rata-rata waktu request 
    // (minimal 250ms, maksimal 15 detik)
    const dynamicTimeout = Math.max(250, Math.min(Math.round(averageRequestTime * 3), 15000));
    config.timeout = dynamicTimeout;
  }

  // Catat waktu mulai request untuk menghitung durasi nanti
  config.metadata = { startTime: new Date() }

  return config
})

// Handle timeout retry and redirect to login on 401
api.interceptors.response.use(
  (res) => {
    // Perbarui rata-rata kecepatan koneksi (Exponential Moving Average) saat sukses
    if (res.config && res.config.metadata && res.config.metadata.startTime) {
      const duration = new Date() - res.config.metadata.startTime;
      // 80% rata-rata lama + 20% durasi baru
      averageRequestTime = (averageRequestTime * 0.8) + (duration * 0.2);
    }
    return res;
  },
  async (err) => {
    const config = err.config;

    // Langsung meminta ulang (retry) jika request timeout
    if (config && (err.code === 'ECONNABORTED' || err.message.toLowerCase().includes('timeout'))) {
      if (!config._retryCount) {
        config._retryCount = 0;
      }

      // Jika terjadi timeout, artinya koneksi melambat dari rata-rata biasanya.
      // Kita kalikan rata-rata dengan 1.5 agar percobaan ulang (retry) memiliki timeout lebih longgar.
      averageRequestTime = averageRequestTime * 1.5;

      // Batasi retry maksimal 3 kali agar tidak infinite loop jika server benar-benar down
      if (config._retryCount < 3) {
        config._retryCount += 1;
        return api(config);
      }
    }

    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const openSecureFile = async (url) => {
  // Buka tab baru WAKTU INI JUGA secara instan untuk responsivitas UX
  const newWindow = window.open('', '_blank')
  newWindow.document.write('<body style="margin:0;background-color:#0f1626;"><div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#e5e7eb;font-family:sans-serif;">Mendownload file, harap tunggu...</div></body>')

  try {
    const token = localStorage.getItem('access_token')
    const cacheBuster = url.includes('?') ? `&t=${new Date().getTime()}` : `?t=${new Date().getTime()}`

    // Pastikan URL mengarah ke backend jika itu adalah file lokal
    const backendRoot = 'https://agricareer.site'
    const fullUrl = url.startsWith('/uploads') ? backendRoot + url : url

    const res = await axios.get(fullUrl + cacheBuster, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: 'blob'
    })

    const type = url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : res.headers['content-type']
    const blob = new Blob([res.data], { type })
    const objectUrl = URL.createObjectURL(blob)

    // Arahkan tab baru yang tadi menampilkan loading ke PDF blob
    newWindow.location.href = objectUrl

    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
  } catch (err) {
    console.error('Gagal membuka file:', err)
    newWindow.close() // Tutup tab loading jika gagal
    alert('Gagal membuka file. Anda mungkin tidak memiliki akses.')
  }
}

export default api