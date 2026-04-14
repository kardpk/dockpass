'use client'

import { useState } from 'react'
import { Check, X, Trash2, ChevronDown, ChevronUp, Anchor, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { LANGUAGE_FLAGS } from '@/lib/i18n/constants'
import { useTripGuests } from '@/hooks/useTripGuests'
import { RealtimeIndicator } from './RealtimeIndicator'
import type { DashboardGuest } from '@/types'

interface GuestManagementTableProps {
  tripId: string
  initialGuests: DashboardGuest[]
  maxGuests: number
  requiresApproval: boolean
}

export function GuestManagementTable({
  tripId, initialGuests, maxGuests, requiresApproval,
}: GuestManagementTableProps) {
  const { guests, connectionStatus, lastUpdated } = useTripGuests(tripId, initialGuests)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)
  const [liveryVerifyId, setLiveryVerifyId] = useState<string | null>(null)
  const [liveryVerifierName, setLiveryVerifierName] = useState('')

  const total = guests.length
  const signed = guests.filter(g => g.waiverSigned).length
  const pendingApproval = guests.filter(
    g => g.approvalStatus === 'pending'
  ).length
  const pendingLivery = guests.filter(
    g => g.approvalStatus === 'pending_livery_briefing'
  ).length

  async function verifyLiveryBriefing(guestId: string) {
    if (!liveryVerifierName.trim()) return
    setActioning(guestId)
    try {
      await fetch(
        `/api/dashboard/guests/${guestId}/verify-livery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verifierName: liveryVerifierName.trim() }),
        }
      )
      setLiveryVerifyId(null)
      setLiveryVerifierName('')
    } finally {
      setActioning(null)
    }
  }

  async function approve(guestId: string) {
    setActioning(guestId)
    try {
      await fetch(
        `/api/dashboard/guests/${guestId}/approve`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approved' }),
        }
      )
      // Realtime subscription will push the update
    } finally {
      setActioning(null)
    }
  }

  async function decline(guestId: string) {
    setActioning(guestId)
    try {
      await fetch(
        `/api/dashboard/guests/${guestId}/approve`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'declined' }),
        }
      )
      // Realtime subscription will push the update
    } finally {
      setActioning(null)
    }
  }

  async function remove(guestId: string) {
    if (!confirm('Remove this guest from the trip?')) return
    setActioning(guestId)
    try {
      await fetch(
        `/api/dashboard/guests/${guestId}/remove`,
        { method: 'DELETE' }
      )
      // Realtime subscription will push the update
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="
      bg-white rounded-[20px] border border-[#D0E2F3]
      shadow-[0_1px_4px_rgba(12,68,124,0.06)]
      overflow-hidden
    ">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
            Guests
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-[#0C447C]">
              {total} / {maxGuests}
            </span>
            <RealtimeIndicator status={connectionStatus} />
            {lastUpdated && (
              <span className="text-[11px] text-[#6B7C93]">
                Updated {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            )}
            {pendingApproval > 0 && (
              <span className="
                text-[11px] font-semibold px-2 py-0.5
                rounded-full bg-[#FEF3DC] text-[#E5910A]
              ">
                {pendingApproval} pending approval
              </span>
            )}
            {pendingLivery > 0 && (
              <span className="
                text-[11px] font-semibold px-2 py-0.5
                rounded-full bg-[#FFF8E1] text-[#92400E]
              ">
                ⚓ {pendingLivery} livery briefing
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 w-full h-1.5 bg-[#E8F2FB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${Math.min((total / maxGuests) * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-[#6B7C93]">
            {signed} waiver{signed !== 1 ? 's' : ''} signed
          </span>
          {total - signed > 0 && (
            <span className="text-[11px] text-[#E5910A]">
              {total - signed} pending
            </span>
          )}
        </div>
      </div>

      {/* Guest list */}
      {guests.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[15px] text-[#6B7C93]">
            No guests yet
          </p>
          <p className="text-[13px] text-[#6B7C93] mt-1">
            Share the trip link to start receiving check-ins
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F8FC]">
          {guests.map(guest => (
            <div
              key={guest.id}
              className={cn(
                'transition-colors',
                guest.approvalStatus === 'pending_livery_briefing'
                  ? 'bg-[#FFFBEB]'
                  : guest.approvalStatus === 'pending'
                  ? 'bg-[#FEF9EE]'
                  : guest.approvalStatus === 'declined'
                  ? 'bg-[#FFF4F4]'
                  : 'bg-white hover:bg-[#F5F8FC]'
              )}
            >
              {/* Guest row */}
              <div className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="
                    w-9 h-9 rounded-full bg-[#E8F2FB]
                    flex items-center justify-center
                    text-[12px] font-bold text-[#0C447C]
                    flex-shrink-0
                  ">
                    {guest.fullName.split(' ')
                      .map(n => n[0]).join('').slice(0, 2)}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="
                        text-[14px] font-medium text-[#0D1B2A]
                        truncate
                      ">
                        {guest.fullName}
                      </span>
                      <span className="text-[14px] flex-shrink-0">
                        {LANGUAGE_FLAGS[guest.languagePreference as keyof typeof LANGUAGE_FLAGS] ?? '🌐'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Waiver status — Firma vs Legacy */}
                      {guest.waiverTextHash === 'firma_template' ? (
                        <span className="text-[11px] font-medium text-[#0C447C]">
                          📝 Firma
                        </span>
                      ) : guest.waiverSigned ? (
                        <span className="text-[11px] font-medium text-[#1D9E75]">
                          ✓ Signed
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#E5910A]">
                          ⏳ Pending
                        </span>
                      )}

                      {/* Safety card counter */}
                      <span className={cn(
                        'text-[11px] font-medium',
                        (guest.safetyAcknowledgments?.length ?? 0) > 0 ? 'text-[#1D9E75]' : 'text-[#6B7C93]'
                      )}>
                        🛡 {guest.safetyAcknowledgments?.length ?? 0} cards
                      </span>

                      {/* Addon emojis */}
                      {guest.addonOrders.length > 0 && (
                        <span className="text-[13px]">
                          {guest.addonOrders.map(o => o.emoji).join('')}
                        </span>
                      )}

                      {/* Flags */}
                      {guest.isNonSwimmer && (
                        <span className="text-[11px] bg-[#FDEAEA] text-[#D63B3B] px-1.5 py-0.5 rounded-full">
                          Non-swimmer
                        </span>
                      )}
                      {guest.dietaryRequirements && (
                        <span className="text-[11px] bg-[#FEF3DC] text-[#E5910A] px-1.5 py-0.5 rounded-full truncate max-w-[80px]">
                          {guest.dietaryRequirements}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {requiresApproval && guest.approvalStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => approve(guest.id)}
                          disabled={actioning === guest.id}
                          className="
                            w-8 h-8 rounded-full bg-[#E8F9F4]
                            flex items-center justify-center
                            text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white
                            transition-colors disabled:opacity-40
                          "
                          aria-label="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => decline(guest.id)}
                          disabled={actioning === guest.id}
                          className="
                            w-8 h-8 rounded-full bg-[#FDEAEA]
                            flex items-center justify-center
                            text-[#D63B3B] hover:bg-[#D63B3B] hover:text-white
                            transition-colors disabled:opacity-40
                          "
                          aria-label="Decline"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}

                    {/* Livery briefing verify button */}
                    {guest.approvalStatus === 'pending_livery_briefing' && (
                      <button
                        onClick={() => {
                          setLiveryVerifyId(liveryVerifyId === guest.id ? null : guest.id)
                          setLiveryVerifierName('')
                        }}
                        disabled={actioning === guest.id}
                        className="
                          flex items-center gap-1.5 px-3 py-1.5
                          rounded-full bg-[#FFF8E1] border border-[#FFD54F]
                          text-[12px] font-semibold text-[#92400E]
                          hover:bg-[#FFECB3] transition-colors
                          disabled:opacity-40
                        "
                        aria-label="Verify livery briefing"
                      >
                        <Anchor size={12} />
                        Verify Briefing
                      </button>
                    )}

                    {/* Show verified badge */}
                    {guest.approvalStatus === 'approved' && guest.liveryBriefingVerifiedAt && (
                      <span className="text-[11px] font-medium text-[#1D9E75] bg-[#E8F9F4] px-2 py-1 rounded-full">
                        ✅ Briefed by {guest.liveryBriefingVerifiedBy}
                      </span>
                    )}

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpanded(
                        expanded === guest.id ? null : guest.id
                      )}
                      className="
                        w-8 h-8 rounded-full
                        flex items-center justify-center
                        text-[#6B7C93] hover:bg-[#F5F8FC]
                      "
                      aria-label="Toggle details"
                    >
                      {expanded === guest.id
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />
                      }
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === guest.id && (
                  <>
                  <div className="mt-3 pl-12 space-y-1.5">
                    {guest.dietaryRequirements && (
                      <p className="text-[12px] text-[#6B7C93]">
                        <span className="font-medium">Dietary:</span>{' '}
                        {guest.dietaryRequirements}
                      </p>
                    )}
                    {guest.waiverSignedAt && (
                      <p className="text-[12px] text-[#6B7C93]">
                        <span className="font-medium">Waiver signed:</span>{' '}
                        {new Date(guest.waiverSignedAt).toLocaleString()}
                      </p>
                    )}
                    {guest.addonOrders.length > 0 && (
                      <div className="text-[12px] text-[#6B7C93]">
                        <span className="font-medium">Add-ons:</span>{' '}
                        {guest.addonOrders.map(o =>
                          `${o.emoji} ${o.addonName} ×${o.quantity}`
                        ).join(', ')}
                      </div>
                    )}
                    <button
                      onClick={() => remove(guest.id)}
                      disabled={actioning === guest.id}
                      className="
                        flex items-center gap-1.5 text-[12px]
                        text-[#D63B3B] hover:underline mt-1
                        disabled:opacity-40
                      "
                    >
                      <Trash2 size={12} />
                      Remove from trip
                    </button>

                    {/* FWC license link */}
                    {guest.fwcLicenseUrl && (
                      <a
                        href={guest.fwcLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12px] text-[#0C447C] hover:underline"
                      >
                        <ExternalLink size={10} />
                        View FWC Boater Safety ID
                      </a>
                    )}
                  </div>

                  {/* Livery verify inline confirmation */}
                  {liveryVerifyId === guest.id && (
                    <div className="mt-3 pl-12 p-3 bg-[#FFF8E1] border border-[#FFD54F] rounded-[10px] space-y-2">
                      <p className="text-[12px] text-[#92400E] leading-relaxed">
                        <strong>I confirm</strong> I have briefed <strong>{guest.fullName}</strong> on 
                        vessel operation, safety equipment locations, and emergency procedures 
                        for this specific hull.
                      </p>
                      <input
                        type="text"
                        placeholder="Your name (Dockmaster / Operator)"
                        value={liveryVerifierName}
                        onChange={e => setLiveryVerifierName(e.target.value)}
                        className="w-full h-[40px] px-3 rounded-[8px] text-[13px] border border-[#FFD54F] bg-white text-[#0D1B2A] placeholder:text-[#6B7C93] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => verifyLiveryBriefing(guest.id)}
                          disabled={!liveryVerifierName.trim() || actioning === guest.id}
                          className="flex-1 h-[36px] rounded-[8px] bg-[#1D9E75] text-white text-[13px] font-semibold hover:bg-[#178a65] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ✓ Confirm Vessel Briefing
                        </button>
                        <button
                          onClick={() => setLiveryVerifyId(null)}
                          className="h-[36px] px-4 rounded-[8px] bg-white border border-[#D0E2F3] text-[13px] text-[#6B7C93] hover:bg-[#F5F8FC]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
