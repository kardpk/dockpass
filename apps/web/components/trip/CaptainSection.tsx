import Image from 'next/image'
import { Shield, Globe } from 'lucide-react'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface CaptainSectionProps {
  captainName: string
  captainPhotoUrl: string | null
  captainBio: string | null
  captainLicense: string | null
  captainLanguages: string[]
  captainYearsExp: number | null
  captainTripCount: number | null
  captainRating: number | null
  captainCertifications: string[]
  tr: TripT
}

export function CaptainSection({
  captainName,
  captainPhotoUrl,
  captainLicense,
  captainLanguages,
  captainYearsExp,
  captainTripCount,
  tr,
}: CaptainSectionProps) {
  const initials = captainName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="tile"
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}
    >
      {/* Kicker */}
      <span
        className="font-mono"
        style={{
          fontSize: '11px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase' as const,
          color: 'var(--color-ink-muted)',
          display: 'block',
          marginBottom: 'var(--s-3)',
        }}
      >
        {tr.captain}
      </span>

      {/* Profile row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
        {/* Photo / initials */}
        {captainPhotoUrl ? (
          <Image
            src={captainPhotoUrl}
            alt={captainName}
            width={56}
            height={56}
            className="object-cover"
            style={{ width: 56, height: 56, borderRadius: 'var(--r-1)' }}
          />
        ) : (
          <div
            style={{
              width: 56, height: 56,
              borderRadius: 'var(--r-1)',
              background: 'var(--color-bone)',
              border: '1px solid var(--color-line-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 700,
              color: 'var(--color-ink)',
            }}
          >
            {initials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 700, color: 'var(--color-ink)' }}>
            {captainName}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginTop: 'var(--s-1)', flexWrap: 'wrap' }}>
            {captainLicense && (
              <span className="badge">
                <Shield size={10} strokeWidth={2.5} />
                {tr.uscgLicensed}
              </span>
            )}
            {captainTripCount != null && (
              <span className="font-mono" style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                {captainTripCount} {tr.trips}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compact meta row */}
      <div
        className="font-mono"
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
          marginTop: 'var(--s-3)',
          paddingTop: 'var(--s-3)',
          borderTop: '1px dashed var(--color-line-soft)',
          fontSize: '12px',
          color: 'var(--color-ink-muted)',
          flexWrap: 'wrap',
        }}
      >
        {captainYearsExp != null && (
          <span>{captainYearsExp} {tr.yearsExp}</span>
        )}
        {captainLanguages.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={11} strokeWidth={2} />
            {captainLanguages.map(lang =>
              LANGUAGE_FLAGS[lang as keyof typeof LANGUAGE_FLAGS] ?? lang
            ).join(' ')}
          </span>
        )}
      </div>
    </div>
  )
}
