'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  Shield, MapPin, Clock, Calendar, FileText, Lock,
  CheckCircle2, AlertTriangle, QrCode, Briefcase
} from 'lucide-react'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { SnapshotAlerts } from './SnapshotAlerts'
import { SnapshotGuestList } from './SnapshotGuestList'
import { SnapshotAddonSummary } from './SnapshotAddonSummary'
import { StartTripFlow } from './StartTripFlow'
import { EndTripFlow } from './EndTripFlow'
import { CaptainChatPanel } from './CaptainChatPanel'
import { CrewManifestPanel } from './CrewManifestPanel'
import { TripNotesPanel } from './TripNotesPanel'
import { HeadCountConfirm } from './HeadCountConfirm'
import { downloadFloatPlan } from '@/lib/captain/floatPlan'
import { useTripGuests } from '@/hooks/useTripGuests'
import { getComplianceProfile, getComplianceLevel } from '@/lib/compliance/tripCompliance'
import { SafetyBriefingGate } from './SafetyBriefingGate'
import type { BriefingAttestation } from './SafetyBriefingGate'
import type { CaptainSnapshotData, TripStatus, DashboardGuest, TripPurpose } from '@/types'

// Dynamic import — html5-qrcode uses browser APIs that break SSR
const QrBoardingScanner = dynamic(
  () => import('./QrBoardingScanner').then(m => ({ default: m.QrBoardingScanner })),
  { ssr: false }
)

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
  const [showScanner, setShowScanner] = useState(false)
  const [showBriefingGate, setShowBriefingGate] = useState(false)
  const [briefingAttestation, setBriefingAttestation] = useState<BriefingAttestation | null>(null)
  // Realtime guest subscription adapter
  const initialDashboardGuests = useMemo<DashboardGuest[]>(() => 
    snapshot.guests.map(g => ({
      id: g.id,
      fullName: g.fullName,
      emergencyContactName: null,
      emergencyContactPhone: null,
      languagePreference: 'en',
      dietaryRequirements: null,
      dateOfBirth: g.dateOfBirth ?? null,
      isNonSwimmer: false,
      isSeaSicknessProne: false,
      waiverSigned: g.waiverSigned,
      waiverSignedAt: null,
      approvalStatus: (g as Record<string, unknown>).approvalStatus as DashboardGuest['approvalStatus'] ?? 'auto_approved',
      checkedInAt: null,
      createdAt: '',
      customerId: null,
      safetyAcknowledgments: [],
      waiverTextHash: g.waiverTextHash ?? null,
      fwcLicenseUrl: (g as Record<string, unknown>).fwcLicenseUrl as string ?? null,
      liveryBriefingVerifiedAt: (g as Record<string, unknown>).liveryBriefingVerifiedAt as string ?? null,
      liveryBriefingVerifiedBy: (g as Record<string, unknown>).liveryBriefingVerifiedBy as string ?? null,
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
          dateOfBirth: update.dateOfBirth ?? guest.dateOfBirth ?? null,
          waiverSigned: update.waiverSigned,
          waiverTextHash: update.waiverTextHash ?? guest.waiverTextHash,
          safetyAckCount: update.safetyAcknowledgments?.length ?? guest.safetyAckCount,
          approvalStatus: update.approvalStatus ?? guest.approvalStatus ?? 'auto_approved',
          fwcLicenseUrl: update.fwcLicenseUrl ?? guest.fwcLicenseUrl ?? null,
          liveryBriefingVerifiedAt: update.liveryBriefingVerifiedAt ?? guest.liveryBriefingVerifiedAt ?? null,
          liveryBriefingVerifiedBy: update.liveryBriefingVerifiedBy ?? guest.liveryBriefingVerifiedBy ?? null,
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
          dateOfBirth: rt.dateOfBirth ?? null,
          waiverSigned: rt.waiverSigned,
          waiverTextHash: rt.waiverTextHash ?? null,
          safetyAckCount: rt.safetyAcknowledgments?.length ?? 0,
          languageFlag: '🌐',
          addonEmojis: [],
          approvalStatus: rt.approvalStatus ?? 'auto_approved',
          fwcLicenseUrl: rt.fwcLicenseUrl ?? null,
          liveryBriefingVerifiedAt: rt.liveryBriefingVerifiedAt ?? null,
          liveryBriefingVerifiedBy: rt.liveryBriefingVerifiedBy ?? null,
        })
      }
    }
    return updated
  }, [liveSnapshot.guests, realtimeUpdates])

  // ── COMPLIANCE PROFILE (derived from trip purpose) ────────────
  const compliance = useMemo(
    () => getComplianceProfile(
      liveSnapshot.tripPurpose as TripPurpose,
      liveSnapshot.forceFullCompliance
    ),
    [liveSnapshot.tripPurpose, liveSnapshot.forceFullCompliance]
  )
  const complianceLevel = useMemo(
    () => getComplianceLevel(
      liveSnapshot.tripPurpose as TripPurpose,
      liveSnapshot.forceFullCompliance
    ),
    [liveSnapshot.tripPurpose, liveSnapshot.forceFullCompliance]
  )

  const requiredCards = liveSnapshot.requiredSafetyCards ?? 0

  const isReadyToDepart = useMemo(() => {
    if (mergedGuests.length === 0) return false
    return mergedGuests.every(g => {
      const hasWaiver = !compliance.waiverRequired || g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = !compliance.safetyBriefingRequired || (g.safetyAckCount ?? 0) >= requiredCards
      return hasWaiver && hasSafety
    })
  }, [mergedGuests, requiredCards, compliance])

  const nonCompliantCount = useMemo(() =>
    mergedGuests.filter(g => {
      const hasWaiver = !compliance.waiverRequired || g.waiverSigned || g.waiverTextHash === 'firma_template'
      const hasSafety = !compliance.safetyBriefingRequired || (g.safetyAckCount ?? 0) >= requiredCards
      return !(hasWaiver && hasSafety)
    }).length
  , [mergedGuests, requiredCards, compliance])

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

  // Show briefing gate overlay (before start flow)
  if (showBriefingGate) {
    return (
      <SafetyBriefingGate
        boatName={liveSnapshot.boatName}
        captainName={liveSnapshot.captainName ?? 'Captain'}
        tripDate={formatTripDate(liveSnapshot.tripDate)}
        guestCount={mergedGuests.length}
        briefingTopics={compliance.briefingTopics}
        complianceLevel={complianceLevel.level}
        token={token}
        allowSkip={true}
        onConfirmed={(attestation) => {
          setBriefingAttestation(attestation)
          setShowBriefingGate(false)
          setShowStartFlow(true)
        }}
        onCancel={() => setShowBriefingGate(false)}
        onSkip={() => {
          // Grace period: skip briefing, go straight to start flow
          setBriefingAttestation(null)
          setShowBriefingGate(false)
          setShowStartFlow(true)
        }}
      />
    )
  }

  // Show start flow overlay
  if (showStartFlow) {
    return (
      <StartTripFlow
        snapshot={liveSnapshot}
        token={token}
        onStarted={onTripStarted}
        onCancel={() => setShowStartFlow(false)}
        briefingAttestation={briefingAttestation}
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
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>

      {/* ── Header ── */}
      <div style={{ background: 'var(--color-ink)', padding: 'var(--s-5) var(--s-5) var(--s-6)' }}>

        {/* Top row: eyebrow + status pill */}
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--s-2)' }}>
          <span
            className="mono"
            style={{ fontSize: 'var(--t-mono-xs)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.55)', fontWeight: 600 }}
          >
            Captain View
          </span>
          <span className={status === 'active' ? 'pill pill--ok' : 'pill pill--ghost'}
            style={status !== 'active' ? { background: 'rgba(244,239,230,0.15)', color: 'var(--color-bone)', borderColor: 'transparent' } : {}}
          >
            <span className="pill-dot" aria-hidden="true" />
            {status === 'active' ? 'Active' : status === 'completed' ? 'Completed' : 'Upcoming'}
          </span>
        </div>

        {/* Compliance mode badge */}
        <div style={{ marginBottom: 'var(--s-2)' }}>
          <span
            className="pill pill--brass"
            style={{ fontSize: 'var(--t-mono-xs)', borderColor: 'var(--color-brass)', color: 'var(--color-brass)' }}
          >
            {complianceLevel.label}
          </span>
        </div>

        {/* Boat name — Fraunces display */}
        <h1
          className="font-display"
          style={{ fontSize: 'var(--t-card)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-bone)', marginBottom: 'var(--s-1)', lineHeight: 1.1 }}
        >
          {liveSnapshot.boatName}
        </h1>

        {/* Captain row */}
        {liveSnapshot.captainName && (
          <div className="flex items-center" style={{ gap: 'var(--s-3)', margin: 'var(--s-3) 0 var(--s-2)' }}>
            {liveSnapshot.captainPhotoUrl ? (
              <div className="avatar avatar--sm" style={{ borderColor: 'rgba(244,239,230,0.3)' }}>
                <img src={liveSnapshot.captainPhotoUrl} alt={liveSnapshot.captainName} />
              </div>
            ) : (
              <div
                className="avatar avatar--sm"
                style={{ background: 'rgba(244,239,230,0.15)', borderColor: 'rgba(244,239,230,0.25)', color: 'var(--color-bone)', fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-xs)', fontWeight: 600 }}
              >
                {liveSnapshot.captainName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <div>
              <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-bone)', lineHeight: 1.2 }}>
                {liveSnapshot.captainName}
              </p>
              {liveSnapshot.captainLicense && (
                <p className="mono flex items-center" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.55)', gap: '4px', marginTop: '2px' }}>
                  <Briefcase size={10} strokeWidth={2} aria-hidden="true" /> {liveSnapshot.captainLicense}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Trip meta — mono chips */}
        <div className="flex flex-wrap" style={{ gap: 'var(--s-2)', marginTop: 'var(--s-2)' }}>
          <span className="mono flex items-center" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.7)', gap: '4px' }}>
            <Calendar size={11} strokeWidth={2} aria-hidden="true" />{formatTripDate(liveSnapshot.tripDate)}
          </span>
          <span className="mono" style={{ color: 'rgba(244,239,230,0.4)' }}>·</span>
          <span className="mono flex items-center" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.7)', gap: '4px' }}>
            <Clock size={11} strokeWidth={2} aria-hidden="true" />{formatTime(liveSnapshot.departureTime)}
          </span>
          <span className="mono" style={{ color: 'rgba(244,239,230,0.4)' }}>·</span>
          <span className="mono flex items-center" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.7)', gap: '4px' }}>
            <Clock size={11} strokeWidth={2} aria-hidden="true" />{formatDuration(liveSnapshot.durationHours)}
          </span>
        </div>
        <p className="mono flex items-center" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.55)', marginTop: 'var(--s-1)', gap: '4px' }}>
          <MapPin size={11} strokeWidth={2} aria-hidden="true" />{liveSnapshot.marinaName}
          {liveSnapshot.slipNumber ? ` · Slip ${liveSnapshot.slipNumber}` : ''}
        </p>

        {/* Weather tile — sea color inside ink header */}
        {liveSnapshot.weather && (
          <div
            className="flex items-center"
            style={{
              marginTop: 'var(--s-3)',
              gap: 'var(--s-2)',
              background: 'rgba(45, 93, 110, 0.4)', /* --sea at 40% */
              border: '1px solid rgba(45, 93, 110, 0.6)',
              borderRadius: 'var(--r-1)',
              padding: '8px 12px',
            }}
          >
            <span className="mono" style={{ fontSize: 'var(--t-body-md)', color: 'var(--color-bone)' }}>{liveSnapshot.weather.label}</span>
            <span className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'rgba(244,239,230,0.7)' }}>{liveSnapshot.weather.temperature}°F</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>

        {/* Buoy insurance status */}
        {status === 'active' && (
          <div className="alert alert--ok">
            <Shield size={18} strokeWidth={2} aria-hidden="true" />
            <div className="alert__body">
              <strong style={{ fontSize: 'var(--t-body-sm)' }}>Insurance active</strong>
              {policyId && !policyId.startsWith('STUB') && !policyId.startsWith('FAIL') && (
                <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                  Policy: {policyId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Safety Briefing Confirmation ── */}
        {(briefingAttestation || liveSnapshot.safetyBriefingConfirmedAt) && (
          <div className="alert alert--info">
            <Shield size={18} strokeWidth={2} aria-hidden="true" />
            <div className="alert__body">
              <strong style={{ fontSize: 'var(--t-body-sm)' }}>Safety Briefing Confirmed</strong>
              <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                {briefingAttestation?.signature ?? liveSnapshot.safetyBriefingConfirmedBy}
                {' · '}
                {(briefingAttestation?.type ?? liveSnapshot.safetyBriefingType)?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        )}

        {/* ── USCG Pre-Departure Compliance Banner ── */}
        {status === 'upcoming' && (
          isReadyToDepart ? (
            <div className="alert alert--ok">
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              <div className="alert__body">
                <strong style={{ fontSize: 'var(--t-body-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Clear — Ready for departure</strong>
                <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                  {mergedGuests.length} guest{mergedGuests.length !== 1 ? 's' : ''} · All waivers signed · Safety briefing complete
                </p>
              </div>
            </div>
          ) : (
            <div className="alert alert--warn">
              <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
              <div className="alert__body">
                <strong style={{ fontSize: 'var(--t-body-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waiting on Guests</strong>
                <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                  {nonCompliantCount} guest{nonCompliantCount !== 1 ? 's' : ''} still need to sign the waiver or complete the safety briefing
                </p>
              </div>
            </div>
          )
        )}

        {/* ── Head Count Verification (pre-departure) ── */}
        {status === 'upcoming' && mergedGuests.length > 0 && (
          <HeadCountConfirm
            token={token}
            digitalGuestCount={mergedGuests.length}
          />
        )}

        {/* ── Crew Manifest ── */}
        <CrewManifestPanel
          crewManifest={liveSnapshot.crewManifest}
          captainName={liveSnapshot.captainName}
          captainLicense={liveSnapshot.captainLicense}
        />

        {/* Passenger alerts */}
        <SnapshotAlerts alerts={liveSnapshot.alerts} />

        {/* Guest list */}
        <SnapshotGuestList
          guests={mergedGuests}
          maxGuests={snapshot.maxGuests ?? mergedGuests.length}
          captainToken={token}
        />

        {/* Add-on summary */}
        {liveSnapshot.addonSummary.length > 0 && (
          <SnapshotAddonSummary summary={liveSnapshot.addonSummary} />
        )}

        {/* ── Trip Log (Notes) ── */}
        <TripNotesPanel token={token} initialNotes="" />

        {/* Chat panel (when trip is active) */}
        {status === 'active' && (
          <CaptainChatPanel
            snapshot={liveSnapshot}
          />
        )}

        {/* ── USCG Float Plan Download ── */}
        <div className="tile tile--hover" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            onClick={() => downloadFloatPlan(liveSnapshot)}
            className="w-full flex items-center text-left"
            style={{ padding: 'var(--s-5)', gap: 'var(--s-3)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FileText size={18} strokeWidth={2} aria-hidden="true" style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--color-ink)' }}>
                USCG Float Plan
              </p>
              <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                Download pre-filled float plan for this trip
              </p>
            </div>
            <span className="badge">Download</span>
          </button>
        </div>

        {/* Refresh indicator */}
        <p className="mono text-center" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.05em' }}>
          Live updates active · Fallback refresh every 30s
        </p>
        <p className="mono text-center" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.05em', marginTop: 'var(--s-1)' }}>
          Valid until {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(liveSnapshot.expiresAt))}
        </p>

        {/* Bottom action button */}
        <div style={{ paddingTop: 'var(--s-2)', paddingBottom: 'var(--s-10)' }}>
          {status === 'upcoming' && (
            <button
              onClick={() => setShowBriefingGate(true)}
              disabled={!isReadyToDepart}
              className="btn btn--rust w-full"
              style={{ height: '64px', fontSize: 'var(--t-body-lg)', fontWeight: 600, justifyContent: 'center' }}
            >
              {isReadyToDepart ? 'Safety Briefing & Start' : 'Waiting on compliance...'}
            </button>
          )}

          {status === 'active' && (
            <button
              onClick={() => setShowEndFlow(true)}
              className="btn btn--danger w-full"
              style={{ height: '64px', fontSize: 'var(--t-body-lg)', fontWeight: 600, justifyContent: 'center' }}
            >
              End Trip
            </button>
          )}

          {status === 'completed' && (
            <div className="alert alert--ok" style={{ justifyContent: 'center', height: '64px' }}>
              <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
              <span style={{ fontWeight: 600 }}>Trip completed</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating QR Scanner button (shown when ≥3 guests) ── */}
      {mergedGuests.length >= 3 && status !== 'completed' && !showStartFlow && !showEndFlow && (
        <button
          onClick={() => setShowScanner(true)}
          className="fixed z-50"
          style={{
            bottom: 'var(--s-6)',
            right: 'var(--s-5)',
            width: '52px',
            height: '52px',
            borderRadius: 'var(--r-1)', /* sharp — not rounded-full */
            background: 'var(--color-ink)',
            border: 'var(--border-w) solid var(--color-ink)',
            color: 'var(--color-bone)',
            boxShadow: 'var(--shadow-float)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background var(--dur-fast) var(--ease)',
          }}
          aria-label="Open QR boarding scanner"
        >
          <QrCode size={20} strokeWidth={2} />
        </button>
      )}

      {/* ── QR Boarding Scanner overlay ── */}
      {showScanner && (
        <QrBoardingScanner
          tripSlug={liveSnapshot.slug}
          guests={mergedGuests.map(g => ({ id: g.id, fullName: g.fullName, boardedAt: (g as Record<string, unknown>).checkedInAt as string ?? null }))}
          onClose={() => setShowScanner(false)}
          onBoarded={() => {
            // Trigger a refresh of the snapshot
            fetch(`/api/snapshot/${token}`).then(async res => {
              if (res.ok) {
                const json = await res.json()
                setLiveSnapshot(json.data)
              }
            }).catch(() => null)
          }}
        />
      )}
    </div>
  )
}
