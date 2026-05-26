import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AuthImage({ src, alt, className, fallbackSrc }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let objectUrl = null

    const fetchImage = async () => {
      if (!src) {
        setImageSrc(fallbackSrc)
        setLoading(false)
        return
      }
      
      // Jika src adalah URL eksternal biasa (misal UI Avatars), langsung gunakan
      if (src.startsWith('http') && !src.includes('localhost:8000') && !src.startsWith('/uploads')) {
        setImageSrc(src)
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('access_token')
        const response = await axios.get(src, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          responseType: 'blob'
        })
        
        objectUrl = URL.createObjectURL(response.data)
        setImageSrc(objectUrl)
      } catch (err) {
        console.error('Gagal memuat gambar terautentikasi:', err)
        setImageSrc(fallbackSrc)
      } finally {
        setLoading(false)
      }
    }

    fetchImage()

    // Cleanup memory URL
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [src, fallbackSrc])

  if (loading) {
    return <div className={`animate-pulse bg-gray-600 ${className}`}></div>
  }

  return <img src={imageSrc} alt={alt} className={className} />
}
