'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Camera, Keyboard } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface QrBoardingScannerProps {
  tripSlug: string
  guests: { id: string; fullName: string; boardedAt: string | null }[]
  onClose: () => void
  onBoarded: (guestId: string, guestName: string) => void
}

interface ScanResult {
  guestName: string
  alreadyBoarded: boolean
  boardedAt: string
}

export function QrBoardingScanner({
  tripSlug, guests, onClose, onBoarded,
}: QrBoardingScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [manualToken, setManualToken] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [boardedCount, setBoardedCount] = useState(0)
  const [cameraError, setCameraError] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<unknown>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    setBoardedCount(guests.filter(g => g.boardedAt != null).length)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize camera scanner
  useEffect(() => {
    if (mode !== 'camera') return

    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const qrScanner = new Html5Qrcode('qr-reader')
        html5QrRef.current = qrScanner
        scanner = qrScanner

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            handleScan(decodedText)
          },
          () => {
            // Ignore scan failures (no QR in frame)
          }
        )
      } catch {
        setCameraError(true)
        setMode('manual')
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 300)

    return () => {
      clearTimeout(timer)
      if (scanner) {
        scanner.stop().then(() => scanner?.clear()).catch(() => null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const handleScan = useCallback(async (qrToken: string) => {
    if (processingRef.current) return
    processingRef.current = true
    setIsProcessing(true)
    setError('')

    try {
      const res = await fetch(`/api/trips/${tripSlug}/board-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Unknown error')
        setTimeout(() => {
          processingRef.current = false
          setError('')
        }, 2000)
        return
      }

      const result: ScanResult = {
        guestName: json.guestName,
        alreadyBoarded: json.alreadyBoarded,
        boardedAt: json.boardedAt,
      }

      setLastResult(result)
      if (!json.alreadyBoarded) {
        setBoardedCount(prev => prev + 1)
        onBoarded(json.guestId ?? '', json.guestName)
      }

      // Auto-reset after 2.5 seconds
      setTimeout(() => {
        setLastResult(null)
        processingRef.current = false
      }, 2500)
    } catch {
      setError('Connection error')
      setTimeout(() => {
        processingRef.current = false
        setError('')
      }, 2000)
    } finally {
      setIsProcessing(false)
    }
  }, [tripSlug, onBoarded])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualToken.trim()) return
    handleScan(manualToken.trim())
    setManualToken('')
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-black/80">
        <div>
          <h2 className="text-white text-[18px] font-bold">
            📱 Scan Mode
          </h2>
          <p className="text-white/60 text-[13px]">
            {boardedCount} / {guests.length} boarded
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(mode === 'camera' ? 'manual' : 'camera')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            {mode === 'camera' ? <Keyboard size={18} /> : <Camera size={18} />}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-[#1D9E75] transition-all duration-500"
          style={{ width: guests.length > 0 ? `${(boardedCount / guests.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center relative">
        {mode === 'camera' ? (
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full max-w-[400px] aspect-square"
          />
        ) : (
          /* Manual QR token entry */
          <form onSubmit={handleManualSubmit} className="px-8 w-full max-w-[400px]">
            <p className="text-white/60 text-[14px] mb-4 text-center">
              {cameraError
                ? 'Camera not available. Enter the guest\'s QR code manually.'
                : 'Enter the QR code text manually:'}
            </p>
            <input
              type="text"
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste or type QR token..."
              autoFocus
              className="
                w-full h-[56px] rounded-[12px]
                bg-white/10 border border-white/20
                text-white text-[16px] px-4
                placeholder:text-white/30
                focus:outline-none focus:border-[#1D9E75]
              "
            />
            <button
              type="submit"
              disabled={!manualToken.trim() || isProcessing}
              className="
                w-full h-[56px] rounded-[12px] mt-4
                bg-[#1D9E75] text-white font-bold
                text-[16px] disabled:opacity-40
              "
            >
              {isProcessing ? 'Processing...' : 'Board Guest'}
            </button>
          </form>
        )}

        {/* Success toast */}
        {lastResult && (
          <div className={cn(
            'absolute inset-x-4 bottom-8 p-6 rounded-[20px]',
            'flex items-center gap-4 animate-pulse',
            lastResult.alreadyBoarded
              ? 'bg-[#FFFBEB] border-2 border-[#F59E0B]'
              : 'bg-[#E8F9F4] border-2 border-[#1D9E75]'
          )}>
            <span className="text-[48px]">
              {lastResult.alreadyBoarded ? '⚠️' : '✅'}
            </span>
            <div>
              <p className={cn(
                'text-[22px] font-black',
                lastResult.alreadyBoarded ? 'text-[#92400E]' : 'text-[#1D9E75]'
              )}>
                {lastResult.alreadyBoarded ? 'ALREADY BOARDED' : 'BOARDED'}
              </p>
              <p className={cn(
                'text-[16px] font-medium',
                lastResult.alreadyBoarded ? 'text-[#78350F]' : 'text-[#065F46]'
              )}>
                {lastResult.guestName}
              </p>
            </div>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="absolute inset-x-4 bottom-8 p-6 rounded-[20px] bg-[#FEE2E2] border-2 border-[#DC2626]">
            <div className="flex items-center gap-4">
              <span className="text-[48px]">❌</span>
              <div>
                <p className="text-[22px] font-black text-[#DC2626]">INVALID</p>
                <p className="text-[14px] text-[#7F1D1D]">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-5 py-4 bg-black/80 text-center">
        <p className="text-white/40 text-[12px]">
          Point camera at guest&apos;s boarding QR code · Auto-resets after each scan
        </p>
      </div>
    </div>
  )
}
