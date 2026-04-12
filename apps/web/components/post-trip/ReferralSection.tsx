'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ReferralSection({
  tripSlug, boatName,
}: {
  tripSlug: string
  boatName: string
}) {
  const [copied, setCopied] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://boatcheckin.com'
  const referralUrl = `${appUrl}?ref=${tripSlug}&boat=${encodeURIComponent(boatName)}`

  const shareMessage = `Just had an amazing charter on ${boatName} 🛥️ Book your own with BoatCheckin — digital check-in, no paperwork: ${referralUrl}`

  async function copyLink() {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'Try BoatCheckin for your next charter',
          text: shareMessage,
          url: referralUrl,
        })
      } else {
        await navigator.clipboard.writeText(shareMessage)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  return (
    <div className="bg-[#E8F2FB] rounded-[20px] p-5 border border-[#D0E2F3]">
      <div className="flex items-start gap-3">
        <span className="text-[28px] flex-shrink-0">🎁</span>
        <div className="flex-1">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A] mb-1">
            Share with a friend
          </h2>
          <p className="text-[14px] text-[#6B7C93] mb-4">
            Know someone planning a charter?
            Share BoatCheckin with them.
          </p>
          <button
            onClick={copyLink}
            className={cn(
              'h-[48px] px-5 rounded-[12px] font-semibold text-[14px]',
              'flex items-center gap-2 transition-colors',
              copied
                ? 'bg-[#1D9E75] text-white'
                : 'bg-[#0C447C] text-white hover:bg-[#093a6b]'
            )}
          >
            {copied ? '✓ Copied!' : '📤 Share the link'}
          </button>
        </div>
      </div>
    </div>
  )
}
