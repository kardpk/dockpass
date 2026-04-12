'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHANNELS, type RealtimeStatus } from '@/types'
import type { TripStatus } from '@/types'

interface UseTripStatusResult {
  status: TripStatus
  startedAt: string | null
  connectionStatus: RealtimeStatus
}

export function useTripStatus(
  tripId: string,
  initialStatus: TripStatus,
  initialStartedAt: string | null = null
): UseTripStatusResult {
  const [status, setStatus] = useState<TripStatus>(initialStatus)
  const [startedAt, setStartedAt] = useState(initialStartedAt)
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatus>('connecting')
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>['channel']
  > | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(CHANNELS.tripStatus(tripId))
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload: any) => {
          const updated = payload.new as Record<string, unknown>
          if (updated.status) setStatus(updated.status as TripStatus)
          if (updated.started_at) setStartedAt(updated.started_at as string)
        }
      )
      .subscribe((state: string) => {
        if (state === 'SUBSCRIBED') setConnectionStatus('connected')
        else if (state === 'CLOSED') setConnectionStatus('disconnected')
        else if (state === 'CHANNEL_ERROR') setConnectionStatus('error')
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      setConnectionStatus('disconnected')
    }
  }, [tripId])

  return { status, startedAt, connectionStatus }
}
