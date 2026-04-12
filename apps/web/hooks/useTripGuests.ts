'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHANNELS, type RealtimeStatus, type ApprovalStatus } from '@/types'
import type { DashboardGuest } from '@/types'
import { playPing } from '@/lib/utils/playPing'

interface UseTripGuestsResult {
  guests: DashboardGuest[]
  connectionStatus: RealtimeStatus
  lastUpdated: Date | null
}

export function useTripGuests(
  tripId: string,
  initialGuests: DashboardGuest[]
): UseTripGuestsResult {
  const [guests, setGuests] = useState<DashboardGuest[]>(initialGuests)
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatus>('connecting')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(CHANNELS.tripGuests(tripId))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: any) => {
          const g = payload.new as Record<string, unknown>

          // Tactile + auditory feedback for Captain on dock
          if (typeof window !== 'undefined') {
            try {
              if (navigator.vibrate) navigator.vibrate(200)
            } catch {}
            playPing()
          }

          setGuests(prev => {
            if (prev.some(x => x.id === g.id)) return prev
            return [...prev, mapRawGuest(g)]
          })
          setLastUpdated(new Date())
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: any) => {
          const g = payload.new as Record<string, unknown>
          // Full re-map: Supabase Realtime sends the COMPLETE NEW row on UPDATE,
          // so we can safely replace the entire guest record via mapRawGuest.
          // This ensures safety acks, Firma hash, and all other fields stay current.
          setGuests(prev =>
            prev.map(x => x.id === g.id ? mapRawGuest(g) : x)
          )
          setLastUpdated(new Date())
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: any) => {
          const old = payload.old as Record<string, unknown>
          setGuests(prev =>
            prev.filter(x => x.id !== old.id)
          )
          setLastUpdated(new Date())
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
  }, [tripId])

  return { guests, connectionStatus, lastUpdated }
}

function mapRawGuest(raw: Record<string, unknown>): DashboardGuest {
  return {
    id: raw.id as string,
    customerId: (raw.customer_id as string) ?? null,
    fullName: raw.full_name as string,
    languagePreference: (raw.language_preference as string) ?? 'en',
    dietaryRequirements: (raw.dietary_requirements as string) ?? null,
    isNonSwimmer: (raw.is_non_swimmer as boolean) ?? false,
    isSeaSicknessProne: (raw.is_seasickness_prone as boolean) ?? false,
    waiverSigned: (raw.waiver_signed as boolean) ?? false,
    waiverSignedAt: (raw.waiver_signed_at as string) ?? null,
    approvalStatus: (raw.approval_status as ApprovalStatus) ?? 'auto_approved',
    checkedInAt: (raw.checked_in_at as string) ?? null,
    createdAt: raw.created_at as string,
    safetyAcknowledgments: (raw.safety_acknowledgments as { topic_key: string; acknowledgedAt: string }[]) ?? [],
    waiverTextHash: (raw.waiver_text_hash as string) ?? null,
    addonOrders: [],  // Addons don't come from realtime — they're joined separately
  }
}
