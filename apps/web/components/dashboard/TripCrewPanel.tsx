'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserRound, Plus, X, ArrowRight, ChevronRight } from 'lucide-react'

interface CaptainOption { id: string; fullName: string; photoUrl: string | null; licenseType: string | null; isDefault: boolean }
interface Assignment { captainId: string; captainName: string; role: string }
interface TripCrewPanelProps { tripId: string; tripStatus: string; initialAssignments: Assignment[] }

function initials(name: string) { return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }

export function TripCrewPanel({ tripId, tripStatus, initialAssignments }: TripCrewPanelProps) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [captains, setCaptains] = useState<CaptainOption[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const isLocked = tripStatus !== 'upcoming'

  useEffect(() => {
    if (showPicker && captains.length === 0) {
      fetch('/api/dashboard/captains').then(r => r.json()).then(json => {
        setCaptains((json.data ?? []).map((c: Record<string, unknown>) => ({ id: c.id, fullName: c.fullName, photoUrl: c.photoUrl, licenseType: c.licenseType, isDefault: c.isDefault })))
      }).catch(() => {})
    }
  }, [showPicker, captains.length])

  const handleAssign = useCallback(async (captainId: string, captainName: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/dashboard/trips/${tripId}/assign-crew`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ captainId, role: 'captain' }) })
      if (r.ok) { setAssignments(prev => [...prev.filter(a => a.role !== 'captain'), { captainId, captainName, role: 'captain' }]); setShowPicker(false) }
    } catch {} finally { setLoading(false) }
  }, [tripId])

  const handleRemove = useCallback(async (captainId: string) => {
    if (!window.confirm('Remove this crew member?')) return
    try {
      await fetch(`/api/dashboard/trips/${tripId}/assign-crew`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ captainId }) })
      setAssignments(prev => prev.filter(a => a.captainId !== captainId))
    } catch {}
  }, [tripId])

  const cap = assignments.find(a => a.role === 'captain')
  const others = assignments.filter(a => a.role !== 'captain')

  return (
    <section>
      <div className="td-kicker">
        <span className="td-kicker-label">Crew Assignment</span>
        {/* "Locked" — just muted text, no heavy pill */}
        {isLocked && <span style={{ fontSize: 11, color: 'var(--td-faint)', fontWeight: 400 }}>Locked</span>}
      </div>

      <div className="td-gap-8">
        {cap ? (
          <div className="td-panel" style={{ borderLeft: '2px solid var(--td-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
              <div className="td-avatar td-avatar-md">{initials(cap.captainName)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-text)', lineHeight: 1.2 }}>{cap.captainName}</p>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--td-faint)', marginTop: 3 }}>Captain · PIC</p>
              </div>
              {!isLocked && (
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button onClick={() => setShowPicker(true)} className="td-btn-ghost">Swap</button>
                  <button onClick={() => handleRemove(cap.captainId)} className="td-btn-ghost" style={{ color: 'var(--td-err)' }}>Remove</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="td-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 14px', textAlign: 'center', borderStyle: 'dashed' }}>
            <UserRound size={20} strokeWidth={1.5} style={{ color: 'var(--td-faint)' }} />
            <p style={{ fontSize: 12, color: 'var(--td-muted)' }}>No captain assigned</p>
            {!isLocked && (
              <button onClick={() => setShowPicker(true)} className="td-btn-outline" style={{ height: 32, fontSize: 12 }}>
                <Plus size={11} strokeWidth={2.5} /> Assign captain
              </button>
            )}
          </div>
        )}

        {others.map(m => (
          <div key={m.captainId} className="td-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
              <div className="td-avatar td-avatar-sm">{initials(m.captainName)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--td-text)' }}>{m.captainName}</p>
                <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--td-faint)', marginTop: 2 }}>{m.role.replace(/_/g, ' ')}</p>
              </div>
              {!isLocked && <button onClick={() => handleRemove(m.captainId)} className="td-btn-ghost" style={{ color: 'var(--td-err)' }}><X size={12} strokeWidth={2} /></button>}
            </div>
          </div>
        ))}

        {showPicker && (
          <div className="td-panel">
            <div className="td-panel-header">
              <span className="td-panel-label">Select captain</span>
              <button onClick={() => setShowPicker(false)} className="td-btn-ghost"><X size={12} strokeWidth={2} /></button>
            </div>
            <div>
              {captains.length === 0 && <p style={{ padding: '10px 14px', fontSize: 12, color: 'var(--td-faint)' }}>Loading...</p>}
              {captains.map((c, idx) => (
                <button key={c.id} type="button" disabled={loading} onClick={() => handleAssign(c.id, c.fullName)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderBottom: idx === captains.length - 1 ? 'none' : '1px solid var(--td-hairline)',
                    background: 'none', cursor: 'pointer', textAlign: 'left', opacity: loading ? 0.5 : 1,
                    borderLeft: assignments.some(a => a.captainId === c.id) ? '2px solid var(--td-text)' : '2px solid transparent',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div className="td-avatar td-avatar-sm">{initials(c.fullName)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--td-text)' }}>
                      {c.fullName}
                      {c.isDefault && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--td-faint)', fontWeight: 400 }}>Default</span>}
                    </p>
                    {c.licenseType && <p style={{ fontSize: 10, color: 'var(--td-faint)', marginTop: 1, fontFamily: 'var(--td-mono)' }}>{c.licenseType}</p>}
                  </div>
                  <ChevronRight size={12} strokeWidth={2} style={{ color: 'var(--td-faint)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {!isLocked && (
          <a href="/dashboard/captains" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--td-faint)', textDecoration: 'none', justifyContent: 'center', marginTop: 2 }}>
            Manage crew roster <ArrowRight size={10} strokeWidth={2} />
          </a>
        )}
      </div>
    </section>
  )
}
