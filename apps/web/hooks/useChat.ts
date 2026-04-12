'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHANNELS, type ChatMessage, type RealtimeStatus } from '@/types'

interface UseChatOptions {
  tripId: string
  senderId: string
  senderType: ChatMessage['senderType']
  senderName: string
  enabled?: boolean
}

interface UseChatResult {
  messages: ChatMessage[]
  isTyping: boolean
  connectionStatus: RealtimeStatus
  unreadCount: number
  sendMessage: (body: string, chipKey?: string) => Promise<void>
  sendTyping: () => void
  markAllRead: () => void
  isLoading: boolean
}

export function useChat(options: UseChatOptions): UseChatResult {
  const { tripId, senderId, senderType, senderName, enabled = true } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatus>('connecting')
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>['channel']
  > | null>(null)

  // Load message history on mount
  useEffect(() => {
    if (!enabled) { setIsLoading(false); return }

    const supabase = createClient()
    supabase
      .from('trip_messages')
      .select('*')
      .eq('trip_id', tripId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }: { data: any }) => {
        const mapped: ChatMessage[] = (data ?? []).map(mapMessage)
        setMessages(mapped)
        const unread = mapped.filter(
          m => m.senderType !== senderType && !m.readAt
        ).length
        setUnreadCount(unread)
        setIsLoading(false)
      })
  }, [tripId, enabled, senderType])

  // Subscribe to new messages + typing broadcasts
  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const channel = supabase
      .channel(CHANNELS.tripChat(tripId))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: any) => {
          const msg = mapMessage(payload.new as Record<string, unknown>)
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.senderType !== senderType) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const { sender } = payload.payload as { sender: string }
        if (sender !== senderId) {
          setIsTyping(true)
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
          }, 3000)
        }
      })
      .subscribe((state: string) => {
        if (state === 'SUBSCRIBED') setConnectionStatus('connected')
        else if (state === 'CLOSED') setConnectionStatus('disconnected')
        else if (state === 'CHANNEL_ERROR') setConnectionStatus('error')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [tripId, enabled, senderId, senderType])

  const sendMessage = useCallback(async (
    body: string,
    chipKey?: string
  ) => {
    if (!body.trim() || body.length > 500) return

    try {
      const res = await fetch(
        `/api/trips/${tripId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: body.trim(),
            senderType,
            senderName,
            senderId,
            chipKey: chipKey ?? null,
            isQuickChip: !!chipKey,
          }),
        }
      )
      if (!res.ok) {
        const json = await res.json()
        console.error('[chat] send failed:', json.error)
      }
    } catch (err) {
      console.error('[chat] network error:', err)
    }
  }, [tripId, senderType, senderName, senderId])

  const sendTyping = useCallback(() => {
    const channel = channelRef.current
    if (!channel) return
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: senderId },
    })
  }, [senderId])

  const markAllRead = useCallback(() => {
    setUnreadCount(0)
    setMessages(prev =>
      prev.map(m => ({
        ...m,
        readAt: m.readAt ?? new Date().toISOString(),
      }))
    )
    fetch(`/api/trips/${tripId}/messages/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderType, senderId }),
    }).catch(() => null)
  }, [tripId, senderType, senderId])

  return {
    messages, isTyping, connectionStatus,
    unreadCount, sendMessage, sendTyping,
    markAllRead, isLoading,
  }
}

function mapMessage(raw: Record<string, unknown>): ChatMessage {
  return {
    id: raw.id as string,
    tripId: raw.trip_id as string,
    guestId: (raw.guest_id as string) ?? null,
    senderType: raw.sender_type as ChatMessage['senderType'],
    senderName: raw.sender_name as string,
    body: raw.body as string,
    isQuickChip: (raw.is_quick_chip as boolean) ?? false,
    chipKey: (raw.chip_key as string) ?? null,
    readAt: (raw.read_at as string) ?? null,
    createdAt: raw.created_at as string,
  }
}
