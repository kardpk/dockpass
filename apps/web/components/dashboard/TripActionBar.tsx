'use client'

import { useState } from 'react'
import {
  Copy, Check, ExternalLink, FileText, Anchor, Share2,
} from 'lucide-react'
import type { TripStatus } from '@/types'

interface TripActionBarProps {
  tripId: string
  tripSlug: string
  status: TripStatus
  shareMessage: string
  initialSnapshotUrl?: string | null
}

/**
 * TripActionBar — MASTER_DESIGN editorial action section
 *
 * Pre-trip: Share card (trip link, copy message, share to captain)
 * Active/Completed: Document downloads (Manifest PDF, USCG CSV)
 */
export function TripActionBar({
  tripId, tripSlug, status, shareMessage, initialSnapshotUrl,
}: TripActionBarProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingCsv, setDownloadingCsv] = useState(false)
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(initialSnapshotUrl || null)
  const [copiedSnapshot, setCopiedSnapshot] = useState(false)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const tripLink = `${appUrl}/trip/${tripSlug}`

  async function copyLink() {
    await navigator.clipboard.writeText(tripLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(shareMessage)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    setDownloadError(null)
    try {
      const res = await fetch(`/api/dashboard/manifest/${tripId}`)
      if (!res.ok) throw new Error('Manifest generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manifest-${tripId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function downloadUscgCsv() {
    setDownloadingCsv(true)
    setDownloadError(null)
    try {
      const res = await fetch(`/api/dashboard/uscg-manifest/${tripId}`)
      if (!res.ok) throw new Error('USCG CSV generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `USCG_Manifest_${tripId}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed. Please try again.')
    } finally {
      setDownloadingCsv(false)
    }
  }

  async function generateSnapshot() {
    if (!window.confirm(snapshotUrl ? 'Revoke the current link and generate a new one?' : 'Generate a captain link for this trip?')) return
    setGeneratingSnapshot(true)
    setSnapshotError(null)
    try {
      const res = await fetch(
        `/api/dashboard/trips/${tripId}/regenerate-captain-token`,
        { method: 'POST' },
      )
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to generate captain link')
      }
      const json = await res.json()
      setSnapshotUrl(`${appUrl}/snapshot/${json.token}`)
    } catch (err) {
      setSnapshotError(err instanceof Error ? err.message : 'Failed to generate captain link. Check that CAPTAIN_TOKEN_SECRET is set in your environment variables.')
    } finally {
      setGeneratingSnapshot(false)
    }
  }

  async function copySnapshot() {
    if (!snapshotUrl) return
    await navigator.clipboard.writeText(snapshotUrl)
    setCopiedSnapshot(true)
    setTimeout(() => setCopiedSnapshot(false), 2000)
  }

  const showDocs = status === 'active' || status === 'completed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)', marginTop: 'var(--s-6)' }}>

      {/* ══════════════════════════════════════════════════════
          SHARE SECTION — always visible
          ══════════════════════════════════════════════════════ */}
      <section>
        <div
          className="font-mono"
          style={{
            fontSize: '13px', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--color-ink)',
            paddingBottom: 'var(--s-3)',
            borderBottom: 'var(--border-w) solid var(--color-ink)',
            marginBottom: 'var(--s-4)',
          }}
        >
          Share
        </div>

        {/* Trip link card */}
        <div className="tile" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: 'var(--s-4) var(--s-5)' }}>
            <span
              className="font-mono"
              style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}
            >
              Trip link
            </span>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', wordBreak: 'break-all', fontWeight: 500, marginTop: 'var(--s-1)' }}>
              {tripLink}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--color-line-soft)' }}>
            <button
              onClick={copyLink}
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
              href={tripLink}
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

        {/* Copy message */}
        <button
          onClick={copyMessage}
          className="tile"
          style={{
            width: '100%', marginTop: 'var(--s-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
            height: 48, cursor: 'pointer',
            fontSize: 'var(--t-body-sm)', fontWeight: 600,
            background: copiedMsg ? 'var(--color-status-ok-soft)' : 'var(--color-paper)',
            color: copiedMsg ? 'var(--color-status-ok)' : 'var(--color-ink)',
            transition: 'background var(--dur-fast) var(--ease)',
          }}
        >
          {copiedMsg ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
          {copiedMsg ? 'Copied to clipboard' : 'Copy message for guests'}
        </button>

        {/* Share to captain */}
        <div style={{ marginTop: 'var(--s-3)' }}>
          {snapshotUrl ? (
            <div className="tile" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: 'var(--s-3) var(--s-5)', background: 'var(--color-bone)' }}>
                <span
                  className="font-mono"
                  style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}
                >
                  Captain link
                </span>
                <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', wordBreak: 'break-all', fontWeight: 500, marginTop: 'var(--s-1)' }}>
                  {snapshotUrl}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--color-line-soft)' }}>
                <button
                  onClick={copySnapshot}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
                    height: 44, fontSize: 'var(--t-body-sm)', fontWeight: 600,
                    background: copiedSnapshot ? 'var(--color-status-ok-soft)' : 'var(--color-paper)',
                    color: copiedSnapshot ? 'var(--color-status-ok)' : 'var(--color-ink)',
                    border: 'none', borderRight: '1px solid var(--color-line-soft)',
                    cursor: 'pointer',
                  }}
                >
                  {copiedSnapshot ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
                  {copiedSnapshot ? 'Copied' : 'Copy link'}
                </button>
                <button
                  onClick={generateSnapshot}
                  disabled={generatingSnapshot}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
                    height: 44, fontSize: 'var(--t-body-sm)', fontWeight: 500,
                    background: 'var(--color-paper)',
                    color: 'var(--color-status-err)',
                    border: 'none', cursor: 'pointer',
                    opacity: generatingSnapshot ? 0.5 : 1,
                  }}
                >
                  {generatingSnapshot ? 'Generating...' : 'Revoke and renew'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={generateSnapshot}
              disabled={generatingSnapshot}
              className="btn btn--primary"
              style={{ width: '100%', justifyContent: 'center', height: 48 }}
            >
              <Share2 size={14} strokeWidth={2.5} />
              {generatingSnapshot ? 'Generating...' : 'Share to captain'}
            </button>
          )}
          {/* Snapshot error */}
          {snapshotError && (
            <div
              style={{
                marginTop: 'var(--s-3)',
                padding: 'var(--s-3) var(--s-4)',
                borderRadius: 'var(--r-1)',
                background: 'rgba(180,60,60,0.06)',
                border: '1px solid rgba(180,60,60,0.2)',
                color: 'var(--color-status-err)',
                fontSize: 13,
                display: 'flex',
                gap: 'var(--s-2)',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ flex: 1 }}>{snapshotError}</span>
              <button
                onClick={() => setSnapshotError(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-status-err)', fontWeight: 700, flexShrink: 0, padding: 0 }}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DOCUMENTS SECTION — active/completed only
          ══════════════════════════════════════════════════════ */}
      {showDocs && (
        <section>
          <div
            className="font-mono"
            style={{
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--color-ink)',
              paddingBottom: 'var(--s-3)',
              borderBottom: 'var(--border-w) solid var(--color-ink)',
              marginBottom: 'var(--s-4)',
            }}
          >
            Documents
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
            <button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="tile"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--s-2)', height: 80, cursor: 'pointer',
                fontSize: 'var(--t-body-sm)', fontWeight: 600,
                color: 'var(--color-ink)',
                opacity: downloadingPdf ? 0.5 : 1,
              }}
            >
              <FileText size={20} strokeWidth={1.8} />
              {downloadingPdf ? 'Generating...' : 'Manifest PDF'}
            </button>

            <button
              onClick={downloadUscgCsv}
              disabled={downloadingCsv}
              className="tile"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--s-2)', height: 80, cursor: 'pointer',
                fontSize: 'var(--t-body-sm)', fontWeight: 600,
                color: 'var(--color-ink)',
                opacity: downloadingCsv ? 0.5 : 1,
              }}
            >
              <Anchor size={20} strokeWidth={1.8} />
              {downloadingCsv ? 'Generating...' : 'USCG CSV'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
