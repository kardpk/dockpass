import { MapPin, ExternalLink } from 'lucide-react'
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
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)', padding: 'var(--s-3) var(--s-4)' }}
    >
      {/* Single dense row: icon + marina + slip + maps link */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)' }}>
        <MapPin size={16} strokeWidth={2} style={{ color: 'var(--color-rust)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              {marinaName}
            </p>
            {slipNumber && (
              <span className="badge badge--ok" style={{ fontSize: '10px' }}>
                Slip {slipNumber}
              </span>
            )}
          </div>
          {marinaAddress && (
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
              {marinaAddress}
            </p>
          )}

          {/* Maps link inline */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 6,
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-rust)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} strokeWidth={2} />
            {tr.openMaps}
          </a>
        </div>
      </div>

      {/* Parking if available */}
      {parkingInstructions && (
        <div
          style={{
            marginTop: 'var(--s-2)',
            paddingTop: 'var(--s-2)',
            borderTop: '1px dashed var(--color-line-soft)',
          }}
        >
          <ParkingCollapsible text={parkingInstructions} label={tr.parkingNote} />
        </div>
      )}
    </div>
  )
}
