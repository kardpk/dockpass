'use client'

import { use, useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { GuestSession } from '@/types'

// Separate hook so localStorage is not accessed during SSR
function useGuestSession(slug: string): { session: GuestSession | null; loaded: boolean } {
  const [loaded, setLoaded] = useState(false)
  const [session, setSession] = useState<GuestSession | null>(null)

  useEffect(() => {
    let parsed: GuestSession | null = null
    try {
      const raw = localStorage.getItem(`dp-guest-${slug}`)
      if (raw) parsed = JSON.parse(raw) as GuestSession
    } catch { /* Corrupt data */ }
    setSession(parsed)
    setLoaded(true)
  }, [slug])

  return { session, loaded }
}

interface Props {
  params: Promise<{ slug: string }>
}

export default function BoardingPassPage({ params }: Props) {
  const { slug } = use(params)
  const { session, loaded } = useGuestSession(slug)

  if (!loaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#0C447C]/30 border-t-[#0C447C] rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-[48px] mb-4">⚓</div>
        <p className="text-[16px] text-[#6B7C93] mb-4">
          No check-in found for this trip.
        </p>
        <a
          href={`/trip/${slug}`}
          className="text-[#0C447C] underline text-[15px]"
        >
          Back to trip page →
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F8FC] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <h1 className="text-[20px] font-bold text-[#0D1B2A] text-center mb-4">
          Your boarding pass
        </h1>

        {/* Boarding pass card */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(12,68,124,0.12)] overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#6B7C93] mb-2">
              BOATCHECKIN
            </p>
            <p className="text-[13px] text-[#6B7C93]">
              Checked in {new Date(session.checkedInAt).toLocaleDateString()}
            </p>
          </div>

          {/* Dashed divider */}
          <div className="flex items-center px-4 my-1">
            <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
            <span className="px-2 text-[#D0E2F3] text-[18px]">✂</span>
            <div className="flex-1 border-t-2 border-dashed border-[#D0E2F3]" />
          </div>

          {/* QR section */}
          <div className="px-5 pt-4 pb-5 flex flex-col items-center">
            <div className="bg-[#0D1B2A] p-3 rounded-[16px] mb-3">
              <QRCodeSVG
                value={session.qrToken}
                size={160}
                fgColor="#FFFFFF"
                bgColor="#0D1B2A"
                level="M"
              />
            </div>
            <p className="text-[17px] font-bold text-[#0D1B2A]">
              {session.guestName}
            </p>
          </div>
        </div>

        <a
          href={`/trip/${slug}`}
          className="block text-center text-[14px] text-[#6B7C93] underline mt-5"
        >
          ← Back to trip info
        </a>
      </div>
    </div>
  )
}
