'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Download, Anchor, Share2, Link as LinkIcon, RefreshCw, X } from 'lucide-react'
import type { TripStatus } from '@/types'

interface TripActionBarProps {
  tripId: string; tripSlug: string; status: TripStatus; allWaiversSigned: boolean
}

export function TripActionBar({ tripId, tripSlug, status, allWaiversSigned }: TripActionBarProps) {
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
    setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000)
  }
  async function downloadPdf() {
    setDownloadingPdf(true); setDownloadError(null)
    try {
      const res = await fetch(`/api/dashboard/manifest/${tripId}`)
      if (!res.ok) throw new Error('Manifest generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `manifest-${tripId}.pdf`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch (err) { setDownloadError(err instanceof Error ? err.message : 'Download failed')
    } finally { setDownloadingPdf(false) }
  }
  async function downloadUscgCsv() {
    setDownloadingCsv(true); setDownloadError(null)
    try {
      const res = await fetch(`/api/dashboard/uscg-manifest/${tripId}`)
      if (!res.ok) throw new Error('USCG CSV generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `USCG_Manifest_${tripId}.csv`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch (err) { setDownloadError(err instanceof Error ? err.message : 'Download failed')
    } finally { setDownloadingCsv(false) }
  }
  async function generateSnapshot() {
    setGeneratingSnapshot(true); setSnapshotError(null)
    try {
      const res = await fetch(`/api/dashboard/trips/${tripId}/regenerate-captain-token`, { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to generate captain link')
      }
      const json = await res.json()
      setSnapshotUrl(`${appUrl}/snapshot/${json.token}`)
    } catch (err) { setSnapshotError(err instanceof Error ? err.message : 'Failed to generate captain link.')
    } finally { setGeneratingSnapshot(false) }
  }
  async function copySnapshot() {
    if (!snapshotUrl) return
    await navigator.clipboard.writeText(snapshotUrl)
    setCopiedSnapshot(true); setTimeout(() => setCopiedSnapshot(false), 2000)
  }

  const showDocs = status === 'active' || status === 'completed'
  const showUscg = showDocs && allWaiversSigned

  return (
    <div>
      {/* ── SHARE ── same td-kicker as every other section */}
      <section>
        <div className="td-kicker">
          <span className="td-kicker-label">Share</span>
        </div>

        <div className="td-gap-8">
          {/* Trip link */}
          <div className="td-panel">
            <div className="td-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LinkIcon size={10} strokeWidth={2} style={{ color: 'var(--td-navy-dim)' }} />
                <span className="td-panel-label">Trip link</span>
              </div>
            </div>
            <div className="td-snapshot-link">{tripLink}</div>
            <div className="td-btn-split td-panel-footer">
              <button onClick={copyLink} className={`td-btn-split-item ${copiedLink ? 'copied' : ''}`}>
                {copiedLink ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                {copiedLink ? 'Copied' : 'Copy link'}
              </button>
              <a href={tripLink} target="_blank" rel="noopener noreferrer" className="td-btn-split-item" style={{ textDecoration: 'none' }}>
                <ExternalLink size={11} strokeWidth={2} /> Preview
              </a>
            </div>
          </div>

          {/* Captain snapshot */}
          {snapshotUrl ? (
            <div className="td-panel">
              <div className="td-panel-header">
                <span className="td-panel-label">Captain link</span>
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 9, fontWeight: 700, color: 'var(--td-warn)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>Active</span>
              </div>
              <div className="td-snapshot-link">{snapshotUrl}</div>
              <div className="td-btn-split td-panel-footer">
                <button onClick={copySnapshot} className={`td-btn-split-item ${copiedSnapshot ? 'copied' : ''}`}>
                  {copiedSnapshot ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                  {copiedSnapshot ? 'Copied' : 'Copy link'}
                </button>
                <button onClick={generateSnapshot} disabled={generatingSnapshot}
                  className="td-btn-split-item" style={{ color: 'var(--td-err)' }}>
                  <RefreshCw size={11} strokeWidth={2} />
                  {generatingSnapshot ? 'Generating...' : 'Revoke & renew'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generateSnapshot} disabled={generatingSnapshot} className="td-btn-primary">
              <Share2 size={13} strokeWidth={2.5} />
              {generatingSnapshot ? 'Generating...' : 'Share to captain'}
            </button>
          )}

          {snapshotError && (
            <div className="td-alert td-alert-err">
              <div style={{ flex: 1, fontSize: 12 }}>{snapshotError}</div>
              <button onClick={() => setSnapshotError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--td-err)', flexShrink: 0, padding: 0 }}>
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── DOCUMENTS — same td-kicker */}
      {showDocs && (
        <section>
          <div className="td-kicker">
            <span className="td-kicker-label">Documents</span>
          </div>

          {downloadError && (
            <div className="td-alert td-alert-err" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 12 }}>{downloadError}</span>
            </div>
          )}

          <button onClick={downloadPdf} disabled={downloadingPdf}
            className={`td-doc-row td-doc-row-accent ${downloadingPdf ? 'locked' : ''}`}>
            <Download size={16} strokeWidth={1.8} className="td-doc-icon" />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <p className="td-doc-title">{downloadingPdf ? 'Generating...' : 'Passenger Manifest PDF'}</p>
              <p className="td-doc-subtitle">Guest list · waivers · safety status</p>
            </div>
          </button>

          {showUscg ? (
            <button onClick={downloadUscgCsv} disabled={downloadingCsv}
              className={`td-doc-row td-doc-row-gold ${downloadingCsv ? 'locked' : ''}`}>
              <Anchor size={16} strokeWidth={1.8} className="td-doc-icon td-doc-icon-gold" />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p className="td-doc-title">{downloadingCsv ? 'Generating...' : 'USCG Passenger CSV'}</p>
                <p className="td-doc-subtitle td-doc-subtitle-gold">46 CFR §182.530 · all waivers signed</p>
              </div>
            </button>
          ) : (
            <div className="td-doc-row locked">
              <Anchor size={16} strokeWidth={1.8} className="td-doc-icon" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="td-doc-title">USCG Passenger CSV</p>
                <p className="td-doc-subtitle" style={{ color: 'var(--td-warn)' }}>
                  Available once all guests have signed waivers
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
