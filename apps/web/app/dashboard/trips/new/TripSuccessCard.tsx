'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle, ArrowRight, Plus } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { TripCreatedResult } from '@/types'

interface TripSuccessCardProps {
  result: TripCreatedResult
  onCreateAnother: () => void
  onViewTrip: () => void
}

export function TripSuccessCard({ result, onCreateAnother, onViewTrip }: TripSuccessCardProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const isSplit = result.bookings.length > 0

  async function copyToClipboard(text: string, type: 'link' | 'message') {
    await navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    }
  }

  if (isSplit) {
    return <SplitSuccessCard result={result} onCreateAnother={onCreateAnother} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      {/* ── Success header ─────────────────────────────────────────────── */}
      <div
        style={{
          padding: 'var(--s-8)',
          background: 'var(--color-ink)',
          border: 'var(--border-w) solid var(--color-ink)',
          borderRadius: 'var(--r-1)',
          textAlign: 'center',
        }}
      >
        <h2
          className="font-display"
          style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-bone)', letterSpacing: '-0.02em' }}
        >
          Your trip link is ready
        </h2>
        <p style={{ fontSize: 'var(--t-body-sm)', color: 'rgba(244,239,230,0.6)', marginTop: 'var(--s-1)' }}>
          Share it with your guests
        </p>

        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--s-3)',
            background: 'rgba(244,239,230,0.08)',
            borderRadius: 'var(--r-1)',
            padding: 'var(--s-3) var(--s-6)',
            marginTop: 'var(--s-5)',
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: '11px', color: 'rgba(244,239,230,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            Code
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.15em', color: 'var(--color-bone)' }}
          >
            {result.tripCode}
          </span>
        </div>
      </div>

      {/* ── Trip link ──────────────────────────────────────────────────── */}
      <div className="tile" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--s-4)' }}>
          <span
            className="font-mono"
            style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}
          >
            Trip link
          </span>
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', wordBreak: 'break-all', fontWeight: 500, marginTop: 'var(--s-2)' }}>
            {result.tripLink}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--color-line-soft)' }}>
          <button
            onClick={() => copyToClipboard(result.tripLink, 'link')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
              height: 48, fontSize: 'var(--t-body-sm)', fontWeight: 600,
              background: copiedLink ? 'var(--color-status-ok-soft)' : 'var(--color-paper)',
              color: copiedLink ? 'var(--color-status-ok)' : 'var(--color-ink)',
              border: 'none', borderRight: '1px solid var(--color-line-soft)',
              cursor: 'pointer',
              transition: 'background var(--dur-fast) var(--ease)',
            }}
          >
            {copiedLink ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
            {copiedLink ? 'Copied' : 'Copy link'}
          </button>
          <a
            href={result.tripLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
              height: 48, fontSize: 'var(--t-body-sm)', fontWeight: 500,
              color: 'var(--color-ink-muted)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} strokeWidth={2} />
            Preview
          </a>
        </div>
      </div>

      {/* ── QR Code ────────────────────────────────────────────────────── */}
      <div className="tile" style={{ padding: 'var(--s-5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-3)' }}>
        <p
          className="font-mono"
          style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Print and post at your marina
        </p>
        <div style={{ background: 'white', padding: 'var(--s-3)', borderRadius: 'var(--r-2)', border: '1px solid var(--color-line-soft)' }}>
          <QRCodeSVG
            value={result.tripLink}
            size={160}
            fgColor="#0B1E2D"
            bgColor="#FFFFFF"
            level="M"
          />
        </div>
      </div>

      {/* ── WhatsApp message ───────────────────────────────────────────── */}
      <div className="tile" style={{ overflow: 'hidden' }}>
        <div style={{ padding: 'var(--s-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
            <MessageCircle size={14} strokeWidth={2} style={{ color: 'var(--color-sea)' }} />
            <span
              className="font-mono"
              style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}
            >
              Ready-to-send message
            </span>
          </div>
          <pre style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: 0 }}>
            {result.whatsappMessage}
          </pre>
        </div>
        <button
          onClick={() => copyToClipboard(result.whatsappMessage, 'message')}
          style={{
            width: '100%', height: 48,
            borderTop: '1px solid var(--color-line-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
            fontSize: 'var(--t-body-sm)', fontWeight: 600,
            background: copiedMessage ? 'var(--color-status-ok-soft)' : 'var(--color-paper)',
            color: copiedMessage ? 'var(--color-status-ok)' : 'var(--color-ink)',
            border: 'none', cursor: 'pointer',
            transition: 'background var(--dur-fast) var(--ease)',
          }}
        >
          {copiedMessage ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
          {copiedMessage ? 'Copied to clipboard' : 'Copy message'}
        </button>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)', paddingTop: 'var(--s-2)' }}>
        <button
          onClick={onViewTrip}
          className="btn btn--primary"
          style={{ width: '100%', justifyContent: 'center', height: 48 }}
        >
          View trip and guest list
          <ArrowRight size={14} strokeWidth={2.5} />
        </button>
        <button
          onClick={onCreateAnother}
          className="btn"
          style={{ width: '100%', justifyContent: 'center', height: 48 }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Create another trip
        </button>
      </div>
    </div>
  )
}

// ─── Split booking success screen ─────────────────────────────────────────────

function SplitSuccessCard({
  result,
  onCreateAnother,
}: {
  result: TripCreatedResult
  onCreateAnother: () => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copyMessage(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      <div
        style={{
          padding: 'var(--s-8)',
          background: 'var(--color-ink)',
          borderRadius: 'var(--r-1)',
          textAlign: 'center',
        }}
      >
        <h2
          className="font-display"
          style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-bone)' }}
        >
          {result.bookings.length} booking links ready
        </h2>
        <p style={{ fontSize: 'var(--t-body-sm)', color: 'rgba(244,239,230,0.6)', marginTop: 'var(--s-1)' }}>
          Send each organiser their personal link
        </p>
      </div>

      {result.bookings.map((booking) => (
        <div key={booking.bookingId} className="tile" style={{ overflow: 'hidden' }}>
          <div style={{ padding: 'var(--s-4)', borderBottom: '1px solid var(--color-line-soft)', background: 'var(--color-bone)' }}>
            <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
              {booking.organiserName}
            </p>
            <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}>
              Max {booking.maxGuests} guests · Code: {booking.bookingCode}
            </p>
          </div>
          <button
            onClick={() => copyMessage(booking.bookingId, booking.whatsappMessage)}
            style={{
              width: '100%', height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
              fontSize: 'var(--t-body-sm)', fontWeight: 500,
              background: copiedId === booking.bookingId ? 'var(--color-status-ok-soft)' : 'var(--color-paper)',
              color: copiedId === booking.bookingId ? 'var(--color-status-ok)' : 'var(--color-ink)',
              border: 'none', cursor: 'pointer',
              transition: 'background var(--dur-fast) var(--ease)',
            }}
          >
            {copiedId === booking.bookingId ? (
              <><Check size={14} strokeWidth={2.5} /> Copied</>
            ) : (
              <><Copy size={14} strokeWidth={2} /> Copy message for {booking.organiserName.split(' ')[0]}</>
            )}
          </button>
        </div>
      ))}

      <button
        onClick={onCreateAnother}
        className="btn"
        style={{ width: '100%', justifyContent: 'center', height: 48 }}
      >
        <Plus size={14} strokeWidth={2.5} />
        Create another trip
      </button>
    </div>
  )
}
