'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHANNELS, type RealtimeStatus } from '@/types'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  readAt: string | null
  createdAt: string
  isToast?: boolean
  toastExpiry?: number
}

interface UseOperatorNotificationsResult {
  notifications: AppNotification[]
  toasts: AppNotification[]
  unreadCount: number
  connectionStatus: RealtimeStatus
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  dismissToast: (id: string) => void
}

const TOAST_DURATION_MS = 5000

export function useOperatorNotifications(
  operatorId: string
): UseOperatorNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [toasts, setToasts] = useState<AppNotification[]>([])
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatus>('connecting')

  // Load initial notifications
  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('operator_notifications')
      .select('*')
      .eq('operator_id', operatorId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }: { data: any }) => {
        setNotifications((data ?? []).map(mapNotification))
      })
  }, [operatorId])

  // Subscribe to new notifications
  useEffect(() => {
    const supabase = createClient()

    // Use a unique suffix to prevent React Strict Mode hot-reload crashes,
    // where the singleton client re-returns an already subscribed channel!
    const channelName = `${CHANNELS.operatorNotifications(operatorId)}-${Math.random().toString(36).substring(7)}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'operator_notifications',
          filter: `operator_id=eq.${operatorId}`,
        },
        (payload: any) => {
          const notification = mapNotification(payload.new as Record<string, unknown>)

          setNotifications(prev => [notification, ...prev])

          const toastTypes = [
            'guest_registered',
            'trip_started',
            'trip_ended',
            'positive_review',
          ]
          if (toastTypes.includes(notification.type)) {
            const toast: AppNotification = {
              ...notification,
              isToast: true,
              toastExpiry: Date.now() + TOAST_DURATION_MS,
            }
            setToasts(prev => [toast, ...prev.slice(0, 2)])
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toast.id))
            }, TOAST_DURATION_MS)
          }
        }
      )
      .subscribe((state: string) => {
        if (state === 'SUBSCRIBED') setConnectionStatus('connected')
        else if (state === 'CLOSED') setConnectionStatus('disconnected')
        else if (state === 'CHANNEL_ERROR') setConnectionStatus('error')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [operatorId])

  const markRead = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('operator_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const markAllRead = useCallback(async () => {
    const supabase = createClient()
    await supabase
      .from('operator_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('operator_id', operatorId)
      .is('read_at', null)
    setNotifications([])
  }, [operatorId])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    markRead(id)
  }, [markRead])

  return {
    notifications,
    toasts,
    unreadCount: notifications.length,
    connectionStatus,
    markRead,
    markAllRead,
    dismissToast,
  }
}

function mapNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: raw.id as string,
    type: raw.type as string,
    title: raw.title as string,
    body: raw.body as string,
    data: (raw.data as Record<string, unknown>) ?? {},
    readAt: (raw.read_at as string) ?? null,
    createdAt: raw.created_at as string,
  }
}
