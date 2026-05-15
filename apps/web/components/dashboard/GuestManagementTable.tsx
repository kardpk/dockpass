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
  id: string; qualificationStatus: QualificationStatus
  hasBoatOwnership: boolean; experienceYears: number
  safetyBoaterRequired: boolean; safetyBoaterCardUrl: string | null
  attestedAt: string; reviewNotes: string | null
}

interface GuestManagementTableProps {
  tripId: string; initialGuests: DashboardGuest[]
  maxGuests: number; requiresApproval: boolean
  requiresQualification?: boolean
  qualificationMap?: Record<string, QualificationRecord>
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
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
  const pending = guests.filter(g => g.approvalStatus === 'pending').length
  const pct = maxGuests > 0 ? Math.min((total / maxGuests) * 100, 100) : 0

  async function approve(guestId: string) {
    setActioning(guestId)
    try { await fetch(`/api/dashboard/guests/${guestId}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approved' }) }) }
    finally { setActioning(null) }
  }

  async function decline(guestId: string) {
    setActioning(guestId)
    try { await fetch(`/api/dashboard/guests/${guestId}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'declined' }) }) }
    finally { setActioning(null) }
  }

  async function remove(guestId: string) {
    if (!confirm('Remove this guest?')) return
    setActioning(guestId)
    try { await fetch(`/api/dashboard/guests/${guestId}/remove`, { method: 'DELETE' }) }
    finally { setActioning(null) }
  }

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

  return (
    <section>
      <div className="td-kicker">
        <div className="td-row" style={{ gap: 10 }}>
          <span className="td-kicker-label">Guests</span>
          <span style={{ fontFamily: 'var(--td-mono)', fontSize: 11, fontWeight: 600, color: 'var(--td-navy-dim)' }}>
            {total} / {maxGuests}
          </span>
          {pending > 0 && <span className="td-pill td-pill-warn">{pending} pending</span>}
        </div>
        <RealtimeIndicator status={connectionStatus} />
      </div>

      {/* Progress */}
      <div className="td-progress-wrap">
        <div
          className="td-progress-bar"
          style={{ width: `${pct}%`, background: signed === total && total > 0 ? 'var(--td-ok)' : 'var(--td-navy)' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-navy-faint)' }}>
          {signed} of {total} waiver{total !== 1 ? 's' : ''} signed
        </span>
        {signed === total && total > 0 && (
          <span className="td-pill td-pill-ok"><Check size={8} strokeWidth={2.5} />All signed</span>
        )}
      </div>

      {/* List */}
      {guests.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--td-navy-faint)', padding: '20px 0' }}>
          No guests yet — share the trip link
        </p>
      ) : (
        <div>
          {guests.map(guest => {
            const isSigned = guest.waiverSigned || guest.waiverTextHash === 'firma_template'
            const isFirma = guest.waiverTextHash === 'firma_template'
            const isExp = expanded === guest.id
            const accentColor = guest.approvalStatus === 'declined' ? 'var(--td-err)'
              : guest.approvalStatus === 'pending' ? 'var(--td-warn)'
              : isSigned ? 'var(--td-ok)'
              : 'transparent'

            return (
              <div
                key={guest.id}
                style={{
                  borderLeft: `2px solid ${accentColor}`,
                  paddingLeft: accentColor !== 'transparent' ? 10 : 0,
                }}
              >
                <div className="td-guest-row">
                  <div className="td-avatar td-avatar-md">{initials(guest.fullName)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="td-guest-name">{guest.fullName}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {isFirma ? (
                        <span className="td-pill td-pill-ghost"><FileSignature size={8} strokeWidth={2.5} />Firma</span>
                      ) : isSigned ? (
                        <span className="td-pill td-pill-ok"><Check size={8} strokeWidth={2.5} />Signed</span>
                      ) : (
                        <span className="td-pill td-pill-warn">Unsigned</span>
                      )}
                      {(guest.safetyAcknowledgments?.length ?? 0) > 0 && (
                        <span className="td-pill td-pill-ghost"><Shield size={8} strokeWidth={2.5} />{guest.safetyAcknowledgments!.length}</span>
                      )}
                      {guest.isNonSwimmer && <span className="td-pill td-pill-err">Non-swimmer</span>}
                      {guest.isSeaSicknessProne && <span className="td-pill td-pill-warn">Seasickness</span>}
                      {guest.approvalStatus === 'declined' && <span className="td-pill td-pill-err">Declined</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {requiresApproval && guest.approvalStatus === 'pending' && (
                      <>
                        <button onClick={() => approve(guest.id)} disabled={actioning === guest.id}
                          style={{ background: 'var(--td-ok-bg)', border: '1px solid var(--td-ok-border)', borderRadius: 4, color: 'var(--td-ok)', padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Check size={11} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => decline(guest.id)} disabled={actioning === guest.id}
                          style={{ background: 'var(--td-err-bg)', border: '1px solid var(--td-err-border)', borderRadius: 4, color: 'var(--td-err)', padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <X size={11} strokeWidth={2.5} />
                        </button>
                      </>
                    )}
                    <button onClick={() => setExpanded(isExp ? null : guest.id)} className="td-expand-toggle">
                      {isExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {isExp && (
                  <div className="td-expanded-body">
                    {guest.dietaryRequirements && (
                      <p style={{ fontSize: 12, color: 'var(--td-navy-dim)' }}>
                        <span style={{ fontWeight: 600 }}>Dietary: </span>{guest.dietaryRequirements}
                      </p>
                    )}
                    {guest.waiverSignedAt && (
                      <p style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-navy-faint)' }}>
                        Signed: {new Date(guest.waiverSignedAt).toLocaleString()}
                      </p>
                    )}
                    {guest.addonOrders.length > 0 && (
                      <p style={{ fontSize: 12, color: 'var(--td-navy-dim)' }}>
                        <span style={{ fontWeight: 600 }}>Add-ons: </span>
                        {guest.addonOrders.map(o => `${o.addonName} ×${o.quantity}`).join(', ')}
                      </p>
                    )}
                    {guest.fwcLicenseUrl && (
                      <a href={guest.fwcLicenseUrl} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--td-navy-mid)', textDecoration: 'none' }}>
                        <ExternalLink size={10} strokeWidth={2} /> FWC Boater ID
                      </a>
                    )}
                    <button onClick={() => remove(guest.id)} disabled={actioning === guest.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--td-err)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={10} strokeWidth={2} /> Remove from trip
                    </button>

                    {liveryVerifyId === guest.id && (
                      <div className="td-alert td-alert-warn" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={12} strokeWidth={2} />
                          <strong style={{ fontSize: 12 }}>Confirm vessel briefing</strong>
                        </div>
                        <input type="text" placeholder="Your name (Dockmaster / Operator)"
                          value={liveryVerifierName} onChange={e => setLiveryVerifierName(e.target.value)}
                          className="td-textarea" style={{ resize: 'none' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => verifyLivery(guest.id)}
                            disabled={!liveryVerifierName.trim() || actioning === guest.id}
                            className="td-btn-primary" style={{ flex: 1, height: 34, fontSize: 11 }}>
                            <Check size={10} strokeWidth={2.5} /> Confirm
                          </button>
                          <button onClick={() => setLiveryVerifyId(null)} className="td-btn-outline" style={{ flex: 1, height: 34 }}>
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
