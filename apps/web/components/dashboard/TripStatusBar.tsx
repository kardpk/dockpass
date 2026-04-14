'use client'

import { useState, useMemo } from 'react'
import { useTripStatus } from '@/hooks/useTripStatus'
import { useTripGuests } from '@/hooks/useTripGuests'
import { RealtimeIndicator } from './RealtimeIndicator'
import { cn } from '@/lib/utils/cn'
import type { TripStatus, DashboardGuest } from '@/types'

interface TripStatusBarProps {
  tripId: string
  tripSlug: string
  initialStatus: TripStatus
  initialStartedAt: string | null
  initialGuests: DashboardGuest[]
  requiredSafetyCards: number
}

export function TripStatusBar({
  tripId,
  tripSlug,
  initialStatus,
  initialStartedAt,
  initialGuests,
  requiredSafetyCards,
}: TripStatusBarProps) {
  const { status, startedAt, connectionStatus } = useTripStatus(
    tripId,
    initialStatus,
    initialStartedAt
  )
  const { guests } = useTripGuests(tripId, initialGuests)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Inline confirmation panel state ─────────────────────
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [briefingConfirmed, setBriefingConfirmed] = useState(false)
  const [captainBriefedAll, setCaptainBriefedAll] = useState(false)

  // ── USCG PRE-DEPARTURE COMPLIANCE ──────────────────────
  const isReadyToDepart = useMemo(() => {
    if (guests.length === 0) return false
    return guests.every(g => {
      const hasWaiver = g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = (g.safetyAcknowledgments?.length ?? 0) >= requiredSafetyCards
      const isApproved = (g.approvalStatus as string) !== 'pending'
      return hasWaiver && hasSafety && isApproved
    })
  }, [guests, requiredSafetyCards])

  const nonCompliantCount = useMemo(() =>
    guests.filter(g => {
      const hasWaiver = g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = (g.safetyAcknowledgments?.length ?? 0) >= requiredSafetyCards
      const isApproved = (g.approvalStatus as string) !== 'pending'
      return !(hasWaiver && hasSafety && isApproved)
    }).length
  , [guests, requiredSafetyCards])

  // ── Start trip with briefing attestation ─────────────────
  async function handleStartTrip() {
    setLoading(true)
    setError(null)

    try {
      // Step 1: Generate a snapshot token (operator auth'd)
      const tokenRes = await fetch(
        `/api/dashboard/trips/${tripId}/snapshot`,
        { method: 'POST' }
      )
      if (!tokenRes.ok) {
        throw new Error('Failed to generate captain token')
      }
      const tokenJson = await tokenRes.json()
      const snapshotToken = tokenJson.data?.token
      if (!snapshotToken) throw new Error('No token returned')

      // Step 2: Call start endpoint with the token + briefing attestation
      const startRes = await fetch(`/api/trips/${tripSlug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotToken,
          confirmedGuestCount: guests.length,
          checklistConfirmed: true,
          // Include briefing attestation from dashboard
          ...(briefingConfirmed && captainBriefedAll ? {
            briefingAttestation: {
              type: 'full_verbal' as const,
              topicsCovered: ['emergency_exits', 'life_jacket_location', 'life_jacket_donning',
                              'instruction_placards', 'hazardous_conditions'],
              signature: 'Operator — Dashboard Confirmation',
              confirmedAt: new Date().toISOString(),
            },
          } : {}),
        }),
      })

      if (!startRes.ok) {
        const body = await startRes.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error || 'Failed to start trip')
      }

      setShowStartConfirm(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start trip'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── End trip ───────────────────────────────────────────
  async function handleEndTrip() {
    if (!window.confirm('End this trip? This will mark it as completed and trigger review requests.')) return

    setLoading(true)
    setError(null)

    try {
      const tokenRes = await fetch(
        `/api/dashboard/trips/${tripId}/snapshot`,
        { method: 'POST' }
      )
      if (!tokenRes.ok) throw new Error('Failed to generate token')
      const tokenJson = await tokenRes.json()
      const snapshotToken = tokenJson.data?.token

      const endRes = await fetch(`/api/trips/${tripSlug}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotToken }),
      })

      if (!endRes.ok) {
        const body = await endRes.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error || 'Failed to end trip')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to end trip'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">

      {/* Connection status */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[#0D1B2A]">Trip Control</h3>
        <RealtimeIndicator status={connectionStatus} />
      </div>

      {/* USCG Compliance Banner — only for upcoming trips */}
      {status === 'upcoming' && (
        isReadyToDepart ? (
          <div className="p-4 rounded-[16px] bg-[#E8F9F4] border-2 border-[#1D9E75]">
            <div className="flex items-center gap-3">
              <span className="text-[24px]">✅</span>
              <div>
                <p className="text-[15px] font-bold text-[#1D9E75]">
                  ALL CLEAR — Ready for departure
                </p>
                <p className="text-[12px] text-[#6B7C93] mt-0.5">
                  {guests.length} guest{guests.length !== 1 ? 's' : ''} · All waivers signed · Safety briefing complete
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-[16px] bg-[#FEF3DC] border-2 border-[#E5910A]">
            <div className="flex items-center gap-3">
              <span className="text-[24px]">⚠️</span>
              <div>
                <p className="text-[15px] font-bold text-[#E5910A]">
                  WAITING ON GUESTS
                </p>
                <p className="text-[12px] text-[#6B7C93] mt-0.5">
                  {nonCompliantCount} guest{nonCompliantCount !== 1 ? 's' : ''} still need to sign the waiver or complete the safety briefing
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Active trip indicator */}
      {status === 'active' && startedAt && (
        <div className="p-3 rounded-[12px] bg-[#E8F2FB] border border-[#D0E2F3]">
          <div className="flex items-center gap-2">
            <span className="text-[16px]">⚓</span>
            <p className="text-[13px] font-medium text-[#0C447C]">
              Trip active since {new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-[12px] bg-[#FDEAEA] border border-[#D63B3B]/30">
          <p className="text-[13px] text-[#D63B3B]">{error}</p>
        </div>
      )}

      {/* ── Inline Start Trip Confirmation Panel ─────────────── */}
      {showStartConfirm && status === 'upcoming' && (
        <div className="rounded-[16px] border-2 border-[#0C447C] bg-white overflow-hidden shadow-lg">
          {/* Panel header */}
          <div className="bg-[#0C447C] px-4 py-3 flex items-center gap-2">
            <span className="text-[18px]">🛡️</span>
            <p className="text-[14px] font-bold text-white">
              Pre-Departure Confirmation
            </p>
          </div>

          <div className="px-4 py-4 space-y-3">
            {/* Summary */}
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6B7C93]">Passengers</span>
              <span className="font-bold text-[#0D1B2A]">{guests.length}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6B7C93]">Waivers signed</span>
              <span className="font-bold text-[#1D9E75]">
                {guests.filter(g => g.waiverSigned || g.waiverTextHash === 'firma_template').length} / {guests.length}
              </span>
            </div>

            <hr className="border-[#D0E2F3]" />

            {/* Safety briefing attestation */}
            <div className="p-3 bg-[#F5F8FC] rounded-[12px] space-y-3">
              <p className="text-[12px] font-bold text-[#6B7C93] uppercase tracking-wider">
                46 CFR §185.506 — Safety Briefing
              </p>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => setCaptainBriefedAll(!captainBriefedAll)}
                  className={cn(
                    'w-5 h-5 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    'transition-all duration-150',
                    captainBriefedAll
                      ? 'bg-[#0C447C] border-[#0C447C]'
                      : 'bg-white border-[#D0E2F3]'
                  )}
                >
                  {captainBriefedAll && (
                    <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-[#0D1B2A] leading-relaxed">
                  The captain has verbally briefed all passengers on life jacket locations,
                  emergency exits, and safety procedures
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  onClick={() => setBriefingConfirmed(!briefingConfirmed)}
                  className={cn(
                    'w-5 h-5 rounded-[5px] border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                    'transition-all duration-150',
                    briefingConfirmed
                      ? 'bg-[#0C447C] border-[#0C447C]'
                      : 'bg-white border-[#D0E2F3]'
                  )}
                >
                  {briefingConfirmed && (
                    <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-[13px] text-[#0D1B2A] leading-relaxed">
                  Insurance will be activated and passengers will be notified
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowStartConfirm(false)
                  setBriefingConfirmed(false)
                  setCaptainBriefedAll(false)
                }}
                disabled={loading}
                className="flex-1 h-[44px] rounded-[10px] border border-[#D0E2F3] text-[#6B7C93] font-semibold text-[14px] hover:bg-[#F5F8FC] transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleStartTrip}
                disabled={loading || !briefingConfirmed || !captainBriefedAll}
                className={cn(
                  'flex-1 h-[44px] rounded-[10px] font-bold text-[14px] transition-all',
                  briefingConfirmed && captainBriefedAll
                    ? 'bg-[#1D9E75] text-white hover:bg-[#178a64] active:scale-[0.98]'
                    : 'bg-[#D0E2F3] text-[#6B7C93] cursor-not-allowed'
                )}
              >
                {loading ? 'Starting...' : '⚓ Confirm & Start'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Trip button — opens confirmation panel */}
      {status === 'upcoming' && !showStartConfirm && (
        <button
          onClick={() => setShowStartConfirm(true)}
          disabled={!isReadyToDepart || loading}
          className="
            w-full h-[52px] rounded-[14px]
            bg-[#1D9E75] text-white
            font-bold text-[16px]
            hover:bg-[#178a64] transition-colors
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            disabled:hover:bg-[#1D9E75]
          "
        >
          {loading ? 'Starting...' : isReadyToDepart ? '🛡️ Start Trip' : '🔒 Waiting on compliance...'}
        </button>
      )}

      {status === 'active' && (
        <button
          onClick={handleEndTrip}
          disabled={loading}
          className="
            w-full h-[52px] rounded-[14px]
            bg-[#E8593C] text-white
            font-bold text-[16px]
            hover:bg-[#cc4a32] transition-colors
            disabled:opacity-40
          "
        >
          {loading ? 'Ending...' : 'End Trip →'}
        </button>
      )}

      {status === 'completed' && (
        <div className="
          w-full h-[52px] rounded-[14px]
          bg-[#E8F9F4] border border-[#1D9E75]/30
          flex items-center justify-center
        ">
          <span className="text-[15px] font-semibold text-[#1D9E75]">
            ✓ Trip completed
          </span>
        </div>
      )}
    </div>
  )
}
