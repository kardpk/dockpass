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
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)', padding: 'var(--s-3) var(--s-4)' }}
    >
      {/* Single dense row: photo + name + badges + meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
        {/* Photo / initials — compact */}
        {captainPhotoUrl ? (
          <Image
            src={captainPhotoUrl}
            alt={captainName}
            width={44}
            height={44}
            className="object-cover"
            style={{ width: 44, height: 44, borderRadius: 'var(--r-1)', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 44, height: 44,
              borderRadius: 'var(--r-1)',
              background: 'var(--color-bone)',
              border: '1px solid var(--color-line-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', fontWeight: 700,
              color: 'var(--color-ink)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
              {captainName}
            </p>
            {captainLicense && (
              <span className="badge" style={{ fontSize: '10px' }}>
                <Shield size={9} strokeWidth={2.5} />
                {tr.uscgLicensed}
              </span>
            )}
          </div>

          {/* Compact meta line */}
          <div
            className="font-mono"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
              marginTop: 3,
              fontSize: '11px',
              color: 'var(--color-ink-muted)',
              flexWrap: 'wrap',
            }}
          >
            {captainTripCount != null && (
              <span>{captainTripCount} {tr.trips}</span>
            )}
            {captainYearsExp != null && (
              <span>{captainYearsExp} {tr.yearsExp}</span>
            )}
            {captainLanguages.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Globe size={10} strokeWidth={2} />
                {captainLanguages.map(lang =>
                  LANGUAGE_FLAGS[lang as keyof typeof LANGUAGE_FLAGS] ?? lang
                ).join(' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
