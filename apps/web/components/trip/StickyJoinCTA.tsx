'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { JoinFlowSheet } from '@/components/join/JoinFlowSheet'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface TripDataForJoin {
  boatName: string
  marinaName: string
  slipNumber: string | null
  captainName: string | null
  tripDate: string
  departureTime: string
  durationHours: number
  charterType: 'captained' | 'bareboat' | 'both'
  tripPurpose: string
  addons: {
    id: string
    name: string
    description: string | null
    emoji: string
    priceCents: number
    maxQuantity: number
  }[]
  isEU: boolean
  // Self-drive qualification settings
  requiresQualification: boolean
  requiresBoaterCard: boolean
  minExperienceYears: number
  requiresBoatOwnership: boolean
  qualificationNotes: string | null
}

interface StickyJoinCTAProps {
  tripSlug: string
  tripCode: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  isFull: boolean
  guestCount: number
  maxGuests: number
  requiresApproval: boolean
  currentLang: string
  tripData: TripDataForJoin
  tr: TripT
}

export function StickyJoinCTA({
  tripSlug,
  status,
  isFull,
  guestCount,
  maxGuests,
  requiresApproval,
  currentLang,
  tripData,
  tr,
}: StickyJoinCTAProps) {
  const [joinOpen, setJoinOpen] = useState(false)

  const isActive = status === 'active'
  const isDisabled = isFull && !isActive

  return (
    <>
      {/* Fixed bottom bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          background: 'var(--color-paper)',
          borderTop: 'var(--border-w) solid var(--color-ink)',
          padding: 'var(--s-4) var(--s-5)',
          paddingBottom: 'calc(var(--s-4) + env(safe-area-inset-bottom))',
        }}
      >
        {/* Active trip banner */}
        {isActive && (
          <div className="alert alert--ok" style={{ marginBottom: 'var(--s-3)', justifyContent: 'center' }}>
            {tr.activeBanner}
          </div>
        )}

        {/* Guest count */}
        <p
          className="font-mono"
          style={{
            fontSize: '12px',
            color: 'var(--color-ink-muted)',
            textAlign: 'center',
            marginBottom: 'var(--s-3)',
            letterSpacing: '0.04em',
          }}
        >
          {tr.guestCount.replace('{n}', guestCount.toString()).replace('{max}', maxGuests.toString())}
        </p>

        {/* CTA button */}
        <button
          onClick={() => !isDisabled && setJoinOpen(true)}
          disabled={isDisabled}
          className={
            isDisabled
              ? 'btn btn--ghost'
              : isActive
                ? 'btn btn--primary'
                : 'btn btn--ink'
          }
          style={{
            width: '100%',
            height: 52,
            fontSize: '16px',
            fontWeight: 700,
            justifyContent: 'center',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.5 : 1,
          }}
        >
          {isDisabled
            ? tr.joinCtaFull
            : isActive
              ? tr.joinCtaActive
              : tr.joinCta}
          {!isDisabled && <ArrowRight size={16} strokeWidth={2.5} />}
        </button>

        {/* Approval note */}
        {requiresApproval && !isDisabled && (
          <p
            className="font-mono"
            style={{
              fontSize: '11px',
              color: 'var(--color-ink-muted)',
              textAlign: 'center',
              marginTop: 'var(--s-2)',
              letterSpacing: '0.04em',
            }}
          >
            Subject to approval
          </p>
        )}
      </div>

      {/* Join flow sheet */}
      <JoinFlowSheet
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
        tripSlug={tripSlug}
        tripData={tripData}
        currentLang={currentLang}
      />
    </>
  )
}
