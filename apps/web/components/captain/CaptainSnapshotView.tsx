'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { SnapshotAlerts } from './SnapshotAlerts'
import { SnapshotGuestList } from './SnapshotGuestList'
import { SnapshotAddonSummary } from './SnapshotAddonSummary'
import { StartTripFlow } from './StartTripFlow'
import { EndTripFlow } from './EndTripFlow'
import { CaptainChatPanel } from './CaptainChatPanel'
import { useTripGuests } from '@/hooks/useTripGuests'
import type { CaptainSnapshotData, TripStatus, DashboardGuest } from '@/types'

interface CaptainSnapshotViewProps {
  snapshot: CaptainSnapshotData
  token: string
  tripStatus: TripStatus
  startedAt: string | null
  buoyPolicyId: string | null
}

export function CaptainSnapshotView({
  snapshot, token, tripStatus, startedAt, buoyPolicyId,
}: CaptainSnapshotViewProps) {
  const [status, setStatus] = useState<TripStatus>(tripStatus)
  const [startedAtState, setStartedAt] = useState(startedAt)
  const [policyId, setPolicyId] = useState(buoyPolicyId)
  const [showStartFlow, setShowStartFlow] = useState(false)
  const [showEndFlow, setShowEndFlow] = useState(false)
  const [liveSnapshot, setLiveSnapshot] = useState(snapshot)
  // Realtime guest subscription adapter
  const initialDashboardGuests = useMemo<DashboardGuest[]>(() => 
    snapshot.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      languagePreference: 'en',
      dietaryRequirements: null,
      isNonSwimmer: false,
      isSeaSicknessProne: false,
      waiverSigned: g.waiverSigned,
      waiverSignedAt: null,
      approvalStatus: 'auto_approved',
      checkedInAt: null,
      createdAt: '',
      customerId: null,
      safetyAcknowledgments: [],
      waiverTextHash: g.waiverTextHash ?? null,
      addonOrders: []
    })), [snapshot.guests])

  const { guests: realtimeUpdates } = useTripGuests(snapshot.tripId, initialDashboardGuests)

  const mergedGuests = useMemo(() => {
    // Merge realtime updates into snapshot guests
    const updated = liveSnapshot.guests.map(guest => {
      const update = realtimeUpdates.find(r => r.id === guest.id)
      if (update) {
        return {
          ...guest,
          waiverSigned: update.waiverSigned,
          waiverTextHash: update.waiverTextHash ?? guest.waiverTextHash,
          safetyAckCount: update.safetyAcknowledgments?.length ?? guest.safetyAckCount,
        }
      }
      return guest
    })
    // Add any NEW guests from realtime that weren't in the initial snapshot
    for (const rt of realtimeUpdates) {
      if (!updated.some(u => u.id === rt.id)) {
        updated.push({
          id: rt.id,
          fullName: rt.fullName,
          waiverSigned: rt.waiverSigned,
          waiverTextHash: rt.waiverTextHash ?? null,
          safetyAckCount: rt.safetyAcknowledgments?.length ?? 0,
          languageFlag: '🌐',
          addonEmojis: [],
        })
      }
    }
    return updated
  }, [liveSnapshot.guests, realtimeUpdates])

  // ── USCG PRE-DEPARTURE COMPLIANCE COMPUTATION ────────────
  const requiredCards = liveSnapshot.requiredSafetyCards ?? 0

  const isReadyToDepart = useMemo(() => {
    if (mergedGuests.length === 0) return false
    return mergedGuests.every(g => {
      const hasWaiver = g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = (g.safetyAckCount ?? 0) >= requiredCards
      return hasWaiver && hasSafety
    })
  }, [mergedGuests, requiredCards])

  const nonCompliantCount = useMemo(() =>
    mergedGuests.filter(g => {
      const hasWaiver = g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = (g.safetyAckCount ?? 0) >= requiredCards
      return !(hasWaiver && hasSafety)
    }).length
  , [mergedGuests, requiredCards])

  // Polling fallback — reduced to 5 minutes since realtime is primary
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/snapshot/${token}`)
        if (res.ok) {
          const json = await res.json()
          setLiveSnapshot(json.data)
        }
      } catch {}
    }, 30000) // 30 seconds — fast fallback for flaky marina WiFi
    return () => clearInterval(interval)
  }, [token])

  function onTripStarted(result: {
    startedAt: string
    buoyPolicyId: string | null
  }) {
    setStatus('active')
    setStartedAt(result.startedAt)
    setPolicyId(result.buoyPolicyId)
    setShowStartFlow(false)
  }

  function onTripEnded() {
    setStatus('completed')
    setShowEndFlow(false)
  }

  // Show start flow overlay
  if (showStartFlow) {
    return (
      <StartTripFlow
        snapshot={liveSnapshot}
        token={token}
        onStarted={onTripStarted}
        onCancel={() => setShowStartFlow(false)}
      />
    )
  }

  // Show end flow overlay
  if (showEndFlow) {
    return (
      <EndTripFlow
        boatName={liveSnapshot.boatName}
        startedAt={startedAtState}
        token={token}
        tripSlug={liveSnapshot.slug}
        onEnded={onTripEnded}
        onCancel={() => setShowEndFlow(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC]">

      {/* Header */}
      <div className="bg-[#0C447C] px-5 pt-5 pb-6 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-bold tracking-wider opacity-70">
            CAPTAIN VIEW · BOATCHECKIN
          </span>
          <span className={
            status === 'active'
              ? 'text-[12px] font-bold bg-[#1D9E75] px-2.5 py-1 rounded-full'
              : 'text-[12px] font-bold bg-white/20 px-2.5 py-1 rounded-full'
          }>
            {status === 'active' ? '● Active' : 'Upcoming'}
          </span>
        </div>
        <h1 className="text-[24px] font-bold mb-1">
          {liveSnapshot.boatName}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            `📅 ${formatTripDate(liveSnapshot.tripDate)}`,
            `⏰ ${formatTime(liveSnapshot.departureTime)}`,
            `⏳ ${formatDuration(liveSnapshot.durationHours)}`,
          ].map(chip => (
            <span key={chip} className="bg-white/20 text-white text-[12px] px-3 py-1 rounded-full">
              {chip}
            </span>
          ))}
        </div>
        <p className="text-white/70 text-[13px] mt-2">
          📍 {liveSnapshot.marinaName}
          {liveSnapshot.slipNumber ? ` · Slip ${liveSnapshot.slipNumber}` : ''}
        </p>

        {/* Weather */}
        {liveSnapshot.weather && (
          <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-[10px] px-3 py-2">
            <span className="text-[20px]">{liveSnapshot.weather.icon}</span>
            <span className="text-[13px] font-medium">
              {liveSnapshot.weather.label} · {liveSnapshot.weather.temperature}°F
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">

        {/* Buoy insurance status */}
        {status === 'active' && (
          <div className="p-4 rounded-[16px] bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">🟢</span>
              <div>
                <p className="text-[14px] font-semibold text-[#1D9E75]">
                  Insurance active
                </p>
                {policyId && !policyId.startsWith('STUB') && !policyId.startsWith('FAIL') && (
                  <p className="text-[12px] text-[#6B7C93]">
                    Policy: {policyId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── USCG PRE-DEPARTURE COMPLIANCE BANNER ──────────────── */}
        {status === 'upcoming' && (
          isReadyToDepart ? (
            <div className="p-4 rounded-[16px] bg-[#E8F9F4] border-2 border-[#1D9E75]">
              <div className="flex items-center gap-3">
                <span className="text-[28px]">✅</span>
                <div>
                  <p className="text-[16px] font-bold text-[#1D9E75]">
                    ALL CLEAR — Ready for departure
                  </p>
                  <p className="text-[12px] text-[#6B7C93] mt-0.5">
                    {mergedGuests.length} guest{mergedGuests.length !== 1 ? 's' : ''} · All waivers signed · Safety briefing complete
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[16px] bg-[#FEF3DC] border-2 border-[#E5910A]">
              <div className="flex items-center gap-3">
                <span className="text-[28px]">⚠️</span>
                <div>
                  <p className="text-[16px] font-bold text-[#E5910A]">
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

        {/* Passenger alerts */}
        <SnapshotAlerts alerts={liveSnapshot.alerts} />

        {/* Guest list */}
        <SnapshotGuestList
          guests={mergedGuests}
          maxGuests={snapshot.maxGuests ?? mergedGuests.length}
        />

        {/* Add-on summary */}
        {liveSnapshot.addonSummary.length > 0 && (
          <SnapshotAddonSummary summary={liveSnapshot.addonSummary} />
        )}

        {/* Chat panel (when trip is active) */}
        {status === 'active' && (
          <CaptainChatPanel
            snapshot={liveSnapshot}
            token={token}
          />
        )}

        {/* Refresh indicator */}
        <p className="text-[11px] text-[#6B7C93] text-center">
          Live updates active · Fallback refresh every 5 min
        </p>

        {/* Bottom action button */}
        <div className="pt-2 pb-8">
          {status === 'upcoming' && (
            <button
              onClick={() => setShowStartFlow(true)}
              disabled={!isReadyToDepart}
              className="
                w-full h-[64px] rounded-[16px]
                bg-[#1D9E75] text-white
                font-bold text-[18px]
                hover:bg-[#178a64] transition-colors
                active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
                disabled:hover:bg-[#1D9E75]
              "
            >
              {isReadyToDepart ? '⚓ Start Trip →' : '🔒 Waiting on compliance...'}
            </button>
          )}

          {status === 'active' && (
            <button
              onClick={() => setShowEndFlow(true)}
              className="
                w-full h-[64px] rounded-[16px]
                bg-[#E8593C] text-white
                font-bold text-[18px]
                hover:bg-[#cc4a32] transition-colors
              "
            >
              End Trip →
            </button>
          )}

          {status === 'completed' && (
            <div className="
              w-full h-[64px] rounded-[16px]
              bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30
              flex items-center justify-center
            ">
              <span className="text-[16px] font-semibold text-[#1D9E75]">
                ✓ Trip completed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
