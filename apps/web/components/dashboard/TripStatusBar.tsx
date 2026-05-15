'use client'

import { useState, useMemo } from 'react'
import { Check, AlertTriangle, Play, Square } from 'lucide-react'
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
  tripId, tripSlug, initialStatus, initialStartedAt,
  initialGuests, requiredSafetyCards,
}: TripStatusBarProps) {
  const { status, startedAt, connectionStatus } = useTripStatus(tripId, initialStatus, initialStartedAt)
  const { guests } = useTripGuests(tripId, initialGuests)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showStartConfirm, setShowStartConfirm] = useState(false)
  const [briefingConfirmed, setBriefingConfirmed] = useState(false)
  const [captainBriefedAll, setCaptainBriefedAll] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

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

  async function handleStartTrip() {
    setLoading(true); setError(null)
    try {
      const tokenRes = await fetch(`/api/dashboard/trips/${tripId}/snapshot`, { method: 'POST' })
      if (!tokenRes.ok) throw new Error('Failed to generate captain token')
      const { data } = await tokenRes.json()
      if (!data?.token) throw new Error('No token returned')
      const startRes = await fetch(`/api/trips/${tripSlug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotToken: data.token,
          confirmedGuestCount: guests.length,
          checklistConfirmed: true,
          ...(briefingConfirmed && captainBriefedAll ? {
            briefingAttestation: {
              type: 'full_verbal' as const,
              topicsCovered: ['emergency_exits','life_jacket_location','life_jacket_donning','instruction_placards','hazardous_conditions'],
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
    } finally { setLoading(false) }
  }

  async function handleEndTrip() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/dashboard/trips/${tripId}/end`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error || 'Failed to end trip')
      }
      setShowEndConfirm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to end trip')
    } finally { setLoading(false) }
  }

  return (
    <section>
      {/* Section kicker */}
      <div className="td-kicker">
        <span className="td-kicker-label">Trip Control</span>
        <div className="td-kicker-meta">
          <RealtimeIndicator status={connectionStatus} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Compliance banner */}
        {status === 'upcoming' && (
          isReadyToDepart ? (
            <div className="td-alert td-alert-ok">
              <Check size={15} strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Ready for departure</strong>
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 11 }}>
                  {guests.length} guest{guests.length !== 1 ? 's' : ''} · All waivers signed · Safety complete
                </span>
              </div>
            </div>
          ) : (
            <div className="td-alert td-alert-warn">
              <AlertTriangle size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Waiting on {nonCompliantCount} guest{nonCompliantCount !== 1 ? 's' : ''}</strong>
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 11 }}>Waiver or safety briefing pending</span>
              </div>
            </div>
          )
        )}

        {/* Active indicator */}
        {status === 'active' && startedAt && (
          <div className="td-alert td-alert-ok">
            <div>
              <strong>Trip active</strong>
              <span style={{ fontFamily: 'var(--td-mono)', fontSize: 11 }}>
                Since {new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="td-alert td-alert-err">
            <AlertTriangle size={15} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            <div><strong>{error}</strong></div>
          </div>
        )}

        {/* Pre-departure confirm panel */}
        {showStartConfirm && status === 'upcoming' && (
          <div className="td-panel">
            <div className="td-panel-header">
              <span className="td-panel-label">Pre-departure confirmation</span>
            </div>
            <div className="td-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Summary */}
              <div className="td-meta-stack">
                <div className="td-meta-row">
                  <span className="td-meta-label">Passengers</span>
                  <span className="td-meta-value">{guests.length}</span>
                </div>
                <div className="td-meta-row">
                  <span className="td-meta-label">Waivers signed</span>
                  <span className="td-meta-value" style={{ color: 'var(--td-ok)' }}>
                    {guests.filter(g => g.waiverSigned || g.waiverTextHash === 'firma_template').length} / {guests.length}
                  </span>
                </div>
              </div>

              {/* 46 CFR attestation */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 4, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid var(--td-divider)' }}>
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--td-gold-dim)' }}>
                  46 CFR 185.506 Safety briefing
                </span>
                <label className="td-check-label">
                  <input type="checkbox" checked={captainBriefedAll} onChange={() => setCaptainBriefedAll(v => !v)} />
                  <span className="td-check-text">Captain has verbally briefed all passengers on life jacket locations, emergency exits, and safety procedures</span>
                </label>
                <label className="td-check-label">
                  <input type="checkbox" checked={briefingConfirmed} onChange={() => setBriefingConfirmed(v => !v)} />
                  <span className="td-check-text">Insurance will activate and passengers will be notified</span>
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setShowStartConfirm(false); setBriefingConfirmed(false); setCaptainBriefedAll(false) }}
                  disabled={loading}
                  className="td-btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartTrip}
                  disabled={loading || !briefingConfirmed || !captainBriefedAll}
                  className="td-btn-gold"
                  style={{ flex: 2 }}
                >
                  <Play size={13} strokeWidth={2.5} />
                  {loading ? 'Starting...' : 'Confirm and start'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Start trip button */}
        {status === 'upcoming' && !showStartConfirm && (
          <button
            onClick={() => setShowStartConfirm(true)}
            disabled={!isReadyToDepart || loading}
            className="td-btn-gold"
          >
            <Play size={14} strokeWidth={2.5} />
            {loading ? 'Starting...' : isReadyToDepart ? 'Start trip' : 'Waiting on compliance...'}
          </button>
        )}

        {/* End trip confirm panel */}
        {status === 'active' && showEndConfirm && (
          <div className="td-panel" style={{ borderLeftWidth: 3, borderLeftColor: 'var(--td-err)' }}>
            <div className="td-panel-header">
              <span className="td-panel-label" style={{ color: 'var(--td-err)' }}>Confirm end trip</span>
            </div>
            <div className="td-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="td-meta-stack">
                <div className="td-meta-row">
                  <span className="td-meta-label">Passengers aboard</span>
                  <span className="td-meta-value">{guests.length}</span>
                </div>
                {startedAt && (
                  <div className="td-meta-row">
                    <span className="td-meta-label">Started at</span>
                    <span className="td-meta-value">
                      {new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--td-text-dim)', margin: 0 }}>
                This marks the trip as <strong style={{ color: 'var(--td-err)' }}>completed</strong> and cannot be undone. Guests will receive a review request.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowEndConfirm(false)} disabled={loading} className="td-btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button onClick={handleEndTrip} disabled={loading} className="td-btn-err" style={{ flex: 1 }}>
                  {loading ? 'Ending...' : 'End trip'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* End trip button */}
        {status === 'active' && !showEndConfirm && (
          <button
            onClick={() => setShowEndConfirm(true)}
            disabled={loading}
            className="td-btn-err"
            style={{ width: '100%', height: 46, justifyContent: 'center' }}
          >
            <Square size={13} strokeWidth={2.5} />
            End trip
          </button>
        )}

        {/* Completed */}
        {status === 'completed' && (
          <div className="td-alert td-alert-ok">
            <Check size={15} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <div><strong>Trip completed</strong></div>
          </div>
        )}
      </div>
    </section>
  )
}
