import { useState, useEffect } from 'react'
import axios from 'axios'

// Cache global untuk menyimpan URL Object (blob) dan request yang sedang berjalan
const imageCache = new Map()
const pendingRequests = new Map()

export default function AuthImage({ src, alt, className, fallbackSrc }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchImage = async () => {
      if (!src) {
        if (isMounted) {
          setImageSrc(fallbackSrc)
          setLoading(false)
        }
        return
      }
      
      // Jika src adalah URL eksternal biasa (misal UI Avatars), langsung gunakan
      if (src.startsWith('http') && !src.includes('localhost:8000') && !src.startsWith('/uploads')) {
        if (isMounted) {
          setImageSrc(src)
          setLoading(false)
        }
        return
      }

      // 1. Cek apakah gambar sudah ada di cache
      if (imageCache.has(src)) {
        if (isMounted) {
          setImageSrc(imageCache.get(src))
          setLoading(false)
        }
        return
      }

      // 2. Cek apakah sedang ada request yang berjalan untuk src yang sama
      if (pendingRequests.has(src)) {
        try {
          const objectUrl = await pendingRequests.get(src)
          if (isMounted) {
            setImageSrc(objectUrl)
            setLoading(false)
          }
        } catch (err) {
          if (isMounted) {
            setImageSrc(fallbackSrc)
            setLoading(false)
          }
        }
        return
      }

      // 3. Jika belum ada, buat request baru
      const token = localStorage.getItem('access_token')
      
      // Karena src mungkin berupa '/uploads/...', pastikan diarahkan ke backend (agricareer.site)
      // bukan ke frontend (agricareer.pages.dev)
      const backendRoot = 'https://agricareer.site'
      const fullUrl = src.startsWith('/uploads') ? backendRoot + src : src

      const requestPromise = axios.get(fullUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob'
      }).then(response => {
        const objectUrl = URL.createObjectURL(response.data)
        imageCache.set(src, objectUrl)
        return objectUrl
      })

      // Simpan promise ke pendingRequests
      pendingRequests.set(src, requestPromise)

      try {
        const objectUrl = await requestPromise
        if (isMounted) {
          setImageSrc(objectUrl)
        }
      } catch (err) {
        console.error('Gagal memuat gambar terautentikasi:', err)
        if (isMounted) {
          setImageSrc(fallbackSrc)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
        // Hapus dari pending setelah selesai
        pendingRequests.delete(src)
      }
    }

    fetchImage()

    return () => {
      isMounted = false
    }
  }, [src, fallbackSrc])

  if (loading) {
    return <div className={`animate-pulse bg-gray-600 ${className}`}></div>
  }

  return <img src={imageSrc} alt={alt} className={className} />
}
