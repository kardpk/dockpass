import Link from 'next/link'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { TripCreateForm } from './TripCreateForm'
import { ChevronLeft, Ship, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create trip — BoatCheckin',
}

export default async function CreateTripPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Parallel data fetch (boats + captains)
  const [boatsResult, captainsResult] = await Promise.all([
    supabase
      .from('boats')
      .select('id, boat_name, boat_type, max_capacity, charter_type, marina_name, slip_number')
      .eq('operator_id', operator.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('captains')
      .select('id, full_name, photo_url, license_type, license_number, license_expiry, is_default, is_active')
      .eq('operator_id', operator.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('full_name', { ascending: true }),
  ])

  const boats = boatsResult.data ?? []
  const captains = (captainsResult.data ?? []).map(c => ({
    id: c.id as string,
    fullName: c.full_name as string,
    photoUrl: (c.photo_url as string) ?? null,
    licenseType: (c.license_type as string) ?? null,
    licenseNumber: (c.license_number as string) ?? null,
    licenseExpiry: (c.license_expiry as string) ?? null,
    isDefault: c.is_default as boolean,
  }))

  // No boats — show editorial empty state
  if (boats.length === 0) {
    return (
      <div className="max-w-[560px] mx-auto px-5 pb-[100px]">
        {/* Header bar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--s-4) 0',
            borderBottom: 'var(--border-w) solid var(--color-line-soft)',
            marginBottom: 'var(--s-8)',
          }}
        >
          <Link
            href="/dashboard/trips"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-1)', color: 'var(--color-ink)', textDecoration: 'none', fontSize: 'var(--t-body-sm)', fontWeight: 500 }}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
            Back
          </Link>
        </div>

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
          <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>
            Set up a vessel first
          </h2>
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', maxWidth: 280 }}>
            You need at least one active boat profile before creating a trip.
          </p>
          <Link href="/dashboard/boats/new" className="btn btn--rust" style={{ marginTop: 'var(--s-2)' }}>
            Add my boat
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[560px] mx-auto px-5 pb-[100px]">
      {/* ── Header bar ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--s-4) 0',
          borderBottom: 'var(--border-w) solid var(--color-line-soft)',
        }}
      >
        <Link
          href="/dashboard/trips"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-1)', color: 'var(--color-ink)', textDecoration: 'none', fontSize: 'var(--t-body-sm)', fontWeight: 500 }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Back
        </Link>
        <span
          className="font-mono"
          style={{ fontSize: 'var(--t-mono-xs)', letterSpacing: '0.12em', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}
        >
          New trip
        </span>
      </div>

      {/* ── Page heading ───────────────────────────────────── */}
      <div style={{ padding: 'var(--s-6) 0 var(--s-4)' }}>
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(26px, 4vw, 32px)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-ink)', lineHeight: 1.1 }}
        >
          Plan your trip
        </h1>
        <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: 'var(--s-2)' }}>
          One link for your entire guest list — waivers, weather, and check-in.
        </p>
      </div>

      {/* ── Form ────────────────────────────────────────── */}
      <TripCreateForm
        boats={boats}
        operatorName={operator.full_name ?? ''}
        captains={captains}
      />
    </div>
  )
}
