'use client'

import { useState } from 'react'
import { FileText, MessageCircle, Share2, Check, Copy } from 'lucide-react'
import type { TripStatus } from '@/types'

interface TripActionBarProps {
  tripId: string
  tripSlug: string
  status: TripStatus
  whatsappMessage: string
  initialSnapshotUrl?: string | null
}

export function TripActionBar({
  tripId, tripSlug, status, whatsappMessage, initialSnapshotUrl
}: TripActionBarProps) {
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [generatingSnapshot, setGeneratingSnapshot] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(initialSnapshotUrl || null)
  const [copiedSnapshot, setCopiedSnapshot] = useState(false)

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/dashboard/manifest/${tripId}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manifest-${tripId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function copyWhatsApp() {
    await navigator.clipboard.writeText(whatsappMessage)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  async function generateSnapshot() {
    if (!window.confirm(snapshotUrl ? 'Are you sure you want to revoke the current link and generate a new one?' : 'Generate a new captain link for this trip?')) return;
    
    setGeneratingSnapshot(true)
    try {
      const res = await fetch(
        `/api/dashboard/trips/${tripId}/regenerate-captain-token`,
        { method: 'POST' }
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      setSnapshotUrl(`${window.location.origin}/snapshot/${json.token}`)
    } catch {
      alert('Failed to generate captain link.')
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

  return (
    <div className="
      fixed bottom-0 left-0 right-0 z-40
      bg-white border-t border-[#D0E2F3]
      px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3
      md:relative md:bottom-auto md:border-none
      md:bg-transparent md:px-0 md:pt-4 md:pb-0
    ">
      <div className="max-w-[720px] mx-auto">

        {/* Snapshot URL (shown after generation) */}
        {snapshotUrl && (
          <div className="
            mb-3 flex items-center gap-2
            p-3 rounded-[12px]
            bg-[#E8F2FB] border border-[#D0E2F3]
          ">
            <p className="text-[13px] text-[#0C447C] flex-1 truncate">
              📎 {snapshotUrl}
            </p>
            <button
              onClick={copySnapshot}
              className="
                flex items-center gap-1 px-3 py-1.5
                rounded-[8px] bg-[#0C447C] text-white
                text-[12px] font-medium flex-shrink-0
              "
            >
              {copiedSnapshot ? <Check size={12} /> : <Copy size={12} />}
              {copiedSnapshot ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={downloadPdf}
            disabled={downloadingPdf}
            className="
              flex flex-col items-center justify-center gap-1
              h-[60px] rounded-[12px]
              bg-[#F5F8FC] border border-[#D0E2F3]
              text-[#0C447C] hover:bg-[#E8F2FB]
              transition-colors disabled:opacity-40
              text-[11px] font-medium
            "
          >
            <FileText size={18} />
            {downloadingPdf ? 'Generating...' : 'Manifest PDF'}
          </button>

          <button
            onClick={copyWhatsApp}
            className="
              flex flex-col items-center justify-center gap-1
              h-[60px] rounded-[12px]
              bg-[#F5F8FC] border border-[#D0E2F3]
              text-[#0C447C] hover:bg-[#E8F2FB]
              transition-colors text-[11px] font-medium
            "
          >
            {copiedMsg
              ? <><Check size={18} /><span>Copied!</span></>
              : <><MessageCircle size={18} /><span>WhatsApp msg</span></>
            }
          </button>

          <button
            onClick={generateSnapshot}
            disabled={generatingSnapshot}
            className={`
              flex flex-col items-center justify-center gap-1
              h-[60px] rounded-[12px]
              text-white transition-colors
              disabled:opacity-40 text-[11px] font-medium
              ${snapshotUrl ? 'bg-[#D63B3B] hover:bg-[#b02a2a]' : 'bg-[#0C447C] hover:bg-[#093a6b]'}
            `}
          >
            {generatingSnapshot ? (
              <span>Generating...</span>
            ) : snapshotUrl ? (
              <><Share2 size={18} /><span>Renew captain link</span></>
            ) : (
              <><Share2 size={18} /><span>Share to captain</span></>
            )}
          </button>
        </div>

        {/* Padding for mobile bottom nav */}
        <div className="h-[72px] md:hidden" />
      </div>
    </div>
  )
}
