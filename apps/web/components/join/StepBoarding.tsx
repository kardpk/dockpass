'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Lock, PartyPopper, Anchor, Shield, Check, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { createClient } from '@/lib/supabase/client'
import type { JoinFlowState } from '@/types'

interface StepBoardingProps {
  tripData: {
    boatName: string
    marinaName: string
    slipNumber: string | null
    captainName: string | null
    tripDate: string
    departureTime: string
    durationHours: number
    charterType: string
  }
  state: JoinFlowState
  tripSlug: string
  onClose: () => void
}

export function StepBoarding({ tripData, state, tripSlug, onClose }: StepBoardingProps) {
  const [pwaPrompt, setPwaPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [pwaInstalled, setPwaInstalled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { isSupported, permission, isSubscribing, requestSubscription } = usePushNotifications()

  // ── Realtime Livery Status Transition ────────────────────────────────────
  const [approvalStatus, setApprovalStatus] = useState(
    state.approvalStatus ?? 'auto_approved'
  )
  const [justApproved, setJustApproved] = useState(false)
  const isLiveryPending = approvalStatus === 'pending_livery_briefing'

  useEffect(() => {
    if (!state.guestId || approvalStatus !== 'pending_livery_briefing') return

    const supabase = createClient()
    const channel = supabase
      .channel(`guest-approval-${state.guestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guests',
          filter: `id=eq.${state.guestId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newStatus = (payload.new as Record<string, unknown>).approval_status as string
          if (newStatus === 'approved') {
            setJustApproved(true)
            setTimeout(() => setApprovalStatus('approved'), 300)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.guestId, approvalStatus])

  // Capture PWA install prompt
  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setPwaPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const installPwa = useCallback(async () => {
    if (!pwaPrompt) return
    await pwaPrompt.prompt()
    const { outcome } = await pwaPrompt.userChoice
    if (outcome === 'accepted') setPwaInstalled(true)
    setPwaPrompt(null)
  }, [pwaPrompt])

  // ── Save boarding pass as PNG image ──────────────────────────────────────
  async function saveBoardingPass() {
    if (!cardRef.current || isSaving) return
    setIsSaving(true)

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High-res for retina
        backgroundColor: null,
        useCORS: true,
        logging: false,
      })

      canvas.toBlob(async (blob) => {
        if (!blob) { setIsSaving(false); return }

        const fileName = `boarding-pass-${tripData.boatName.replace(/\s+/g, '-').toLowerCase()}.png`

        // Try native share with file (mobile), fall back to download
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], fileName, { type: 'image/png' })
          const shareData = { files: [file], title: `Boarding Pass — ${tripData.boatName}` }
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData).catch(() => null)
            setIsSaving(false)
            return
          }
        }

        // Desktop fallback: trigger download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setIsSaving(false)
      }, 'image/png')
    } catch {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ paddingTop: 'var(--s-2)' }}>
      {/* ── Header States ── */}
      <AnimatePresence mode="wait">
        {isLiveryPending ? (
          <motion.div
            key="amber"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ textAlign: 'center', marginBottom: 'var(--s-5)' }}
          >
            <Lock size={28} strokeWidth={2} style={{ color: 'var(--color-status-warn)', margin: '0 auto var(--s-2)' }} />
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 400, color: 'var(--color-status-warn)', marginBottom: 'var(--s-2)' }}>
              Instruction required
            </h2>
            <p className="font-mono" style={{ fontSize: '12px', color: 'var(--color-ink-muted)', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
              Florida law (§327.54) requires an in-person vessel briefing before bareboat departure.
            </p>
          </motion.div>
        ) : justApproved ? (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{ textAlign: 'center', marginBottom: 'var(--s-5)' }}
            onAnimationComplete={() => setTimeout(() => setJustApproved(false), 2000)}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              <PartyPopper size={36} strokeWidth={1.5} style={{ color: 'var(--color-status-ok)', margin: '0 auto' }} />
            </motion.div>
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 400, color: 'var(--color-status-ok)', marginTop: 'var(--s-2)' }}>
              You&apos;re cleared!
            </h2>
          </motion.div>
        ) : (
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: 'var(--s-4)' }}
          >
            <Anchor size={28} strokeWidth={1.5} style={{ color: 'var(--color-rust)', margin: '0 auto var(--s-2)' }} />
            <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 400, color: 'var(--color-ink)', marginBottom: 4 }}>
              You&apos;re checked in
            </h2>
            <p className="font-mono" style={{ fontSize: '12px', color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}>
              Save your boarding pass below
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          BOARDING PASS CARD — capturable as PNG
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        ref={cardRef}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(11,29,58,0.18), 0 2px 8px rgba(11,29,58,0.08)',
          marginBottom: 20,
          background: '#0B1D3A',
        }}
      >
        {/* ── Top section: header ── */}
        <div
          style={{
            background: '#0B1D3A',
            padding: '20px 20px 16px',
          }}
        >
          {/* Brand line — BOATCHECKIN bold + BOARDING PASS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px', fontWeight: 800,
                letterSpacing: '0.18em', textTransform: 'uppercase' as const,
                color: '#ffffff',
              }}
            >
              Boatcheckin
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                color: '#C75B3A',
                background: 'rgba(199,91,58,0.15)',
                padding: '3px 8px',
                borderRadius: 4,
              }}
            >
              Boarding pass
            </span>
          </div>

          {/* Boat name */}
          <h3
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 26,
              fontWeight: 400,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 16,
              margin: '0 0 16px',
            }}
          >
            {tripData.boatName}
          </h3>

          {/* 3-column trip meta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Date', value: formatTripDate(tripData.tripDate) },
              { label: 'Departs', value: formatTime(tripData.departureTime) },
              { label: 'Duration', value: formatDuration(tripData.durationHours) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.12em', textTransform: 'uppercase' as const,
                    marginBottom: 2, margin: '0 0 2px',
                  }}
                >
                  {label}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tear line with side notches ── */}
        <div
          style={{
            position: 'relative',
            height: 32,
            background: '#0B1D3A',
            overflow: 'visible',
          }}
        >
          <div style={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: '#F5F0E8' }} />
          <div style={{ position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: '#F5F0E8' }} />
          <div style={{ position: 'absolute', left: 24, right: 24, top: '50%', borderTop: '4px dashed rgba(255,255,255,0.15)' }} />
        </div>

        {/* ── Bottom section: QR + Guest info ── */}
        <div
          style={{
            background: '#0B1D3A',
            padding: '16px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* QR Code */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div
              style={{
                background: '#ffffff',
                padding: 12,
                borderRadius: 8,
                transition: 'all 500ms ease',
                filter: isLiveryPending ? 'blur(8px)' : 'none',
                transform: isLiveryPending ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              <QRCodeSVG
                value={state.qrToken || `dp-guest-${tripSlug}`}
                size={130}
                fgColor="#0B1D3A"
                bgColor="#FFFFFF"
                level="M"
              />
            </div>

            {/* Lock overlay */}
            <AnimatePresence>
              {isLiveryPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Lock size={18} strokeWidth={2.5} style={{ color: '#fff' }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
                    Awaiting sign-off
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dock info */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.06em',
              marginBottom: 4, margin: '0 0 4px',
              textAlign: 'center',
            }}
          >
            {tripData.slipNumber ? `Slip ${tripData.slipNumber}  ·  ` : ''}
            {tripData.marinaName}
          </p>

          {/* Guest name */}
          <p
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 20,
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              marginBottom: 12, margin: '0 0 12px',
              textAlign: 'center',
            }}
          >
            {state.fullName}
          </p>

          {/* Status pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            <StatusPill icon={<Shield size={9} strokeWidth={2.5} />} label="Waiver signed" />
            {state.safetyAcks.length > 0 && (
              <StatusPill icon={<Check size={9} strokeWidth={2.5} />} label={`${state.safetyAcks.length} safety`} />
            )}
            {isLiveryPending && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 4,
                  background: '#F59E0B', fontSize: 10, fontWeight: 700,
                  color: '#fff', animation: 'pulse 2s infinite',
                }}
              >
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Save boarding pass as PNG ── */}
      <button
        onClick={saveBoardingPass}
        disabled={isSaving}
        className="btn btn--rust"
        style={{
          width: '100%', height: 48,
          justifyContent: 'center', fontSize: '15px',
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        <Download size={16} strokeWidth={2} />
        {isSaving ? 'Generating…' : 'Save boarding pass'}
      </button>

      {/* ── Secondary actions ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {/* PWA install */}
        {pwaPrompt && !pwaInstalled && (
          <div
            className="tile"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}
          >
            <Anchor size={18} strokeWidth={2} style={{ color: 'var(--color-ink)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                Add to home screen
              </p>
              <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', margin: 0 }}>
                Dock alerts + weather updates
              </p>
            </div>
            <button className="btn btn--ink btn--sm" onClick={installPwa}>Add</button>
          </div>
        )}

        {/* Push notifications */}
        {isSupported && permission === 'default' && (
          <div
            className="tile"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}
          >
            <Bell size={18} strokeWidth={2} style={{ color: 'var(--color-ink)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                Push notifications
              </p>
              <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', margin: 0 }}>
                Get weather alerts directly
              </p>
            </div>
            <button
              className="btn btn--ink btn--sm"
              onClick={() => requestSubscription('guest', state.guestId)}
              disabled={isSubscribing}
            >
              {isSubscribing ? 'Wait' : 'Enable'}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', minHeight: 44,
            fontSize: 14, color: 'var(--color-ink-muted)',
            textDecoration: 'underline',
            background: 'none', border: 'none',
            cursor: 'pointer',
          }}
        >
          Back to trip info
        </button>
      </div>
    </div>
  )
}

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.15)',
        fontSize: 10, fontWeight: 600,
        color: 'rgba(255,255,255,0.65)',
      }}
    >
      {icon}
      {label}
    </span>
  )
}

// BeforeInstallPromptEvent is not in TS lib by default
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
