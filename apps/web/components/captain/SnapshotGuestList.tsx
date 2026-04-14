'use client'

import { useRef, useState } from 'react'
import { Anchor, Phone, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface GuestRow {
  id: string
  fullName: string
  dateOfBirth: string | null
  waiverSigned: boolean
  waiverTextHash: string | null
  safetyAckCount: number
  languageFlag: string
  addonEmojis: string[]
  approvalStatus: string
  fwcLicenseUrl: string | null
  liveryBriefingVerifiedAt: string | null
  liveryBriefingVerifiedBy: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  dietaryRequirements?: string | null
  isNonSwimmer?: boolean
}

export function SnapshotGuestList({
  guests, maxGuests, captainToken,
}: {
  guests: GuestRow[]
  maxGuests: number
  captainToken?: string
}) {
  const signed = guests.filter(g => g.waiverSigned).length
  const pendingLivery = guests.filter(g => g.approvalStatus === 'pending_livery_briefing').length
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetGuest, setTargetGuest] = useState<string | null>(null)
  const [liveryVerifyId, setLiveryVerifyId] = useState<string | null>(null)
  const [liveryVerifierName, setLiveryVerifierName] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null)

  const handleUploadClick = (guestId: string) => {
    setTargetGuest(guestId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !targetGuest) return

    setUploadingId(targetGuest)
    console.log(`Uploading paper waiver for ${targetGuest}...`)
    await new Promise(r => setTimeout(r, 1000))
    setUploadingId(null)
    setTargetGuest(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function verifyLiveryBriefing(guestId: string) {
    if (!liveryVerifierName.trim() || !captainToken) return
    setActioning(guestId)
    try {
      await fetch(
        `/api/captain/${captainToken}/verify-livery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId,
            verifierName: liveryVerifierName.trim(),
          }),
        }
      )
      setLiveryVerifyId(null)
      setLiveryVerifierName('')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="
      bg-white rounded-[20px] overflow-hidden
      border border-[#D0E2F3]
    ">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
            Passengers
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-[#0C447C]">
              {guests.length} checked in · {signed} signed
            </span>
            {pendingLivery > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF8E1] text-[#92400E]">
                ⚓ {pendingLivery} livery
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Guest rows */}
      {guests.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[15px] text-[#6B7C93]">No guests yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F8FC]">
          {guests.map(guest => (
            <div
              key={guest.id}
              className={cn(
                'px-5 py-3 transition-colors cursor-pointer',
                guest.approvalStatus === 'pending_livery_briefing'
                  ? 'bg-[#FFFBEB]'
                  : guest.waiverSigned
                  ? ''
                  : 'bg-[#FEF9EE]',
                expandedGuestId === guest.id && 'bg-[#F5F8FC]'
              )}
            >
              <div
                className="flex items-center gap-3"
                onClick={() => setExpandedGuestId(
                  expandedGuestId === guest.id ? null : guest.id
                )}
              >
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

                {/* Name + expand indicator */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="text-[14px] font-medium text-[#0D1B2A] truncate">
                    {guest.fullName}
                  </span>
                  <ChevronDown
                    size={12}
                    className={cn(
                      'text-[#6B7C93] transition-transform flex-shrink-0',
                      expandedGuestId === guest.id && 'rotate-180'
                    )}
                  />
                </div>

                {/* Language + addons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[14px]">{guest.languageFlag}</span>
                  {guest.addonEmojis.length > 0 && (
                    <span className="text-[13px]">
                      {guest.addonEmojis.join('')}
                    </span>
                  )}
                  <div className="flex flex-col items-end gap-1">
                    {/* Livery badge */}
                    {guest.approvalStatus === 'pending_livery_briefing' ? (
                      <span className="text-[11px] font-bold text-[#92400E] bg-[#FFF8E1] px-1.5 py-0.5 rounded-full">
                        ⚓ Briefing Required
                      </span>
                    ) : guest.liveryBriefingVerifiedAt ? (
                      <span className="text-[11px] font-bold text-[#1D9E75]">
                        ✅ Briefed
                      </span>
                    ) : null}

                    {/* Waiver status */}
                    {guest.waiverTextHash === 'firma_template' ? (
                      <span className="text-[12px] font-bold text-[#0C447C]">
                        📝 Firma
                      </span>
                    ) : guest.waiverSigned ? (
                      <span className="text-[12px] font-bold text-[#1D9E75]">
                        ✓ Signed
                      </span>
                    ) : (
                      <span className="text-[12px] font-bold text-[#E5910A]">
                        ⏳ Pending
                      </span>
                    )}
                    {/* Safety ack count */}
                    <span className="text-[10px] text-[#6B7C93]">
                      🛡 {guest.safetyAckCount} cards
                    </span>
                    
                    {!guest.waiverSigned && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUploadClick(guest.id) }}
                        disabled={uploadingId === guest.id}
                        className="text-[10px] text-[#6B7C93] underline disabled:opacity-50"
                      >
                        {uploadingId === guest.id ? 'Uploading...' : 'Upload Paper'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Expanded: Emergency Contact + Details ── */}
              {expandedGuestId === guest.id && (
                <div className="mt-2.5 ml-12 space-y-2 animate-in slide-in-from-top-1 duration-200">
                  {/* Emergency Contact */}
                  {guest.emergencyContactName && guest.emergencyContactPhone && (
                    <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[#FEF3DC] border border-[#E5910A]/20">
                      <span className="text-[16px]">📞</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#92400E]">
                          Emergency: {guest.emergencyContactName}
                        </p>
                        <p className="text-[12px] text-[#78350F]">
                          {guest.emergencyContactPhone}
                        </p>
                      </div>
                      <a
                        href={`tel:${guest.emergencyContactPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="
                          flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          bg-[#E8593C] text-white text-[11px] font-bold
                          hover:bg-[#cc4a32] transition-colors
                          flex-shrink-0
                        "
                      >
                        <Phone size={11} />
                        CALL
                      </a>
                    </div>
                  )}

                  {/* Medical/dietary flags */}
                  <div className="flex flex-wrap gap-1.5">
                    {guest.isNonSwimmer && (
                      <span className="text-[11px] font-medium text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
                        🏊 Non-swimmer
                      </span>
                    )}
                    {guest.dietaryRequirements && (
                      <span className="text-[11px] font-medium text-[#92400E] bg-[#FEF3DC] px-2 py-0.5 rounded-full">
                        🥗 {guest.dietaryRequirements}
                      </span>
                    )}
                    {guest.dateOfBirth && (() => {
                      const age = Math.floor(
                        (Date.now() - new Date(guest.dateOfBirth).getTime()) / 31557600000
                      )
                      if (age < 6) return (
                        <span className="text-[11px] font-medium text-[#DC2626] bg-[#FEE2E2] px-2 py-0.5 rounded-full">
                          👶 Age {age} — PFD Required
                        </span>
                      )
                      if (age < 18) return (
                        <span className="text-[11px] font-medium text-[#6B7C93] bg-[#F5F8FC] px-2 py-0.5 rounded-full">
                          🧒 Minor (age {age})
                        </span>
                      )
                      return null
                    })()}
                  </div>

                  {/* No emergency contact notice */}
                  {!guest.emergencyContactPhone && (
                    <p className="text-[11px] text-[#6B7C93] italic">
                      No emergency contact provided
                    </p>
                  )}
                </div>
              )}

              {/* Livery verify button — inline for captain */}
              {guest.approvalStatus === 'pending_livery_briefing' && captainToken && (
                <div className="mt-2 ml-12">
                  {liveryVerifyId === guest.id ? (
                    <div className="p-3 bg-[#FFF8E1] border border-[#FFD54F] rounded-[10px] space-y-2">
                      <p className="text-[12px] text-[#92400E] leading-relaxed">
                        <strong>I confirm</strong> I have briefed <strong>{guest.fullName}</strong> on 
                        vessel operation, safety equipment, and emergency procedures.
                      </p>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={liveryVerifierName}
                        onChange={e => setLiveryVerifierName(e.target.value)}
                        className="w-full h-[36px] px-3 rounded-[8px] text-[13px] border border-[#FFD54F] bg-white text-[#0D1B2A] placeholder:text-[#6B7C93] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => verifyLiveryBriefing(guest.id)}
                          disabled={!liveryVerifierName.trim() || actioning === guest.id}
                          className="flex-1 h-[32px] rounded-[8px] bg-[#1D9E75] text-white text-[12px] font-semibold hover:bg-[#178a65] transition-colors disabled:opacity-40"
                        >
                          ✓ Confirm
                        </button>
                        <button
                          onClick={() => setLiveryVerifyId(null)}
                          className="h-[32px] px-3 rounded-[8px] bg-white border border-[#D0E2F3] text-[12px] text-[#6B7C93]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setLiveryVerifyId(guest.id)
                        setLiveryVerifierName('')
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF8E1] border border-[#FFD54F] text-[11px] font-semibold text-[#92400E] hover:bg-[#FFECB3] transition-colors"
                    >
                      <Anchor size={11} />
                      Verify Livery Briefing
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Hidden file input for paper waiver upload */}
      <input 
        type="file" 
        accept="application/pdf,image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
