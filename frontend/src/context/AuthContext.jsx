import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [latestMessage, setLatestMessage] = useState(null)

  const fetchCounts = useCallback(async () => {
    if (!user) return
    try {
      const [chatRes, notifRes] = await Promise.all([
        api.get('/chat/unread'),
        api.get('/notifikasi/')
      ])
      setUnreadChatCount(chatRes.data.unread)
      setUnreadNotifCount(notifRes.data.filter(n => !n.is_read).length)
    } catch (e) {
      console.error('Failed to fetch initial counts', e)
    }
  }, [user])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  useEffect(() => {
    const username = user?.username
    if (!username) return
    let ws = null
    let pingInterval = null
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(`${protocol}//${window.location.host}/api/chat/ws/${username}`)
      
      ws.onopen = () => {
        // Send a ping every 30 seconds to keep Cloudflare Tunnel connection alive
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }
      
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'chat') {
            setUnreadChatCount(prev => prev + 1)
            setLatestMessage(payload.data)
          } else if (payload.type === 'notifikasi') {
            setUnreadNotifCount(prev => prev + 1)
          }
        } catch (e) {
          console.error('WebSocket payload error:', e)
        }
      }
      ws.onclose = () => {
        if (pingInterval) clearInterval(pingInterval)
        setTimeout(() => { if (user?.username) connect() }, 3000)
      }
    }
    connect()

    return () => {
      if (pingInterval) clearInterval(pingInterval)
      if (ws) {
        ws.onclose = null
        ws.close()
      }
    }
  }, [user?.username])

  const login = useCallback(async (username, password, rememberMe) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password, remember_me: rememberMe })
      localStorage.setItem('access_token', data.access_token)

      // Fetch full profile after token is stored
      const { data: profile } = await api.get('/auth/me')
      localStorage.setItem('user', JSON.stringify(profile))
      setUser(profile)
      return { success: true, role: profile.role }
    } catch (err) {
      const msg =
        err.response?.data?.detail || 'Terjadi kesalahan. Coba lagi.'
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const updateUser = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, logout, updateUser,
      unreadChatCount, setUnreadChatCount,
      unreadNotifCount, setUnreadNotifCount,
      fetchCounts,
      latestMessage
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
