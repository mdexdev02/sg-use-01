import { useState, useEffect, useRef } from 'react'
import { getChatMessages, sendChatMessage, subscribeToChat } from '../../lib/supabase'

export default function ChatRoom({ tournamentId, username }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!tournamentId) return
    getChatMessages(tournamentId).then(setMessages).catch(console.error)

    const channel = subscribeToChat(tournamentId, (msg) => {
      setMessages((prev) => [...prev, msg])
    })
    return () => channel.unsubscribe()
  }, [tournamentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await sendChatMessage(tournamentId, username, input.trim())
      setInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-700">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <span className="text-lg">💬</span>
        <span className="font-bold text-white text-sm">채팅방</span>
        <span className="ml-auto text-xs text-slate-500">실시간</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-slate-600 text-xs text-center mt-4">아직 메시지가 없습니다.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            <span className="text-xs text-slate-500">{msg.username}</span>
            <span
              className={`inline-block px-3 py-1.5 rounded-xl text-sm max-w-[85%] ${
                msg.username === username
                  ? 'bg-blue-700 text-white self-end'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              {msg.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-700 flex gap-2">
        <input
          className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder="메시지 입력..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
        >
          전송
        </button>
      </form>
    </div>
  )
}
