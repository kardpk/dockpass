# BoatCheckin — Phase 3G Agent Instructions
# Real-time Layer: Live Updates + Guest-Captain Chat
# @3G_REALTIME

---

## CONTEXT

Phases 3A–3F built a complete product.
Everything works. Nothing is live.

Phase 3G makes BoatCheckin feel alive.

When Conrad opens his dashboard at 9:45am,
he sees Ahmed checking in — the row appears
as Ahmed taps "Sign and check in" a mile away.

When Sofia can't find the slip, she opens
the chat widget and types "Where do I go?"
The captain sees it instantly. He replies:
"Slip 14A, past the fuel dock on your right."
Sofia finds the boat. The trip starts well.

This phase wires together every real-time
surface in the product using a single,
coherent Supabase Realtime architecture.

Three layers of real-time:
  Layer 1 — DB changes (postgres_changes)
    Guest registration, trip status, approvals
    Powers: dashboard, captain snapshot, trip page

  Layer 2 — Broadcast channels (ephemeral)
    Chat messages, typing indicators, presence
    Powers: guest-captain chat

  Layer 3 — Operator notifications (push)
    Toast banners, in-app feed
    Powers: dashboard notification centre

---

## PASTE THIS INTO YOUR IDE

```
@docs/agents/00-MASTER.md
@docs/agents/02-ARCHITECTURE.md
@docs/agents/03-DATABASE.md
@docs/agents/04-SECURITY.md
@docs/agents/05-FRONTEND.md
@docs/agents/06-DESIGN.md
@docs/agents/07-BACKEND.md
@docs/agents/11-REDIS.md
@docs/agents/16-UX_SCREENS.md

TASK: Build Phase 3G — Real-time Layer.
Three surfaces: live dashboard, trip page
status updates, and guest-captain chat.

Phases 3A–3F are complete and tested.
Build on top of existing components.
Do NOT modify the guest registration
flow or operator dashboard core logic —
only add real-time subscriptions to them.

Use Supabase Realtime.
All channels scoped to trip_id or operator_id.
Never subscribe to unscoped broadcast channels.
Rate limit chat: 20 messages/hr per guest.
Chat only opens when trip.status = 'active'
or when guest manually requests it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1 — DATABASE MIGRATION 005
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The chat needs a persistent message table.
Persistent because: captain may reload the
snapshot and needs message history. Operator
may need to review a conversation later.

────────────────────────────────────────────
1A. Migration file
────────────────────────────────────────────

Create: supabase/migrations/005_realtime.sql

-- ── TRIP MESSAGES ────────────────────────
-- Guest-captain chat messages per trip.
-- Scoped to trip_id. Auto-deletes after 90 days.
CREATE TABLE trip_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  operator_id   UUID NOT NULL REFERENCES operators(id),

  -- Sender identity
  -- Either guest_id OR is_captain/is_operator
  guest_id      UUID REFERENCES guests(id) ON DELETE SET NULL,
  sender_type   TEXT NOT NULL
                CHECK (sender_type IN (
                  'guest', 'captain', 'operator', 'system'
                )),
  sender_name   TEXT NOT NULL,    -- display name

  -- Content
  body          TEXT NOT NULL
                CHECK (char_length(body) >= 1
                   AND char_length(body) <= 500),
  is_quick_chip BOOLEAN NOT NULL DEFAULT false,
  chip_key      TEXT,             -- for i18n of quick chips

  -- Read tracking (captain reads all)
  read_at       TIMESTAMPTZ,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ         -- soft delete
);

-- Index: fetch chat history for a trip fast
CREATE INDEX idx_trip_messages_trip_time
  ON trip_messages (trip_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index: unread messages for operator/captain
CREATE INDEX idx_trip_messages_unread
  ON trip_messages (trip_id, read_at)
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- ── ENABLE REALTIME ──────────────────────
-- Supabase Realtime must be enabled on each
-- table that we subscribe to with postgres_changes.
-- Run in Supabase Dashboard → Database → Replication
-- OR via SQL if you have the extension:

-- Enable realtime on trip_messages
ALTER PUBLICATION supabase_realtime
  ADD TABLE trip_messages;

-- Verify existing tables already in publication
-- (should be set from Phase 3D):
-- guests, operator_notifications, trips
-- If missing, add them here:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'guests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'operator_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE operator_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trips;
  END IF;
END $$;

-- ── RLS POLICIES ─────────────────────────

-- Guests can insert their own messages
CREATE POLICY "messages_guest_insert" ON trip_messages
  FOR INSERT WITH CHECK (
    sender_type = 'guest'
    AND guest_id IS NOT NULL
  );

-- Operators can insert as captain/operator/system
CREATE POLICY "messages_operator_insert" ON trip_messages
  FOR INSERT WITH CHECK (
    auth.uid() = operator_id
    AND sender_type IN ('captain', 'operator', 'system')
  );

-- Operators can read all messages on their trips
CREATE POLICY "messages_operator_read" ON trip_messages
  FOR SELECT USING (auth.uid() = operator_id);

-- Guests can read messages from their trip
-- (any sender) — but not other guests' trips
-- Identified via trip_id matching their session
-- Access controlled at API level, not RLS
-- (guests have no auth.uid())
-- Service role used for guest message reads
CREATE POLICY "messages_service_all" ON trip_messages
  FOR ALL USING (auth.role() = 'service_role');

Run:
  npx supabase db push
  npx supabase gen types typescript --linked \
    > apps/web/types/database.ts

Verify:
  trip_messages table exists
  supabase_realtime publication includes it
  Types updated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2 — TYPES + CHANNEL REGISTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
2A. Realtime types
────────────────────────────────────────────

Add to: apps/web/types/index.ts

// ─── Chat message ─────────────────────────
export interface ChatMessage {
  id: string
  tripId: string
  guestId: string | null
  senderType: 'guest' | 'captain' | 'operator' | 'system'
  senderName: string
  body: string
  isQuickChip: boolean
  chipKey: string | null
  readAt: string | null
  createdAt: string
}

// ─── Quick chips (predefined guest messages) ─
export interface QuickChip {
  key: string
  icon: string
  label: string          // shown in UI
}

export const QUICK_CHIPS: QuickChip[] = [
  { key: 'parking',   icon: '🅿️', label: "Where exactly do I park?" },
  { key: 'late_10',   icon: '⏱️', label: "I'm running 10 min late" },
  { key: 'entrance',  icon: '🚢', label: "Which dock entrance?" },
  { key: 'arrived',   icon: '📍', label: "I'm at the marina now" },
  { key: 'cant_find', icon: '🔍', label: "I can't find the boat" },
  { key: 'question',  icon: '💬', label: "I have a question" },
]

// ─── Realtime channel names (centralised) ──
// Keep all channel names in one place to
// avoid typos causing duplicate subscriptions.
export const CHANNELS = {
  // Per-trip: DB changes on guests table
  tripGuests: (tripId: string) =>
    `trip-guests-${tripId}` as const,

  // Per-trip: DB changes on trips table (status)
  tripStatus: (tripId: string) =>
    `trip-status-${tripId}` as const,

  // Per-trip: broadcast chat messages
  tripChat: (tripId: string) =>
    `trip-chat-${tripId}` as const,

  // Per-operator: DB changes on operator_notifications
  operatorNotifications: (operatorId: string) =>
    `op-notifications-${operatorId}` as const,

  // Per-operator: DB changes on guests (all trips)
  operatorDashboard: (operatorId: string) =>
    `op-dashboard-${operatorId}` as const,
} as const

// ─── Connection state ─────────────────────
export type RealtimeStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

────────────────────────────────────────────
2B. Supabase browser client (ensure singleton)
────────────────────────────────────────────

Verify: apps/web/lib/supabase/browser.ts

This file must export a SINGLETON browser client.
Multiple components cannot each call createBrowserClient —
that creates multiple WebSocket connections.
One singleton shared across the app.

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseBrowser() {
  if (_client) return _client
  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _client
}

// Alias for components that were using createBrowserClient directly
export { createSupabaseBrowser as getSupabaseBrowser }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3 — CUSTOM REALTIME HOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All hooks in: apps/web/hooks/

────────────────────────────────────────────
3A. useTripStatus — guest trip page
────────────────────────────────────────────

Create: apps/web/hooks/useTripStatus.ts
'use client'

Subscribed to on the guest trip page and the
boarding pass page. Updates the page when
trip.status changes from 'upcoming' → 'active'
so guests see the teal "Your charter is active"
banner without refreshing.

'use client'

import { useState, useEffect, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
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
    ReturnType<typeof createSupabaseBrowser>['channel']
  > | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowser()

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
        (payload) => {
          const updated = payload.new as any
          if (updated.status) setStatus(updated.status)
          if (updated.started_at) setStartedAt(updated.started_at)
        }
      )
      .subscribe((state) => {
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

────────────────────────────────────────────
3B. useTripGuests — live guest list
────────────────────────────────────────────

Create: apps/web/hooks/useTripGuests.ts
'use client'

Used by dashboard TodayTripCard and
GuestManagementTable (Phase 3D). Handles
INSERT / UPDATE / DELETE of guest rows.

This CONSOLIDATES the two separate inline
useEffect subscriptions already written in
Phase 3D into a single reusable hook.
Replace the inline useEffects in:
  - TodayTripCard.tsx
  - GuestManagementTable.tsx
with this hook.

'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { CHANNELS, type RealtimeStatus } from '@/types'
import type { DashboardGuest } from '@/types'

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
    const supabase = createSupabaseBrowser()

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
        (payload) => {
          const g = payload.new as any
          setGuests(prev => {
            // Idempotency: don't add if already present
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
        (payload) => {
          const g = payload.new as any
          setGuests(prev =>
            prev.map(x =>
              x.id === g.id
                ? {
                    ...x,
                    waiverSigned: g.waiver_signed ?? x.waiverSigned,
                    approvalStatus: g.approval_status ?? x.approvalStatus,
                    checkedInAt: g.checked_in_at ?? x.checkedInAt,
                  }
                : x
            )
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
        (payload) => {
          setGuests(prev =>
            prev.filter(x => x.id !== payload.old.id)
          )
          setLastUpdated(new Date())
        }
      )
      .subscribe((state) => {
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

function mapRawGuest(raw: any): DashboardGuest {
  return {
    id: raw.id,
    fullName: raw.full_name,
    languagePreference: raw.language_preference ?? 'en',
    dietaryRequirements: raw.dietary_requirements ?? null,
    isNonSwimmer: raw.is_non_swimmer ?? false,
    isSeaSicknessProne: raw.is_seasickness_prone ?? false,
    waiverSigned: raw.waiver_signed ?? false,
    waiverSignedAt: raw.waiver_signed_at ?? null,
    approvalStatus: raw.approval_status ?? 'auto_approved',
    checkedInAt: raw.checked_in_at ?? null,
    createdAt: raw.created_at,
    addonOrders: [], // refetched on expand
  }
}

────────────────────────────────────────────
3C. useOperatorNotifications — toasts
────────────────────────────────────────────

Create: apps/web/hooks/useOperatorNotifications.ts
'use client'

Powers the live notification feed in the
operator dashboard. Also drives toast banners
when a new guest checks in while the operator
has the dashboard open.

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { CHANNELS, type RealtimeStatus } from '@/types'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  readAt: string | null
  createdAt: string
  // UI state
  isToast?: boolean   // show as banner
  toastExpiry?: number // unix ms when toast hides
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
    const supabase = createSupabaseBrowser()

    supabase
      .from('operator_notifications')
      .select('*')
      .eq('operator_id', operatorId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setNotifications((data ?? []).map(mapNotification))
      })
  }, [operatorId])

  // Subscribe to new notifications
  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel(CHANNELS.operatorNotifications(operatorId))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'operator_notifications',
          filter: `operator_id=eq.${operatorId}`,
        },
        (payload) => {
          const notification = mapNotification(payload.new as any)

          // Add to notification feed
          setNotifications(prev => [notification, ...prev])

          // Show as toast for high-priority types
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
            setToasts(prev => [toast, ...prev.slice(0, 2)]) // max 3 toasts
            // Auto-dismiss
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toast.id))
            }, TOAST_DURATION_MS)
          }
        }
      )
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') setConnectionStatus('connected')
        else if (state === 'CLOSED') setConnectionStatus('disconnected')
        else if (state === 'CHANNEL_ERROR') setConnectionStatus('error')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [operatorId])

  const markRead = useCallback(async (id: string) => {
    const supabase = createSupabaseBrowser()
    await supabase
      .from('operator_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const markAllRead = useCallback(async () => {
    const supabase = createSupabaseBrowser()
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

function mapNotification(raw: any): AppNotification {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    body: raw.body,
    data: raw.data ?? {},
    readAt: raw.read_at,
    createdAt: raw.created_at,
  }
}

────────────────────────────────────────────
3D. useChat — guest-captain messaging
────────────────────────────────────────────

Create: apps/web/hooks/useChat.ts
'use client'

Core chat hook. Used by both the guest
ChatWidget and the captain's CaptainChatPanel.

Combines two realtime mechanisms:
  1. postgres_changes on trip_messages
     for persistent history and new messages
  2. Broadcast for ephemeral typing indicators

Why postgres_changes instead of pure broadcast?
Because messages must persist. The captain
reloads the snapshot. Guests can scroll history.
The operator can review conversations.

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/browser'
import { CHANNELS, type ChatMessage, type RealtimeStatus } from '@/types'

interface UseChatOptions {
  tripId: string
  senderId: string     // guestId or 'operator'
  senderType: ChatMessage['senderType']
  senderName: string
  enabled?: boolean    // can disable before trip is active
}

interface UseChatResult {
  messages: ChatMessage[]
  isTyping: boolean    // someone else is typing
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
    ReturnType<typeof createSupabaseBrowser>['channel']
  > | null>(null)

  // Load message history on mount
  useEffect(() => {
    if (!enabled) { setIsLoading(false); return }

    const supabase = createSupabaseBrowser()
    supabase
      .from('trip_messages')
      .select('*')
      .eq('trip_id', tripId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        const mapped = (data ?? []).map(mapMessage)
        setMessages(mapped)
        // Count messages not sent by this user
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

    const supabase = createSupabaseBrowser()

    const channel = supabase
      .channel(CHANNELS.tripChat(tripId))
      // DB changes — new messages persist
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const msg = mapMessage(payload.new as any)
          setMessages(prev => {
            // Idempotency
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.senderType !== senderType) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      // Broadcast — ephemeral typing indicators
      .on('broadcast', { event: 'typing' }, (payload) => {
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
      .subscribe((state) => {
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
    // Fire and forget — server marks as read
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

function mapMessage(raw: any): ChatMessage {
  return {
    id: raw.id,
    tripId: raw.trip_id,
    guestId: raw.guest_id ?? null,
    senderType: raw.sender_type,
    senderName: raw.sender_name,
    body: raw.body,
    isQuickChip: raw.is_quick_chip ?? false,
    chipKey: raw.chip_key ?? null,
    readAt: raw.read_at ?? null,
    createdAt: raw.created_at,
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4 — CHAT API ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
4A. POST /api/trips/[tripId]/messages
    Send a chat message
────────────────────────────────────────────

Create: apps/web/app/api/trips/[tripId]/
  messages/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireOperator } from '@/lib/security/auth'
import { z } from 'zod'

const messageSchema = z.object({
  body: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .transform(s => s.trim()),
  senderType: z.enum(['guest', 'captain', 'operator', 'system']),
  senderName: z.string().min(1).max(100).transform(s => s.trim()),
  senderId: z.string().min(1).max(100),
  chipKey: z.string().max(50).nullable().optional(),
  isQuickChip: z.boolean().optional().default(false),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params

  // Validate UUID format
  if (!/^[0-9a-f-]{36}$/.test(tripId)) {
    return NextResponse.json(
      { error: 'Invalid trip ID' }, { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid message', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  const supabase = createServiceClient()

  // ── Operator/captain messages require auth ──
  if (data.senderType === 'captain' || data.senderType === 'operator') {
    try {
      const { operator } = await requireOperator()
      // Verify trip belongs to this operator
      const { data: trip } = await supabase
        .from('trips')
        .select('id, operator_id')
        .eq('id', tripId)
        .eq('operator_id', operator.id)
        .single()
      if (!trip) {
        return NextResponse.json(
          { error: 'Trip not found' }, { status: 404 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorised' }, { status: 401 }
      )
    }
  }

  // ── Guest messages: verify guest belongs to trip ──
  if (data.senderType === 'guest') {
    // Rate limit: 20 messages per hour per sender
    const limited = await rateLimit(req, {
      max: 20, window: 3600,
      key: `chat:guest:${data.senderId}:${tripId}`,
    })
    if (limited.blocked) {
      return NextResponse.json(
        { error: 'Too many messages. Try again later.' },
        { status: 429 }
      )
    }

    // Verify guest exists and belongs to this trip
    const { data: guest } = await supabase
      .from('guests')
      .select('id, trip_id')
      .eq('id', data.senderId)
      .eq('trip_id', tripId)
      .is('deleted_at', null)
      .single()

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' }, { status: 404 }
      )
    }
  }

  // ── Verify trip is active (chat only works on active/upcoming trips) ──
  const { data: trip } = await supabase
    .from('trips')
    .select('id, status, operator_id')
    .eq('id', tripId)
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  // Only allow chat during upcoming/active trips
  if (trip.status === 'completed' || trip.status === 'cancelled') {
    return NextResponse.json(
      { error: 'Chat is closed for this trip' },
      { status: 409 }
    )
  }

  // ── Insert message ───────────────────────
  const { data: message, error } = await supabase
    .from('trip_messages')
    .insert({
      trip_id: tripId,
      operator_id: trip.operator_id,
      guest_id: data.senderType === 'guest' ? data.senderId : null,
      sender_type: data.senderType,
      sender_name: data.senderName,
      body: data.body,
      is_quick_chip: data.isQuickChip,
      chip_key: data.chipKey ?? null,
    })
    .select('id, created_at')
    .single()

  if (error || !message) {
    console.error('[chat:send]', error?.code)
    return NextResponse.json(
      { error: 'Failed to send message' }, { status: 500 }
    )
  }

  // ── Notify operator of new guest message ──
  if (data.senderType === 'guest') {
    supabase.from('operator_notifications').insert({
      operator_id: trip.operator_id,
      type: 'chat_message',
      title: '💬 New message',
      body: `${data.senderName}: "${data.body.slice(0, 60)}${data.body.length > 60 ? '…' : ''}"`,
      data: { tripId, messageId: message.id },
    }).then().catch(() => null)
  }

  return NextResponse.json({
    data: { id: message.id, createdAt: message.created_at }
  })
}

────────────────────────────────────────────
4B. GET /api/trips/[tripId]/messages
    Fetch message history
────────────────────────────────────────────

Add to: apps/web/app/api/trips/[tripId]/
  messages/route.ts (same file, add GET)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params

  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `chat:history:${tripId}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' }, { status: 429 }
    )
  }

  // Auth: either operator or valid guest token
  // For operator: use requireOperator
  // For guest: verify via guestId query param
  const url = new URL(req.url)
  const guestId = url.searchParams.get('guestId')

  const supabase = createServiceClient()

  if (guestId) {
    // Verify guest belongs to trip
    const { data: guest } = await supabase
      .from('guests')
      .select('id')
      .eq('id', guestId)
      .eq('trip_id', tripId)
      .is('deleted_at', null)
      .single()
    if (!guest) {
      return NextResponse.json(
        { error: 'Not found' }, { status: 404 }
      )
    }
  } else {
    // Must be operator
    try {
      const { operator } = await requireOperator()
      const { data: trip } = await supabase
        .from('trips')
        .select('id')
        .eq('id', tripId)
        .eq('operator_id', operator.id)
        .single()
      if (!trip) {
        return NextResponse.json(
          { error: 'Not found' }, { status: 404 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorised' }, { status: 401 }
      )
    }
  }

  const { data: messages } = await supabase
    .from('trip_messages')
    .select('*')
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json({ data: messages ?? [] })
}

────────────────────────────────────────────
4C. POST /api/trips/[tripId]/messages/read
    Mark messages as read
────────────────────────────────────────────

Create: apps/web/app/api/trips/[tripId]/
  messages/read/route.ts
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireOperator } from '@/lib/security/auth'
import { z } from 'zod'

const readSchema = z.object({
  senderType: z.enum(['guest', 'captain', 'operator']),
  senderId: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = readSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  if (parsed.data.senderType !== 'guest') {
    // Operator/captain marking messages read
    const { operator } = await requireOperator()
    await supabase
      .from('trip_messages')
      .update({ read_at: now })
      .eq('trip_id', tripId)
      .eq('operator_id', operator.id)
      .is('read_at', null)
      .neq('sender_type', 'captain')
      .neq('sender_type', 'operator')
  } else {
    // Guest marking messages read
    await supabase
      .from('trip_messages')
      .update({ read_at: now })
      .eq('trip_id', tripId)
      .in('sender_type', ['captain', 'operator'])
      .is('read_at', null)
  }

  return NextResponse.json({ data: { ok: true } })
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5 — GUEST CHAT WIDGET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
5A. ChatWidget — guest-facing (trip page)
────────────────────────────────────────────

Create: apps/web/components/chat/ChatWidget.tsx
'use client'

Floats over the trip page.
Opens as a bottom sheet.
Shows quick chips before typing.
Shows unread badge on FAB.
Auto-opens when trip becomes active and
the guest has a session.

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils'
import { QUICK_CHIPS } from '@/types'
import type { GuestSession, TripStatus } from '@/types'

interface ChatWidgetProps {
  tripId: string
  tripStatus: TripStatus
  session: GuestSession | null
  captainName: string | null
}

export function ChatWidget({
  tripId, tripStatus, session, captainName,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Only enabled when trip is active and guest has a session
  const enabled = tripStatus === 'active' && !!session

  const chat = useChat({
    tripId,
    senderId: session?.guestId ?? 'anonymous',
    senderType: 'guest',
    senderName: session?.guestName ?? 'Guest',
    enabled,
  })

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chat.messages, isOpen])

  // Mark as read on open
  useEffect(() => {
    if (isOpen && chat.unreadCount > 0) {
      chat.markAllRead()
    }
  }, [isOpen]) // eslint-disable-line

  // Auto-open when trip starts and guest is here
  useEffect(() => {
    if (tripStatus === 'active' && session && !isOpen) {
      // Small delay so page can show the active banner first
      const t = setTimeout(() => {
        // Only auto-open if there are messages from captain
        if (chat.messages.some(m => m.senderType === 'captain')) {
          setIsOpen(true)
        }
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [tripStatus, session]) // eslint-disable-line

  // Don't render if chat is disabled
  if (!enabled) return null

  async function handleSend(text?: string) {
    const body = text ?? inputText.trim()
    if (!body) return
    await chat.sendMessage(body)
    setInputText('')
  }

  async function handleChip(chip: typeof QUICK_CHIPS[number]) {
    await chat.sendMessage(chip.label, chip.key)
  }

  const captainDisplayName = captainName ?? 'Your captain'

  return (
    <>
      {/* FAB — chat button */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-24 right-4 z-40
          w-14 h-14 rounded-full
          bg-[#0C447C] text-white
          shadow-[0_4px_16px_rgba(12,68,124,0.4)]
          flex items-center justify-center
          hover:bg-[#093a6b] transition-colors
          active:scale-95
        "
        aria-label="Open chat"
      >
        <MessageCircle size={22} />
        {chat.unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1
            w-5 h-5 rounded-full
            bg-[#E8593C] text-white
            text-[10px] font-bold
            flex items-center justify-center
          ">
            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
          </span>
        )}
      </button>

      {/* Chat sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="
              fixed inset-x-0 bottom-0 z-50
              bg-white rounded-t-[20px]
              flex flex-col
              max-h-[70vh]
              shadow-[0_-4px_24px_rgba(12,68,124,0.15)]
            "
          >
            {/* Handle + header */}
            <div className="flex-shrink-0 pt-3 pb-2 px-5 border-b border-[#F5F8FC]">
              <div className="w-10 h-1 bg-[#D0E2F3] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="
                    w-8 h-8 rounded-full bg-[#0C447C]
                    flex items-center justify-center
                    text-white text-[13px] font-bold
                  ">
                    {captainDisplayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#0D1B2A]">
                      {captainDisplayName}
                    </p>
                    <p className={cn(
                      'text-[11px]',
                      chat.connectionStatus === 'connected'
                        ? 'text-[#1D9E75]'
                        : 'text-[#6B7C93]'
                    )}>
                      {chat.connectionStatus === 'connected' ? '● Live' : '○ Connecting...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F8FC] flex items-center justify-center text-[#6B7C93]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {chat.isLoading ? (
                <p className="text-center text-[13px] text-[#6B7C93] py-4">
                  Loading...
                </p>
              ) : chat.messages.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[15px] text-[#6B7C93] mb-1">
                    Ask {captainDisplayName} anything
                  </p>
                  <p className="text-[13px] text-[#6B7C93]">
                    Quick questions below, or type your own
                  </p>
                </div>
              ) : (
                chat.messages.map(msg => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isMine={msg.senderType === 'guest'}
                  />
                ))
              )}
              {chat.isTyping && (
                <div className="flex items-center gap-2">
                  <TypingIndicator />
                  <span className="text-[12px] text-[#6B7C93]">
                    {captainDisplayName} is typing...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips */}
            {chat.messages.length < 2 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => handleChip(chip)}
                    className="
                      flex-shrink-0 h-[36px] px-3 rounded-full
                      border border-[#D0E2F3] bg-white
                      text-[13px] text-[#0D1B2A] font-medium
                      hover:border-[#0C447C] hover:bg-[#E8F2FB]
                      transition-colors whitespace-nowrap
                      flex items-center gap-1.5
                    "
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="
              flex-shrink-0 px-4
              pb-[calc(0.75rem+env(safe-area-inset-bottom))]
              pt-3 border-t border-[#F5F8FC]
              flex items-center gap-2
            ">
              <input
                type="text"
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value)
                  if (e.target.value) chat.sendTyping()
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type a message..."
                maxLength={500}
                className="
                  flex-1 h-[44px] px-4 rounded-full text-[15px]
                  border border-[#D0E2F3] bg-white text-[#0D1B2A]
                  placeholder:text-[#6B7C93]
                  focus:outline-none focus:border-[#0C447C]
                "
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="
                  w-11 h-11 rounded-full
                  bg-[#0C447C] text-white
                  flex items-center justify-center
                  hover:bg-[#093a6b] transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ChatBubble({
  message, isMine,
}: {
  message: import('@/types').ChatMessage
  isMine: boolean
}) {
  const isSystem = message.senderType === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[12px] text-[#6B7C93] bg-[#F5F8FC] px-3 py-1 rounded-full">
          {message.body}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col max-w-[80%]',
      isMine ? 'items-end ml-auto' : 'items-start mr-auto'
    )}>
      {!isMine && (
        <span className="text-[11px] text-[#6B7C93] mb-0.5 px-1">
          {message.senderName}
        </span>
      )}
      <div className={cn(
        'px-4 py-2.5 rounded-[18px] text-[15px] leading-relaxed',
        isMine
          ? 'bg-[#0C447C] text-white rounded-tr-[4px]'
          : 'bg-[#F5F8FC] text-[#0D1B2A] rounded-tl-[4px]'
      )}>
        {message.body}
      </div>
      <span className="text-[10px] text-[#6B7C93] mt-0.5 px-1">
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit',
        })}
      </span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 bg-[#F5F8FC] px-3 py-2 rounded-[18px] rounded-tl-[4px]">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#6B7C93] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

────────────────────────────────────────────
5B. Wire ChatWidget into trip page
────────────────────────────────────────────

Update: apps/web/app/(public)/trip/[slug]/
  page.tsx

The trip page is a Server Component so it
passes the tripId and status to a client
component that reads the guest session and
conditionally renders ChatWidget.

Add import + component at bottom of page:
  import { TripPageChat } from
    '@/components/chat/TripPageChat'

Before the closing </> of the page:
  <TripPageChat
    tripId={trip.id}
    initialStatus={trip.status}
    captainName={trip.boat.captainName}
  />

Create: apps/web/components/chat/
  TripPageChat.tsx
'use client'

Thin wrapper that reads localStorage and
wires up both the ChatWidget and the live
status update for the active banner.

'use client'

import { useEffect, useState } from 'react'
import { ChatWidget } from './ChatWidget'
import { useTripStatus } from '@/hooks/useTripStatus'
import { ActiveTripBanner } from '@/components/trip/ActiveTripBanner'
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
  marinaName, slipNumber,
}: TripPageChatProps) {
  const [session, setSession] = useState<GuestSession | null>(null)

  // Load guest session
  useEffect(() => {
    // Dynamic tripSlug detection from URL
    const slug = window.location.pathname.split('/trip/')[1]?.split('/')[0]
    if (!slug) return
    try {
      const raw = localStorage.getItem(`dp-guest-${slug}`)
      if (raw) setSession(JSON.parse(raw))
    } catch {}
  }, [])

  // Subscribe to live trip status
  const { status, startedAt } = useTripStatus(
    tripId, initialStatus
  )

  // Show active banner when trip goes live
  // (replaces the server-rendered placeholder)
  return (
    <>
      {status === 'active' && marinaName && (
        <ActiveTripBanner
          boatName=""  // not needed here
          marinaName={marinaName}
          slipNumber={slipNumber ?? null}
          startedAt={startedAt}
          tr={null as any}  // banner uses hardcoded EN in live mode
        />
      )}
      <ChatWidget
        tripId={tripId}
        tripStatus={status}
        session={session}
        captainName={captainName}
      />
    </>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6 — CAPTAIN CHAT PANEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
6A. CaptainChatPanel — unified guest thread
────────────────────────────────────────────

Create: apps/web/components/captain/
  CaptainChatPanel.tsx
'use client'

The captain sees ALL guest messages in one
unified thread. Each message shows the guest
name as a label. The captain replies once
and all guests see it.

'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, ChevronDown } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils'
import type { CaptainSnapshotData } from '@/types'

interface CaptainChatPanelProps {
  snapshot: CaptainSnapshotData
  token: string  // snapshot token = captain identity
}

export function CaptainChatPanel({
  snapshot, token,
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

  // Show unread badge but panel collapses by default
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

Wire into: apps/web/components/captain/
  CaptainSnapshotView.tsx

After the add-on summary section, add:
  import { CaptainChatPanel } from './CaptainChatPanel'

  {/* Chat panel (when trip is active) */}
  {status === 'active' && (
    <CaptainChatPanel
      snapshot={liveSnapshot}
      token={token}
    />
  )}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7 — OPERATOR NOTIFICATION TOASTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
7A. NotificationToast — slide-down banners
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  NotificationToast.tsx
'use client'

Appears at the top of the dashboard when
a new guest checks in, trip starts, etc.
Auto-dismisses after 5 seconds.

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/hooks/useOperatorNotifications'

interface NotificationToastProps {
  toasts: AppNotification[]
  onDismiss: (id: string) => void
}

const TOAST_ICONS: Record<string, string> = {
  guest_registered: '👤',
  trip_started: '⚓',
  trip_ended: '✓',
  positive_review: '⭐',
  chat_message: '💬',
  waiver_signed: '📝',
  default: '🔔',
}

export function NotificationToasts({
  toasts, onDismiss,
}: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="
              pointer-events-auto
              flex items-start gap-3
              bg-white border border-[#D0E2F3]
              rounded-[16px] p-4 pr-3
              shadow-[0_4px_20px_rgba(12,68,124,0.15)]
              max-w-[320px]
            "
          >
            <span className="text-[22px] flex-shrink-0 mt-0.5">
              {TOAST_ICONS[toast.type] ?? TOAST_ICONS.default}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#0D1B2A] leading-tight">
                {toast.title}
              </p>
              <p className="text-[13px] text-[#6B7C93] mt-0.5 leading-snug">
                {toast.body}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="
                w-6 h-6 rounded-full flex-shrink-0 mt-0.5
                flex items-center justify-center
                text-[#6B7C93] hover:bg-[#F5F8FC] transition-colors
              "
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

────────────────────────────────────────────
7B. NotificationBell — dashboard header
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  NotificationBell.tsx
'use client'

Shows unread count. Opens notification feed
dropdown. Wire into the dashboard layout.

'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOperatorNotifications } from '@/hooks/useOperatorNotifications'
import type { AppNotification } from '@/hooks/useOperatorNotifications'

interface NotificationBellProps {
  operatorId: string
}

const NOTIFICATION_ICONS: Record<string, string> = {
  guest_registered: '👤',
  trip_started: '⚓',
  trip_ended: '✓',
  positive_review: '⭐',
  chat_message: '💬',
  default: '🔔',
}

export function NotificationBell({ operatorId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications, toasts, unreadCount,
    markRead, markAllRead, dismissToast,
  } = useOperatorNotifications(operatorId)

  return (
    <>
      {/* Toasts layer */}
      {/* Import and use NotificationToasts here */}
      {/* <NotificationToasts toasts={toasts} onDismiss={dismissToast} /> */}
      {/* NOTE: NotificationToasts should be rendered in layout.tsx not here */}

      {/* Bell button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            relative w-10 h-10 rounded-full
            flex items-center justify-center
            text-[#6B7C93] hover:bg-[#F5F8FC]
            transition-colors
          "
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="
              absolute top-1 right-1
              w-4 h-4 rounded-full bg-[#E8593C]
              text-white text-[9px] font-bold
              flex items-center justify-center
            ">
              {unreadCount > 9 ? '9' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="
              absolute right-0 top-12 z-50
              w-[320px] bg-white rounded-[16px]
              border border-[#D0E2F3]
              shadow-[0_8px_32px_rgba(12,68,124,0.15)]
              overflow-hidden
            ">
              <div className="px-4 py-3 border-b border-[#F5F8FC] flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#0D1B2A]">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[12px] text-[#0C447C] hover:underline flex items-center gap-1"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-[14px] text-[#6B7C93]">
                      All caught up ✓
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F5F8FC]">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-[#F5F8FC] cursor-pointer"
                        onClick={() => markRead(n.id)}
                      >
                        <span className="text-[18px] flex-shrink-0 mt-0.5">
                          {NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICONS.default}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-[#0D1B2A] leading-tight">
                            {n.title}
                          </p>
                          <p className="text-[12px] text-[#6B7C93] mt-0.5 leading-snug truncate">
                            {n.body}
                          </p>
                          <p className="text-[11px] text-[#6B7C93] mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-[#0C447C] flex-shrink-0 mt-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

────────────────────────────────────────────
7C. Wire into dashboard layout
────────────────────────────────────────────

Update: apps/web/app/dashboard/layout.tsx

The dashboard layout needs:
  1. NotificationBell in the header (desktop)
  2. NotificationToasts at root level
  3. NotificationBell in BottomNav (mobile)

Fetch operatorId server-side and pass to
the client components.

In the layout, add:
  import { NotificationBell } from
    '@/components/dashboard/NotificationBell'
  import { NotificationToasts } from
    '@/components/dashboard/NotificationToast'
  import { DashboardNotifications } from
    '@/components/dashboard/DashboardNotifications'

Create one wrapper client component that
handles both the bell and the toasts to
keep the layout clean:

Create: apps/web/components/dashboard/
  DashboardNotifications.tsx
'use client'

'use client'

import { useOperatorNotifications } from '@/hooks/useOperatorNotifications'
import { NotificationToasts } from './NotificationToast'
import { NotificationBell } from './NotificationBell'

export function DashboardNotifications({
  operatorId,
}: {
  operatorId: string
}) {
  const { toasts, dismissToast, unreadCount, notifications, markRead, markAllRead } =
    useOperatorNotifications(operatorId)

  return (
    <>
      <NotificationToasts toasts={toasts} onDismiss={dismissToast} />
      {/* Bell is rendered separately in the layout header */}
    </>
  )
}

Then in dashboard/layout.tsx, add within the
authenticated section:
  <DashboardNotifications operatorId={operator.id} />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 8 — CONNECTION STATE MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

────────────────────────────────────────────
8A. Offline banner
────────────────────────────────────────────

Create: apps/web/components/ui/
  OfflineBanner.tsx
'use client'

Shows when the browser goes offline.
Hides when connection returns.
Design from DESIGN.md offline banner spec.

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true)
      setWasOffline(true)
    }
    function handleOnline() {
      setIsOffline(false)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    // Check initial state
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline ? (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          className="
            fixed top-0 left-0 right-0 z-[70]
            bg-[#E5910A] text-white
            flex items-center justify-center
            py-2 px-4 text-[13px] font-medium
          "
        >
          ⚠️ You're offline — some features unavailable
        </motion.div>
      ) : wasOffline ? (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          transition={{ duration: 0.3 }}
          className="
            fixed top-0 left-0 right-0 z-[70]
            bg-[#1D9E75] text-white
            flex items-center justify-center
            py-2 px-4 text-[13px] font-medium
          "
          onAnimationComplete={() => {
            setTimeout(() => setWasOffline(false), 2000)
          }}
        >
          ✓ Back online
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

Add OfflineBanner to:
  apps/web/app/(public)/trip/[slug]/page.tsx
  apps/web/app/dashboard/layout.tsx

────────────────────────────────────────────
8B. Realtime connection indicator (dashboard)
────────────────────────────────────────────

Create: apps/web/components/dashboard/
  RealtimeIndicator.tsx
'use client'

Small dot in dashboard header showing whether
the Supabase Realtime connection is live.

'use client'

import { cn } from '@/lib/utils'
import type { RealtimeStatus } from '@/types'

export function RealtimeIndicator({
  status,
}: {
  status: RealtimeStatus
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        'w-2 h-2 rounded-full',
        status === 'connected' && 'bg-[#1D9E75] animate-pulse',
        status === 'connecting' && 'bg-[#E5910A]',
        status === 'disconnected' && 'bg-[#D0E2F3]',
        status === 'error' && 'bg-[#D63B3B]',
      )} />
      <span className="text-[11px] text-[#6B7C93] hidden md:inline">
        {status === 'connected' ? 'Live' : status}
      </span>
    </div>
  )
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 9 — REFACTOR: CONSOLIDATE EXISTING
REALTIME SUBSCRIPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phases 3D and 3E added inline useEffect
subscriptions directly in components. These
must be refactored to use the new hooks for
consistency and to prevent duplicate channels.

────────────────────────────────────────────
9A. TodayTripCard refactor
────────────────────────────────────────────

Update: apps/web/components/dashboard/
  TodayTripCard.tsx

REMOVE the inline useEffect that subscribes
to postgres_changes on the guests table.

REPLACE with:
  import { useTripGuests } from '@/hooks/useTripGuests'
  import { RealtimeIndicator } from './RealtimeIndicator'

  const { guests, connectionStatus } = useTripGuests(
    trip.id, trip.guests
  )

Add RealtimeIndicator to the card header:
  <RealtimeIndicator status={connectionStatus} />

────────────────────────────────────────────
9B. GuestManagementTable refactor
────────────────────────────────────────────

Update: apps/web/components/dashboard/
  GuestManagementTable.tsx

Same pattern as 9A. Remove the inline
useEffect. Replace with useTripGuests hook.

  const { guests, connectionStatus, lastUpdated } =
    useTripGuests(tripId, initialGuests)

Add to the table header:
  <div className="flex items-center gap-2">
    <RealtimeIndicator status={connectionStatus} />
    {lastUpdated && (
      <span className="text-[11px] text-[#6B7C93]">
        Updated {lastUpdated.toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit'
        })}
      </span>
    )}
  </div>

────────────────────────────────────────────
9C. CaptainSnapshotView refactor
────────────────────────────────────────────

Update: apps/web/components/captain/
  CaptainSnapshotView.tsx

The snapshot already has an auto-refresh
interval. Add useTripGuests to also receive
instant push updates (don't rely on polling
alone):

  import { useTripGuests } from '@/hooks/useTripGuests'

  const { guests: liveGuests, connectionStatus } =
    useTripGuests(snapshot.tripId, snapshot.guests)

  // Update snapshot guests in real-time
  const displayGuests = liveGuests.length > 0
    ? liveGuests
    : liveSnapshot.guests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 10 — TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: apps/web/__tests__/unit/realtime/
  chatSchema.test.ts

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { QUICK_CHIPS, CHANNELS } from '@/types'

const messageSchema = z.object({
  body: z.string().min(1).max(500).transform(s => s.trim()),
  senderType: z.enum(['guest', 'captain', 'operator', 'system']),
  senderName: z.string().min(1).max(100),
  senderId: z.string().min(1).max(100),
  chipKey: z.string().max(50).nullable().optional(),
  isQuickChip: z.boolean().optional().default(false),
})

describe('chat message schema', () => {
  const valid = {
    body: 'Where do I park?',
    senderType: 'guest' as const,
    senderName: 'Sofia Martinez',
    senderId: '550e8400-e29b-41d4-a716-446655440000',
  }

  it('accepts valid guest message', () => {
    expect(messageSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty body', () => {
    expect(messageSchema.safeParse({
      ...valid, body: '',
    }).success).toBe(false)
  })

  it('rejects body over 500 chars', () => {
    expect(messageSchema.safeParse({
      ...valid, body: 'x'.repeat(501),
    }).success).toBe(false)
  })

  it('rejects unknown sender type', () => {
    expect(messageSchema.safeParse({
      ...valid, senderType: 'admin',
    }).success).toBe(false)
  })

  it('trims body whitespace', () => {
    const result = messageSchema.safeParse({
      ...valid, body: '  Where do I park?  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.body).toBe('Where do I park?')
    }
  })

  it('accepts quick chip with chipKey', () => {
    expect(messageSchema.safeParse({
      ...valid,
      chipKey: 'parking',
      isQuickChip: true,
    }).success).toBe(true)
  })
})

describe('QUICK_CHIPS', () => {
  it('has 6 chips', () => {
    expect(QUICK_CHIPS).toHaveLength(6)
  })

  it('each chip has key, icon, label', () => {
    for (const chip of QUICK_CHIPS) {
      expect(chip.key).toBeTruthy()
      expect(chip.icon).toBeTruthy()
      expect(chip.label).toBeTruthy()
    }
  })

  it('keys are unique', () => {
    const keys = QUICK_CHIPS.map(c => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('CHANNELS', () => {
  it('generates scoped channel names', () => {
    const tripId = 'trip-abc-123'
    expect(CHANNELS.tripGuests(tripId))
      .toBe(`trip-guests-${tripId}`)
    expect(CHANNELS.tripChat(tripId))
      .toBe(`trip-chat-${tripId}`)
    expect(CHANNELS.tripStatus(tripId))
      .toBe(`trip-status-${tripId}`)
  })

  it('different trips get different channels', () => {
    expect(CHANNELS.tripChat('trip-1'))
      .not.toBe(CHANNELS.tripChat('trip-2'))
  })
})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 11 — VERIFICATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All 15 tests must pass before Phase 3H.

TEST 1 — Unit tests:
  npm run test
  All tests in __tests__/unit/realtime/ pass

TEST 2 — Migration 005 applied:
  trip_messages table exists in Supabase
  supabase_realtime publication includes:
    guests, trips, operator_notifications, trip_messages
  Verify in Supabase Dashboard → Database → Replication

TEST 3 — Guest registration live update (dashboard):
  Open operator dashboard /dashboard/trips/[id] tab 1
  Open trip page /trip/[slug] in incognito tab 2
  In tab 2: register a guest (Phase 3C join flow)
  In tab 1: within 2 seconds, the guest row appears
  NO manual refresh in tab 1
  RealtimeIndicator shows green ●

TEST 4 — Guest count live on trip page:
  Open trip page in two different browsers
  In browser 1: register a guest
  In browser 2: the guest count in StickyJoinCTA
    updates from "N of M checked in" within 5 seconds
  The count uses the API route, not Realtime
  (Trip page does not subscribe — it polls on interaction)

TEST 5 — Trip page live status:
  Open trip page with trip.status = 'upcoming'
  In Supabase: manually UPDATE trips SET status = 'active'
    WHERE id = '[tripId]'
  Trip page: teal "Your charter is active" banner appears
  Within 3 seconds. Without refresh.

TEST 6 — Chat widget appears on active trip:
  Trip is active
  Guest has a session in localStorage
  Navigate to /trip/[slug]
  Chat FAB (navy circle with MessageCircle icon)
    appears in bottom-right corner
  Tap FAB: chat sheet slides up
  Quick chips are visible

TEST 7 — Send and receive chat message:
  Open trip page as guest (tab 1, with session)
  Open captain snapshot page (tab 2)
  In tab 1: tap "I'm at the marina now" quick chip
  In tab 2: captain chat panel shows the message
    within 2 seconds. Guest name shown.
  In tab 2: type reply "See you at Slip 14A!"
    and send
  In tab 1: reply appears in chat sheet
  VERIFY in Supabase: trip_messages has 2 rows

TEST 8 — Chat rate limiting:
  Send 20 messages rapidly as the same guest
  21st message: API returns 429
  Error visible in chat UI

TEST 9 — Chat closed for completed trip:
  Set trip status = 'completed' in Supabase
  Navigate to /trip/[slug]
  ChatWidget FAB: NOT rendered
  POST to /api/trips/[tripId]/messages:
    Returns 409 "Chat is closed for this trip"

TEST 10 — Typing indicator:
  Open chat as guest (tab 1) and captain (tab 2)
  In tab 1: start typing in the input field
  In tab 2: "A guest is typing..." appears
  Disappears after 3 seconds of no typing

TEST 11 — Operator notification toasts:
  Open operator dashboard
  In another tab: register a new guest
  Dashboard: a toast slides in from top-right
    "👤 New guest checked in"
    Shows guest first name
  Auto-dismisses after 5 seconds
  NotificationBell badge increments

TEST 12 — Mark notification as read:
  Dashboard shows unread badge on bell
  Click notification in dropdown
  Badge decrements
  "Mark all read" clears all
  Supabase: operator_notifications.read_at is set

TEST 13 — Singleton Supabase client:
  Open dashboard with multiple realtime components
  Open browser DevTools → Network → WS
  Count WebSocket connections to Supabase
  EXPECTED: exactly 1 WebSocket connection
  (All channels share one connection)

TEST 14 — Offline banner:
  Open trip page in browser
  DevTools → Network → Throttling → Offline
  Orange banner appears: "You're offline"
  Un-tick Offline
  Green banner: "Back online"
  Disappears after 2 seconds

TEST 15 — Build clean:
  npm run typecheck → zero errors
  npm run build → zero errors
  No duplicate useEffect subscriptions
    (each component uses the hook, not inline)
  No 'any' in new files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT BACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When all 15 tests pass:
  1. Every file created (full paths)
  2. Every file modified (full paths + change)
  3. Migration 005 status:
     - trip_messages table confirmed
     - Realtime publication tables confirmed
  4. All 15 test results: ✅ / ❌
  5. WebSocket connection count
     (from DevTools → Network → WS)
  6. Chat latency observed in TEST 7
     (approx ms between send and receive)
  7. Channels created during dashboard session
     (list all active channel names)
  8. Any deviations from spec + why
  9. Total lines added across all files
```
