'use client'

import { useMemo } from 'react'
import { ChatWidget } from './ChatWidget'
import { useTripStatus } from '@/hooks/useTripStatus'
import { storage } from '@/lib/storage'
import type { GuestSession, TripStatus } from '@/types'

interface TripPageChatProps {
  tripId: string
  initialStatus: TripStatus
  captainName: string | null
  marinaName?: string
  slipNumber?: string | null
}

export function TripPageChat({
  tripId, initialStatus, captainName,
}: TripPageChatProps) {
  const session = useMemo<GuestSession | null>(() => {
    if (typeof window === 'undefined') return null
    const slug = window.location.pathname.split('/trip/')[1]?.split('/')[0]
    if (!slug) return null
    return storage.get('guest_session', slug)
  }, [])

  const { status } = useTripStatus(
    tripId, initialStatus
  )

  return (
    <ChatWidget
      tripId={tripId}
      tripStatus={status}
      session={session}
      captainName={captainName}
    />
  )
}
