'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserRound, Plus, X, ArrowRight, ChevronRight } from 'lucide-react'

interface CaptainOption {
  id: string; fullName: string; photoUrl: string | null
  licenseType: string | null; isDefault: boolean
}
interface Assignment { captainId: string; captainName: string; role: string }
interface TripCrewPanelProps { tripId: string; tripStatus: string; initialAssignments: Assignment[] }

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
    if (!window.confirm('Remove this crew member?')) return
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
      <div className="td-kicker">
        <span className="td-kicker-label">Crew Assignment</span>
        {isLocked && <span className="td-pill td-pill-ghost">Locked</span>}
      </div>

      <div className="td-gap-8">
        {/* Captain card */}
        {currentCaptain ? (
          <div className="td-panel" style={{ borderLeft: '3px solid var(--td-navy)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
              <div className="td-avatar td-avatar-md">{initials(currentCaptain.captainName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-navy)', lineHeight: 1.2 }}>
                  {currentCaptain.captainName}
                </p>
                <p style={{ fontFamily: 'var(--td-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--td-navy-dim)', marginTop: 3 }}>
                  Captain · PIC
                </p>
              </div>
              {!isLocked && (
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button onClick={() => setShowPicker(true)} className="td-btn-ghost">Swap</button>
                  <button onClick={() => handleRemove(currentCaptain.captainId)} className="td-btn-ghost" style={{ color: 'var(--td-err)' }}>Remove</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="td-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 16px', textAlign: 'center', borderStyle: isLocked ? 'solid' : 'dashed' }}>
            <UserRound size={22} strokeWidth={1.5} style={{ color: 'var(--td-navy-faint)' }} />
            <p style={{ fontSize: 13, color: 'var(--td-navy-dim)' }}>
              {isLocked ? 'No captain assigned' : 'No captain assigned yet'}
            </p>
            {!isLocked && (
              <button onClick={() => setShowPicker(true)} className="td-btn-outline" style={{ fontSize: 12, height: 34 }}>
                <Plus size={11} strokeWidth={2.5} /> Assign captain
              </button>
            )}
          </div>
        )}

        {/* Other crew */}
        {otherCrew.map(member => (
          <div key={member.captainId} className="td-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
              <div className="td-avatar td-avatar-sm">{initials(member.captainName)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--td-navy)' }}>{member.captainName}</p>
                <p style={{ fontFamily: 'var(--td-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--td-navy-faint)', marginTop: 2 }}>
                  {member.role.replace(/_/g, ' ')}
                </p>
              </div>
              {!isLocked && (
                <button onClick={() => handleRemove(member.captainId)} className="td-btn-ghost" style={{ color: 'var(--td-err)' }}>
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Picker */}
        {showPicker && (
          <div className="td-panel">
            <div className="td-panel-header">
              <span className="td-panel-label">Select from roster</span>
              <button onClick={() => setShowPicker(false)} className="td-btn-ghost"><X size={13} strokeWidth={2} /></button>
            </div>
            <div>
              {captains.length === 0 && (
                <p style={{ padding: '12px 14px', fontSize: 12, color: 'var(--td-navy-faint)' }}>Loading...</p>
              )}
              {captains.map((c, idx) => (
                <button key={c.id} type="button" disabled={loading}
                  onClick={() => handleAssign(c.id, c.fullName)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderBottom: idx === captains.length - 1 ? 'none' : `1px solid var(--td-divider)`,
                    background: 'none', cursor: 'pointer', textAlign: 'left', opacity: loading ? 0.5 : 1,
                    transition: 'background 100ms',
                    borderLeft: assignments.some(a => a.captainId === c.id) ? '2px solid var(--td-navy)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--td-surface-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div className="td-avatar td-avatar-sm">{initials(c.fullName)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--td-navy)' }}>
                      {c.fullName}
                      {c.isDefault && <span style={{ marginLeft: 6, fontFamily: 'var(--td-mono)', fontSize: 9, color: 'var(--td-navy-dim)' }}>Default</span>}
                    </p>
                    {c.licenseType && (
                      <p style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-navy-faint)', marginTop: 1 }}>
                        {c.licenseType}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={12} strokeWidth={2} style={{ color: 'var(--td-navy-faint)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLocked && (
          <a href="/dashboard/captains" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--td-navy-faint)', textDecoration: 'none', marginTop: 2, justifyContent: 'center' }}>
            Manage crew roster <ArrowRight size={10} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </section>
  )
}
