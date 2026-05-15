'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, Download, Anchor, Share2, Link as LinkIcon, RefreshCw, X } from 'lucide-react'
import type { TripStatus } from '@/types'

interface TripActionBarProps { tripId: string; tripSlug: string; status: TripStatus; allWaiversSigned: boolean }

export function TripActionBar({ tripId, tripSlug, status, allWaiversSigned }: TripActionBarProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [dlPdf, setDlPdf] = useState(false)
  const [dlCsv, setDlCsv] = useState(false)
  const [genSnap, setGenSnap] = useState(false)
  const [snapUrl, setSnapUrl] = useState<string | null>(null)
  const [copiedSnap, setCopiedSnap] = useState(false)
  const [snapErr, setSnapErr] = useState<string | null>(null)
  const [dlErr, setDlErr] = useState<string | null>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const tripLink = `${appUrl}/trip/${tripSlug}`

  async function copyLink() { await navigator.clipboard.writeText(tripLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }
  async function copySnap() { if (!snapUrl) return; await navigator.clipboard.writeText(snapUrl); setCopiedSnap(true); setTimeout(() => setCopiedSnap(false), 2000) }

  async function downloadPdf() {
    setDlPdf(true); setDlErr(null)
    try {
      const r = await fetch(`/api/dashboard/manifest/${tripId}`)
      if (!r.ok) throw new Error('Manifest generation failed')
      const url = URL.createObjectURL(await r.blob())
      Object.assign(document.createElement('a'), { href: url, download: `manifest-${tripId}.pdf` }).click()
      URL.revokeObjectURL(url)
    } catch (e) { setDlErr(e instanceof Error ? e.message : 'Download failed')
    } finally { setDlPdf(false) }
  }

  async function downloadCsv() {
    setDlCsv(true); setDlErr(null)
    try {
      const r = await fetch(`/api/dashboard/uscg-manifest/${tripId}`)
      if (!r.ok) throw new Error('USCG CSV generation failed')
      const url = URL.createObjectURL(await r.blob())
      Object.assign(document.createElement('a'), { href: url, download: `USCG_Manifest_${tripId}.csv` }).click()
      URL.revokeObjectURL(url)
    } catch (e) { setDlErr(e instanceof Error ? e.message : 'Download failed')
    } finally { setDlCsv(false) }
  }

  async function generateSnap() {
    setGenSnap(true); setSnapErr(null)
    try {
      const r = await fetch(`/api/dashboard/trips/${tripId}/regenerate-captain-token`, { method: 'POST' })
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'Failed') }
      const j = await r.json()
      setSnapUrl(`${appUrl}/snapshot/${j.token}`)
    } catch (e) { setSnapErr(e instanceof Error ? e.message : 'Failed to generate link')
    } finally { setGenSnap(false) }
  }

  const showDocs = status === 'active' || status === 'completed'
  const showUscg = showDocs && allWaiversSigned

  return (
    <div>
      {/* ── SHARE — same td-kicker as all sections */}
      <section>
        <div className="td-kicker">
          <span className="td-kicker-label">Share</span>
        </div>

        <div className="td-gap-8">
          {/* Trip link card */}
          <div className="td-panel">
            <div className="td-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <LinkIcon size={9} strokeWidth={2} style={{ color: 'var(--td-faint)' }} />
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
          {snapUrl ? (
            <div className="td-panel">
              <div className="td-panel-header">
                <span className="td-panel-label">Captain link</span>
                <span style={{ fontSize: 10, color: 'var(--td-warn)', fontWeight: 500 }}>Active</span>
              </div>
              <div className="td-snapshot-link">{snapUrl}</div>
              <div className="td-btn-split td-panel-footer">
                <button onClick={copySnap} className={`td-btn-split-item ${copiedSnap ? 'copied' : ''}`}>
                  {copiedSnap ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} strokeWidth={2} />}
                  {copiedSnap ? 'Copied' : 'Copy link'}
                </button>
                <button onClick={generateSnap} disabled={genSnap} className="td-btn-split-item" style={{ color: 'var(--td-err)' }}>
                  <RefreshCw size={11} strokeWidth={2} />
                  {genSnap ? 'Generating...' : 'Revoke & renew'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generateSnap} disabled={genSnap} className="td-btn-primary">
              <Share2 size={13} strokeWidth={2.5} />
              {genSnap ? 'Generating...' : 'Share to captain'}
            </button>
          )}

          {snapErr && (
            <div className="td-alert td-alert-err">
              <span style={{ flex: 1, fontSize: 12 }}>{snapErr}</span>
              <button onClick={() => setSnapErr(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--td-err)', padding: 0 }}>
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

          {dlErr && <div className="td-alert td-alert-err" style={{ marginBottom: 8 }}><span style={{ fontSize: 12 }}>{dlErr}</span></div>}

          <button onClick={downloadPdf} disabled={dlPdf} className={`td-doc-row td-doc-row-navy ${dlPdf ? 'locked' : ''}`}>
            <Download size={15} strokeWidth={1.8} className="td-doc-icon" />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <p className="td-doc-title">{dlPdf ? 'Generating...' : 'Passenger Manifest PDF'}</p>
              <p className="td-doc-subtitle">Guest list · waivers · safety status</p>
            </div>
          </button>

          {showUscg ? (
            <button onClick={downloadCsv} disabled={dlCsv} className={`td-doc-row td-doc-row-gold ${dlCsv ? 'locked' : ''}`}>
              <Anchor size={15} strokeWidth={1.8} className="td-doc-icon td-doc-icon-gold" />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p className="td-doc-title">{dlCsv ? 'Generating...' : 'USCG Passenger CSV'}</p>
                <p className="td-doc-subtitle td-doc-subtitle-gold">46 CFR §182.530 · all waivers signed</p>
              </div>
            </button>
          ) : (
            <div className="td-doc-row locked">
              <Anchor size={15} strokeWidth={1.8} className="td-doc-icon" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="td-doc-title">USCG Passenger CSV</p>
                <p className="td-doc-subtitle" style={{ color: 'var(--td-warn)' }}>Available once all guests have signed</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
