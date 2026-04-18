import { MapPin, ExternalLink, Car } from 'lucide-react'
import { ParkingCollapsible } from './ParkingCollapsible'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface FindDockSectionProps {
  marinaName: string
  marinaAddress: string
  slipNumber: string | null
  parkingInstructions: string | null
  operatingArea: string | null
  lat: number | null
  lng: number | null
  tr: TripT
}

export function FindDockSection({
  marinaName,
  marinaAddress,
  slipNumber,
  parkingInstructions,
  operatingArea,
  lat,
  lng,
  tr,
}: FindDockSectionProps) {
  const mapsUrl = lat && lng
    ? `https://maps.google.com/?q=${lat},${lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(marinaAddress || marinaName)}`

  return (
    <div
      className="tile"
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
        <MapPin size={16} strokeWidth={2} style={{ color: 'var(--color-rust)' }} />
        <span
          className="font-mono"
          style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: 'var(--color-ink-muted)',
          }}
        >
          {tr.findDock}
        </span>
      </div>

      {/* Marina info */}
      <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 700, color: 'var(--color-ink)' }}>
        {marinaName}
      </p>
      {marinaAddress && (
        <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: 'var(--s-1)' }}>
          {marinaAddress}
        </p>
      )}

      {/* Slip badge */}
      {slipNumber && (
        <span className="badge badge--ok" style={{ marginTop: 'var(--s-2)', display: 'inline-flex' }}>
          {tr.slip} {slipNumber}
        </span>
      )}

      {/* Open in Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 'var(--s-3)',
          display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
          minHeight: 44,
          fontSize: 'var(--t-body-sm)',
          fontWeight: 600,
          color: 'var(--color-ink)',
          textDecoration: 'none',
        }}
      >
        <ExternalLink size={14} strokeWidth={2} />
        {tr.openMaps}
      </a>

      {/* Parking collapsible */}
      {parkingInstructions && (
        <div
          style={{
            marginTop: 'var(--s-3)',
            paddingTop: 'var(--s-3)',
            borderTop: '1px dashed var(--color-line-soft)',
          }}
        >
          <ParkingCollapsible text={parkingInstructions} label={tr.parkingNote} />
        </div>
      )}

      {/* Operating area */}
      {operatingArea && (
        <p style={{ marginTop: 'var(--s-3)', fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)' }}>
          Operating area: {operatingArea}
        </p>
      )}
    </div>
  )
}
