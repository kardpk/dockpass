'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Anchor, Users, HardHat, UserPlus, AlertTriangle, Ship, ArrowRight } from 'lucide-react'
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
      {/* ── Page header ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-6)' }}>
        <div>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-ink)', lineHeight: 1.1 }}
          >
            Crew roster
          </h1>
          <p
            className="font-mono"
            style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 6 }}
          >
            {captains.length} member{captains.length !== 1 ? 's' : ''} in your roster
          </p>
        </div>
        <button
          onClick={() => { setEditingCaptain(null); setShowForm(true) }}
          className="btn btn--rust"
        >
          <UserPlus size={14} strokeWidth={2.5} />
          Add crew
        </button>
      </div>

      {/* ── License expiry alert ─────────────────────────── */}
      {expiringCaptains.length > 0 && (
        <div className="alert alert--warn" style={{ marginBottom: 'var(--s-5)' }}>
          <AlertTriangle size={16} strokeWidth={2} />
          <div>
            <strong>License alert</strong>
            <div style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: 2 }}>
              {expiringCaptains.length} crew member{expiringCaptains.length !== 1 ? 's have' : ' has a'} license{expiringCaptains.length !== 1 ? 's' : ''}{' '}
              expiring within 60 days (or already expired): {expiringCaptains.map(c => c.fullName).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* ── Crew cards or empty state ───────────────────── */}
      {captains.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)' }}>
          {grouped.map(group => (
            <section key={group.role}>
              {/* Section kicker */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingBottom: 'var(--s-3)',
                  borderBottom: '1px solid var(--color-line-soft)',
                  marginBottom: 'var(--s-3)',
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    fontSize: 'var(--t-mono-xs)', fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
                  }}
                >
                  <group.config.Icon size={12} strokeWidth={2} />
                  {group.config.label}
                </div>
                <span className="pill pill--ghost">{group.members.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
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
            </section>
          ))}
        </div>
      ) : (
        /* ── Empty state ─────────────────────────────────── */
        <div
          className="tile text-center"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: 'var(--s-16) var(--s-8)',
            gap: 'var(--s-4)',
            borderStyle: 'dashed',
          }}
        >
          <Ship size={32} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)' }} />
          <h2
            className="font-display"
            style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}
          >
            No crew members yet
          </h2>
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', maxWidth: 280 }}>
            Add your first crew member to start assigning them to trips.
          </p>
          <button
            onClick={() => { setEditingCaptain(null); setShowForm(true) }}
            className="btn btn--rust"
            style={{ marginTop: 'var(--s-2)' }}
          >
            Add your first crew member
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ── Form sheet overlay ───────────────────────────── */}
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
