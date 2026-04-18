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

  useEffect(() => {
    try {
      const saved = storage.get('guest_checklist', slug)
      if (saved) setChecked(new Set(saved.checked))
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
      style={{ margin: '0 var(--s-4)', marginTop: 'var(--s-3)', padding: 'var(--s-3) var(--s-4)' }}
    >
      {/* Header + tabs inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginBottom: 'var(--s-2)' }}>
        <Backpack size={14} strokeWidth={2} style={{ color: 'var(--color-ink)' }} />
        <span
          className="font-mono"
          style={{
            fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase' as const,
            color: 'var(--color-ink)',
          }}
        >
          Packing
        </span>

        {/* Tab pills — right aligned */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            onClick={() => setActiveTab('bring')}
            className="font-mono"
            style={{
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              padding: '3px 8px',
              borderRadius: 'var(--r-1)',
              border: 'var(--border-w) solid',
              borderColor: activeTab === 'bring' ? 'var(--color-ink)' : 'var(--color-line)',
              background: activeTab === 'bring' ? 'var(--color-ink)' : 'transparent',
              color: activeTab === 'bring' ? '#fff' : 'var(--color-ink-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Bring
          </button>
          <button
            onClick={() => setActiveTab('avoid')}
            className="font-mono"
            style={{
              fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              padding: '3px 8px',
              borderRadius: 'var(--r-1)',
              border: 'var(--border-w) solid',
              borderColor: activeTab === 'avoid' ? 'var(--color-status-err)' : 'var(--color-line)',
              background: activeTab === 'avoid' ? 'var(--color-status-err)' : 'transparent',
              color: activeTab === 'avoid' ? '#fff' : 'var(--color-ink-muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Avoid
          </button>
        </div>
      </div>

      {/* Bring checklist — compact */}
      {activeTab === 'bring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
          {bringItems.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>No items listed.</p>
          )}
          {bringItems.map((item, idx) => (
            <label
              key={idx}
              htmlFor={`bring-${idx}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                id={`bring-${idx}`}
                checked={checked.has(idx)}
                onChange={() => toggleItem(idx)}
                style={{
                  width: 16, height: 16, flexShrink: 0,
                  accentColor: 'var(--color-ink)',
                  cursor: 'pointer',
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  lineHeight: 1.45,
                  color: checked.has(idx) ? 'var(--color-ink-muted)' : 'var(--color-ink)',
                  textDecoration: checked.has(idx) ? 'line-through' : 'none',
                }}
              >
                {item}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Avoid list — compact */}
      {activeTab === 'avoid' && (
        <div
          style={{
            borderLeft: '3px solid var(--color-status-err)',
            paddingLeft: 'var(--s-3)',
            display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
          }}
        >
          {avoidItems.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>No items listed.</p>
          )}
          {avoidItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <X size={12} strokeWidth={3} style={{ color: 'var(--color-status-err)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.45 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
