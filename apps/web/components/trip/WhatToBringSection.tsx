'use client'

import { useState, useEffect } from 'react'
import { Check, X, Backpack } from 'lucide-react'
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
    <div
      className="tile"
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
        <Backpack size={16} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
        <span
          className="font-mono"
          style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: 'var(--color-ink)',
          }}
        >
          Packing list
        </span>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 'var(--s-2)', marginBottom: 'var(--s-3)' }}>
        <button
          onClick={() => setActiveTab('bring')}
          className={activeTab === 'bring' ? 'btn btn--ink btn--sm' : 'btn btn--ghost btn--sm'}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Check size={13} strokeWidth={2.5} />
          {tr.whatToBring}
        </button>
        <button
          onClick={() => setActiveTab('avoid')}
          className={activeTab === 'avoid' ? 'btn btn--danger btn--sm' : 'btn btn--ghost btn--sm'}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <X size={13} strokeWidth={2.5} />
          {tr.whatNotToBring}
        </button>
      </div>

      {/* Bring checklist */}
      {activeTab === 'bring' && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
          {bringItems.length === 0 && (
            <li style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)' }}>No items listed.</li>
          )}
          {bringItems.map((item, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
              <input
                type="checkbox"
                id={`bring-${idx}`}
                checked={checked.has(idx)}
                onChange={() => toggleItem(idx)}
                style={{
                  width: 20, height: 20, flexShrink: 0, cursor: 'pointer',
                  accentColor: 'var(--color-ink)',
                  borderRadius: 'var(--r-1)',
                }}
              />
              <label
                htmlFor={`bring-${idx}`}
                style={{
                  fontSize: 'var(--t-body-sm)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  color: checked.has(idx) ? 'var(--color-ink-muted)' : 'var(--color-ink)',
                  textDecoration: checked.has(idx) ? 'line-through' : 'none',
                }}
              >
                {item}
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* Avoid list */}
      {activeTab === 'avoid' && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
          {avoidItems.length === 0 && (
            <li style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)' }}>No items listed.</li>
          )}
          {avoidItems.map((item, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-2)' }}>
              <X size={14} strokeWidth={2.5} style={{ color: 'var(--color-status-err)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-status-err)' }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
