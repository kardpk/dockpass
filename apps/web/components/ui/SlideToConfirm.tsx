'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface SlideToConfirmProps {
  label: string
  onComplete: () => void
  disabled?: boolean
  color: 'teal' | 'coral'
}

export function SlideToConfirm({
  label, onComplete, disabled = false, color,
}: SlideToConfirmProps) {
  const [complete, setComplete] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [trackWidth, setTrackWidth] = useState(320)

  useEffect(() => {
    if (constraintsRef.current) {
      setTrackWidth(constraintsRef.current.offsetWidth)
    }
  }, [])

  const THUMB_SIZE = 60
  const COMPLETE_THRESHOLD = 0.85 // 85% of track

  const bgColor = color === 'teal' ? '#1D9E75' : '#E8593C'
  const bgColorLight = color === 'teal' ? '#E8F9F4' : '#FDEAEA'
  const textColor = color === 'teal' ? '#1D9E75' : '#E8593C'

  function handleDragEnd(_: any, info: PanInfo) {
    if (disabled || complete) return
    const maxX = trackWidth - THUMB_SIZE - 8
    const progress = x.get() / maxX

    if (progress >= COMPLETE_THRESHOLD) {
      // Snap to end + trigger
      animate(x, maxX, { duration: 0.1 })
      setComplete(true)

      // Haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 30, 100])
      }

      setTimeout(() => {
        onComplete()
      }, 150)
    } else {
      // Snap back
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <div
      ref={constraintsRef}
      className={cn(
        'relative w-full h-[64px] rounded-[16px] overflow-hidden select-none',
        disabled && 'opacity-40 cursor-not-allowed',
        complete ? 'bg-[' + bgColor + ']' : 'bg-[' + bgColorLight + ']'
      )}
      style={{
        background: complete ? bgColor : bgColorLight,
      }}
    >
      {/* Track label */}
      {!complete && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[15px] font-bold tracking-wider" style={{ color: textColor }}>
            ← {label} →
          </span>
        </div>
      )}

      {/* Complete label */}
      {complete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[16px] font-bold text-white">✓ Starting...</span>
        </div>
      )}

      {/* Draggable thumb */}
      {!complete && (
        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x, backgroundColor: bgColor }}
          onDragEnd={handleDragEnd}
          className="
            absolute top-[4px] left-[4px]
            w-[56px] h-[56px]
            rounded-[14px] cursor-grab active:cursor-grabbing
            flex items-center justify-center
            shadow-md
            z-10
          "
        >
          <span className="text-white text-[20px] font-bold select-none">
            →
          </span>
        </motion.div>
      )}
    </div>
  )
}
