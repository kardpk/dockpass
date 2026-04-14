'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, ChevronDown } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils/cn'
import type { CaptainSnapshotData } from '@/types'

interface CaptainChatPanelProps {
  snapshot: CaptainSnapshotData
}

export function CaptainChatPanel({
  snapshot,
}: CaptainChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chat = useChat({
    tripId: snapshot.tripId,
    senderId: `captain-${snapshot.tripId}`,
    senderType: 'captain',
    senderName: snapshot.captainName ?? 'Captain',
    enabled: true,
  })

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chat.messages, isOpen])

  useEffect(() => {
    if (isOpen) chat.markAllRead()
  }, [isOpen]) // eslint-disable-line

  async function sendReply() {
    if (!input.trim()) return
    await chat.sendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden mt-3">
      {/* Panel header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-[#0C447C]" />
          <span className="text-[15px] font-semibold text-[#0D1B2A]">
            Guest messages
          </span>
          {chat.unreadCount > 0 && (
            <span className="
              w-5 h-5 rounded-full bg-[#E8593C]
              text-white text-[10px] font-bold
              flex items-center justify-center
            ">
              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-[#6B7C93] transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Messages */}
          <div className="px-4 pb-2 max-h-[320px] overflow-y-auto space-y-2 border-t border-[#F5F8FC]">
            {chat.messages.length === 0 ? (
              <p className="text-center text-[14px] text-[#6B7C93] py-6">
                No messages yet. Guests will appear here.
              </p>
            ) : (
              chat.messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col max-w-[85%]',
                    msg.senderType === 'captain'
                      ? 'items-end ml-auto'
                      : 'items-start mr-auto'
                  )}
                >
                  {msg.senderType !== 'captain' && (
                    <span className="text-[11px] text-[#6B7C93] mb-0.5 px-1">
                      {msg.senderName}
                    </span>
                  )}
                  <div className={cn(
                    'px-4 py-2.5 rounded-[16px] text-[14px] leading-relaxed',
                    msg.senderType === 'captain'
                      ? 'bg-[#0C447C] text-white rounded-tr-[4px]'
                      : 'bg-[#F5F8FC] text-[#0D1B2A] rounded-tl-[4px]'
                  )}>
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-[#6B7C93] mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
            {chat.isTyping && (
              <p className="text-[12px] text-[#6B7C93] italic">
                A guest is typing...
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input */}
          <div className="px-4 py-3 border-t border-[#F5F8FC] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => {
                setInput(e.target.value)
                chat.sendTyping()
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); sendReply() }
              }}
              placeholder="Reply to all guests..."
              maxLength={500}
              className="
                flex-1 h-[44px] px-4 rounded-full text-[14px]
                border border-[#D0E2F3] bg-white text-[#0D1B2A]
                placeholder:text-[#6B7C93]
                focus:outline-none focus:border-[#0C447C]
              "
            />
            <button
              onClick={sendReply}
              disabled={!input.trim()}
              className="
                w-11 h-11 rounded-full bg-[#0C447C] text-white
                flex items-center justify-center
                hover:bg-[#093a6b] transition-colors
                disabled:opacity-40
              "
            >
              <Send size={15} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
