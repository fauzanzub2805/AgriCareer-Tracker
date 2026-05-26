import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const openSecureFile = async (url) => {
  try {
    const token = localStorage.getItem('access_token')
    const res = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: 'blob'
    })
    const objectUrl = URL.createObjectURL(res.data)
    window.open(objectUrl, '_blank')
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
  } catch (err) {
    console.error('Gagal membuka file:', err)
    alert('Gagal membuka file. Anda mungkin tidak memiliki akses.')
  }
}

export default api
