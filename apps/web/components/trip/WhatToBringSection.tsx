'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { storage } from '@/lib/storage'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface WhatToBringSectionProps {
  whatToBring: string | null
  whatNotToBring: string | null
  slug: string
  tr: TripT
}

export function WhatToBringSection({
  whatToBring,
  whatNotToBring,
  slug,
  tr,
}: WhatToBringSectionProps) {
  const [activeTab, setActiveTab] = useState<'bring' | 'avoid'>('bring')
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const bringItems = whatToBring
    ? whatToBring.split('\n').map((s) => s.trim()).filter(Boolean)
    : []
  const avoidItems = whatNotToBring
    ? whatNotToBring.split('\n').map((s) => s.trim()).filter(Boolean)
    : []

  // Load saved ticks from versioned storage
  useEffect(() => {
    try {
      const saved = storage.get('guest_checklist', slug)
      if (saved) {
        setChecked(new Set(saved.checked))
      }
    } catch { /* Unavailable */ }
  }, [slug])

  function toggleItem(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      storage.set('guest_checklist', { checked: [...next] }, slug)
      return next
    })
  }

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-border p-5">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('bring')}
          className={cn(
            'flex-1 h-[40px] rounded-[10px] text-[14px] font-medium border transition-colors',
            activeTab === 'bring'
              ? 'bg-navy text-white border-[#0C447C]'
              : 'bg-white text-text-mid border-border',
          )}
        >
          ✓ {tr.whatToBring}
        </button>
        <button
          onClick={() => setActiveTab('avoid')}
          className={cn(
            'flex-1 h-[40px] rounded-[10px] text-[14px] font-medium border transition-colors',
            activeTab === 'avoid'
              ? 'bg-[#D63B3B] text-white border-[#D63B3B]'
              : 'bg-white text-text-mid border-border',
          )}
        >
          ✗ {tr.whatNotToBring}
        </button>
      </div>

      {/* Bring checklist */}
      {activeTab === 'bring' && (
        <ul className="space-y-2">
          {bringItems.length === 0 && (
            <li className="text-[14px] text-text-mid">No items listed.</li>
          )}
          {bringItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`bring-${idx}`}
                checked={checked.has(idx)}
                onChange={() => toggleItem(idx)}
                className="w-[22px] h-[22px] accent-gold shrink-0 cursor-pointer"
              />
              <label
                htmlFor={`bring-${idx}`}
                className={cn(
                  'text-[14px] cursor-pointer select-none',
                  checked.has(idx)
                    ? 'line-through text-text-mid'
                    : 'text-navy',
                )}
              >
                {item}
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* Avoid list */}
      {activeTab === 'avoid' && (
        <ul className="space-y-2">
          {avoidItems.length === 0 && (
            <li className="text-[14px] text-text-mid">No items listed.</li>
          )}
          {avoidItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-error font-bold text-[14px] mt-0.5">✗</span>
              <span className="text-[14px] text-[#E8593C]">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
