'use client'

import { useState, useTransition, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote, Users, Heart, Fish, Building2, GraduationCap, Anchor,
  Ship, Check, Lock, AlertTriangle, RefreshCw, ArrowRight, Minus, Plus,
} from 'lucide-react'
import { createTrip } from './actions'
import { TripSuccessCard } from './TripSuccessCard'
import { SplitBookingEditor } from './SplitBookingEditor'
import { Switch } from '@/components/ui/Switch'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { TripFormData, TripCreatedResult, SplitBookingEntry, TripPurpose } from '@/types'
import { DURATION_OPTIONS, TRIP_PURPOSE_LABELS } from '@/types'
import { shouldShowConsiderationWarning } from '@/lib/compliance/tripCompliance'

// ─── Icon map (R2 — lucide only, no emojis) ──────────────────────────────────

const ICON_MAP: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Banknote, Users, Heart, Fish, Building2, GraduationCap, Anchor,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Boat {
  id: string
  boat_name: string
  boat_type: string
  max_capacity: number
  charter_type: string
  marina_name: string
  slip_number: string | null
}

interface CaptainPick {
  id: string
  fullName: string
  photoUrl: string | null
  licenseType: string | null
  licenseNumber: string | null
  licenseExpiry: string | null
  isDefault: boolean
}

interface TripCreateFormProps {
  boats: Boat[]
  operatorName: string
  captains?: CaptainPick[]
}

// ─── Section kicker ──────────────────────────────────────────────────────────

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono"
      style={{
        fontSize: 'var(--t-mono-xs)',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        paddingBottom: 'var(--s-3)',
        borderBottom: '1px solid var(--color-line-soft)',
        marginBottom: 'var(--s-4)',
      }}
    >
      {children}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

export function TripCreateForm({ boats, captains = [] }: TripCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TripCreatedResult | null>(null)
  const [error, setError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [splitBookings, setSplitBookings] = useState<SplitBookingEntry[]>([])

  // Captain picker — pre-select default
  const defaultCaptain = captains.find(c => c.isDefault)
  const [selectedCaptainId, setSelectedCaptainId] = useState<string | null>(
    defaultCaptain?.id ?? null
  )

  // ─── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<TripFormData>({
    boatId: boats.length === 1 ? boats[0]!.id : '',
    boatName: boats.length === 1 ? boats[0]!.boat_name : '',
    boatCapacity: boats.length === 1 ? boats[0]!.max_capacity : 0,
    tripDate: '',
    departureTime: '09:00',
    durationHours: 4,
    maxGuests: boats.length === 1 ? boats[0]!.max_capacity : 0,
    bookingType: 'private',
    requiresApproval: false,
    tripCode: generateTripCodeClient(),
    charterType: (boats.length === 1 ? boats[0]!.charter_type : 'captained') as TripFormData['charterType'],
    specialNotes: '',
    splitBookings: [],
    tripPurpose: 'commercial',
    forceFullCompliance: false,
    fuelShareDisclaimerAccepted: false,
  })

  function handleBoatChange(boatId: string) {
    const boat = boats.find((b) => b.id === boatId)
    if (!boat) return
    setForm((prev) => ({
      ...prev,
      boatId,
      boatName: boat.boat_name,
      boatCapacity: boat.max_capacity,
      maxGuests: boat.max_capacity,
      charterType: boat.charter_type as TripFormData['charterType'],
    }))
    setFieldErrors({})
  }

  const todayStr = new Date().toISOString().split('T')[0]!

  // ─── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    startTransition(async () => {
      const res = await createTrip({
        ...form,
        splitBookings: form.bookingType === 'split' ? splitBookings : [],
      })

      if (!res.success) {
        setError(res.error)
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        return
      }

      // Auto-assign captain (non-blocking)
      if (selectedCaptainId && res.data.tripId) {
        fetch(`/api/dashboard/trips/${res.data.tripId}/assign-crew`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captainId: selectedCaptainId, role: 'captain' }),
        }).catch(() => { /* silent — trip created, assignment is best-effort */ })
      }

      setResult(res.data)
    })
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <TripSuccessCard
        result={result}
        onCreateAnother={() => {
          setResult(null)
          setForm((prev) => ({
            ...prev,
            tripDate: '',
            tripCode: generateTripCodeClient(),
            specialNotes: '',
          }))
        }}
        onViewTrip={() => router.push(`/dashboard/trips/${result.tripId}`)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)' }}>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — TRIP TYPE
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionKicker>Trip type</SectionKicker>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s-2)' }}>
          {(Object.entries(TRIP_PURPOSE_LABELS) as [TripPurpose, typeof TRIP_PURPOSE_LABELS[TripPurpose]][]).map(
            ([value, meta]) => {
              const isActive = form.tripPurpose === value
              const IconComponent = ICON_MAP[meta.icon]
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setForm((p) => ({
                      ...p,
                      tripPurpose: value,
                      fuelShareDisclaimerAccepted: value !== 'fishing_social' ? false : p.fuelShareDisclaimerAccepted,
                    }))
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 'var(--s-2)',
                    padding: 'var(--s-3)',
                    background: isActive ? 'var(--color-bone)' : 'var(--color-paper)',
                    border: isActive ? '2px solid var(--color-rust)' : 'var(--border-w) solid var(--color-line-soft)',
                    borderRadius: 'var(--r-1)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: 72,
                    transition: 'border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
                  }}
                >
                  {IconComponent && (
                    <IconComponent
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  )}
                  <div>
                    <div
                      style={{
                        fontSize: 'var(--t-body-sm)',
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                        lineHeight: 1.2,
                      }}
                    >
                      {meta.label}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-ink-muted)',
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {meta.description}
                    </div>
                  </div>
                </button>
              )
            },
          )}
        </div>

        {/* USCG Consideration warning */}
        {shouldShowConsiderationWarning(form.tripPurpose, form.charterType) && (
          <div
            className="alert alert--warn"
            style={{ marginTop: 'var(--s-3)' }}
          >
            <AlertTriangle size={16} strokeWidth={2} />
            <div>
              <strong>USCG Notice:</strong> If you accept <strong>any payment or consideration</strong> for
              this trip, you are legally operating &quot;for-hire&quot; and must comply with commercial
              vessel requirements (OUPV license, drug testing, enhanced equipment).
            </div>
          </div>
        )}

        {/* Fuel-sharing disclaimer for fishing trips */}
        {form.tripPurpose === 'fishing_social' && (
          <div
            className="tile"
            style={{ marginTop: 'var(--s-3)', padding: 'var(--s-4)' }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.fuelShareDisclaimerAccepted}
                onChange={(e) => setForm((p) => ({ ...p, fuelShareDisclaimerAccepted: e.target.checked }))}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: 'var(--color-rust)', flexShrink: 0 }}
              />
              <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                I confirm that this trip involves <strong>only shared expenses</strong> among friends or acquaintances.
                No passenger is paying me for transportation.
              </span>
            </label>
          </div>
        )}

        {/* Force full compliance toggle */}
        {!['commercial', 'corporate'].includes(form.tripPurpose) && (
          <div
            className="tile"
            style={{
              marginTop: 'var(--s-3)',
              padding: 'var(--s-4)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div>
              <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
                Force full compliance
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: 2 }}>
                Require waivers and safety briefing for this trip type
              </p>
            </div>
            <Switch
              checked={form.forceFullCompliance}
              onChange={(v) => setForm((p) => ({ ...p, forceFullCompliance: v }))}
            />
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — VESSEL + CAPTAIN
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionKicker>Vessel</SectionKicker>

        {boats.length === 1 ? (
          <div
            className="tile"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
              padding: 'var(--s-4)',
              borderLeft: '4px solid var(--color-rust)',
            }}
          >
            <Ship size={20} strokeWidth={1.8} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 600, color: 'var(--color-ink)' }}>
                {boats[0]!.boat_name}
              </p>
              <p
                className="font-mono"
                style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}
              >
                {boats[0]!.marina_name} · Up to {boats[0]!.max_capacity} guests
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            {boats.map((boat) => {
              const isActive = form.boatId === boat.id
              return (
                <button
                  key={boat.id}
                  type="button"
                  onClick={() => handleBoatChange(boat.id)}
                  className="tile"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
                    padding: 'var(--s-4)',
                    cursor: 'pointer',
                    borderLeft: isActive ? '4px solid var(--color-rust)' : '4px solid transparent',
                    background: isActive ? 'var(--color-bone)' : 'var(--color-paper)',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
                  }}
                >
                  <Ship size={20} strokeWidth={1.8} style={{ color: isActive ? 'var(--color-rust)' : 'var(--color-ink-muted)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 600, color: 'var(--color-ink)' }}>
                      {boat.boat_name}
                    </p>
                    <p
                      className="font-mono"
                      style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}
                    >
                      {boat.marina_name} · Up to {boat.max_capacity} guests
                    </p>
                  </div>
                  {isActive && <Check size={18} strokeWidth={2.5} style={{ color: 'var(--color-rust)', flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>
        )}
        {fieldErrors.boatId && (
          <p className="field-error" style={{ marginTop: 'var(--s-2)' }}>{fieldErrors.boatId[0]}</p>
        )}

        {/* ── Captain picker ───────────────────────────────────────────── */}
        {captains.length > 0 && form.charterType !== 'bareboat' && (
          <div style={{ marginTop: 'var(--s-6)' }}>
            <SectionKicker>Captain</SectionKicker>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
              {captains.map(captain => {
                const isActive = selectedCaptainId === captain.id
                return (
                  <button
                    key={captain.id}
                    type="button"
                    onClick={() => setSelectedCaptainId(isActive ? null : captain.id)}
                    className="tile"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
                      padding: 'var(--s-3) var(--s-4)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '4px solid var(--color-rust)' : '4px solid transparent',
                      background: isActive ? 'var(--color-bone)' : 'var(--color-paper)',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
                    }}
                  >
                    {captain.photoUrl ? (
                      <img
                        src={captain.photoUrl} alt=""
                        style={{ width: 36, height: 36, borderRadius: 'var(--r-pill)', objectFit: 'cover', border: 'var(--border-w) solid var(--color-line-soft)' }}
                      />
                    ) : (
                      <div
                        className="avatar avatar--sm"
                        style={{
                          width: 36, height: 36, borderRadius: 'var(--r-pill)',
                          background: 'var(--color-bone-warm)', border: 'var(--border-w) solid var(--color-line-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: 'var(--color-ink)',
                        }}
                      >
                        {captain.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                        {captain.fullName}
                        {captain.isDefault && (
                          <span className="pill pill--ghost" style={{ fontSize: '9px' }}>DEFAULT</span>
                        )}
                      </p>
                      {captain.licenseType && (
                        <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}>
                          {captain.licenseType}
                        </p>
                      )}
                    </div>
                    {isActive && <Check size={18} strokeWidth={2.5} style={{ color: 'var(--color-rust)', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: 'var(--s-2)' }}>
              Captain will be assigned to this trip.{' '}
              <a href="/dashboard/captains" className="editorial-link" style={{ fontSize: '11px' }}>Manage roster</a>
            </p>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — SCHEDULE
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionKicker>Schedule</SectionKicker>

        {/* Date + Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-4)' }}>
          <div className="field">
            <label htmlFor="tripDate" className="field-label">Date</label>
            <input
              id="tripDate"
              type="date"
              min={todayStr}
              value={form.tripDate}
              onChange={(e) => setForm((p) => ({ ...p, tripDate: e.target.value }))}
              className={cn('field-input', fieldErrors.tripDate && 'field-input--error')}
              required
            />
            {fieldErrors.tripDate && (
              <span className="field-error">{fieldErrors.tripDate[0]}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="departureTime" className="field-label">Departure</label>
            <input
              id="departureTime"
              type="time"
              step="900"
              value={form.departureTime}
              onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))}
              className="field-input"
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div style={{ marginTop: 'var(--s-5)' }}>
          <label className="field-label" style={{ marginBottom: 'var(--s-3)', display: 'block' }}>Duration</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
            {DURATION_OPTIONS.map((opt) => {
              const isActive = opt.value === 0 ? showCustomDuration : form.durationHours === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (opt.value === 0) {
                      setShowCustomDuration(true)
                      setForm((p) => ({ ...p, durationHours: 0 }))
                    } else {
                      setShowCustomDuration(false)
                      setForm((p) => ({ ...p, durationHours: opt.value }))
                    }
                  }}
                  className="font-mono"
                  style={{
                    padding: 'var(--s-2) var(--s-4)',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderRadius: 'var(--r-1)',
                    border: isActive ? '2px solid var(--color-ink)' : 'var(--border-w) solid var(--color-line-soft)',
                    background: isActive ? 'var(--color-ink)' : 'var(--color-paper)',
                    color: isActive ? 'var(--color-bone)' : 'var(--color-ink)',
                    cursor: 'pointer',
                    minHeight: 40,
                    transition: 'all var(--dur-fast) var(--ease)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {showCustomDuration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', marginTop: 'var(--s-3)' }}>
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                placeholder="7"
                value={form.durationHours || ''}
                onChange={(e) => setForm((p) => ({ ...p, durationHours: Number(e.target.value) }))}
                className="field-input font-mono"
                style={{ width: 100, textAlign: 'center' }}
                autoFocus
              />
              <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)' }}>hours</span>
            </div>
          )}
          {fieldErrors.durationHours && (
            <span className="field-error">{fieldErrors.durationHours[0]}</span>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — GUESTS + BOOKING
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionKicker>Guests</SectionKicker>

        {/* Guest stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center',
              border: 'var(--border-w) solid var(--color-ink)',
              borderRadius: 'var(--r-2)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, maxGuests: Math.max(1, p.maxGuests - 1) }))}
              style={{
                width: 48, height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-paper)', border: 'none', cursor: 'pointer',
                color: 'var(--color-ink)',
              }}
              aria-label="Decrease guests"
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
            <input
              type="number"
              min="1"
              max={form.boatCapacity || 500}
              value={form.maxGuests}
              onChange={(e) => setForm((p) => ({ ...p, maxGuests: Math.min(Number(e.target.value), p.boatCapacity || 500) }))}
              className="font-mono"
              style={{
                width: 56, height: 48, textAlign: 'center',
                fontSize: '18px', fontWeight: 700, color: 'var(--color-ink)',
                border: 'none', outline: 'none', background: 'transparent',
                borderLeft: '1px solid var(--color-line-soft)',
                borderRight: '1px solid var(--color-line-soft)',
              }}
            />
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, maxGuests: Math.min(p.maxGuests + 1, p.boatCapacity || 500) }))}
              style={{
                width: 48, height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--color-paper)', border: 'none', cursor: 'pointer',
                color: 'var(--color-ink)',
              }}
              aria-label="Increase guests"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
          {form.boatCapacity > 0 && (
            <span className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}>
              Max {form.boatCapacity} for this vessel
            </span>
          )}
        </div>
        {fieldErrors.maxGuests && (
          <span className="field-error">{fieldErrors.maxGuests[0]}</span>
        )}

        {/* Booking type */}
        <div style={{ marginTop: 'var(--s-5)' }}>
          <label className="field-label" style={{ marginBottom: 'var(--s-3)', display: 'block' }}>Booking type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
            {[
              { value: 'private' as const, icon: Lock, title: 'Private charter', body: 'One group, one link' },
              { value: 'split' as const, icon: Users, title: 'Split charter', body: 'Multiple separate groups' },
            ].map((opt) => {
              const isActive = form.bookingType === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, bookingType: opt.value }))}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 'var(--s-2)',
                    padding: 'var(--s-4)',
                    background: isActive ? 'var(--color-bone)' : 'var(--color-paper)',
                    border: isActive ? '2px solid var(--color-rust)' : 'var(--border-w) solid var(--color-line-soft)',
                    borderRadius: 'var(--r-1)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)',
                  }}
                >
                  <opt.icon size={18} strokeWidth={2} />
                  <div>
                    <div style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>{opt.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: 2 }}>{opt.body}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Split booking editor */}
        {form.bookingType === 'split' && (
          <div style={{ marginTop: 'var(--s-4)' }}>
            <SplitBookingEditor
              entries={splitBookings}
              onChange={setSplitBookings}
              maxTotalGuests={form.maxGuests}
            />
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — OPTIONS
          ══════════════════════════════════════════════════════════════════ */}
      <section>
        <SectionKicker>Options</SectionKicker>

        {/* Manual approval toggle */}
        <div
          className="tile"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--s-4)',
          }}
        >
          <div>
            <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
              Manual approval
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: 2 }}>
              Review each guest before they are confirmed
            </p>
          </div>
          <Switch
            checked={form.requiresApproval}
            onChange={(v) => setForm((p) => ({ ...p, requiresApproval: v }))}
          />
        </div>

        {/* Trip code */}
        <div className="field" style={{ marginTop: 'var(--s-5)' }}>
          <label className="field-label" htmlFor="tripCode">
            Trip code
            <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.06em', marginLeft: 'var(--s-2)', opacity: 0.7 }}>
              Guests enter this to check in
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
            <input
              id="tripCode"
              type="text"
              maxLength={4}
              value={form.tripCode}
              onChange={(e) => setForm((p) => ({ ...p, tripCode: e.target.value.toUpperCase().slice(0, 4) }))}
              className="field-input font-mono"
              style={{
                width: 100, textAlign: 'center',
                fontSize: '22px', fontWeight: 700,
                letterSpacing: '0.15em',
              }}
              placeholder="SUN4"
            />
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, tripCode: generateTripCodeClient() }))}
              className="btn btn--sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}
            >
              <RefreshCw size={13} strokeWidth={2.5} />
              Regenerate
            </button>
          </div>
          {fieldErrors.tripCode && (
            <span className="field-error">{fieldErrors.tripCode[0]}</span>
          )}
        </div>

        {/* Special notes */}
        <div className="field" style={{ marginTop: 'var(--s-5)' }}>
          <label className="field-label" htmlFor="specialNotes">
            Notes
            <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.06em', marginLeft: 'var(--s-2)', opacity: 0.7 }}>
              Optional
            </span>
          </label>
          <textarea
            id="specialNotes"
            rows={3}
            maxLength={500}
            value={form.specialNotes}
            onChange={(e) => setForm((p) => ({ ...p, specialNotes: e.target.value }))}
            placeholder="Corporate event, birthday celebration, sunset route"
            className="field-input"
            style={{ resize: 'none', minHeight: 80 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--s-1)' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '10px',
                color: form.specialNotes.length > 450 ? 'var(--color-status-err)' : 'var(--color-ink-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {form.specialNotes.length} / 500
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          GLOBAL ERROR + SUBMIT
          ══════════════════════════════════════════════════════════════════ */}
      {error && (
        <div className="alert alert--err">
          <AlertTriangle size={16} strokeWidth={2} />
          <div><strong>{error}</strong></div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !form.boatId || !form.tripDate}
        className="btn btn--rust btn--lg"
        style={{
          width: '100%',
          justifyContent: 'center',
          height: 52,
          opacity: (isPending || !form.boatId || !form.tripDate) ? 0.4 : 1,
          cursor: (isPending || !form.boatId || !form.tripDate) ? 'not-allowed' : 'pointer',
        }}
      >
        {isPending ? (
          <AnchorLoader size="sm" color="white" />
        ) : (
          <>
            Generate trip link
            <ArrowRight size={14} strokeWidth={2.5} />
          </>
        )}
      </button>
    </form>
  )
}

// ─── Client-side trip code generator ─────────────────────────────────────────
function generateTripCodeClient(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]!,
  ).join('')
}
