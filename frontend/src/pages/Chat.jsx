import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AuthImage from '../components/AuthImage'
import { encryptMessage, decryptMessage } from '../utils/crypto'
export default function Chat() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const chatContainerRef = useRef(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const { fetchCounts, latestMessage } = useAuth() // Sync global unread count & listen to ws

  const isDosen = user?.role === 'dosen'

  // Fetch contacts once
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/chat/contacts')
        setContacts(res.data)
      } catch (err) {
        console.error("Gagal mendapatkan kontak:", err)
      } finally {
        setLoadingContacts(false)
      }
    }
    fetchContacts()
  }, [])

  // Prevent body/html scroll on mobile view only
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    const updateOverflow = () => {
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
      }
    }

    updateOverflow()
    window.addEventListener('resize', updateOverflow)

    return () => {
      window.removeEventListener('resize', updateOverflow)
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])


  const fetchMessages = async () => {
    if (!selectedContact) return
    setLoadingMessages(true)
    setHasMore(true)
    try {
      const res = await api.get(`/chat/history/${selectedContact.username}?limit=10&offset=0`)
      const decryptedMessages = res.data.map(m => ({
        ...m,
        pesan: decryptMessage(m.pesan)
      }))
      setMessages(decryptedMessages)
      if (res.data.length < 10) {
        setHasMore(false)
      }

      // Sync badge karena backend otomatis melakukan mark_as_read saat history diakses
      fetchCounts()

      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = 9999999
        }
        setInitialScrollDone(true) // Mark initial scroll as complete
      }, 50)
    } catch (err) {
      console.error("Gagal mendapatkan pesan:", err)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Effect to fetch messages when selected contact changes
  useEffect(() => {
    setInitialScrollDone(false)
    if (selectedContact) {
      fetchMessages()
    } else {
      setMessages([])
    }
  }, [selectedContact])

  // Effect to handle incoming real-time messages from global AuthContext WebSocket
  const lastProcessedMsgId = useRef(null)

  useEffect(() => {
    if (!latestMessage || latestMessage.id === lastProcessedMsgId.current) return
    lastProcessedMsgId.current = latestMessage.id

    const data = { ...latestMessage }
    data.pesan = decryptMessage(data.pesan)
    data.isNew = true

    setMessages(prev => {
      // If we are chatting with the sender or target group
      if (selectedContact && (data.sender_username === selectedContact.username || data.receiver_username === selectedContact.username)) {
        // Tell backend we read it, fire and forget
        if (!selectedContact.is_group) {
          api.post(`/chat/mark-read/${data.sender_username}`).then(() => fetchCounts()).catch(e => console.error(e))
        }

        if (!prev.find(m => m.id === data.id)) {
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = 9999999
            }
          }, 50)
          return [...prev, data]
        }
      }
      return prev
    })

    // Update contact list unread count
    setContacts(prev => prev.map(c => {
      if (c.username === data.sender_username) {
        // Only increment if we are not actively reading it
        const isActiveChat = selectedContact && (selectedContact.username === data.sender_username)
        if (!isActiveChat) {
          return { ...c, unread_count: (c.unread_count || 0) + 1 }
        }
      }
      return c
    }))
  }, [latestMessage, selectedContact, fetchCounts])

  const loadMoreMessages = async () => {
    if (!selectedContact || loadingMore || !hasMore || loadingMessages) return
    setLoadingMore(true)

    const container = chatContainerRef.current
    const prevScrollHeight = container ? container.scrollHeight : 0
    const prevScrollTop = container ? container.scrollTop : 0

    try {
      const dbMessagesCount = messages.filter(m => typeof m.id === 'number' && m.id < 1000000000000).length
      const res = await api.get(`/chat/history/${selectedContact.username}?limit=10&offset=${dbMessagesCount}`)

      if (res.data.length < 10) {
        setHasMore(false)
      }

      const decryptedMessages = res.data.map(m => ({
        ...m,
        pesan: decryptMessage(m.pesan)
      }))

      if (decryptedMessages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const filteredNew = decryptedMessages.filter(m => !existingIds.has(m.id))
          return [...filteredNew, ...prev]
        })

        setTimeout(() => {
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight + prevScrollTop
            }
          })
        }, 50)
      }
    } catch (err) {
      console.error("Gagal memuat pesan lama:", err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleScroll = (e) => {
    const container = e.target
    if (container.scrollTop <= 5 && hasMore && !loadingMore && !loadingMessages) {
      loadMoreMessages()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file || !selectedContact) return
    
    setUploadingAttachment(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const uploadRes = await api.post('/chat/upload-attachment', formData)
      const attachmentData = uploadRes.data
      
      const tempMsg = {
        id: Date.now(),
        sender_username: user.username,
        receiver_username: selectedContact.username,
        pesan: '',
        waktu_kirim: new Date().toISOString(),
        is_read: 0,
        isNew: true,
        is_pending: true,
        attachment_url: attachmentData.url,
        attachment_type: attachmentData.type,
        attachment_name: attachmentData.filename
      }
      setMessages(prev => [...prev, tempMsg])
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = 9999999
        }
      }, 50)
      
      const res = await api.post('/chat/send', {
        receiver_username: selectedContact.username,
        pesan: encryptMessage(''),
        attachment_url: attachmentData.url,
        attachment_type: attachmentData.type,
        attachment_name: attachmentData.filename
      })
      
      setMessages(prev => prev.map(m => 
        m.id === tempMsg.id ? { ...m, id: res.data.data.id, waktu_kirim: res.data.data.waktu_kirim, is_pending: false } : m
      ))
    } catch (error) {
      console.error("Gagal mengunggah file:", error)
      alert("File gagal diunggah.")
    } finally {
      setUploadingAttachment(false)
      if (fileInputRef.current) fileInputRef.current.value = null
    }
  }


  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedContact) return

    const messageText = newMessage
    setNewMessage('') // optimistically clear

    // Optimistically add to UI
    const tempMsg = {
      id: Date.now(),
      sender_username: user.username,
      receiver_username: selectedContact.username,
      pesan: messageText,
      waktu_kirim: new Date().toISOString(),
      is_read: 0,
      isNew: true, // Mark as new for animation
      is_pending: true
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 9999999
      }
    }, 50)

    try {
      const encryptedPesan = encryptMessage(messageText)
      const res = await api.post('/chat/send', {
        receiver_username: selectedContact.username,
        pesan: encryptedPesan
      })
      // Update temp message with real ID and timestamp from server
      setMessages(prev => prev.map(m =>
        m.id === tempMsg.id ? { ...m, id: res.data.data.id, waktu_kirim: res.data.data.waktu_kirim, is_pending: false } : m
      ))
    } catch (err) {
      console.error("Gagal mengirim pesan:", err)
      alert("Pesan gagal terkirim.")
      // Remove temp message on fail
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setNewMessage(messageText)
    }
  }

  const getFallbackAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`
  }

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const normalizedString = String(dateString).replace(' ', 'T');
    const d = new Date(normalizedString);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <main className="flex-grow flex flex-col max-w-7xl mx-auto w-full p-0 md:p-6 lg:p-8 h-[calc(100dvh-137px)] max-h-[calc(100dvh-137px)] md:h-auto md:max-h-[calc(100vh-74px)]">
      <div className="bg-[#0f1626] md:rounded-xl border-0 md:border border-gray-800 shadow-xl overflow-hidden flex flex-grow min-h-0 relative">

        {/* Sidebar Contacts */}
        <div className={`w-full sm:w-1/3 md:w-1/4 border-r border-gray-800/60 flex flex-col bg-[#0f1626] ${selectedContact ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-800/60 bg-gradient-to-r from-[#1e2638] to-[#0f1626]">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">
              {isDosen ? 'Mahasiswa Bimbingan' : 'Dosen Pembimbing'}
            </h2>
          </div>
          <div className="overflow-y-auto flex-grow custom-scrollbar">
            {loadingContacts ? (
              <div className="p-4 text-center text-sm text-gray-500">Memuat kontak...</div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Belum ada kontak.
              </div>
            ) : (
              contacts.map(c => (
                <div
                  key={c.username}
                  onClick={() => {
                    setSelectedContact(c)
                    // Clear unread count locally when opened
                    if (c.unread_count > 0) {
                      setContacts(prev => prev.map(contact =>
                        contact.username === c.username ? { ...contact, unread_count: 0 } : contact
                      ))
                    }
                  }}
                  className={`flex items-center gap-3 p-4 cursor-pointer border-b border-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 ease-in-out transform hover:translate-x-1 ${selectedContact?.username === c.username ? 'bg-gray-800/80 border-l-4 border-yellow-400 shadow-inner' : 'border-l-4 border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                    {c.is_group ? (
                      <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      </div>
                    ) : (
                      <AuthImage src={c.foto_profile || getFallbackAvatar(c.full_name)} fallbackSrc={getFallbackAvatar(c.full_name)} alt="Profile" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{c.full_name}</p>
                    {c.is_group ? (
                      <p className="text-xs text-yellow-400 truncate">Pengumuman & Diskusi</p>
                    ) : (
                      <p className="text-xs text-gray-400 truncate">{c.nip || c.nim || `@${c.username}`}</p>
                    )}
                  </div>
                  {c.unread_count > 0 && (
                    <div className="flex flex-col items-end flex-shrink-0">
                      <div className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shadow-lg shadow-red-500/50 animate-pulse">
                        {c.unread_count > 99 ? '99+' : c.unread_count}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`w-full sm:w-2/3 md:w-3/4 flex flex-col bg-gradient-to-b from-[#161f30] to-[#0f1626] relative ${!selectedContact ? 'hidden sm:flex' : 'flex'}`}>

          {!selectedContact ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-500 relative z-10">
              <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 shadow-lg border border-gray-700/50">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <p className="font-medium tracking-wide">Pilih kontak untuk mulai mengobrol</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="w-full px-6 py-4 border-b border-gray-800/60 bg-[#1e2638] flex items-center gap-4 shadow-sm z-10 flex-shrink-0">
                <button
                  className="sm:hidden text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  onClick={() => setSelectedContact(null)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div className="w-11 h-11 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600 shadow-sm">
                  {selectedContact.is_group ? (
                    <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    </div>
                  ) : (
                    <AuthImage src={selectedContact.foto_profile || getFallbackAvatar(selectedContact.full_name)} fallbackSrc={getFallbackAvatar(selectedContact.full_name)} alt="Profile" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-base font-bold text-white truncate break-words">{selectedContact.full_name}</h3>
                  {selectedContact.is_group ? (
                    <p className="text-xs text-yellow-400/80 font-medium tracking-wide uppercase truncate">Grup Obrolan</p>
                  ) : (
                    <p className="text-xs text-yellow-400/80 font-medium tracking-wide uppercase truncate">{isDosen ? `Mahasiswa Bimbingan` : `Dosen Pembimbing`}</p>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className={`flex-grow p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 z-10 relative transition-opacity duration-150 ${initialScrollDone ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                {loadingMore && (
                  <div className="text-center py-2 text-xs text-yellow-400/80 animate-pulse">
                    Memuat pesan sebelumnya...
                  </div>
                )}
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 my-auto animate-pulse">Memuat obrolan...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 my-auto bg-gray-800/50 inline-block px-4 py-2 rounded-full mx-auto border border-gray-700/50">
                    Kirim pesan pertama untuk memulai obrolan.
                  </div>
                ) : (
                  messages.map(m => {
                    const isMine = m.sender_username === user.username
                    return (
                      <div id={`msg-${m.id}`} key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${m.isNew ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : ''}`}>
                        <div className={`max-w-[85%] md:max-w-[75%] min-w-[100px] sm:min-w-[120px] rounded-[18px] px-4 py-2.5 flex flex-col ${isMine ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 rounded-br-[4px] shadow-sm' : 'bg-[#1e2638] text-white rounded-bl-[4px] shadow-sm border border-gray-700/50'}`}>
                          {!isMine && selectedContact.is_group && (
                            <p className="text-xs font-bold text-yellow-400 mb-1">{m.sender_full_name || m.sender_username}</p>
                          )}
                          {m.attachment_url && m.attachment_type === 'image' && (
                            <div className="mb-2">
                              <img src={m.attachment_url} alt="Attachment" className="max-w-[180px] sm:max-w-[220px] max-h-[220px] object-cover rounded-lg cursor-pointer hover:brightness-90 transition shadow-sm" onClick={() => window.open(m.attachment_url, '_blank')} />
                            </div>
                          )}
                          {m.attachment_url && m.attachment_type === 'document' && (
                            <a href={m.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition text-sm">
                              <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                              <span className="truncate font-medium">{m.attachment_name || "Lihat Dokumen"}</span>
                            </a>
                          )}
                          {m.pesan && <p className="text-[15.5px] break-words whitespace-pre-wrap leading-relaxed">{m.pesan}</p>}
                          <div className={`text-[11px] mt-1.5 text-right flex items-center justify-end gap-1 ${isMine ? 'text-yellow-900/70 font-semibold' : 'text-gray-400'}`}>
                            {formatTime(m.waktu_kirim)}
                            {isMine && (
                              m.is_pending ? (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 13l4 4L17 7"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 13l4 4L23 7"></path>
                                </svg>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 sm:p-4 border-t border-gray-800/60 bg-[#0f1626] z-10 flex-shrink-0">
                {uploadingAttachment && (
                  <div className="text-xs text-yellow-400 animate-pulse mb-2 text-center">Sedang mengunggah file...</div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 w-full max-w-4xl mx-auto items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0 transition-all"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-grow min-w-0 bg-[#1e2638] text-white text-[14px] sm:text-[15px] border border-gray-700 rounded-full px-4 py-2.5 sm:px-6 sm:py-3 focus:outline-none focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 flex items-center justify-center text-gray-900 flex-shrink-0 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:hover:scale-100"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

      </div>
    </main>
  )
}
