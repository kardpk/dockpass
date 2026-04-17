'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Anchor, Users, HardHat, UserPlus, AlertTriangle, Ship } from 'lucide-react'
import { CaptainCard } from '@/components/dashboard/CaptainCard'
import { CaptainFormSheet } from '@/components/dashboard/CaptainFormSheet'
import type { CaptainProfile, CrewRole } from '@/types'

interface BoatOption { id: string; name: string }

interface CrewRosterClientProps {
  initialCaptains: CaptainProfile[]
  expiringCaptains: CaptainProfile[]
  operatorBoats: BoatOption[]
}

const ROLE_ORDER: CrewRole[] = ['captain', 'first_mate', 'crew', 'deckhand']
const ROLE_SECTION: Record<CrewRole, { label: string; Icon: typeof Shield }> = {
  captain:    { label: 'Captains',    Icon: Shield },
  first_mate: { label: 'First Mates', Icon: Anchor },
  crew:       { label: 'Crew',        Icon: Users },
  deckhand:   { label: 'Deckhands',   Icon: HardHat },
}

export function CrewRosterClient({
  initialCaptains,
  expiringCaptains,
  operatorBoats,
}: CrewRosterClientProps) {
  const router = useRouter()
  const [captains, setCaptains] = useState(initialCaptains)
  const [showForm, setShowForm] = useState(false)
  const [editingCaptain, setEditingCaptain] = useState<CaptainProfile | null>(null)

  const handleEdit = useCallback((captain: CaptainProfile) => {
    setEditingCaptain(captain)
    setShowForm(true)
  }, [])

  const handleDeactivate = useCallback(async (captain: CaptainProfile) => {
    if (!window.confirm(`Remove ${captain.fullName} from your crew roster?`)) return
    try {
      const res = await fetch(`/api/dashboard/captains/${captain.id}`, { method: 'DELETE' })
      if (res.ok) setCaptains(prev => prev.filter(c => c.id !== captain.id))
    } catch { /* silent fail */ }
  }, [])

  const handleSaved = useCallback((saved: CaptainProfile) => {
    setCaptains(prev => {
      const existing = prev.find(c => c.id === saved.id)
      if (existing) {
        saved.linkedBoats = existing.linkedBoats ?? []
        return prev.map(c => c.id === saved.id ? saved : c)
      }
      return [saved, ...prev]
    })
    setShowForm(false)
    setEditingCaptain(null)
    router.refresh()
  }, [router])

  const handleBoatLinked = useCallback((captainId: string, boatId: string, boatName: string) => {
    setCaptains(prev => prev.map(c =>
      c.id !== captainId ? c : { ...c, linkedBoats: [...c.linkedBoats, { boatId, boatName }] }
    ))
  }, [])

  const handleBoatUnlinked = useCallback((captainId: string, boatId: string) => {
    setCaptains(prev => prev.map(c =>
      c.id !== captainId ? c : { ...c, linkedBoats: c.linkedBoats.filter(lb => lb.boatId !== boatId) }
    ))
  }, [])

  const grouped = ROLE_ORDER
    .map(role => ({ role, config: ROLE_SECTION[role], members: captains.filter(c => c.defaultRole === role) }))
    .filter(g => g.members.length > 0)

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: 0, lineHeight: 1.1 }}>
            Crew Roster
          </h1>
          <p className="mono" style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 4, letterSpacing: '0.03em' }}>
            {captains.length} member{captains.length !== 1 ? 's' : ''} in your roster
          </p>
        </div>
        <button
          onClick={() => { setEditingCaptain(null); setShowForm(true) }}
          className="btn btn--ink"
          style={{ height: 40, paddingInline: 16, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <UserPlus size={15} strokeWidth={2} />
          Add Crew
        </button>
      </div>

      {/* ── License expiry alerts ───────────────────────────────────── */}
      {expiringCaptains.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            borderRadius: 'var(--r-1)',
            background: 'rgba(212,160,23,0.06)',
            border: '1px solid rgba(212,160,23,0.25)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <AlertTriangle size={15} strokeWidth={2} style={{ color: 'var(--color-brass)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 2px' }}>
              License Alert
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', margin: 0 }}>
              {expiringCaptains.length} crew member{expiringCaptains.length !== 1 ? 's have' : ' has a'} license
              {expiringCaptains.length !== 1 ? 's' : ''} expiring within 30 days: {expiringCaptains.map(c => c.fullName).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* ── Crew cards or empty state ───────────────────────────────── */}
      {captains.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grouped.map(group => (
            <div key={group.role}>
              {/* Section label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <group.config.Icon size={14} strokeWidth={1.75} style={{ color: 'var(--color-ink-muted)' }} />
                <p className="mono" style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--color-ink-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1,
                }}>
                  {group.config.label}
                </p>
                <span style={{
                  padding: '1px 8px', borderRadius: 9999,
                  background: 'var(--color-bone)',
                  border: '1px solid var(--color-line)',
                  fontSize: 11, color: 'var(--color-ink-muted)',
                }}>
                  {group.members.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.members.map(captain => (
                  <CaptainCard
                    key={captain.id}
                    captain={captain}
                    operatorBoats={operatorBoats}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onBoatLinked={handleBoatLinked}
                    onBoatUnlinked={handleBoatUnlinked}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Empty state ──────────────────────────────────────────── */
        <div
          style={{
            textAlign: 'center',
            paddingTop: 56, paddingBottom: 56,
            paddingLeft: 24, paddingRight: 24,
          }}
        >
          <div
            style={{
              width: 64, height: 64, borderRadius: 'var(--r-2)',
              background: 'var(--color-bone)',
              border: '1px solid var(--color-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Ship size={28} strokeWidth={1.25} style={{ color: 'var(--color-ink-muted)' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 6px' }}>
            No crew members yet
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.55 }}>
            Add your first crew member to start assigning them to trips. Their profile appears on guest boarding passes.
          </p>
          <button
            onClick={() => { setEditingCaptain(null); setShowForm(true) }}
            className="btn btn--ink"
            style={{ height: 48, paddingInline: 24, fontSize: 14, fontWeight: 600 }}
          >
            + Add your first crew member
          </button>
        </div>
      )}

      {/* ── Form sheet overlay ──────────────────────────────────────── */}
      {showForm && (
        <CaptainFormSheet
          key={editingCaptain?.id ?? 'new'}
          captain={editingCaptain}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingCaptain(null) }}
        />
      )}
    </>
  )
}
