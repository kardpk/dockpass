'use client'

import { useState, useRef } from 'react'
import { PostcardData, PostcardStyle, PostTripPageData } from '@/types'
import { cn } from '@/lib/utils'

// Lazy load html2canvas to avoid massive bundle hit
// Webpack / Next.js dynamic import via top-level function
const getHtml2Canvas = () => import('html2canvas').then(mod => mod.default)

const STYLES: { key: PostcardStyle; label: string; emoji: string }[] = [
  { key: 'classic', label: 'Classic', emoji: '⚓' },
  { key: 'minimal', label: 'Minimal', emoji: '□' },
  { key: 'sunset', label: 'Sunset', emoji: '🌅' },
]

const STYLE_THEMES: Record<PostcardStyle, any> = {
  classic: {
    bg: '#ffffff',
    text: '#0D1B2A',
    headerBg: '#0C447C',
    headerText: '#ffffff',
  },
  minimal: {
    bg: '#FAFAFA',
    text: '#111111',
    headerBg: '#ffffff',
    headerText: '#111111',
  },
  sunset: {
    bg: '#0D1B2A',
    text: '#ffffff',
    headerBg: '#D26046', // Coral
    headerText: '#ffffff',
  },
}

function formatTripDate(isoString: string) {
  const d = new Date(isoString)
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const day = d.getDate().toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${month} ${day} ${year}`
}

export function PostcardSection({
  tripSlug, tripId, guestId,
  postcardData
}: {
  tripSlug: string
  tripId: string
  guestId?: string
  postcardData: Omit<PostcardData, 'style'>
}) {
  const [style, setStyle] = useState<PostcardStyle>('classic')
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  
  const cardRef = useRef<HTMLDivElement>(null)
  const theme = STYLE_THEMES[style]

  async function downloadPostcard() {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    
    try {
      const html2canvas = await getHtml2Canvas()
      const canvas = await html2canvas(cardRef.current, {
        width: 1080, height: 1080, scale: 1, useCORS: true,
        allowTaint: false, backgroundColor: null, logging: false,
      })

      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `boatcheckin_${tripSlug}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      setDownloaded(true)
      setTimeout(() => setDownloaded(false), 3000)

      if (guestId) {
        fetch(`/api/trips/${tripSlug}/postcard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId, guestId, style }),
        }).catch(() => null)
      }
    } catch {
      alert('Failed to generate postcard')
    } finally {
      setDownloading(false)
    }
  }

  async function sharePostcard() {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    
    try {
      const html2canvas = await getHtml2Canvas()
      const canvas = await html2canvas(cardRef.current, {
        width: 1080, height: 1080, scale: 1, useCORS: true,
        allowTaint: false, backgroundColor: null, logging: false,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) return

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [] })) {
          const file = new File([blob], 'my-charter.png', { type: 'image/png' })
          await navigator.share({
            title: `My charter on ${postcardData.boatName}`,
            text: `Amazing day on the water ⚓ via @boatcheckin.com`,
            files: [file],
          })

          if (guestId) {
            fetch(`/api/trips/${tripSlug}/postcard`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tripId, guestId }),
            }).catch(() => null)
          }
        } else {
          downloadPostcard()
        }
      }, 'image/png', 1.0)
    } catch {
      
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden shadow-[0_1px_4px_rgba(12,68,124,0.06)]">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#E8F2FB] flex items-center justify-center text-[20px]">
            📸
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-[#0D1B2A]">
              Your trip postcard is ready 🎉
            </h2>
            <p className="text-[13px] text-[#6B7C93]">
              Download and share to Instagram
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {STYLES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStyle(s.key)}
              className={cn(
                'flex-1 h-[44px] rounded-[10px] text-[13px] font-medium border transition-all duration-150',
                style === s.key
                  ? 'bg-[#0C447C] text-white border-[#0C447C]'
                  : 'bg-white text-[#6B7C93] border-[#D0E2F3] hover:border-[#0C447C]'
              )}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        <div className="relative mb-4 rounded-[16px] overflow-hidden">
          <PostcardCanvas
            data={{ ...postcardData, style }}
            theme={theme}
            size={320}
          />
        </div>

        <div
          className="fixed"
          style={{
            top: '-9999px',
            left: '-9999px',
            width: '1080px',
            height: '1080px',
            pointerEvents: 'none',
          }}
        >
          <div ref={cardRef} style={{ width: 1080, height: 1080 }}>
            <PostcardCanvas
              data={{ ...postcardData, style }}
              theme={theme}
              size={1080}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={downloadPostcard}
            disabled={downloading}
            className="flex-1 h-[52px] rounded-[12px] border-2 border-[#0C447C] text-[#0C447C] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#E8F2FB] transition-colors disabled:opacity-40"
          >
            {downloading ? '...' : downloaded ? '✓ Downloaded' : '⬇ Download'}
          </button>
          <button
            onClick={sharePostcard}
            disabled={downloading}
            className="flex-1 h-[52px] rounded-[12px] bg-[#0C447C] text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#093a6b] transition-colors disabled:opacity-40"
          >
            {downloading ? '...' : '📤 Share'}
          </button>
        </div>

        <p className="text-[11px] text-[#6B7C93] text-center mt-2">
          Perfect for Instagram Stories or Feed (1:1)
        </p>
      </div>
    </div>
  )
}

function PostcardCanvas({ data, theme, size }: { data: PostcardData; theme: any, size: number }) {
  const scale = size / 1080
  const isPreview = size < 1080

  const content = (
    <div
      style={{
        width: 1080, height: 1080, backgroundColor: theme.bg,
        position: 'relative', fontFamily: 'Inter, Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div style={{ backgroundColor: theme.headerBg, padding: '60px 80px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <span style={{ fontSize: 36 }}>⚓</span>
          <span style={{ color: theme.headerText, fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.9 }}>
            BOATCHECKIN
          </span>
        </div>
        <h1 style={{ color: theme.headerText, fontSize: 72, fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {data.boatName}
        </h1>
      </div>

      <div style={{ padding: '60px 80px', flex: 1 }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ color: theme.text, opacity: 0.7, fontSize: 22, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>
            Aboard
          </p>
          <p style={{ color: theme.text, fontSize: 52, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
            {data.guestName}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginBottom: 60 }}>
          {[
            { label: 'DATE', value: formatTripDate(data.tripDate) },
            { label: 'CAPTAIN', value: data.captainName ?? 'Charter' },
            { label: 'MARINA', value: data.marinaName },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: theme.text, opacity: 0.6, fontSize: 16, fontWeight: 700, letterSpacing: '0.12em', margin: '0 0 6px', textTransform: 'uppercase' }}>
                {label}
              </p>
              <p style={{ color: theme.text, fontSize: 24, fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {data.weatherIcon && data.temperature && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px 32px', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, marginBottom: 48 }}>
            <span style={{ fontSize: 40 }}>{data.weatherIcon}</span>
            <div>
              <p style={{ color: theme.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
                {data.temperature}°F
              </p>
              <p style={{ color: theme.text, opacity: 0.7, fontSize: 18, margin: 0 }}>
                {data.weatherLabel}
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 48, left: 80, right: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: theme.text, opacity: 0.5, fontSize: 18, margin: 0, fontWeight: 500 }}>
          boatcheckin.com
        </p>
        <p style={{ color: theme.text, opacity: 0.4, fontSize: 16, margin: 0 }}>
          ⚓ Charter Experience
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: -80, right: -80, fontSize: 400, opacity: 0.04, lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
        ⚓
      </div>
    </div>
  )

  if (!isPreview) return content

  return (
    <div style={{ width: size, height: size, overflow: 'hidden', borderRadius: 16, position: 'relative' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1080, height: 1080 }}>
        {content}
      </div>
    </div>
  )
}
