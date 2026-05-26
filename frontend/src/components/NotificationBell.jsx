import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function formatWaktuRelatif(isoString) {
  if (!isoString) return ''
  // Handle space separator if SQLite returns YYYY-MM-DD HH:MM:SS
  const normalizedString = String(isoString).replace(' ', 'T')
  const date = new Date(normalizedString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 5) return 'Baru saja'
  if (diffSec < 60) return `${diffSec} detik yang lalu`
  if (diffMin < 60) return `${diffMin} menit yang lalu`
  if (diffHour < 24) return `${diffHour} jam yang lalu`
  if (diffDay < 7) return `${diffDay} hari yang lalu`
  
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotificationBell() {
  const { unreadNotifCount, setUnreadNotifCount } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifikasi/')
      setNotifications(res.data)
    } catch (err) {
      console.error('Gagal mengambil notifikasi:', err)
    }
  }

  // Fetch notifications only when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifikasi/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
      setUnreadNotifCount(0)
    } catch (err) {
      console.error('Gagal menandai semua dibaca:', err)
    }
  }

  const handleNotificationClick = async (notif) => {
    setIsOpen(false)
    if (!notif.is_read) {
      try {
        await api.put(`/notifikasi/${notif.id}/read`)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
        )
        setUnreadNotifCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Gagal menandai notifikasi terbaca:', err)
      }
    }
    if (notif.link_path) {
      navigate(notif.link_path)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white transition relative p-2 rounded-full hover:bg-gray-800/40"
        title="Pemberitahuan"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadNotifCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0f1626]">
            {unreadNotifCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0f1626] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Dropdown Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800 bg-[#161f30]">
            <h4 className="text-sm font-semibold text-white">Notifikasi</h4>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadNotifCount === 0}
              className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 disabled:text-gray-600 disabled:cursor-not-allowed transition"
            >
              Tandai semua dibaca
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/50 custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex flex-col p-4 hover:bg-[#1a2336] transition cursor-pointer text-left relative ${
                    !notif.is_read ? 'bg-[#131b2b]' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        notif.judul.includes('Diterima')
                          ? 'text-green-400'
                          : notif.judul.includes('Ditolak') || notif.judul.includes('Deadline')
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}
                    >
                      {notif.judul}
                    </span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {formatWaktuRelatif(notif.tanggal_dibuat)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1.5 leading-relaxed font-normal">
                    {notif.pesan}
                  </p>
                  {!notif.is_read && (
                    <span className="absolute right-3 bottom-3 w-2 h-2 rounded-full bg-blue-500"></span>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500 text-xs">
                Tidak ada notifikasi baru saat ini.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
