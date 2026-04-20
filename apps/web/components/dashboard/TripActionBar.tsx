'use client'

import { useState } from 'react'
import {
  Copy, Check, ExternalLink, Download, Anchor,
  Share2, Link as LinkIcon, RefreshCw,
} from 'lucide-react'
import type { TripStatus } from '@/types'

interface TripActionBarProps {
  tripId: string
  tripSlug: string
  status: TripStatus
  /** allWaiversSigned — USCG CSV only shown when this is true + trip active/completed */
  allWaiversSigned: boolean
}

/**
 * TripActionBar — Share + contextual documents
 *
 * SHARE section — always visible
 *   Trip link (copy + preview)
 *   Captain snapshot link (generate/revoke/copy)
 *
 * DOCUMENTS section — contextual:
 *   Manifest PDF  → status active or completed
 *   USCG CSV      → status active/completed AND allWaiversSigned
 */
export function TripActionBar({
  tripId, tripSlug, status, allWaiversSigned,
}: TripActionBarProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingCsv, setDownloadingCsv] = useState(false)
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
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
      setSnapshotError(
        err instanceof Error
          ? err.message
          : 'Failed to generate captain link. Check CAPTAIN_TOKEN_SECRET is set in environment variables.'
      )
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
  const showUscg = showDocs && allWaiversSigned

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-8)', marginTop: 'var(--s-8)' }}>

      {/* ══════════════════════════════════════════════════════
          SHARE SECTION
          ══════════════════════════════════════════════════════ */}
      <section>
        {/* Section kicker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s-2)',
            paddingBottom: 'var(--s-3)',
            borderBottom: 'var(--border-w) solid var(--color-ink)',
            marginBottom: 'var(--s-4)',
          }}
        >
          <Share2 size={14} strokeWidth={2} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
          <span
            className="font-mono"
            style={{
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--color-ink)',
            }}
          >
            Share
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>

          {/* Trip link tile */}
          <div className="tile" style={{ overflow: 'hidden', padding: 0 }}>
            <div
              style={{
                padding: 'var(--s-3) var(--s-4)',
                background: 'var(--color-bone)',
                borderBottom: '1px solid var(--color-line-soft)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 4 }}>
                <LinkIcon size={11} strokeWidth={2} style={{ color: 'var(--color-ink-muted)' }} />
                <span
                  className="font-mono"
                  style={{
                    fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                  }}
                >
                  Trip link
                </span>
              </div>
              <p
                className="font-mono"
                style={{
                  fontSize: '12px', color: 'var(--color-ink)',
                  wordBreak: 'break-all', lineHeight: 1.5, margin: 0,
                }}
              >
                {tripLink}
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <button
                onClick={copyLink}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 'var(--s-2)', height: 44,
                  fontSize: '13px', fontWeight: 600,
                  background: copiedLink ? 'var(--color-status-ok-soft)' : 'var(--color-paper)',
                  color: copiedLink ? 'var(--color-status-ok)' : 'var(--color-ink)',
                  border: 'none', borderRight: '1px solid var(--color-line-soft)',
                  cursor: 'pointer',
                  transition: 'background var(--dur-fast) var(--ease)',
                }}
              >
                {copiedLink ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
                {copiedLink ? 'Copied' : 'Copy link'}
              </button>
              <a
                href={tripLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 'var(--s-2)', height: 44,
                  fontSize: '13px', fontWeight: 500,
                  color: 'var(--color-ink-muted)',
                  textDecoration: 'none',
                  background: 'var(--color-paper)',
                }}
              >
                <ExternalLink size={13} strokeWidth={2} />
                Preview
              </a>
            </div>
          </div>

          {/* Captain snapshot */}
          {snapshotUrl ? (
            <div className="tile" style={{ overflow: 'hidden', padding: 0 }}>
              <div
                style={{
                  padding: 'var(--s-3) var(--s-4)',
                  background: 'var(--color-bone)',
                  borderBottom: '1px solid var(--color-line-soft)',
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                    display: 'block', marginBottom: 4,
                  }}
                >
                  Captain link
                </span>
                <p
                  className="font-mono"
                  style={{
                    fontSize: '11px', color: 'var(--color-ink)',
                    wordBreak: 'break-all', lineHeight: 1.5, margin: 0,
                  }}
                >
                  {snapshotUrl}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <button
                  onClick={copySnapshot}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 'var(--s-2)', height: 44,
                    fontSize: '13px', fontWeight: 600,
                    background: copiedSnapshot ? 'var(--color-status-ok-soft)' : 'var(--color-paper)',
                    color: copiedSnapshot ? 'var(--color-status-ok)' : 'var(--color-ink)',
                    border: 'none', borderRight: '1px solid var(--color-line-soft)',
                    cursor: 'pointer',
                  }}
                >
                  {copiedSnapshot ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
                  {copiedSnapshot ? 'Copied' : 'Copy link'}
                </button>
                <button
                  onClick={generateSnapshot}
                  disabled={generatingSnapshot}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 'var(--s-2)', height: 44,
                    fontSize: '13px', fontWeight: 500,
                    background: 'var(--color-paper)',
                    color: 'var(--color-status-err)',
                    border: 'none', cursor: 'pointer',
                    opacity: generatingSnapshot ? 0.5 : 1,
                  }}
                >
                  <RefreshCw size={13} strokeWidth={2} />
                  {generatingSnapshot ? 'Generating...' : 'Revoke & renew'}
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
            <div className="alert alert--err" style={{ display: 'flex', gap: 'var(--s-3)' }}>
              <div style={{ flex: 1, fontSize: '13px' }}>{snapshotError}</div>
              <button
                onClick={() => setSnapshotError(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-status-err)', fontWeight: 700, flexShrink: 0, padding: 0,
                }}
                aria-label="Dismiss error"
              >
                <Check size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          DOCUMENTS SECTION — contextual
          ══════════════════════════════════════════════════════ */}
      {showDocs && (
        <section>
          {/* Section kicker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--s-2)',
              paddingBottom: 'var(--s-3)',
              borderBottom: 'var(--border-w) solid var(--color-ink)',
              marginBottom: 'var(--s-4)',
            }}
          >
            <Download size={14} strokeWidth={2} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
            <span
              className="font-mono"
              style={{
                fontSize: '13px', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--color-ink)',
              }}
            >
              Documents
            </span>
          </div>

          {downloadError && (
            <div className="alert alert--err" style={{ marginBottom: 'var(--s-3)' }}>
              <div style={{ fontSize: '13px' }}>{downloadError}</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>

            {/* Manifest PDF — always when active/completed */}
            <button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="tile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s-4)',
                padding: 'var(--s-4) var(--s-5)',
                cursor: 'pointer',
                width: '100%',
                borderLeft: '4px solid var(--color-ink)',
                opacity: downloadingPdf ? 0.5 : 1,
                transition: 'opacity 0.15s',
                textAlign: 'left',
              }}
            >
              <Download
                size={20}
                strokeWidth={1.8}
                style={{ color: 'var(--color-ink)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.2 }}>
                  {downloadingPdf ? 'Generating...' : 'Passenger Manifest PDF'}
                </p>
                <p
                  className="font-mono"
                  style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: 2 }}
                >
                  Guest list · waivers · safety status
                </p>
              </div>
            </button>

            {/* USCG CSV — only when all waivers signed */}
            {showUscg ? (
              <button
                onClick={downloadUscgCsv}
                disabled={downloadingCsv}
                className="tile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s-4)',
                  padding: 'var(--s-4) var(--s-5)',
                  cursor: 'pointer',
                  width: '100%',
                  borderLeft: '4px solid var(--color-brass)',
                  opacity: downloadingCsv ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                  textAlign: 'left',
                }}
              >
                <Anchor
                  size={20}
                  strokeWidth={1.8}
                  style={{ color: 'var(--color-brass)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.2 }}>
                    {downloadingCsv ? 'Generating...' : 'USCG Passenger CSV'}
                  </p>
                  <p
                    className="font-mono"
                    style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: 2 }}
                  >
                    46 CFR §182.530 · all waivers signed
                  </p>
                </div>
              </button>
            ) : showDocs ? (
              /* USCG unavailable — explain why */
              <div
                className="tile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--s-4)',
                  padding: 'var(--s-4) var(--s-5)',
                  opacity: 0.5,
                  borderLeft: '4px solid var(--color-line-soft)',
                }}
              >
                <Anchor
                  size={20}
                  strokeWidth={1.8}
                  style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.2 }}>
                    USCG Passenger CSV
                  </p>
                  <p
                    className="font-mono"
                    style={{ fontSize: '11px', color: 'var(--color-status-warn)', marginTop: 2 }}
                  >
                    Available once all guests have signed waivers
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  )
}
