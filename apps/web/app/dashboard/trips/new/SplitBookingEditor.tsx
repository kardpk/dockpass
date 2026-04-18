'use client'

import { Plus, Trash2 } from 'lucide-react'
import type { SplitBookingEntry } from '@/types'

interface SplitBookingEditorProps {
  entries: SplitBookingEntry[]
  onChange: (entries: SplitBookingEntry[]) => void
  maxTotalGuests: number
}

export function SplitBookingEditor({
  entries,
  onChange,
  maxTotalGuests,
}: SplitBookingEditorProps) {
  const totalAllocated = entries.reduce((sum, e) => sum + e.maxGuests, 0)
  const remaining = maxTotalGuests - totalAllocated

  function addEntry() {
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        organiserName: '',
        organiserEmail: '',
        maxGuests: Math.min(Math.max(remaining, 1), 4),
        notes: '',
      },
    ])
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id))
  }

  function updateEntry(
    id: string,
    field: keyof SplitBookingEntry,
    value: string | number,
  ) {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          className="font-mono"
          style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}
        >
          Split bookings
        </span>
        {totalAllocated > 0 && (
          <span
            className="pill"
            style={{
              background: remaining < 0 ? 'var(--color-status-err-soft)' : 'var(--color-bone)',
              color: remaining < 0 ? 'var(--color-status-err)' : 'var(--color-ink)',
            }}
          >
            {totalAllocated} / {maxTotalGuests} allocated
          </span>
        )}
      </div>

      {/* Entries */}
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="tile"
          style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              className="font-mono"
              style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, color: 'var(--color-ink-muted)', letterSpacing: '0.08em' }}
            >
              Group {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeEntry(entry.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-ink-muted)',
                borderRadius: 'var(--r-1)',
                transition: 'color var(--dur-fast) var(--ease)',
              }}
              aria-label="Remove booking"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Organiser name"
            value={entry.organiserName}
            onChange={(e) => updateEntry(entry.id, 'organiserName', e.target.value)}
            className="field-input"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--s-2)' }}>
            <input
              type="email"
              placeholder="Email (optional)"
              value={entry.organiserEmail}
              onChange={(e) => updateEntry(entry.id, 'organiserEmail', e.target.value)}
              className="field-input"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
              <input
                type="number"
                min={1}
                max={maxTotalGuests}
                value={entry.maxGuests}
                onChange={(e) => updateEntry(entry.id, 'maxGuests', Number(e.target.value))}
                className="field-input font-mono"
                style={{ width: 64, textAlign: 'center' }}
              />
              <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)' }}>guests</span>
            </div>
          </div>
        </div>
      ))}

      {/* Add group button */}
      <button
        type="button"
        onClick={addEntry}
        disabled={remaining <= 0}
        style={{
          width: '100%', height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s-2)',
          borderRadius: 'var(--r-1)',
          border: remaining <= 0 ? 'var(--border-w) solid var(--color-line-soft)' : 'var(--border-w) dashed var(--color-ink-muted)',
          background: 'var(--color-paper)',
          color: remaining <= 0 ? 'var(--color-line-soft)' : 'var(--color-ink)',
          fontSize: 'var(--t-body-sm)', fontWeight: 600,
          cursor: remaining <= 0 ? 'not-allowed' : 'pointer',
          transition: 'background var(--dur-fast) var(--ease)',
        }}
      >
        <Plus size={14} strokeWidth={2.5} />
        Add group
        {remaining > 0 && (
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginLeft: 'var(--s-1)' }}>
            ({remaining} remaining)
          </span>
        )}
      </button>
    </div>
  )
}
