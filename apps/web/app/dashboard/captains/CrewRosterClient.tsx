'use client'

import { useState, useCallback } from 'react'
import { Shield, Anchor, Users, HardHat, UserPlus, AlertTriangle, Ship, ArrowRight } from 'lucide-react'
import { CaptainFormSheet } from '@/components/dashboard/CaptainFormSheet'
import { CaptainCard } from '@/components/dashboard/CaptainCard'
import { DashTile, type TileStatus } from '@/components/ui/DashTile'
import { markDirty } from '@/lib/utils/markDirty'
import { useRouter } from 'next/navigation'
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

function getLicenseStatus(captain: CaptainProfile): {
  status: TileStatus
  pill:   string
} {
  if (!captain.licenseExpiry) return { status: 'ok', pill: 'ACTIVE' }
  const daysLeft = Math.ceil(
    (new Date(captain.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysLeft <= 0)  return { status: 'err',  pill: 'EXPIRED'  }
  if (daysLeft <= 30) return { status: 'err',  pill: `${daysLeft}D LEFT` }
  if (daysLeft <= 60) return { status: 'warn', pill: `${daysLeft}D LEFT` }
  return { status: 'ok', pill: 'VALID' }
}

export function CrewRosterClient({
  initialCaptains,
  expiringCaptains,
  operatorBoats,
}: CrewRosterClientProps) {
  const router = useRouter()
  const [captains, setCaptains]         = useState(initialCaptains)
  const [showForm, setShowForm]         = useState(false)
  const [editingCaptain, setEditingCaptain] = useState<CaptainProfile | null>(null)
  // Selected captain for detail slide-sheet (edit/deactivate/link boats)
  const [detailCaptain, setDetailCaptain] = useState<CaptainProfile | null>(null)

  const handleEdit = useCallback((captain: CaptainProfile) => {
    setDetailCaptain(null)
    setEditingCaptain(captain)
    setShowForm(true)
  }, [])

  const handleDeactivate = useCallback(async (captain: CaptainProfile) => {
    if (!window.confirm(`Remove ${captain.fullName} from your crew roster?`)) return
    try {
      const res = await fetch(`/api/dashboard/captains/${captain.id}`, { method: 'DELETE' })
      if (res.ok) {
        setCaptains(prev => prev.filter(c => c.id !== captain.id))
        setDetailCaptain(null)
        markDirty()
      }
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
    markDirty()
    router.refresh()
  }, [router])

  const handleBoatLinked = useCallback((captainId: string, boatId: string, boatName: string) => {
    setCaptains(prev => prev.map(c =>
      c.id !== captainId ? c : { ...c, linkedBoats: [...c.linkedBoats, { boatId, boatName }] }
    ))
    markDirty()
  }, [])

  const handleBoatUnlinked = useCallback((captainId: string, boatId: string) => {
    setCaptains(prev => prev.map(c =>
      c.id !== captainId ? c : { ...c, linkedBoats: c.linkedBoats.filter(lb => lb.boatId !== boatId) }
    ))
    markDirty()
  }, [])

  const grouped = ROLE_ORDER
    .map(role => ({ role, config: ROLE_SECTION[role], members: captains.filter(c => c.defaultRole === role) }))
    .filter(g => g.members.length > 0)

  return (
    <>
      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s-3)', marginBottom: 'var(--s-4)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: 0, lineHeight: 1.2 }}>
            Crew roster
          </h1>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginTop: 4, letterSpacing: '0.05em' }}>
            {captains.length} member{captains.length !== 1 ? 's' : ''}
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

      {/* ── License expiry alert ── */}
      {expiringCaptains.length > 0 && (
        <div className="alert alert--warn" style={{ marginBottom: 'var(--s-4)' }}>
          <AlertTriangle size={16} strokeWidth={2} />
          <div>
            <strong>License alert</strong>
            <div style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: 2 }}>
              {expiringCaptains.map(c => c.fullName).join(', ')} —{' '}
              {expiringCaptains.length === 1 ? 'license' : 'licenses'} expiring within 60 days.
            </div>
          </div>
        </div>
      )}

      {/* ── Crew grid or empty state ── */}
      {captains.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
          {grouped.map(group => (
            <section key={group.role}>
              {/* Section kicker */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: 'var(--s-2)',
                borderBottom: '1px solid var(--color-line-soft)',
                marginBottom: 'var(--s-3)',
              }}>
                <div className="font-mono" style={{
                  fontSize: 'var(--t-mono-xs)', fontWeight: 700,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
                }}>
                  <group.config.Icon size={11} strokeWidth={2} />
                  {group.config.label}
                </div>
                <span className="pill pill--ghost" style={{ fontSize: 10, padding: '2px 8px' }}>
                  {group.members.length}
                </span>
              </div>

              {/* Crew tile grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
                gap: 'var(--s-3)',
              }}>
                {group.members.map(captain => {
                  const { status, pill } = getLicenseStatus(captain)

                  const metaParts: string[] = []
                  if (captain.phone) metaParts.push(captain.phone)
                  if (captain.linkedBoats.length > 0) {
                    metaParts.push(`${captain.linkedBoats.length} boat${captain.linkedBoats.length !== 1 ? 's' : ''}`)
                  }

                  return (
                    <DashTile
                      key={captain.id}
                      variant="vessel"
                      status={status}
                      eyebrow={group.config.label.slice(0, -1)} // 'Captains' → 'Captain'
                      title={captain.fullName}
                      meta={metaParts.join(' · ') || (captain.licenseType ?? undefined)}
                      pill={{ label: pill }}
                      onClick={() => setDetailCaptain(captain)}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* ── Empty state ── */
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

      {/* ── Crew detail sheet ── */}
      {detailCaptain && (
        <>
          {/* Slide-up animation keyframe */}
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
          `}</style>

          {/* Backdrop */}
          <div
            onClick={() => setDetailCaptain(null)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 200,
              background: 'rgba(11, 30, 45, 0.55)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Sheet panel */}
          <div
            style={{
              position: 'fixed',
              bottom: 0, left: 0, right: 0,
              zIndex: 201,
              background: 'var(--color-paper)',
              borderTop: '2px solid var(--color-ink)',
              borderRadius: '6px 6px 0 0',
              /* Slide up animation */
              animation: 'slideUp 260ms cubic-bezier(0.32, 0.72, 0, 1)',
              /* Scroll inside the sheet — NOT on the whole viewport */
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ── Handle + close row ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px 0',
              flexShrink: 0,
            }}>
              {/* Drag handle — centered */}
              <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: 36, height: 4,
                  background: 'var(--color-line-soft)',
                  borderRadius: 'var(--r-pill)',
                }} />
              </div>
              {/* Close button */}
              <button
                onClick={() => setDetailCaptain(null)}
                style={{
                  position: 'absolute', right: 14, top: 10,
                  width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-bone)',
                  border: '1px solid var(--color-line-soft)',
                  borderRadius: 'var(--r-1)',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: 'var(--color-ink-muted)',
                  lineHeight: 1,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* ── Scrollable content — padding-bottom clears bottom nav ── */}
            <div style={{
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '12px 16px',
              /* Clear the 56px bottom nav + 16px buffer + safe area */
              paddingBottom: 'calc(56px + 24px + env(safe-area-inset-bottom, 0px))',
              flex: 1,
            }}>
              <CaptainCard
                captain={detailCaptain}
                operatorBoats={operatorBoats}
                onEdit={c => { handleEdit(c) }}
                onDeactivate={handleDeactivate}
                onBoatLinked={(cid, bid, bname) => {
                  handleBoatLinked(cid, bid, bname)
                  setDetailCaptain(prev => prev ? {
                    ...prev,
                    linkedBoats: [...prev.linkedBoats, { boatId: bid, boatName: bname }],
                  } : null)
                }}
                onBoatUnlinked={(cid, bid) => {
                  handleBoatUnlinked(cid, bid)
                  setDetailCaptain(prev => prev ? {
                    ...prev,
                    linkedBoats: prev.linkedBoats.filter(lb => lb.boatId !== bid),
                  } : null)
                }}
              />
            </div>
          </div>
        </>
      )}


      {/* ── Add/edit form sheet ── */}
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
