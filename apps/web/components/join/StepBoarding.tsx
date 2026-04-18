'use client'

import { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share, Lock, PartyPopper, Anchor, Shield, Check, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  async function sharePass() {
    const url = `${window.location.origin}/trip/${tripSlug}`
    if (navigator.share) {
      await navigator.share({
        title: `My boarding pass — ${tripData.boatName}`,
        text: 'I\'m boarding ' + tripData.boatName + ' on ' + formatTripDate(tripData.tripDate),
        url,
      }).catch(() => null)
    } else {
      await navigator.clipboard.writeText(url).catch(() => null)
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
              Show this pass when boarding
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          BOARDING PASS CARD — Apple Wallet / Airline boarding pass aesthetic
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          borderRadius: 'var(--r-2)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(11,29,58,0.18), 0 2px 8px rgba(11,29,58,0.08)',
          marginBottom: 'var(--s-4)',
        }}
      >
        {/* ── Top section: INK header ── */}
        <div
          style={{
            background: 'var(--color-ink)',
            padding: 'var(--s-5) var(--s-5) var(--s-4)',
            position: 'relative',
          }}
        >
          {/* Brand line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-3)' }}>
            <span
              className="font-mono"
              style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Boatcheckin
            </span>
            <span
              className="font-mono"
              style={{
                fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                color: 'var(--color-rust)',
              }}
            >
              Boarding pass
            </span>
          </div>

          {/* Boat name — large display */}
          <h3
            className="font-display"
            style={{
              fontSize: 'clamp(22px, 5vw, 28px)',
              fontWeight: 400,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--s-4)',
            }}
          >
            {tripData.boatName}
          </h3>

          {/* 3-column trip meta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s-3)' }}>
            {[
              { label: 'Date', value: formatTripDate(tripData.tripDate) },
              { label: 'Departs', value: formatTime(tripData.departureTime) },
              { label: 'Duration', value: formatDuration(tripData.durationHours) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p
                  className="font-mono"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 2 }}
                >
                  {label}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
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
            height: 24,
            background: 'var(--color-ink)',
          }}
        >
          {/* Left notch */}
          <div
            style={{
              position: 'absolute',
              left: -12, top: '50%', transform: 'translateY(-50%)',
              width: 24, height: 24,
              borderRadius: '50%',
              background: 'var(--color-paper)',
            }}
          />
          {/* Right notch */}
          <div
            style={{
              position: 'absolute',
              right: -12, top: '50%', transform: 'translateY(-50%)',
              width: 24, height: 24,
              borderRadius: '50%',
              background: 'var(--color-paper)',
            }}
          />
          {/* Dashed line */}
          <div
            style={{
              position: 'absolute',
              left: 20, right: 20, top: '50%',
              borderTop: '2px dashed rgba(255,255,255,0.15)',
            }}
          />
        </div>

        {/* ── Bottom section: QR + Guest ── */}
        <div
          style={{
            background: 'var(--color-ink)',
            padding: 'var(--s-4) var(--s-5) var(--s-5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* QR Code */}
          <div style={{ position: 'relative', marginBottom: 'var(--s-3)' }}>
            <div
              style={{
                background: '#fff',
                padding: 12,
                borderRadius: 'var(--r-1)',
                transition: 'all 500ms ease',
                filter: isLiveryPending ? 'blur(8px)' : 'none',
                transform: isLiveryPending ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              <QRCodeSVG
                value={state.qrToken || `dp-guest-${tripSlug}`}
                size={140}
                fgColor="var(--color-ink)"
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
                  <div
                    style={{
                      width: 48, height: 48,
                      borderRadius: '50%',
                      background: 'var(--color-status-warn)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 'var(--s-2)',
                    }}
                  >
                    <Lock size={20} strokeWidth={2.5} style={{ color: '#fff' }} />
                  </div>
                  <span
                    className="font-mono"
                    style={{ fontSize: '11px', fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}
                  >
                    Awaiting sign-off
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dock info */}
          <p
            className="font-mono"
            style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.06em',
              marginBottom: 4,
            }}
          >
            {tripData.slipNumber ? `Slip ${tripData.slipNumber}  ·  ` : ''}
            {tripData.marinaName}
          </p>

          {/* Guest name — hero treatment */}
          <p
            className="font-display"
            style={{
              fontSize: '20px',
              fontWeight: 400,
              color: '#fff',
              letterSpacing: '-0.01em',
              marginBottom: 'var(--s-3)',
            }}
          >
            {state.fullName}
          </p>

          {/* Status pills inside the card */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px',
                borderRadius: 'var(--r-1)',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '11px', fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <Shield size={10} strokeWidth={2.5} />
              Waiver signed
            </span>
            {state.safetyAcks.length > 0 && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px',
                  borderRadius: 'var(--r-1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                <Check size={10} strokeWidth={2.5} />
                {state.safetyAcks.length} safety
              </span>
            )}
            {isLiveryPending && (
              <span
                className="font-mono"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px',
                  borderRadius: 'var(--r-1)',
                  background: 'var(--color-status-warn)',
                  fontSize: '11px', fontWeight: 700,
                  color: '#fff',
                  animation: 'pulse 2s infinite',
                }}
              >
                Vessel instruction pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <button
          onClick={sharePass}
          className="btn btn--rust"
          style={{ width: '100%', height: 48, justifyContent: 'center', fontSize: '15px' }}
        >
          <Share size={16} strokeWidth={2} />
          Save boarding pass
        </button>

        {/* PWA install */}
        {pwaPrompt && !pwaInstalled && (
          <div
            className="tile"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
              padding: 'var(--s-3) var(--s-4)',
            }}
          >
            <Anchor size={18} strokeWidth={2} style={{ color: 'var(--color-ink)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 700, color: 'var(--color-ink)' }}>
                Add to home screen
              </p>
              <p className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                Dock alerts + weather updates
              </p>
            </div>
            <button className="btn btn--ink btn--sm" onClick={installPwa}>
              Add
            </button>
          </div>
        )}

        {/* Push notifications */}
        {isSupported && permission === 'default' && (
          <div
            className="tile"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
              padding: 'var(--s-3) var(--s-4)',
            }}
          >
            <Bell size={18} strokeWidth={2} style={{ color: 'var(--color-ink)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 'var(--t-body-sm)', fontWeight: 700, color: 'var(--color-ink)' }}>
                Push notifications
              </p>
              <p className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
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
            fontSize: 'var(--t-body-sm)',
            color: 'var(--color-ink-muted)',
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

// BeforeInstallPromptEvent is not in TS lib by default
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
