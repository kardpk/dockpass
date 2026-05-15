'use client'

import { useState } from 'react'
import {
  Users, Check, X, Trash2, ChevronDown, ChevronUp,
  ExternalLink, AlertTriangle, FileSignature, Shield,
} from 'lucide-react'
import { useTripGuests } from '@/hooks/useTripGuests'
import { RealtimeIndicator } from './RealtimeIndicator'
import type { DashboardGuest, QualificationStatus } from '@/types'

type QualificationRecord = {
  id: string
  qualificationStatus: QualificationStatus
  hasBoatOwnership: boolean
  experienceYears: number
  safetyBoaterRequired: boolean
  safetyBoaterCardUrl: string | null
  attestedAt: string
  reviewNotes: string | null
}

interface GuestManagementTableProps {
  tripId: string
  initialGuests: DashboardGuest[]
  maxGuests: number
  requiresApproval: boolean
  requiresQualification?: boolean
  qualificationMap?: Record<string, QualificationRecord>
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

// E-2: Determines the semantic state of the guest roster for dot colour + tooltip
type GuestDotState = 'ALL_SIGNED' | 'ALL_IN' | 'PARTIAL' | 'EMPTY'
function getGuestDotState(total: number, signed: number, maxGuests: number): GuestDotState {
  if (total === 0) return 'EMPTY'
  if (signed === total && total === maxGuests) return 'ALL_SIGNED'  // full house + all waivers
  if (total === maxGuests) return 'ALL_IN'                          // full house, some waivers pending
  return 'PARTIAL'                                                  // not all guests checked in
}

export function GuestManagementTable({
  tripId, initialGuests, maxGuests, requiresApproval,
}: GuestManagementTableProps) {
  const { guests, connectionStatus } = useTripGuests(tripId, initialGuests)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)
  const [liveryVerifyId, setLiveryVerifyId] = useState<string | null>(null)
  const [liveryVerifierName, setLiveryVerifierName] = useState('')

  const total = guests.length
  const signed = guests.filter(g => g.waiverSigned || g.waiverTextHash === 'firma_template').length
  const pendingApproval = guests.filter(g => g.approvalStatus === 'pending').length
  const progressPct = maxGuests > 0 ? Math.min((total / maxGuests) * 100, 100) : 0

  async function verifyLiveryBriefing(guestId: string) {
    if (!liveryVerifierName.trim()) return
    setActioning(guestId)
    try {
      await fetch(`/api/dashboard/guests/${guestId}/verify-livery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifierName: liveryVerifierName.trim() }),
      })
      setLiveryVerifyId(null)
      setLiveryVerifierName('')
    } finally { setActioning(null) }
  }

  async function approve(guestId: string) {
    setActioning(guestId)
    try {
      await fetch(`/api/dashboard/guests/${guestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved' }),
      })
    } finally { setActioning(null) }
  }

  async function decline(guestId: string) {
    setActioning(guestId)
    try {
      await fetch(`/api/dashboard/guests/${guestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'declined' }),
      })
    } finally { setActioning(null) }
  }

  async function remove(guestId: string) {
    if (!confirm('Remove this guest from the trip?')) return
    setActioning(guestId)
    try {
      await fetch(`/api/dashboard/guests/${guestId}/remove`, { method: 'DELETE' })
    } finally { setActioning(null) }
  }

  return (
    <section style={{ marginTop: 'var(--s-6)' }}>

      {/* ── Section kicker — MASTER_DESIGN §6.6 soft line, not ink ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 12,
          borderBottom: '1px solid var(--color-line-soft, rgba(11,30,45,0.12))',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--color-ink-muted, #3d5568)',
            }}
          >
            Guests
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10, fontWeight: 500,
              color: 'var(--color-ink-muted, #3d5568)',
            }}
          >
            {total} / {maxGuests}
          </span>

          {/* E-2: Semantic status dot — colour reflects real guest roster state */}
          {(() => {
            const dotState = getGuestDotState(total, signed, maxGuests)
            const dotColor =
              dotState === 'ALL_SIGNED'
                ? '#1F6B52'
                : dotState === 'ALL_IN' || dotState === 'PARTIAL'
                  ? '#B5822A'
                  : 'var(--muted, #6b7280)'
            const pendingWaivers = total - signed
            const tooltip =
              dotState === 'ALL_SIGNED'
                ? 'All waivers signed'
                : dotState === 'ALL_IN'
                  ? `${pendingWaivers} waiver${pendingWaivers !== 1 ? 's' : ''} pending`
                  : dotState === 'PARTIAL'
                    ? `${total} of ${maxGuests} checked in`
                    : 'No guests yet'
            return (
              <span
                title={tooltip}
                aria-label={tooltip}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: dotColor,
                  display: 'inline-block',
                  flexShrink: 0,
                  cursor: 'help',
                  transition: 'background 300ms ease',
                }}
              />
            )
          })()}

          {pendingApproval > 0 && (
            <span className="pill pill--warn">
              <span className="pill-dot" />
              {pendingApproval} pending
            </span>
          )}
        </div>
        <RealtimeIndicator status={connectionStatus} />
      </div>

      {/* ── Waiver progress ── */}
      <div style={{ marginBottom: 'var(--s-4)' }}>
        <div
          style={{
            height: 4,
            background: 'var(--border, #dde2ea)',
            borderRadius: 'var(--r-1)',
            overflow: 'hidden',
            marginBottom: 'var(--s-2)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: signed === total && total > 0
                ? 'var(--verified, #059669)'
                : 'var(--ink, #111c2d)',
              transition: 'width 0.4s var(--ease)',
              borderRadius: 'var(--r-1)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="font-mono"
            style={{ fontSize: '11px', color: 'var(--muted, #6b7280)' }}
          >
            {signed} waiver{signed !== 1 ? 's' : ''} signed
          </span>
          {total - signed > 0 && (
            <span
              className="font-mono"
              style={{ fontSize: '11px', color: 'var(--warning, #d97706)' }}
            >
              {total - signed} unsigned
            </span>
          )}
          {signed === total && total > 0 && (
            <span className="pill pill--ok">
              <Check size={10} strokeWidth={2.5} />
              All signed
            </span>
          )}
        </div>
      </div>

      {/* ── Guest list ── */}
      {guests.length === 0 ? (
        <div
          className="tile"
          style={{
            padding: 'var(--s-10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--s-2)',
            textAlign: 'center',
          }}
        >
          <Users
            size={32}
            strokeWidth={1.5}
            style={{ color: 'var(--muted, #6b7280)', opacity: 0.4 }}
          />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink, #111c2d)', fontFamily: 'var(--sans, sans-serif)' }}>
            No guests yet
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted, #6b7280)' }}>
            Share the trip link to start receiving check-ins
          </p>
        </div>
      ) : (
        <div
          className="tile"
          style={{ overflow: 'hidden', padding: 0 }}
        >
          {guests.map((guest, idx) => {
            const isWaiverSigned = guest.waiverSigned || guest.waiverTextHash === 'firma_template'
            const isFirma = guest.waiverTextHash === 'firma_template'
            const isExpanded = expanded === guest.id
            const isLast = idx === guests.length - 1

            // Left accent stripe color
            let accentColor = 'var(--border, #dde2ea)'
            if (guest.approvalStatus === 'declined') accentColor = 'var(--danger, #dc2626)'
            else if (guest.approvalStatus === 'pending') accentColor = 'var(--warning, #d97706)'
            else if (isWaiverSigned) accentColor = 'var(--verified, #059669)'

            return (
              <div
                key={guest.id}
                style={{
                  borderLeft: `4px solid ${accentColor}`,
                  borderBottom: isLast ? 'none' : '1px solid var(--border, #dde2ea)',
                  transition: 'border-left-color 0.2s',
                }}
              >
                {/* ── Guest row ── */}
                <div style={{ padding: 'var(--s-3) var(--s-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>

                    {/* Guest avatar — MASTER_DESIGN §7.9 circular bone-warm */}
                    <div
                      style={{
                        width: 34, height: 34,
                        borderRadius: 9999,
                        background: 'var(--color-bone-warm, #EDE6D8)',
                        border: '1.5px solid var(--color-line-soft, rgba(11,30,45,0.12))',
                        color: 'var(--color-ink, #0B1E2D)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 600,
                        flexShrink: 0,
                        fontFamily: 'var(--font-mono, monospace)',
                      }}
                    >
                      {initials(guest.fullName)}
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-1)' }}>
                        <span
                          style={{
                            fontSize: '14px', fontWeight: 600,
                            color: 'var(--ink, #111c2d)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {guest.fullName}
                        </span>
                      </div>

                      {/* Status pills row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
                        {/* Waiver */}
                        {isFirma ? (
                          <span className="pill pill--ghost">
                            <FileSignature size={9} strokeWidth={2.5} />
                            Firma
                          </span>
                        ) : isWaiverSigned ? (
                          <span className="pill pill--ok">
                            <Check size={9} strokeWidth={2.5} />
                            Signed
                          </span>
                        ) : (
                          <span className="pill pill--warn">Unsigned</span>
                        )}

                        {/* Safety cards */}
                        {(guest.safetyAcknowledgments?.length ?? 0) > 0 && (
                          <span className="pill pill--ok">
                            <Shield size={9} strokeWidth={2.5} />
                            {guest.safetyAcknowledgments!.length} cards
                          </span>
                        )}

                        {/* Flags */}
                        {guest.isNonSwimmer && (
                          <span className="pill pill--err">Non-swimmer</span>
                        )}
                        {guest.isSeaSicknessProne && (
                          <span className="pill pill--warn">Seasickness</span>
                        )}
                        {guest.dietaryRequirements && (
                          <span className="pill pill--ghost" style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {guest.dietaryRequirements}
                          </span>
                        )}

                        {/* Approval */}
                        {guest.approvalStatus === 'declined' && (
                          <span className="pill pill--err">Declined</span>
                        )}
                        {guest.approvalStatus === 'pending_livery_briefing' && (
                          <span className="pill pill--brass">Livery briefing</span>
                        )}
                      </div>
                    </div>

                    {/* Row actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-1)', flexShrink: 0 }}>
                      {requiresApproval && guest.approvalStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => approve(guest.id)}
                            disabled={actioning === guest.id}
                            className="btn btn--sm"
                            style={{
                              background: 'var(--verified, #059669)',
                              borderColor: 'var(--verified, #059669)',
                              color: 'var(--off, #f5f7fa)',
                              padding: '4px 10px',
                            }}
                            aria-label="Approve"
                          >
                            <Check size={12} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => decline(guest.id)}
                            disabled={actioning === guest.id}
                            className="btn btn--sm btn-danger"
                            style={{ padding: '4px 10px' }}
                            aria-label="Decline"
                          >
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        </>
                      )}
                      {guest.approvalStatus === 'pending_livery_briefing' && (
                        <button
                          onClick={() => {
                            setLiveryVerifyId(liveryVerifyId === guest.id ? null : guest.id)
                            setLiveryVerifierName('')
                          }}
                          disabled={actioning === guest.id}
                          className="btn btn-sm btn-gold"
                          style={{ fontSize: '11px' }}
                        >
                          Verify briefing
                        </button>
                      )}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : guest.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: 'var(--r-1)',
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--muted, #6b7280)',
                        }}
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded detail ── */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: 'var(--s-3)',
                        paddingTop: 'var(--s-3)',
                        borderTop: '1px dashed var(--border, #dde2ea)',
                        paddingLeft: 48,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--s-2)',
                      }}
                    >
                      {guest.dietaryRequirements && (
                        <p style={{ fontSize: '12px', color: 'var(--muted, #6b7280)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink, #111c2d)' }}>Dietary: </span>
                          {guest.dietaryRequirements}
                        </p>
                      )}
                      {guest.waiverSignedAt && (
                        <p className="font-mono" style={{ fontSize: '11px', color: 'var(--muted, #6b7280)' }}>
                          Waiver signed: {new Date(guest.waiverSignedAt).toLocaleString()}
                        </p>
                      )}
                      {guest.addonOrders.length > 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--muted, #6b7280)' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink, #111c2d)' }}>Add-ons: </span>
                          {guest.addonOrders.map(o => `${o.addonName} ×${o.quantity}`).join(', ')}
                        </p>
                      )}
                      {guest.fwcLicenseUrl && (
                        <a
                          href={guest.fwcLicenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)',
                            fontSize: '12px', color: 'var(--ink, #111c2d)', fontWeight: 500,
                            textDecoration: 'underline', textDecorationColor: 'var(--border, #dde2ea)',
                          }}
                        >
                          <ExternalLink size={11} strokeWidth={2} />
                          FWC Boater Safety ID
                        </a>
                      )}
                      <button
                        onClick={() => remove(guest.id)}
                        disabled={actioning === guest.id}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 'var(--s-1)',
                          fontSize: '12px', color: 'var(--danger, #dc2626)', background: 'none',
                          border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500,
                        }}
                      >
                        <Trash2 size={11} strokeWidth={2} />
                        Remove from trip
                      </button>

                      {/* Livery verify inline */}
                      {liveryVerifyId === guest.id && (
                        <div
                          className="alert alert--warn"
                          style={{ marginTop: 'var(--s-2)', flexDirection: 'column', alignItems: 'stretch' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)' }}>
                            <AlertTriangle size={14} strokeWidth={2} />
                            <strong style={{ fontSize: '13px' }}>Confirm vessel briefing</strong>
                          </div>
                          <p style={{ fontSize: '12px', lineHeight: 1.5, marginBottom: 'var(--s-3)' }}>
                            I confirm I have briefed <strong>{guest.fullName}</strong> on vessel operation,
                            safety equipment, and emergency procedures for this hull.
                          </p>
                          <input
                            type="text"
                            placeholder="Your name (Dockmaster / Operator)"
                            value={liveryVerifierName}
                            onChange={e => setLiveryVerifierName(e.target.value)}
                            className="field-input"
                            style={{ marginBottom: 'var(--s-2)' }}
                          />
                          <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
                            <button
                              onClick={() => verifyLiveryBriefing(guest.id)}
                              disabled={!liveryVerifierName.trim() || actioning === guest.id}
                              className="btn btn--sm"
                              style={{
                                flex: 1,
                                background: 'var(--verified, #059669)',
                                borderColor: 'var(--verified, #059669)',
                                color: 'var(--off, #f5f7fa)',
                              }}
                            >
                              <Check size={12} strokeWidth={2.5} />
                              Confirm briefing
                            </button>
                            <button
                              onClick={() => setLiveryVerifyId(null)}
                              className="btn btn--sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
