'use client'

import { useState } from 'react'
import {
  Check, X, Trash2, ChevronDown, ChevronUp,
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

type DotState = 'ALL_SIGNED' | 'ALL_IN' | 'PARTIAL' | 'EMPTY'
function dotState(total: number, signed: number, max: number): DotState {
  if (total === 0) return 'EMPTY'
  if (signed === total && total === max) return 'ALL_SIGNED'
  if (total === max) return 'ALL_IN'
  return 'PARTIAL'
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
  const ds = dotState(total, signed, maxGuests)

  const dotColor = ds === 'ALL_SIGNED' ? 'var(--td-ok)'
    : ds === 'ALL_IN' || ds === 'PARTIAL' ? 'var(--td-warn)'
    : 'var(--td-text-faint)'

  async function verifyLivery(guestId: string) {
    if (!liveryVerifierName.trim()) return
    setActioning(guestId)
    try {
      await fetch(`/api/dashboard/guests/${guestId}/verify-livery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifierName: liveryVerifierName.trim() }),
      })
      setLiveryVerifyId(null); setLiveryVerifierName('')
    } finally { setActioning(null) }
  }

  async function approve(guestId: string) {
    setActioning(guestId)
    try {
      await fetch(`/api/dashboard/guests/${guestId}/approve`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved' }),
      })
    } finally { setActioning(null) }
  }

  async function decline(guestId: string) {
    setActioning(guestId)
    try {
      await fetch(`/api/dashboard/guests/${guestId}/approve`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'declined' }),
      })
    } finally { setActioning(null) }
  }

  async function remove(guestId: string) {
    if (!confirm('Remove this guest from the trip?')) return
    setActioning(guestId)
    try { await fetch(`/api/dashboard/guests/${guestId}/remove`, { method: 'DELETE' }) }
    finally { setActioning(null) }
  }

  return (
    <section>
      {/* Uniform section kicker */}
      <div className="td-kicker">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="td-kicker-label">Guests</span>
          <span style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-text-faint)' }}>
            {total} / {maxGuests}
          </span>
          <span
            title={ds === 'ALL_SIGNED' ? 'All waivers signed' : `${total - signed} unsigned`}
            style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }}
          />
          {pendingApproval > 0 && (
            <span className="td-pill td-pill-warn">{pendingApproval} pending</span>
          )}
        </div>
        <RealtimeIndicator status={connectionStatus} />
      </div>

      {/* Waiver progress */}
      <div className="td-progress-wrap">
        <div
          className="td-progress-bar"
          style={{
            width: `${progressPct}%`,
            background: signed === total && total > 0 ? 'var(--td-ok)' : 'var(--td-gold)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-text-dim)' }}>
          {signed} waiver{signed !== 1 ? 's' : ''} signed
        </span>
        {signed === total && total > 0 && (
          <span className="td-pill td-pill-ok"><Check size={9} strokeWidth={2.5} />All signed</span>
        )}
        {total - signed > 0 && (
          <span style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-warn)' }}>
            {total - signed} unsigned
          </span>
        )}
      </div>

      {/* Guest list */}
      {guests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--td-text-faint)' }}>
          <p style={{ fontFamily: 'var(--td-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            No guests yet
          </p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Share the trip link to start receiving check-ins</p>
        </div>
      ) : (
        <div>
          {guests.map(guest => {
            const isWaiverSigned = guest.waiverSigned || guest.waiverTextHash === 'firma_template'
            const isFirma = guest.waiverTextHash === 'firma_template'
            const isExpanded = expanded === guest.id
            const isLast = guest === guests[guests.length - 1]

            // Left accent color
            let accentColor = 'transparent'
            if (guest.approvalStatus === 'declined') accentColor = 'var(--td-err)'
            else if (guest.approvalStatus === 'pending') accentColor = 'var(--td-warn)'
            else if (isWaiverSigned) accentColor = 'var(--td-ok)'

            return (
              <div
                key={guest.id}
                style={{
                  borderBottom: isLast ? 'none' : '1px solid var(--td-divider)',
                  borderLeft: `2px solid ${accentColor}`,
                  paddingLeft: accentColor !== 'transparent' ? 10 : 0,
                  transition: 'border-left-color 0.2s',
                }}
              >
                <div className="td-guest-row" style={{ borderBottom: 'none' }}>
                  {/* Avatar */}
                  <div className="td-avatar td-avatar-md">
                    {initials(guest.fullName)}
                  </div>

                  {/* Name + pills */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="td-guest-name">{guest.fullName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                      {isFirma ? (
                        <span className="td-pill td-pill-ghost"><FileSignature size={9} strokeWidth={2.5} />Firma</span>
                      ) : isWaiverSigned ? (
                        <span className="td-pill td-pill-ok"><Check size={9} strokeWidth={2.5} />Signed</span>
                      ) : (
                        <span className="td-pill td-pill-warn">Unsigned</span>
                      )}
                      {(guest.safetyAcknowledgments?.length ?? 0) > 0 && (
                        <span className="td-pill td-pill-ok"><Shield size={9} strokeWidth={2.5} />{guest.safetyAcknowledgments!.length} cards</span>
                      )}
                      {guest.isNonSwimmer && <span className="td-pill td-pill-err">Non-swimmer</span>}
                      {guest.isSeaSicknessProne && <span className="td-pill td-pill-warn">Seasickness</span>}
                      {guest.approvalStatus === 'declined' && <span className="td-pill td-pill-err">Declined</span>}
                      {guest.approvalStatus === 'pending_livery_briefing' && (
                        <span className="td-pill td-pill-gold">Livery briefing</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {requiresApproval && guest.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => approve(guest.id)}
                          disabled={actioning === guest.id}
                          style={{ background: 'var(--td-ok-bg)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 4, color: 'var(--td-ok)', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <Check size={12} strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => decline(guest.id)}
                          disabled={actioning === guest.id}
                          style={{ background: 'var(--td-err-bg)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 4, color: 'var(--td-err)', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                    {guest.approvalStatus === 'pending_livery_briefing' && (
                      <button
                        onClick={() => setLiveryVerifyId(liveryVerifyId === guest.id ? null : guest.id)}
                        disabled={actioning === guest.id}
                        className="td-btn-ghost"
                        style={{ fontSize: 11 }}
                      >
                        Verify
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : guest.id)}
                      className="td-expand-toggle"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="td-expanded-body">
                    {guest.dietaryRequirements && (
                      <p style={{ fontSize: 12, color: 'var(--td-text-dim)' }}>
                        <span style={{ color: 'var(--td-text)' }}>Dietary: </span>{guest.dietaryRequirements}
                      </p>
                    )}
                    {guest.waiverSignedAt && (
                      <p style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-text-dim)' }}>
                        Waiver signed: {new Date(guest.waiverSignedAt).toLocaleString()}
                      </p>
                    )}
                    {guest.addonOrders.length > 0 && (
                      <p style={{ fontSize: 12, color: 'var(--td-text-dim)' }}>
                        <span style={{ color: 'var(--td-text)' }}>Add-ons: </span>
                        {guest.addonOrders.map(o => `${o.addonName} ×${o.quantity}`).join(', ')}
                      </p>
                    )}
                    {guest.fwcLicenseUrl && (
                      <a
                        href={guest.fwcLicenseUrl}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--td-gold-dim)', textDecoration: 'none' }}
                      >
                        <ExternalLink size={11} strokeWidth={2} /> FWC Boater Safety ID
                      </a>
                    )}
                    <button
                      onClick={() => remove(guest.id)}
                      disabled={actioning === guest.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--td-err)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Trash2 size={11} strokeWidth={2} /> Remove from trip
                    </button>

                    {/* Livery verify inline */}
                    {liveryVerifyId === guest.id && (
                      <div className="td-alert td-alert-warn" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, marginTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={13} strokeWidth={2} />
                          <strong style={{ fontSize: 12 }}>Confirm vessel briefing</strong>
                        </div>
                        <p style={{ fontSize: 12, margin: 0 }}>
                          I confirm I have briefed <strong>{guest.fullName}</strong> on vessel operation, safety equipment, and emergency procedures.
                        </p>
                        <input
                          type="text"
                          placeholder="Your name (Dockmaster / Operator)"
                          value={liveryVerifierName}
                          onChange={e => setLiveryVerifierName(e.target.value)}
                          className="td-textarea"
                          style={{ padding: '7px 10px', resize: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => verifyLivery(guest.id)}
                            disabled={!liveryVerifierName.trim() || actioning === guest.id}
                            className="td-btn-gold"
                            style={{ flex: 1, height: 36, fontSize: 12 }}
                          >
                            <Check size={11} strokeWidth={2.5} /> Confirm
                          </button>
                          <button onClick={() => setLiveryVerifyId(null)} className="td-btn-outline" style={{ flex: 1, height: 36 }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
