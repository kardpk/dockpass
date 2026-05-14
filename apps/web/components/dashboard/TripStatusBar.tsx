'use client'

import { useState, useMemo } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import { useTripStatus } from '@/hooks/useTripStatus'
import { useTripGuests } from '@/hooks/useTripGuests'
import { RealtimeIndicator } from './RealtimeIndicator'
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
    tripId, initialStatus, initialStartedAt,
  )
  const { guests } = useTripGuests(tripId, initialGuests)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Confirmation panel state ─────────────────────────────
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [briefingConfirmed, setBriefingConfirmed] = useState(false)
  const [captainBriefedAll, setCaptainBriefedAll] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // ── USCG compliance check ────────────────────────────────
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

  // ── Start trip ───────────────────────────────────────────
  async function handleStartTrip() {
    setLoading(true)
    setError(null)
    try {
      const tokenRes = await fetch(`/api/dashboard/trips/${tripId}/snapshot`, { method: 'POST' })
      if (!tokenRes.ok) throw new Error('Failed to generate captain token')
      const tokenJson = await tokenRes.json()
      const snapshotToken = tokenJson.data?.token
      if (!snapshotToken) throw new Error('No token returned')

      const startRes = await fetch(`/api/trips/${tripSlug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotToken,
          confirmedGuestCount: guests.length,
          checklistConfirmed: true,
          ...(briefingConfirmed && captainBriefedAll ? {
            briefingAttestation: {
              type: 'full_verbal' as const,
              topicsCovered: ['emergency_exits', 'life_jacket_location', 'life_jacket_donning',
                              'instruction_placards', 'hazardous_conditions'],
              signature: 'Operator Dashboard Confirmation',
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
      setError(err instanceof Error ? err.message : 'Failed to start trip')
    } finally {
      setLoading(false)
    }
  }

  // ── End trip — calls operator-auth endpoint (no token required) ────────────
  async function handleEndTrip() {
    setLoading(true)
    setError(null)
    try {
      const endRes = await fetch(`/api/dashboard/trips/${tripId}/end`, {
        method: 'POST',
      })

      if (!endRes.ok) {
        const body = await endRes.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error || 'Failed to end trip')
      }

      setShowEndConfirm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to end trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={{ marginTop: 'var(--s-6)' }}>
      {/* ── Section kicker ────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-4)' }}>
        <div
          className="font-mono"
          style={{
            fontSize: '13px', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--ink, #111c2d)',
          }}
        >
          Trip control
        </div>
        <RealtimeIndicator status={connectionStatus} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>

        {/* ── Compliance banner (upcoming) ───────────────── */}
        {status === 'upcoming' && (
          isReadyToDepart ? (
            <div className="alert alert--ok">
              <Check size={16} strokeWidth={2.5} />
              <div>
                <strong>Ready for departure</strong>
                <div style={{ fontSize: 'var(--t-body-sm)', color: 'var(--muted, #6b7280)', marginTop: 2 }}>
                  {guests.length} guest{guests.length !== 1 ? 's' : ''} · All waivers signed · Safety briefing complete
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert--warn">
              <AlertTriangle size={16} strokeWidth={2} />
              <div>
                <strong>Waiting on guests</strong>
                <div style={{ fontSize: 'var(--t-body-sm)', color: 'var(--muted, #6b7280)', marginTop: 2 }}>
                  {nonCompliantCount} guest{nonCompliantCount !== 1 ? 's' : ''} still need to sign the waiver or complete the safety briefing
                </div>
              </div>
            </div>
          )
        )}

        {/* ── Active trip indicator ──────────────────────── */}
        {status === 'active' && startedAt && (
          <div className="alert alert--ok">
            <div>
              <strong>Trip active</strong>
              <span style={{ marginLeft: 'var(--s-2)', fontWeight: 400 }}>
                since {new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────── */}
        {error && (
          <div className="alert alert--err">
            <AlertTriangle size={16} strokeWidth={2} />
            <div><strong>{error}</strong></div>
          </div>
        )}

        {/* ── Start confirmation panel ──────────────────── */}
        {showStartConfirm && status === 'upcoming' && (
          <div
            className="tile"
            style={{ overflow: 'hidden', padding: 0 }}
          >
            {/* Panel header */}
            <div
              style={{
                background: 'var(--ink, #111c2d)',
                padding: 'var(--s-3) var(--s-5)',
              }}
            >
              <span
                className="font-mono"
                style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--off, #f5f7fa)' }}
              >
                Pre-departure confirmation
              </span>
            </div>

            <div style={{ padding: 'var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
              {/* Summary rows */}
              <div className="meta-stack">
                <div className="meta-row">
                  <span className="label">Passengers</span>
                  <span className="value" style={{ fontSize: 'var(--t-body-md)' }}>{guests.length}</span>
                </div>
                <div className="meta-row">
                  <span className="label">Waivers signed</span>
                  <span className="value" style={{ fontSize: 'var(--t-body-md)', color: 'var(--verified, #059669)' }}>
                    {guests.filter(g => g.waiverSigned || g.waiverTextHash === 'firma_template').length} / {guests.length}
                  </span>
                </div>
              </div>

              {/* Safety briefing attestation */}
              <div
                style={{
                  padding: 'var(--s-4)',
                  background: 'var(--off, #f5f7fa)',
                  borderRadius: 'var(--r-2)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--s-3)',
                }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted, #6b7280)' }}
                >
                  46 CFR 185.506 Safety briefing
                </span>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={captainBriefedAll}
                    onChange={() => setCaptainBriefedAll(!captainBriefedAll)}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--gold, #c9a227)', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--ink, #111c2d)', lineHeight: 1.5 }}>
                    The captain has verbally briefed all passengers on life jacket locations,
                    emergency exits, and safety procedures
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={briefingConfirmed}
                    onChange={() => setBriefingConfirmed(!briefingConfirmed)}
                    style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--gold, #c9a227)', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--ink, #111c2d)', lineHeight: 1.5 }}>
                    Insurance will be activated and passengers will be notified
                  </span>
                </label>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
                <button
                  onClick={() => { setShowStartConfirm(false); setBriefingConfirmed(false); setCaptainBriefedAll(false) }}
                  disabled={loading}
                  className="btn"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartTrip}
                  disabled={loading || !briefingConfirmed || !captainBriefedAll}
                  className="btn btn-navy"
                  style={{
                    flex: 1,
                    background: (briefingConfirmed && captainBriefedAll) ? 'var(--verified, #059669)' : 'var(--border, #dde2ea)',
                    borderColor: (briefingConfirmed && captainBriefedAll) ? 'var(--verified, #059669)' : 'var(--border, #dde2ea)',
                    color: (briefingConfirmed && captainBriefedAll) ? 'var(--off, #f5f7fa)' : 'var(--muted, #6b7280)',
                    cursor: (briefingConfirmed && captainBriefedAll) ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? 'Starting...' : 'Confirm and start'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Start Trip button ──────────────────────────── */}
        {status === 'upcoming' && !showStartConfirm && (
          <button
            onClick={() => setShowStartConfirm(true)}
            disabled={!isReadyToDepart || loading}
            className="btn"
            style={{
              width: '100%', height: 52, justifyContent: 'center',
              background: isReadyToDepart ? 'var(--navy, #0a1628)' : 'var(--off, #f5f7fa)',
              borderColor: isReadyToDepart ? 'var(--navy, #0a1628)' : 'var(--border, #dde2ea)',
              color: isReadyToDepart ? '#e8e8e0' : 'var(--muted, #6b7280)',
              fontSize: 'var(--t-body-md)', fontWeight: 700,
              cursor: isReadyToDepart ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Starting...' : isReadyToDepart ? 'Start trip' : 'Waiting on compliance...'}
          </button>
        )}

        {/* ── End Trip confirmation panel ───────────────── */}
        {status === 'active' && showEndConfirm && (
          <div
            className="tile"
            style={{ overflow: 'hidden', padding: 0 }}
          >
            {/* Panel header */}
            <div
              style={{
                background: 'var(--danger, #dc2626)',
                padding: 'var(--s-3) var(--s-5)',
              }}
            >
              <span
                className="font-mono"
                style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff' }}
              >
                Confirm End Trip
              </span>
            </div>

            <div style={{ padding: 'var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
              {/* Summary */}
              <div className="meta-stack">
                <div className="meta-row">
                  <span className="label">Passengers aboard</span>
                  <span className="value" style={{ fontSize: 'var(--t-body-md)' }}>{guests.length}</span>
                </div>
                {startedAt && (
                  <div className="meta-row">
                    <span className="label">Started at</span>
                    <span className="value" style={{ fontSize: 'var(--t-body-md)' }}>
                      {new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div
                style={{
                  padding: 'var(--s-3) var(--s-4)',
                  background: 'rgba(180,60,60,0.06)',
                  border: '1px solid rgba(180,60,60,0.2)',
                  borderRadius: 'var(--r-1)',
                  fontSize: 'var(--t-body-sm)',
                  color: 'var(--danger, #dc2626)',
                  lineHeight: 1.5,
                }}
              >
                This will mark the trip as <strong>completed</strong> and cannot be undone. Guests will receive a review request.
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  disabled={loading}
                  className="btn"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndTrip}
                  disabled={loading}
                  className="btn"
                  style={{
                    flex: 1,
                    background: 'var(--danger, #dc2626)',
                    borderColor: 'var(--danger, #dc2626)',
                    color: '#fff',
                    fontWeight: 700,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Ending...' : 'End Trip'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── End Trip button (opens confirmation) ───────── */}
        {status === 'active' && !showEndConfirm && (
          <button
            onClick={() => setShowEndConfirm(true)}
            disabled={loading}
            className="btn btn-danger"
            style={{ width: '100%', height: 52, justifyContent: 'center', fontSize: 'var(--t-body-md)', fontWeight: 700 }}
          >
            End trip
          </button>
        )}

        {/* ── Completed state ───────────────────────────── */}
        {status === 'completed' && (
          <div className="alert alert--ok">
            <Check size={16} strokeWidth={2.5} />
            <div><strong>Trip completed</strong></div>
          </div>
        )}
      </div>
    </section>
  )
}
