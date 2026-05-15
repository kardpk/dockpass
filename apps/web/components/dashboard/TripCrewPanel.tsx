'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserRound, Plus, X, ArrowRight, ChevronRight } from 'lucide-react'

interface CaptainOption {
  id: string; fullName: string; photoUrl: string | null
  licenseType: string | null; isDefault: boolean
}

interface Assignment {
  captainId: string; captainName: string; role: string
}

interface TripCrewPanelProps {
  tripId: string; tripStatus: string; initialAssignments: Assignment[]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function TripCrewPanel({ tripId, tripStatus, initialAssignments }: TripCrewPanelProps) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [captains, setCaptains] = useState<CaptainOption[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const isLocked = tripStatus !== 'upcoming'

  useEffect(() => {
    if (showPicker && captains.length === 0) {
      fetch('/api/dashboard/captains').then(r => r.json()).then(json => {
        setCaptains((json.data ?? []).map((c: Record<string, unknown>) => ({
          id: c.id, fullName: c.fullName, photoUrl: c.photoUrl,
          licenseType: c.licenseType, isDefault: c.isDefault,
        })))
      }).catch(() => {})
    }
  }, [showPicker, captains.length])

  const handleAssign = useCallback(async (captainId: string, captainName: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/trips/${tripId}/assign-crew`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captainId, role: 'captain' }),
      })
      if (res.ok) {
        setAssignments(prev => [...prev.filter(a => a.role !== 'captain'), { captainId, captainName, role: 'captain' }])
        setShowPicker(false)
      }
    } catch {} finally { setLoading(false) }
  }, [tripId])

  const handleRemove = useCallback(async (captainId: string) => {
    if (!window.confirm('Remove this crew member from the trip?')) return
    try {
      await fetch(`/api/dashboard/trips/${tripId}/assign-crew`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captainId }),
      })
      setAssignments(prev => prev.filter(a => a.captainId !== captainId))
    } catch {}
  }, [tripId])

  const currentCaptain = assignments.find(a => a.role === 'captain')
  const otherCrew = assignments.filter(a => a.role !== 'captain')

  return (
    <section>
      {/* Uniform section kicker */}
      <div className="td-kicker">
        <span className="td-kicker-label">Crew Assignment</span>
        {isLocked && <span className="td-pill td-pill-ghost">Locked</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Captain card */}
        {currentCaptain ? (
          <div className="td-panel" style={{ borderLeft: '3px solid var(--td-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div className="td-avatar td-avatar-md">{initials(currentCaptain.captainName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--td-sans)', fontSize: 14, fontWeight: 600, color: 'var(--td-text)', lineHeight: 1.2 }}>
                  {currentCaptain.captainName}
                </p>
                <p style={{ fontFamily: 'var(--td-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--td-gold-dim)', marginTop: 3 }}>
                  Captain · PIC
                </p>
              </div>
              {!isLocked && (
                <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                  <button onClick={() => setShowPicker(true)} className="td-btn-ghost">Swap</button>
                  <button onClick={() => handleRemove(currentCaptain.captainId)} className="td-btn-ghost" style={{ color: 'var(--td-err)' }}>Remove</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="td-panel"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 16px', textAlign: 'center', borderStyle: isLocked ? 'solid' : 'dashed' }}
          >
            <UserRound size={24} strokeWidth={1.5} style={{ color: 'var(--td-text-faint)' }} />
            <p style={{ fontSize: 12, color: 'var(--td-text-dim)' }}>
              {isLocked ? 'No captain assigned' : 'No captain assigned yet'}
            </p>
            {!isLocked && (
              <button onClick={() => setShowPicker(true)} className="td-btn-outline" style={{ fontSize: 12 }}>
                <Plus size={12} strokeWidth={2.5} /> Assign captain
              </button>
            )}
          </div>
        )}

        {/* Other crew */}
        {otherCrew.map(member => (
          <div key={member.captainId} className="td-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
              <div className="td-avatar td-avatar-sm">{initials(member.captainName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--td-text)', lineHeight: 1.2 }}>
                  {member.captainName}
                </p>
                <p style={{ fontFamily: 'var(--td-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--td-text-dim)', marginTop: 2 }}>
                  {member.role.replace(/_/g, ' ')}
                </p>
              </div>
              {!isLocked && (
                <button onClick={() => handleRemove(member.captainId)} className="td-btn-ghost" style={{ color: 'var(--td-err)' }}>
                  <X size={13} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Captain picker */}
        {showPicker && (
          <div className="td-panel">
            <div className="td-panel-header">
              <span className="td-panel-label">Select from roster</span>
              <button onClick={() => setShowPicker(false)} className="td-btn-ghost">
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            <div>
              {captains.length === 0 && (
                <p style={{ padding: '12px 16px', fontSize: 12, color: 'var(--td-text-dim)' }}>Loading roster...</p>
              )}
              {captains.map((captain, idx) => (
                <button
                  key={captain.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleAssign(captain.id, captain.fullName)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: idx === captains.length - 1 ? 'none' : '1px solid var(--td-divider)',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                    opacity: loading ? 0.5 : 1, transition: 'background 120ms',
                    borderLeft: assignments.some(a => a.captainId === captain.id) ? '2px solid var(--td-gold)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--td-surface-hi)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div className="td-avatar td-avatar-sm">{initials(captain.fullName)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--td-text)' }}>
                      {captain.fullName}
                      {captain.isDefault && (
                        <span style={{ marginLeft: 6, fontFamily: 'var(--td-mono)', fontSize: 9, color: 'var(--td-gold)' }}>Default</span>
                      )}
                    </p>
                    {captain.licenseType && (
                      <p style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-text-dim)', marginTop: 1 }}>
                        {captain.licenseType}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={13} strokeWidth={2} style={{ color: 'var(--td-text-faint)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Roster link */}
        {!isLocked && (
          <a href="/dashboard/captains" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--td-text-faint)', textDecoration: 'none', marginTop: 4, justifyContent: 'center' }}>
            Manage crew roster <ArrowRight size={11} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </section>
  )
}
